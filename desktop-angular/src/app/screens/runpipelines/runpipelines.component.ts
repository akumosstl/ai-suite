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
import { InputDialogComponent } from '../../components/input-dialog/input-dialog.component';

/**
 * Conexão SSE constante para status de execução em tempo real.
 */
const VALID_STATUSES = ['completed', 'running', 'failed', 'pending', 'ready'];
const ACTIVE_STATUSES = ['running', 'completed', 'failed'];
const BLOCKING_STATUSES = ['running', 'completed', 'failed'];

function hasBlockingPreviousStep(steps: PipelineStep[], currentIndex: number): boolean {
  for (let i = 0; i < currentIndex; i++) {
    if (BLOCKING_STATUSES.includes(steps[i].status || '')) {
      return true;
    }
  }
  return false;
}

function normalizeStepStatus(steps: PipelineStep[]): PipelineStep[] {
  return steps.map((step, index) => {
    const status = step.status || 'pending';
    if (status === 'ready' && hasBlockingPreviousStep(steps, index)) {
      return { ...step, status: 'pending' };
    }
    return step;
  });
}

/**
 * Retorna a classe CSS baseada no status da pipeline.
 * @param status - Status atual da pipeline
 * @param isPipelineRunning - Indica se a pipeline está em execução
 * @returns Classe CSS correspondente ao status
 */
function getStatusClass(status: string | undefined | null, isPipelineRunning: boolean = false): string {
  if (!status || !VALID_STATUSES.includes(status)) {
    return isPipelineRunning ? 'running' : 'pending';
  }
  return status;
}

