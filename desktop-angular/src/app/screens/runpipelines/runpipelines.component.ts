import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService, Pipeline, PipelineStep } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { ConsoleOutputDialogComponent } from '../../components/console-output-dialog/console-output-dialog.component';

const VALID_STATUSES = ['completed', 'running', 'failed', 'pending', 'ready'];

function getStatusClass(status: string | undefined | null, isPipelineRunning: boolean = false): string {
  if (!status || !VALID_STATUSES.includes(status)) {
    return isPipelineRunning ? 'running' : 'pending';
  }
  return status;
}

@Component({
  selector: 'app-runpipelines',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './runpipelines.component.html',
  styleUrl: './runpipelines.component.css'
})
export class RunpipelinesComponent implements OnInit, OnDestroy {
  pipeline: Pipeline | null = null;
  pipelineSteps: PipelineStep[] = [];
  selectedStep: PipelineStep | null = null;
  currentStepIndex = 0;
  isRunning = false;
  isPaused = false;
  isStopping = false;
  showLoading = false;
  projectId: number | null = null;
  currentRunId: number | null = null;
  
  private eventSource?: EventSource;
  private pollingInterval: any;
  private lastSseUpdate: number = 0;
  private processedStepOutputs = new Set<string>();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private projectContext: ProjectContextService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.projectId = params['projectId'] ? +params['projectId'] : this.projectContext.getProjectId();
      const pipelineId = params['pipelineId'];
      
