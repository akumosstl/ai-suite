import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { ApiService, Pipeline, PipelineStep } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { ConsoleOutputDialogComponent } from '../../components/console-output-dialog/console-output-dialog.component';
import { StepIODialogComponent } from '../../components/step-io-dialog/step-io-dialog.component';

@Component({
  selector: 'app-run-step-by-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: 'run-step-by-step.component.html',
  styleUrl: 'run-step-by-step.component.css'
})
export class RunStepByStepComponent implements OnInit, OnDestroy, OnChanges {
  @Input() pipelineId?: number;
  @Input() projectId?: number | null;

  pipeline: Pipeline | null = null;
  pipelineSteps: PipelineStep[] = [];
  selectedStep: PipelineStep | null = null;
  currentStepIndex = 0;
  isRunning = false;
  isPaused = false;
  isStopped = false;
  hasPendingSteps = false;
  private pipelineStarted = false;

  private eventSource?: EventSource;
  private destroy$ = new Subject<void>();
  private lastUpdateTime = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private projectContext: ProjectContextService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.pipelineId = this.pipelineId || (params['pipelineId'] ? +params['pipelineId'] : undefined);
      const projectId = params['projectId'] ? +params['projectId'] : this.projectContext.getProjectId();
      this.projectId = this.projectId || (projectId !== null ? projectId : undefined);