/**
 * Componente de execução de pipelines em tempo real.
 * Utiliza SSE (Server-Sent Events) para atualizações em tempo real
 * e fallback de polling para status da execução.
 * Exibe o progresso, saída de cada step e permite controlar a execução.
 * 
 * @componentName RunpipelinesComponent
 * @selector app-runpipelines
 */
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
  
  /**
   * Inicializa o componente carregando os parâmetros da rota.
   */
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.projectId = params['projectId'] ? +params['projectId'] : this.projectContext.getProjectId();
      const pipelineId = params['pipelineId'];
      
      if (pipelineId && this.projectId) {
        this.loadPipeline(+pipelineId, this.projectId);
      } else if (this.projectId) {
        this.loadPipelines(this.projectId);
      }
    });
  }
  
  /**
   * Desconecta o SSE e limpa intervalos ao destruir o componente.
   */
  ngOnDestroy() {
    this.disconnectSse();
  }
  
  /**
   * Estabelece conexão SSE com o servidor para receber atualizações em tempo real.
   * @param pipelineId - ID da pipeline para eventos
   */
  connectSse(runId: number) {
    this.disconnectSse();
    const baseUrl = 'http://localhost:8080';
    const sseUrl = `${baseUrl}/api/pipeline-runs/${runId}/stream`;
    console.log('Connecting to SSE:', sseUrl);
    this.eventSource = new EventSource(sseUrl);
    
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
        this.showLoading = false;
        this.stopPolling();
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });
    
    this.eventSource.addEventListener('step-error', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Step error:', data);
        const step = this.pipelineSteps.find(s => s.stepOrder === data.stepOrder);
        if (step) {
          step.status = 'failed';
          step.outputContent = (step.outputContent || '') + '\n[ERROR]: ' + data.error;
          if (data.stackTrace) {
            step.outputContent += '\nStack: ' + data.stackTrace;
          }
          this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
          this.cdr.detectChanges();
        }
      } catch (e) {
        console.error('Error parsing SSE step-error:', e);
      }
    });
    
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.disconnectSse();
      if (this.isRunning && this.currentRunId) {
        console.log('Attempting to reconnect SSE in 3 seconds...');
        setTimeout(() => {
          if (this.isRunning && this.currentRunId) {
            this.connectSse(this.currentRunId);
          }
        }, 3000);
      }
    };
  }
  
  /**
   * Desconecta do SSE e para o polling.
   */
  disconnectSse() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.stopPolling();
  }

  /**
   * Inicia o polling para verificação de status quando SSE não está disponível.
   * @param intervalMs - Intervalo de verificação em milissegundos (padrão: 3000)
   */
  startPolling(intervalMs: number = 3000) {
    console.log('starting polling for pipeline status...');
    this.stopPolling();
    this.lastSseUpdate = Date.now();
    this.pollingInterval = setInterval(() => {
      if (this.isRunning && this.pipeline?.id) {
        this.pollPipelineStatus();
      } else {
        this.stopPolling();
      }
    }, intervalMs);
  }

  /**
   * Para o polling de status.
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  /**
   * Faz polling do status da pipeline no servidor.
   */
  pollPipelineStatus() {
    if (!this.pipeline?.id || !this.currentRunId) return;
    
    this.apiService.getLatestPipelineRun(this.pipeline.id).subscribe({
      next: (run) => {
        console.log('Polling - run status:', run?.status, 'steps:', run?.steps?.length);
        if (run) {
          if (run.status === 'completed' || run.status === 'failed' || run.status === 'stopped') {
            this.isRunning = false;
            this.showLoading = false;
            this.stopPolling();
            console.log('Pipeline finished with status:', run.status);
          }
          
          if (run.steps) {
            let updated = false;
            run.steps.forEach((stepData: any) => {
              const step = this.pipelineSteps.find(s => s.stepOrder === stepData.stepOrder);
              if (step) {
                if (stepData.status === 'running') {
                  const prevStep = this.pipelineSteps.find(s => s.stepOrder === stepData.stepOrder - 1);
                  if (prevStep && prevStep.status !== 'completed' && prevStep.status !== 'failed') {
                    prevStep.status = 'completed';
                  }
                }
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
        }
      },
      error: (err) => console.error('Error polling pipeline status:', err)
    });
  }
  
  /**
   * Processa a saída de um step recebida via SSE.
   * @param data - Dados do step contendo id, ordem, saída e status
   */
  handleStepOutput(data: { runId?: number; pipelineId?: number; stepId: number; stepOrder: number; output: string; status: string }) {
    const step = this.pipelineSteps.find(s => s.stepOrder === data.stepOrder);
    if (!step) return;
    
    if (data.status === 'running') {
      const prevStep = this.pipelineSteps.find(s => s.stepOrder === data.stepOrder - 1);
      if (prevStep && prevStep.status !== 'completed' && prevStep.status !== 'failed') {
        prevStep.status = 'completed';
      }
    }
    
    step.status = data.status;
    step.outputContent = data.output;
    step.loadedFromServer = false;
    
    if (data.status === 'completed' || data.status === 'failed') {
      this.showLoading = false;
      this.isRunning = false;
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
    
    if (!this.selectedStep || this.selectedStep.stepOrder !== step.stepOrder) {
      this.selectedStep = step;
    }
    
    this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
    this.cdr.detectChanges();
  }
  
  /**
   * Carrega a lista de pipelines de um projeto.
   * @param projectId - ID do projeto
   */
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
  
  /**
   * Carrega uma pipeline específica e verifica seu status.
   * @param pipelineId - ID da pipeline
   * @param projectId - ID do projeto
   */
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
              this.showLoading = true;
              this.cdr.markForCheck();
              this.loadPipelineSteps(true, true);
              if (this.currentRunId) {
                this.connectSse(this.currentRunId);
              }
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

  /**
   * Cria uma nova execução de pipeline e inicia a execução.
   */
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
              agent: step.agentName ? { name: step.agentName, namespace: step.agentNameSpace, scope: 'pipeline' } : undefined,
              script: step.scriptName ? { name: step.scriptName, namespace: step.scriptNamespace || '', scope: 'pipeline' } : undefined,
              status: index === 0 ? 'running' : 'ready',
              outputContent: '',
              outputType: step.outputType
            }));
            this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
          this.selectedStep = this.pipelineSteps[0] || null;
          this.cdr.detectChanges();
        }
        if (this.currentRunId) {
          this.connectSse(this.currentRunId);
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

  /**
   * Atualiza o status de um step na execução atual.
   * @param step - Step a ser atualizado
   */
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

  /**
   * Finaliza a execução da pipeline com o status especificado.
   * @param status - Status final (completed, failed, stopped)
   */
  completePipelineRun(status: string) {
    if (!this.currentRunId) return;
    
    this.apiService.completePipelineRun(this.currentRunId, status).subscribe({
      error: (err) => console.error('Error completing pipeline run:', err)
    });
  }
  
  /**
   * Carrega os steps da pipeline atual.
   * @param clearOutput - Se deve limpar a saída dos steps
   * @param isActivePipeline - Se é uma pipeline ativa em execução
   */
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
              agent: step.agentName ? { name: step.agentName, namespace: step.agentNamespace, scope: 'pipeline' } : undefined,
              script: step.scriptName ? { name: step.scriptName, namespace: step.scriptNamespace || '', scope: 'pipeline' } : undefined,
              status: isActivePipeline && index === 0 && run.status === 'running' ? 'running' : getStatusClass(step.status, run.status === 'running'),
              inputContent: step.inputContent || '',
              inputType: step.inputType,
              outputContent: (step.outputContent || ''),
              outputType: step.outputType,
              loadedFromServer: true
            }));
            this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
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
                  status: step.status && step.status !== 'ready' ? step.status : (clearOutput ? 'ready' : step.status || 'pending')
                }));
                this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
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
                status: step.status && step.status !== 'ready' ? step.status : (clearOutput ? 'ready' : step.status || 'pending')
              }));
              this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
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
            status: step.status && step.status !== 'ready' ? step.status : (clearOutput ? 'ready' : step.status || 'pending')
          }));
          this.pipelineSteps = normalizeStepStatus(this.pipelineSteps);
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
        this.pipelineSteps = normalizeStepStatus(steps);
        
        for (const step of this.pipelineSteps) {
          const prevStep = previousSteps.find(ps => ps.stepOrder === step.stepOrder);
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
  
  /**
   * Atualiza o índice do step atual com base no status dos steps.
   */
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
  
  /**
   * Seleciona um step para visualização detalhada.
   * @param step - Step a ser selecionado
   */
  selectStep(step: PipelineStep) {
    this.selectedStep = step;
  }

  /**
   * Verifica se a pipeline foi finalizada (todos os steps concluídos ou falhou).
   * @returns True se a pipeline está finalizada
   */
  isPipelineFinished(): boolean {
    if (this.pipelineSteps.length === 0) return false;
    const hasRunning = this.pipelineSteps.some(s => s.status === 'running');
    const hasPending = this.pipelineSteps.some(s => s.status === 'pending' || s.status === 'ready');
    return !hasRunning && !hasPending && this.pipelineSteps.every(s => s.status === 'completed' || s.status === 'failed');
  }
  
  /**
   * Retorna para a página do projeto ou da pipeline.
   */
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
  
  /**
   * Para a execução da pipeline.
   */
  stopPipeline() {
    this.isStopping = true;
    this.cdr.markForCheck();
    if (this.projectId && this.pipeline?.id) {
      this.apiService.stopPipeline(this.projectId, this.pipeline.id).subscribe({
        next: () => {
          this.isRunning = false;
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
  
  /**
   * Abre o diálogo para visualizar/editar a entrada de um step.
   * @param step - Step que terá a entrada editada
   */
  openInput(step: PipelineStep) {
    this.dialog.open(InputDialogComponent, {
      data: { step, pipelineId: this.pipeline?.id },
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      panelClass: 'input-dialog-panel'
    });
  }
  
  /**
   * Abre o diálogo para visualizar a saída de um step.
   * @param step - Step que terá a saída visualizada
   */
  openOutput(step: PipelineStep) {
    if (!this.pipeline?.id || !step.stepOrder) return;
    
    this.apiService.getPipelineSteps(this.pipeline.id).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.stepOrder === step.stepOrder);
        if (updatedStep) {
          this.cdr.detectChanges();
        }
      }
    });
  }

  /**
   * Abre o diálogo de console para visualizar a saída em tempo real de um step.
   * @param step - Step que terá o console visualizado
   */
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

  copyOutput() {
    if (this.selectedStep?.outputContent) {
      navigator.clipboard.writeText(this.selectedStep.outputContent).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }
}