      if (pipelineId && this.projectId) {
        this.loadPipeline(+pipelineId, this.projectId);
        this.connectSse(+pipelineId);
      } else if (this.projectId) {
        this.loadPipelines(this.projectId);
      }
    });
  }
  
  ngOnDestroy() {
    this.disconnectSse();
  }
  
  connectSse(pipelineId: number) {
    this.disconnectSse();
    const baseUrl = 'http://localhost:8080';
    this.eventSource = new EventSource(`${baseUrl}/api/pipelines/${pipelineId}/stream`);
    
    this.eventSource.addEventListener('connected', (event) => {
      console.log('SSE connected:', event);
    });
    
    this.eventSource.addEventListener('step-output', (event) => {
      console.log('SSE step-output received:', event.data);
      this.lastSseUpdate = Date.now();
      try {
        const data = JSON.parse(event.data);
        this.handleStepOutput(data);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });
    
    this.eventSource.addEventListener('pipeline-complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Pipeline complete:', data);
        this.processedStepOutputs.clear();
        this.isRunning = false;
        this.isPaused = false;
        this.stopPolling();
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });
    
    this.eventSource.addEventListener('pipeline-paused', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Pipeline paused:', data);
        this.isPaused = true;
        this.isRunning = false;
        this.currentStepIndex = data.completedStepOrder || data.nextStepOrder - 1;
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });
    
    this.eventSource.addEventListener('step-error', (event) => {
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
          this.cdr.detectChanges();
        }
      } catch (e) {
        console.error('Error parsing SSE step-error:', e);
      }
    });
    
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      const currentPipelineId = this.pipeline?.id;
      this.disconnectSse();
      if (this.isRunning && currentPipelineId) {
        console.log('Attempting to reconnect SSE in 3 seconds...');
        setTimeout(() => {
          if (this.isRunning && this.pipeline?.id === currentPipelineId) {
            this.connectSse(currentPipelineId);
          }
        }, 3000);
      }
    };
  }
  
  disconnectSse() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.stopPolling();
  }

  startPolling(intervalMs: number = 3000) {
    this.stopPolling();
    this.lastSseUpdate = Date.now();
    this.pollingInterval = setInterval(() => {
      if (this.isRunning && !this.isPaused && this.pipeline?.id && this.currentRunId) {
        const timeSinceLastUpdate = Date.now() - this.lastSseUpdate;
        if (timeSinceLastUpdate > intervalMs) {
          console.log('No SSE update for ' + timeSinceLastUpdate + 'ms, polling for status...');
          this.pollPipelineStatus();
        }
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  pollPipelineStatus() {
    if (!this.pipeline?.id || !this.currentRunId) return;
    
    this.apiService.getLatestPipelineRun(this.pipeline.id).subscribe({
      next: (run) => {
        if (run && run.steps) {
          let updated = false;
          run.steps.forEach((stepData: any) => {
            const step = this.pipelineSteps.find(s => s.id === stepData.id);
            if (step) {
              if (step.status !== stepData.status) {
                step.status = stepData.status;
                updated = true;
              }
              if (stepData.outputContent) {
                if (step.loadedFromServer) {
                  step.outputContent = stepData.outputContent;
                  step.loadedFromServer = false;
                } else if (stepData.outputContent.length > (step.outputContent?.length || 0) * 1.5) {
                  step.outputContent = stepData.outputContent;
                } else if (stepData.outputContent !== step.outputContent) {
                  step.outputContent = (step.outputContent || '') + stepData.outputContent;
                }
                updated = true;
              }
            }
          });
          if (updated) {
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => console.error('Error polling pipeline status:', err)
    });
  }
  
  handleStepOutput(data: { stepId: number; stepOrder: number; output: string; status: string }) {
    const messageKey = `${data.stepId}-${data.stepOrder}-${data.status}`;
    if (this.processedStepOutputs.has(messageKey)) {
      return;
    }
    this.processedStepOutputs.add(messageKey);

    const step = this.pipelineSteps.find(s => s.id === data.stepId || s.stepOrder === data.stepOrder);
    if (step) {
      step.status = data.status;
      
      if (step.loadedFromServer) {
        step.outputContent = data.output;
        step.loadedFromServer = false;
      } else {
        step.outputContent = (step.outputContent || '') + data.output;
      }
      
      if (data.status === 'completed' || data.status === 'failed') {
        this.showLoading = false;
      }
      
      if (this.currentRunId && step.stepOrder) {
        this.apiService.updatePipelineRunStep(
          this.currentRunId,
          step.stepOrder,
          data.status,
          step.outputContent,
          step.outputType
        ).subscribe({
          error: (err) => console.error('Error updating pipeline run step:', err)
        });
      }
      
      if (!this.selectedStep || this.selectedStep.id !== step.id) {
        this.selectedStep = step;
      }
      
      this.cdr.detectChanges();
    }
  }
  
  loadPipelines(projectId: number) {
    this.apiService.getPipelinesByProject(projectId, 0, 100).subscribe({
      next: (response: any) => {
        const pipelines = response.pipelines || [];
        if (pipelines.length > 0) {
          this.pipeline = pipelines[0];
          this.loadPipelineSteps();
        }
      },
      error: (err: any) => console.error('Error loading pipelines:', err)
    });
  }
  
  loadPipeline(pipelineId: number, projectId: number | null) {
    if (!projectId) return;
    
    this.isRunning = true;
    this.cdr.markForCheck();
    this.currentRunId = null;
    
    this.apiService.getPipelinesByProject(projectId, 0, 100).subscribe({
      next: (response: any) => {
        const pipelines: Pipeline[] = response.pipelines || [];
        this.pipeline = pipelines.find((p: Pipeline) => p.id === pipelineId) || pipelines[0];
        
        this.apiService.getLatestPipelineRun(pipelineId).subscribe({
          next: (run) => {
            if (run && (run.status === 'running' || run.status === 'pending')) {
              this.currentRunId = run.id || null;
              this.isRunning = true;
              this.isPaused = false;
              this.showLoading = true;
              this.cdr.markForCheck();
              this.loadPipelineSteps(true, true);
              this.startPolling();
            } else if (run && run.status === 'completed') {
              this.currentRunId = run.id || null;
              this.isRunning = false;
              this.showLoading = false;
              this.cdr.markForCheck();
              this.loadPipelineSteps(true, false);
            } else if (run && run.status === 'failed') {
              this.currentRunId = run.id || null;
              this.isRunning = false;
              this.showLoading = false;
              this.cdr.markForCheck();
              this.loadPipelineSteps(true, false);
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
      error: (err: any) => {
        console.error('Error loading pipeline:', err);
        this.isRunning = false;
        this.cdr.markForCheck();
      }
    });
  }

  createPipelineRun() {
    if (!this.pipeline?.id || !this.projectId) return;
    
    this.isRunning = true;
    this.showLoading = true;
    this.selectedStep = null;
    const pipelineId = this.pipeline.id;
    const projectId = this.projectId;
    
    this.apiService.createPipelineRun(pipelineId).pipe(
      switchMap((run) => {
        this.currentRunId = run.id || null;
        if (run.steps && run.steps.length > 0) {
            this.currentRunId = run.id || null;
            this.pipelineSteps = run.steps.map((step: any, index: number) => ({
              id: step.id,
              stepOrder: step.stepOrder,
              agent: step.agentName ? { name: step.agentName, category: step.agentCategory, scope: 'pipeline' } : undefined,
              script: step.scriptName ? { name: step.scriptName, category: step.scriptCategory, namespace: '', scope: 'pipeline' } : undefined,
              status: index === 0 ? 'running' : 'ready',
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
        // Keep loading visible until SSE updates the step status
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error running pipeline:', err);
        this.isRunning = false;
        this.showLoading = false;
        this.cdr.detectChanges();
      }
    });
    
    // Fallback: hide loading after 10 seconds if no SSE update
    setTimeout(() => {
      if (this.showLoading) {
        this.showLoading = false;
        this.cdr.detectChanges();
      }
    }, 10000);
  }

  updatePipelineRun(step: PipelineStep) {
    if (!this.currentRunId || !step.stepOrder) return;
    
    this.apiService.updatePipelineRunStep(
      this.currentRunId,
      step.stepOrder,
      step.status || 'ready',
      step.outputContent,
      step.outputType
    ).subscribe({
      error: (err) => console.error('Error updating pipeline run step:', err)
    });
  }

  completePipelineRun(status: string) {
    if (!this.currentRunId) return;
    
    this.apiService.completePipelineRun(this.currentRunId, status).subscribe({
      error: (err) => console.error('Error completing pipeline run:', err)
    });
  }
  
  loadPipelineSteps(clearOutput = false, isActivePipeline = false) {
    if (!this.pipeline?.id) {
      return;
    }
    
    const pipelineId = this.pipeline.id;
    
    if (!this.currentRunId) {
      this.apiService.getLatestPipelineRun(pipelineId).subscribe({
        next: (run) => {
          if (run && run.steps && run.steps.length > 0) {
            this.currentRunId = run.id || null;
            this.pipelineSteps = run.steps.map((step: any, index: number) => ({
              id: step.id,
              stepOrder: step.stepOrder,
              agent: step.agentName ? { name: step.agentName, category: step.agentCategory, scope: 'pipeline' } : undefined,
              script: step.scriptName ? { name: step.scriptName, category: step.scriptCategory, namespace: '', scope: 'pipeline' } : undefined,
              status: isActivePipeline && index === 0 && run.status === 'running' ? 'running' : getStatusClass(step.status, run.status === 'running'),
              outputContent: (step.outputContent || ''),
              outputType: step.outputType,
              loadedFromServer: true
            }));
            this.isRunning = run.status === 'running';
            if (clearOutput) {
              this.selectedStep = null;
            } else if (!this.selectedStep && this.pipelineSteps.length > 0) {
              this.selectedStep = this.pipelineSteps[0];
            }
          } else {
            this.apiService.getPipelineSteps(pipelineId).subscribe({
              next: (steps) => {
                this.pipelineSteps = steps.map(step => ({
                  ...step,
                  outputContent: clearOutput ? '' : (step.outputContent || ''),
                  status: 'ready'
                }));
                if (clearOutput) {
                  this.selectedStep = null;
                  this.isRunning = true;
                } else if (!this.selectedStep && this.pipelineSteps.length > 0) {
                  this.selectedStep = this.pipelineSteps[0];
                }
                this.updateCurrentStepIndex();
              }
            });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.apiService.getPipelineSteps(pipelineId).subscribe({
            next: (steps) => {
              this.pipelineSteps = steps.map(step => ({
                ...step,
                outputContent: clearOutput ? '' : (step.outputContent || ''),
                status: 'ready'
              }));
              if (clearOutput) {
                this.selectedStep = null;
                this.isRunning = true;
              } else if (!this.selectedStep && this.pipelineSteps.length > 0) {
                this.selectedStep = this.pipelineSteps[0];
              }
              this.updateCurrentStepIndex();
              this.cdr.detectChanges();
            }
          });
        }
      });
      return;
    }
    
    this.apiService.getPipelineSteps(pipelineId).subscribe({
      next: (steps) => {
        if (!this.currentRunId) {
          this.pipelineSteps = steps.map(step => ({
            ...step,
            outputContent: clearOutput ? '' : (step.outputContent || ''),
            status: 'ready'
          }));
          if (clearOutput) {
            this.selectedStep = null;
            this.isRunning = true;
          } else if (!this.selectedStep && this.pipelineSteps.length > 0) {
            this.selectedStep = this.pipelineSteps[0];
          }
          this.updateCurrentStepIndex();
          this.cdr.detectChanges();
          return;
        }
        
        if (clearOutput) {
          this.pipelineSteps = steps.map(step => ({
            ...step,
            outputContent: '',
            status: 'ready'
          }));
          this.selectedStep = null;
          this.isRunning = true;
          this.updateCurrentStepIndex();
          this.cdr.detectChanges();
          return;
        }
        
        if (!this.selectedStep && steps.length > 0) {
          this.selectedStep = steps[0];
        }
        
        const previousSteps = this.pipelineSteps;
        this.pipelineSteps = steps;
        
        for (const step of this.pipelineSteps) {
          const prevStep = previousSteps.find(ps => ps.id === step.id);
          if (prevStep && (prevStep.status !== step.status || prevStep.outputContent !== step.outputContent)) {
            this.updatePipelineRun(step);
          }
        }
        
        const allCompleted = this.pipelineSteps.every(s => s.status === 'completed');
        const anyFailed = this.pipelineSteps.some(s => s.status === 'failed');
        
        if (this.isRunning && !this.pipelineSteps.some(s => s.status === 'running')) {
          if (anyFailed) {
            this.completePipelineRun('failed');
          } else if (allCompleted) {
            this.completePipelineRun('completed');
          }
        }
        
        this.updateCurrentStepIndex();
        this.cdr.detectChanges();
      },
  error: (err: any) => console.error('Error loading pipeline steps:', err)
    });
  }
  
  updateCurrentStepIndex() {
    const runningIndex = this.pipelineSteps.findIndex(s => s.status === 'running');
    if (runningIndex !== -1) {
      this.currentStepIndex = runningIndex;
      this.isRunning = true;
    } else {
      const completedCount = this.pipelineSteps.filter(s => s.status === 'completed').length;
      this.currentStepIndex = completedCount;
      this.isRunning = this.pipelineSteps.some(s => s.status === 'running');
    }
    this.cdr.markForCheck();
  }
  
  selectStep(step: PipelineStep) {
    this.selectedStep = step;
  }

  isPipelineFinished(): boolean {
    if (this.pipelineSteps.length === 0) return false;
    const hasRunning = this.pipelineSteps.some(s => s.status === 'running');
    const hasPending = this.pipelineSteps.some(s => s.status === 'pending' || s.status === 'ready');
    return !hasRunning && !hasPending && (this.isPaused || this.pipelineSteps.every(s => s.status === 'completed' || s.status === 'failed'));
  }
  
  goBack() {
    if (this.projectId && this.pipeline?.id) {
      this.router.navigate(['/project', this.projectId], { 
        queryParams: { pipelineId: this.pipeline.id } 
      });
    } else if (this.projectId) {
      this.router.navigate(['/project', this.projectId]);
    } else {
      this.router.navigate(['/project']);
    }
  }
  
  stopPipeline() {
    this.isStopping = true;
    this.cdr.markForCheck();
    if (this.projectId && this.pipeline?.id) {
      this.apiService.stopPipeline(this.projectId, this.pipeline.id).subscribe({
        next: () => {
          this.isRunning = false;
          this.isPaused = false;
          this.isStopping = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isStopping = false;
          this.cdr.markForCheck();
          console.error('Error stopping pipeline:', err);
        }
      });
    } else {
      this.isStopping = false;
      this.cdr.markForCheck();
    }
    if (this.currentRunId) {
      this.completePipelineRun('stopped');
    }
  }

  continuePipeline() {
    if (!this.projectId || !this.pipeline?.id) return;
    
    this.isPaused = false;
    this.isRunning = true;
    
    this.apiService.continuePipeline(this.projectId, this.pipeline.id).subscribe({
      error: (err) => console.error('Error continuing pipeline:', err)
    });
  }
  
  openInput(step: PipelineStep) {
    if (!this.pipeline?.id || !step.id) return;
    
    this.apiService.getPipelineSteps(this.pipeline.id).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.id === step.id);
        if (updatedStep) {
          this.cdr.detectChanges();
        }
      }
    });
  }
  
  openOutput(step: PipelineStep) {
    if (!this.pipeline?.id || !step.id) return;
    
    this.apiService.getPipelineSteps(this.pipeline.id).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.id === step.id);
        if (updatedStep) {
          this.cdr.detectChanges();
        }
      }
    });
  }

  openConsoleOutput(step: PipelineStep) {
    this.dialog.open(ConsoleOutputDialogComponent, {
      data: { step, pipelineId: this.pipeline?.id },
      width: '95vw',
      height: '90vh',
      maxWidth: 'none',
      maxHeight: 'none',
      panelClass: 'console-dialog-panel'
    });
  }
}