      if (this.pipelineId && this.projectId) {
        this.loadPipelineData();
      }
    });
  }

  isStepRunnable(step: PipelineStep): boolean {
    return step.status === 'running' || step.status === 'completed';
  }

  canRunStep(step: PipelineStep, index: number): boolean {
    if (step.status === 'running' || step.status === 'completed' || this.isStopped) {
      return false;
    }
    if (index === 0) {
      return true;
    }
    const prevStep = this.pipelineSteps[index - 1];
    return prevStep?.status === 'completed';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pipelineId'] || changes['projectId']) {
      if (this.pipelineId && this.projectId && !this.pipeline) {
        this.loadPipelineData();
      }
    }
  }

  hasPipelineStarted(): boolean {
    return this.pipelineStarted || this.pipeline?.status === 'running' || this.isRunning || this.isPaused;
  }

  ngOnDestroy() {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cleanup(): void {
    this.disconnectSse();
  }

  loadPipelineData(): void {
    const pipelineId = this.pipelineId;
    const projectId = this.projectId;
    if (!pipelineId || !projectId) return;

    this.isRunning = false;
    this.isPaused = false;
    this.pipelineStarted = false;
    this.cdr.markForCheck();

    this.apiService.getPipelinesByProject(projectId, 0, 100).subscribe({
      next: (response: any) => {
        const pipelines: Pipeline[] = response.pipelines || [];
        this.pipeline = pipelines.find(p => p.id === pipelineId) || pipelines[0];
        
        this.apiService.getLatestPipelineRun(pipelineId).subscribe({
          next: (run) => {
            if (run && run.status === 'running') {
              this.apiService.isPipelinePaused(projectId, pipelineId).subscribe({
                next: (pausedResponse) => {
                  this.isPaused = pausedResponse.paused;
                  this.pipelineStarted = true;
                  this.isRunning = !this.isPaused;
                  if (pausedResponse.pendingStepOrder) {
                    this.currentStepIndex = pausedResponse.pendingStepOrder - 1;
                  }
                  this.cdr.markForCheck();
                  this.loadPipelineSteps();
                  this.connectSse();
                },
                error: () => {
                  this.pipelineStarted = true;
                  this.isRunning = true;
                  this.cdr.markForCheck();
                  this.loadPipelineSteps();
                  this.connectSse();
                }
              });
            } else if (this.pipeline?.status === 'running') {
              this.apiService.isPipelinePaused(projectId, pipelineId).subscribe({
                next: (pausedResponse) => {
                  this.isPaused = pausedResponse.paused;
                  this.pipelineStarted = true;
                  this.isRunning = !this.isPaused;
                  if (pausedResponse.pendingStepOrder) {
                    this.currentStepIndex = pausedResponse.pendingStepOrder - 1;
                  }
                  this.cdr.markForCheck();
                  this.loadPipelineSteps();
                  this.connectSse();
                },
                error: () => {
                  this.cdr.markForCheck();
                  this.createPipelineRun();
                }
              });
            } else {
              this.cdr.markForCheck();
              this.createPipelineRun();
            }
          },
          error: () => {
            this.cdr.markForCheck();
            this.createPipelineRun();
          }
        });
      },
      error: (err) => console.error('Error loading pipeline:', err)
    });
  }

  createPipelineRun(): void {
    if (!this.pipelineId || !this.projectId) return;
    
    this.isRunning = true;
    this.selectedStep = null;
    const pipelineId = this.pipelineId;
    const projectId = this.projectId;
    
    this.apiService.createPipelineRun(pipelineId).pipe(
      switchMap((run) => {
        if (run.steps && run.steps.length > 0) {
          this.pipelineSteps = run.steps.map((step: any) => ({
            id: step.id,
            stepOrder: step.stepOrder,
            agent: step.agentName ? { name: step.agentName, category: step.agentCategory, scope: 'pipeline' } : undefined,
            script: step.scriptName ? { name: step.scriptName, category: step.scriptCategory, namespace: '', scope: 'pipeline' } : undefined,
            status: 'ready',
            outputContent: '',
            outputType: step.outputType
          }));
          this.selectedStep = this.pipelineSteps[0] || null;
          this.cdr.detectChanges();
        }
        return this.apiService.runPipeline(projectId, pipelineId);
      })
    ).subscribe({
      next: () => {
        this.connectSse();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error running pipeline:', err);
        this.isRunning = false;
        this.cdr.detectChanges();
      }
    });
  }

  checkPausedState(): void {
    if (!this.pipelineId || !this.projectId) return;

    this.apiService.isPipelinePaused(this.projectId, this.pipelineId).subscribe({
      next: (response) => {
        this.isPaused = response.paused;
        this.isRunning = !this.isPaused && this.pipelineSteps.some(s => s.status === 'running');
        this.cdr.markForCheck();
      },
      error: () => {
        this.isPaused = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPipelineSteps(): void {
    const pipelineId = this.pipelineId;
    if (!pipelineId) return;

    this.apiService.getLatestPipelineRun(pipelineId).subscribe({
      next: (run) => {
        if (run && run.steps && run.steps.length > 0) {
          this.pipelineSteps = run.steps.map((step: any) => ({
            id: step.id,
            stepOrder: step.stepOrder,
            agent: step.agentName ? { name: step.agentName, category: step.agentCategory, scope: 'pipeline' } : undefined,
            script: step.scriptName ? { name: step.scriptName, category: step.scriptCategory, namespace: '', scope: 'pipeline' } : undefined,
            status: step.status || 'pending',
            outputContent: step.outputContent || ''
          }));
          this.isRunning = run.status === 'running';
          this.updateSelectedStep();
          this.updateState();
        } else {
          this.apiService.getPipelineSteps(pipelineId).subscribe({
            next: (steps) => {
              const hasChanged = this.hasStepsChanged(this.pipelineSteps, steps);

              if (hasChanged) {
                this.pipelineSteps = steps.map(step => ({
                  ...step,
                  status: step.status || 'pending'
                }));

                this.updateSelectedStep();
                this.updateState();
              }

              this.cdr.markForCheck();
            },
            error: (err) => console.error('Error loading steps:', err)
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.apiService.getPipelineSteps(pipelineId).subscribe({
          next: (steps) => {
            const hasChanged = this.hasStepsChanged(this.pipelineSteps, steps);

            if (hasChanged) {
              this.pipelineSteps = steps.map(step => ({
                ...step,
                status: step.status || 'pending'
              }));

              this.updateSelectedStep();
              this.updateState();
            }

            this.cdr.markForCheck();
          },
          error: (err) => console.error('Error loading steps:', err)
        });
      }
    });
  }

  private hasStepsChanged(oldSteps: PipelineStep[], newSteps: PipelineStep[]): boolean {
    if (oldSteps.length !== newSteps.length) return true;

    for (let i = 0; i < oldSteps.length; i++) {
      if (oldSteps[i].status !== newSteps[i].status ||
        oldSteps[i].outputContent !== newSteps[i].outputContent) {
        return true;
      }
    }

    return false;
  }

  private updateSelectedStep(): void {
    if (this.selectedStep) {
      const updatedStep = this.pipelineSteps.find(s => s.id === this.selectedStep?.id);
      if (updatedStep) {
        this.selectedStep = { ...updatedStep };
      }
    }
  }

  private updateState(): void {
    this.isRunning = this.pipelineSteps.some(s => s.status === 'running');
    this.isPaused = this.pipelineSteps.some(s => s.status === 'completed') &&
      this.pipelineSteps.some(s => s.status === 'pending') &&
      !this.isRunning;
    this.hasPendingSteps = this.pipelineSteps.some(s => s.status === 'pending' || s.status === 'failed');
    
    const runningIndex = this.pipelineSteps.findIndex(s => s.status === 'running');
    if (runningIndex !== -1) {
      this.currentStepIndex = runningIndex;
    } else {
      const completedCount = this.pipelineSteps.filter(s => s.status === 'completed').length;
      this.currentStepIndex = completedCount;
    }
  }

  getStepStatus(step: PipelineStep, index: number): string {
    if (step.status === 'running') return 'running';
    if (step.status === 'completed') return 'completed';
    if (step.status === 'failed') return 'failed';
    
    if (index === 0) return step.status || 'pending';
    
    const prevStep = this.pipelineSteps[index - 1];
    if (prevStep?.status === 'completed') return 'ready';
    
    return step.status || 'pending';
  }

  getStepIndex(step: PipelineStep): number {
    return this.pipelineSteps.findIndex(s => s.id === step.id);
  }

  selectStep(step: PipelineStep): void {
    this.selectedStep = { ...step };
    this.cdr.markForCheck();
  }

  runSingleStep(step: PipelineStep): void {
    if (!this.projectId || !this.pipelineId) return;

    const stepIndex = this.getStepIndex(step);
    if (stepIndex > 0) {
      const prevStep = this.pipelineSteps[stepIndex - 1];
      if (prevStep.status !== 'completed') {
        console.warn('Previous step must be completed first');
        return;
      }
    }

    this.pipelineStarted = true;
    this.isRunning = true;
    this.isPaused = false;
    this.cdr.markForCheck();

    if (stepIndex === 0 && this.pipelineSteps.every(s => s.status === 'ready' || s.status === 'pending')) {
      this.apiService.runPipeline(this.projectId, this.pipelineId).subscribe({
        error: (err) => {
          console.error('Error running step:', err);
          this.isRunning = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.apiService.continuePipeline(this.projectId, this.pipelineId).subscribe({
        error: (err) => {
          console.error('Error continuing step:', err);
          this.isRunning = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  runAllRemaining(): void {
    if (!this.projectId || !this.pipelineId) return;

    this.pipelineStarted = true;
    this.isPaused = false;
    this.isRunning = true;
    this.cdr.markForCheck();

    const firstRunningIndex = this.pipelineSteps.findIndex(s => s.status === 'running');
    const firstPausedIndex = this.pipelineSteps.findIndex(s => s.status === 'completed');
    
    if (firstPausedIndex !== -1 && firstPausedIndex < this.pipelineSteps.length - 1) {
      this.apiService.continuePipeline(this.projectId, this.pipelineId).subscribe({
        error: (err) => {
          console.error('Error continuing pipeline:', err);
          this.isRunning = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.apiService.runPipeline(this.projectId, this.pipelineId).subscribe({
        error: (err) => {
          console.error('Error running pipeline:', err);
          this.isRunning = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  pausePipeline(): void {
    if (!this.pipelineId || !this.projectId) return;

    this.apiService.stopPipeline(this.projectId, this.pipelineId).subscribe({
      next: () => {
        this.isRunning = false;
        this.isPaused = true;
        this.cdr.markForCheck();
        this.loadPipelineSteps();
      },
      error: (err) => console.error('Error pausing pipeline:', err)
    });
  }

  continuePipeline(): void {
    if (!this.pipelineId || !this.projectId) return;

    this.pipelineStarted = true;
    this.isPaused = false;
    this.isRunning = true;
    this.cdr.markForCheck();

    this.apiService.continuePipeline(this.projectId, this.pipelineId).subscribe({
      error: (err) => {
        console.error('Error continuing pipeline:', err);
        this.isRunning = false;
        this.cdr.markForCheck();
      }
    });
  }

  stopPipeline(): void {
    if (!this.pipelineId || !this.projectId) return;

    this.disconnectSse();
    this.isRunning = false;
    this.isPaused = false;
    this.isStopped = true;

    this.apiService.stopPipeline(this.projectId, this.pipelineId).subscribe({
      next: () => {
        this.loadPipelineSteps();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error stopping pipeline:', err)
    });

    this.cdr.markForCheck();
  }

  openInputDialog(step: PipelineStep): void {
    if (!this.pipelineId) return;

    this.dialog.open(StepIODialogComponent, {
      data: {
        step,
        pipelineId: this.pipelineId,
        mode: 'input'
      },
      width: '600px',
      panelClass: 'dark-dialog'
    }).afterClosed().subscribe(() => {
      this.loadPipelineSteps();
    });
  }

  openOutputDialog(step: PipelineStep): void {
    if (!this.pipelineId) return;

    this.dialog.open(StepIODialogComponent, {
      data: {
        step,
        pipelineId: this.pipelineId,
        mode: 'output'
      },
      width: '600px',
      panelClass: 'dark-dialog'
    }).afterClosed().subscribe(() => {
      this.loadPipelineSteps();
    });
  }

  openConsoleOutput(step: PipelineStep): void {
    this.dialog.open(ConsoleOutputDialogComponent, {
      data: { step },
      width: '95vw',
      height: '90vh',
      maxWidth: 'none',
      maxHeight: 'none',
      panelClass: 'console-dialog-panel'
    });
  }

  goBack(): void {
    this.cleanup();
    if (this.projectId && this.pipelineId) {
      this.router.navigate(['/project', this.projectId], {
        queryParams: { pipelineId: this.pipelineId }
      });
    } else if (this.projectId) {
      this.router.navigate(['/project', this.projectId]);
    } else {
      this.router.navigate(['/project']);
    }
  }

  private connectSse(): void {
    if (!this.pipelineId) return;

    this.disconnectSse();
    const baseUrl = 'http://localhost:8080';
    this.eventSource = new EventSource(`${baseUrl}/api/pipelines/${this.pipelineId}/stream`);

    this.eventSource.addEventListener('connected', (event) => {
      console.log('SSE connected');
    });

    this.eventSource.addEventListener('step-output', (event) => {
      console.log('step-output event received:', event.data);
      try {
        const data = JSON.parse(event.data);
        this.handleStepOutput(data);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });

    this.eventSource.addEventListener('pipeline-paused', (event) => {
      console.log('pipeline-paused event received');
      try {
        const data = JSON.parse(event.data);
        this.isPaused = true;
        this.isRunning = false;
        this.cdr.markForCheck();
        this.loadPipelineSteps();
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });

    this.eventSource.addEventListener('step-error', (event) => {
      console.log('step-error event received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Step error:', data);
        const step = this.pipelineSteps.find(s => s.id === data.stepId);
        if (step) {
          step.status = 'failed';
          step.outputContent = (step.outputContent || '') + '\n[ERROR]: ' + data.error;
          if (data.stackTrace) {
            step.outputContent += '\nStack: ' + data.stackTrace;
          }
          this.updateState();
          this.cdr.markForCheck();
        }
      } catch (e) {
        console.error('Error parsing SSE step-error:', e);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.disconnectSse();
      if (this.isRunning && !this.isPaused) {
        console.log('Attempting to reconnect SSE in 3 seconds...');
        setTimeout(() => {
          if (this.isRunning && !this.isPaused) {
            this.connectSse();
          }
        }, 3000);
      }
    };
  }

  private disconnectSse(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  private handleStepOutput(data: { stepId: number; stepOrder?: number; output: string; status: string }): void {
    const step = this.pipelineSteps.find(s => s.id === data.stepId || (data.stepOrder && s.stepOrder === data.stepOrder));
    if (step) {
      step.status = data.status;
      step.outputContent = (step.outputContent || '') + data.output;

      if (this.selectedStep?.id === step.id) {
        this.selectedStep = { ...step };
      }

      this.updateState();
      this.cdr.markForCheck();
    }
  }
}
