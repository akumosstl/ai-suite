import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgClass } from '@angular/common';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { PromptDialogComponent } from '../../components/prompt-dialog/prompt-dialog.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService, Project, Pipeline, PipelineStep, Agent, Target, ProjectFile } from '../../services/api.service';
import { SelectAgentDialogComponent, SelectedStep } from '../../components/select-agent-dialog/select-agent-dialog.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';
import { StepIODialogComponent } from '../../components/step-io-dialog/step-io-dialog.component';
import { StepCliDialogComponent } from '../../components/step-cli-dialog/step-cli-dialog.component';
import { StepSettingsDialogComponent } from '../../components/step-settings-dialog/step-settings-dialog.component';
import { CreateFileDialogComponent } from '../../components/create-file-dialog/create-file-dialog.component';
import { EditPipelineDialogComponent } from '../../components/edit-pipeline-dialog/edit-pipeline-dialog.component';
import { ProjectReadmeDialogComponent } from '../../components/project-readme-dialog/project-readme-dialog.component';
import { DuplicatePipelineDialogComponent } from '../../components/duplicate-pipeline-dialog/duplicate-pipeline-dialog.component';

/**
 * Componente principal de gerenciamento de projetos e pipelines.
 * Permite criar, editar e executar pipelines, gerenciar steps,
 * adicionar agentes, skills, scripts, comandos e outros recursos ao projeto.
 * 
 * @componentName ProjectComponent
 * @selector app-project
 */
@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, NgClass, MenuBarComponent, MatButtonModule, MatMenuModule, MatIconModule, MatTooltipModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatSelectModule, FormsModule, MatDialogModule, DragDropModule, PipelineResultDialogComponent, SelectAgentDialogComponent, PanelToggleComponent, StepIODialogComponent, StepCliDialogComponent, StepSettingsDialogComponent, PromptDialogComponent, CreateFileDialogComponent, EditPipelineDialogComponent, ProjectReadmeDialogComponent, DuplicatePipelineDialogComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
/**
 * Tela de detalhes do projeto.
 * Exibe informações, agentes, skills e configurações do projeto selecionado.
 *
 * @author Seu Nome
 * @since 2024
 * @component
 * @description Componente de tela para visualização e edição de projetos.
 */
export class ProjectComponent implements OnInit, OnDestroy {
  pipelinesExpanded = false;
  pipelines: Pipeline[] = [];
  project: Project | null = null;
  selectedPipeline: Pipeline | null = null;
  pipelineSteps: PipelineStep[] = [];
  selectedStep: PipelineStep | null = null;
  loading = false;
  showPipelineForm = false;
  showProjectInfo = true;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  leftPanelCollapsed = false;
  baseUrl = 'http://localhost:1488/';
  newPipeline: Pipeline = {
    name: '',
    description: '',
    status: 'pending',
    outputExtension: 'json',
    type: 'sequential'
  };

  outputExtensions = ['json', 'yml', 'text'];
  filteredOutputExtensions: string[] = [...this.outputExtensions];

  isEditingProject = false;
  editProject: { name: string; description: string; path: string; target: string } = { name: '', description: '', path: '', target: '' };
  targets: Target[] = [];
  isRunningPipeline = false;
  runningPipelineId: number | null = null;
  pipelineStatus: string | null = null;
  isReorderingSteps = false;
  isSavingProject = false;
  endpointsExpanded = false;
  projectFiles: ProjectFile[] = [];

  private runningCheckInterval: any;
  private keydownHandler!: (event: KeyboardEvent) => void;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private projectContext: ProjectContextService,
    private ngZone: NgZone
  ) { }

  /**
   * Copia o texto para a área de transferência e exibe mensagem de sucesso.
   * @param text - Texto a ser copiado
   */
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showMessage('Endpoint copied to clipboard', 'success');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.showMessage('Failed to copy endpoint', 'error');
    });
  }

  /**
   * Para a execução do pipeline atual.
   */
  stopPipeline() {
    if (!this.selectedPipeline?.id || !this.project?.id) {
      return;
    }

    this.apiService.stopPipeline(this.project.id, this.selectedPipeline.id).subscribe({
      next: () => {
        this.showMessage('Pipeline stopped successfully', 'success');
        this.isRunningPipeline = false;
        this.runningPipelineId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error stopping pipeline:', err);
        this.showMessage('Error stopping pipeline', 'error');
      }
    });
  }



  /**
   * Inicializa o componente carregando o projeto pelos parâmetros da rota
   * ou pelo estado de navegação.
   */
  ngOnInit() {
    const nav = this.router.getCurrentNavigation()
    const stateProject = nav?.extras?.state?.['project']
    if (stateProject) {
      this.project = stateProject
      this.loading = false
      this.loadPipelines(stateProject.id)
      if (stateProject.id) {
        localStorage.setItem('lastProjectId', stateProject.id.toString())
        this.projectContext.setProjectId(stateProject.id)
        this.projectContext.setFromProject(true)
        this.loadProjectFiles(stateProject.id)
      }
      this.restoreSelectedPipeline()
      this.cdr.detectChanges()
      return
    }
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('ProjectComponent initialized with id:', id);
      if (id) {
        this.loadProject(parseInt(id, 10));
        localStorage.setItem('lastProjectId', id)
        this.projectContext.setProjectId(parseInt(id, 10))
        this.projectContext.setFromProject(true)
      } else {
        console.log('No project id provided');
        this.project = null;
        this.pipelines = [];
      }
    });

    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === 'r') {
          event.preventDefault();
          event.stopPropagation();
          console.log('Shortcut Ctrl+Shift+R detected');
          this.runPipeline();
        }
      }
      if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'x' && this.isRunningPipeline) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Shortcut Ctrl+X detected');
        this.stopPipeline();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  ngOnDestroy() {
    if (this.runningCheckInterval) {
      clearInterval(this.runningCheckInterval);
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
  }

  /**
   * Carrega os detalhes de um projeto pelo ID.
   * @param id - ID do projeto a ser carregado
   */
  loadProject(id: number) {
    console.log('Loading project with id:', id);
    this.loading = true;
    this.apiService.getProject(id).subscribe({
      next: (project) => {
        console.log('Project loaded:', project);
        this.project = project;
        this.loadPipelines(id);
        this.loadProjectFiles(id);
        this.projectContext.setProjectId(id);
        this.projectContext.setFromProject(true);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.loading = false;
      }
    });
  }

  loadProjectFiles(projectId: number) {
    console.log('loadProjectFiles called for project:', projectId);
    this.apiService.getProjectFiles(projectId).subscribe({
      next: (files) => {
        this.projectFiles = files;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading project files:', error);
        this.projectFiles = [];
      }
    });
  }

  /**
   * Carrega todos os targets disponíveis para edição do projeto.
   */
  loadTargets(): void {
    this.apiService.getTargets().subscribe({
      next: (targets) => {
        this.targets = targets;
        this.cdr.detectChanges();
      },
      error: () => {
        this.targets = [];
      }
    });
  }

  /**
   * Ativa o modo de edição do projeto e carrega os targets.
   */
  editProjectInfo() {
    if (!this.project) return;
    this.loadTargets();
    this.editProject = {
      name: this.project.name || '',
      description: this.project.description || '',
      path: this.project.path || '',
      target: this.project.target || ''
    };
    this.isEditingProject = true;
  }

  /**
   * Cancela a edição do projeto sem salvar.
   */
  cancelEditProject() {
    this.isEditingProject = false;
    this.editProject = { name: '', description: '', path: '', target: '' };
  }

  /**
   * Salva as informações editadas do projeto.
   */
  saveProjectInfo() {
    if (!this.project) return;

    const projectId = this.project.id;
    if (!projectId) return;

    this.isSavingProject = true;

    const updatedProject = {
      ...this.project,
      name: this.editProject.name,
      description: this.editProject.description,
      path: this.editProject.path,
      target: this.editProject.target
    };

    this.apiService.updateProject(projectId, updatedProject).subscribe({
      next: (project) => {
        this.project = { ...this.project, ...project };
        this.isEditingProject = false;
        this.isSavingProject = false;
        this.showMessage('Project saved successfully', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving project:', err);
        this.isSavingProject = false;
        this.showMessage('Error saving project', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Abre o diálogo para editar o README do projeto.
   */
  openReadmeDialog() {
    if (!this.project?.id) {
      return;
    }

    const dialogRef = this.dialog.open(ProjectReadmeDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      height: '80vh',
      data: {
        projectId: this.project.id,
        readme: this.project.readme || ''
      }
    });

    dialogRef.afterClosed().subscribe((updatedProject: Project | undefined) => {
      if (updatedProject && this.project) {
        this.project = { ...this.project, readme: updatedProject.readme };
        this.showMessage('README saved successfully', 'success');
        this.cdr.detectChanges();
      }
    });
  }


  /**
   * Exibe uma mensagem temporária na interface.
   * @param msg - Mensagem a ser exibida
   * @param type - Tipo da mensagem (success ou error)
   */
  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  /**
   * Carrega as pipelines de um projeto específico.
   * @param projectId - ID do projeto
   */
  loadPipelines(projectId: number | undefined) {
    if (projectId === undefined) return;

    this.apiService.getPipelinesByProject(projectId, 0, 100).subscribe({
      next: (response) => {
        this.pipelines = response.pipelines || [];

        this.route.queryParams.subscribe(queryParams => {
          const pipelineId = queryParams['pipelineId'];
          if (pipelineId && this.pipelines.length > 0) {
            const pipeline = this.pipelines.find(p => p.id === parseInt(pipelineId, 10));
            if (pipeline) {
              this.selectPipeline(pipeline);
            }
          }
        });

        this.restoreSelectedPipeline();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading pipelines:', error);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Seleciona uma pipeline e carrega seus steps.
   * @param pipeline - Pipeline a ser selecionada
   */
  selectPipeline(pipeline: Pipeline) {
    this.selectedPipeline = pipeline;
    this.projectContext.setSelectedPipelineId(pipeline.id ?? null);
    this.showProjectInfo = false;
    this.showPipelineForm = false;
    this.message = '';
    this.loadPipelineSteps(pipeline.id!);
    this.checkRunningPipeline();
    this.startRunningCheckInterval();
  }

  /**
   * Restaura a pipeline selecionada anteriormente a partir do contexto do projeto.
   */
  private restoreSelectedPipeline(): void {
    const storedPipelineId = this.projectContext.getSelectedPipelineId();
    if (storedPipelineId && this.pipelines.length > 0) {
      const pipeline = this.pipelines.find(p => p.id === storedPipelineId);
      if (pipeline) {
        this.selectPipeline(pipeline);
      }
    }
  }

  /**
   * Alterna a expansão da lista de pipelines.
   */
  togglePipelines() {
    this.pipelinesExpanded = !this.pipelinesExpanded;
  }

  /**
   * Alterna o estado de recolhimento do painel esquerdo.
   */
  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  @HostListener('document:keydown.control.b')
  onToggleLeftPanel(): void {
    this.toggleLeftPanel();
  }

  @HostListener('document:keydown.control.alt.r')
  onRunPipelineBackground(): void {
    this.runPipelineBackground();
  }

  runPipelineBackground() {
    if (!this.selectedPipeline?.id || this.pipelineSteps.length === 0 || !this.project?.id) {
      return;
    }

    this.isRunningPipeline = true;
    this.runningPipelineId = this.selectedPipeline.id;
    const pipelineId = this.selectedPipeline.id;
    const projectId = this.project.id;

    this.apiService.runPipeline(projectId, pipelineId).subscribe({
      next: () => {
        this.showMessage('Pipeline started in background', 'success');
      },
      error: (err) => {
        console.error('Error running pipeline:', err);
        this.isRunningPipeline = false;
        this.runningPipelineId = null;
        this.showMessage('Error running pipeline: ' + err.message, 'error');
      }
    });
  }

  /**
   * Exibe o formulário para criação de uma nova pipeline.
   */
  showCreatePipelineForm() {
    this.showPipelineForm = true;
    this.showProjectInfo = false;
    this.selectedPipeline = null;
    this.message = '';
    this.newPipeline = {
      name: '',
      description: '',
      status: 'pending',
      outputExtension: 'json'
    };
  }

  /**
   * Exibe o painel de informações do projeto.
   */
  showProjectInfoPanel() {
    this.showProjectInfo = true;
    this.showPipelineForm = false;
    this.selectedPipeline = null;
    this.message = '';
  }

  /**
   * Cria uma nova pipeline com os dados do formulário.
   */
  savePipeline() {
    if (!this.project || !this.newPipeline.name) {
      return;
    }

    this.message = '';
    this.apiService.createPipeline(this.project.id!, this.newPipeline).subscribe({
      next: (pipeline) => {
        // Exibe modal de sucesso e só então atualiza a lista
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: 'Pipeline created successfully!'
          }
        }).afterClosed().subscribe(() => {
          if (this.project) {
            this.loadPipelines(this.project.id!);
          }
          this.pipelinesExpanded = true;
          this.selectedPipeline = pipeline;
          this.showPipelineForm = false;
          this.showProjectInfo = true;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error creating pipeline:', error);
        // Exibe modal de erro
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: false,
            message: 'Falha ao criar pipeline. Tente novamente.'
          }
        });
      }
    });
  }

  /**
   * Cancela a criação/edição da pipeline e retorna ao modo de visualização.
   */
  cancelPipelineForm() {
    this.showPipelineForm = false;
    this.showProjectInfo = true;
    this.message = '';
    this.newPipeline = {
      name: '',
      description: '',
      status: 'pending',
      outputExtension: 'json',
      type: 'sequential'
    };
  }

  /**
   * Filtra as extensões de saída disponíveis com base no valor digitado.
   * @param value - Valor digitado pelo usuário
   */
  onOutputExtensionChange(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredOutputExtensions = this.outputExtensions.filter(ext =>
      ext.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredOutputExtensions.includes(value)) {
      this.filteredOutputExtensions = [value, ...this.filteredOutputExtensions];
    }
  }

  /**
   * Carrega os steps de uma pipeline específica.
   * @param pipelineId - ID da pipeline
   */
  loadPipelineSteps(pipelineId: number) {
    this.apiService.getPipelineSteps(pipelineId).subscribe({
      next: (steps) => {
        this.pipelineSteps = steps;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading pipeline steps:', error);
        this.pipelineSteps = [];
      }
    });
  }

  /**
   * Opens the edit pipeline dialog to modify pipeline name and description.
   */
  openEditPipelineDialog() {
    if (!this.selectedPipeline || !this.project?.id) {
      return;
    }

    const dialogRef = this.dialog.open(EditPipelineDialogComponent, {
      width: '500px',
      data: {
        id: this.selectedPipeline.id,
        name: this.selectedPipeline.name,
        description: this.selectedPipeline.description || '',
        outputExtension: this.selectedPipeline.outputExtension
      }
    });

    dialogRef.afterClosed().subscribe((result: { name: string; description: string; outputExtension?: string } | undefined) => {
      if (result && this.selectedPipeline && this.project?.id && this.selectedPipeline.id) {
        const pipelineId = this.selectedPipeline.id;
        const updatedPipeline: Pipeline = {
          ...this.selectedPipeline,
          name: result.name,
          description: result.description
          ,
          outputExtension: result.outputExtension
        };

        this.apiService.updatePipeline(this.project.id, pipelineId, updatedPipeline).subscribe({
          next: (pipeline) => {
            this.selectedPipeline = pipeline;
            const index = this.pipelines.findIndex(p => p.id === pipeline.id);
            if (index !== -1) {
              this.pipelines[index] = pipeline;
            }
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: true,
                message: 'Pipeline updated successfully!'
              }
            });
          },
          error: (error) => {
            console.error('Error updating pipeline:', error);
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: false,
                message: 'Failed to update pipeline'
              }
            });
          }
        });
      }
    });
  }

  /**
   * Abre o diálogo para adicionar um novo step (agente ou script) à pipeline.
   */
  openAddStepDialog() {
    const dialogRef = this.dialog.open(SelectAgentDialogComponent, {
      width: '600px',
      data: { mode: 'pipeline' }
    });

    dialogRef.afterClosed().subscribe((selected: SelectedStep) => {
      if (selected && this.selectedPipeline?.id) {
        if (selected.type === 'agent') {
          const agent = selected.item as any;
          this.apiService.addPipelineStep(this.selectedPipeline.id, agent.id).subscribe({
            next: (step) => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Agent "${agent.name}" added to pipeline successfully!`
                }
              }).afterClosed().subscribe(() => {
                if (this.selectedPipeline?.id) {
                  this.loadPipelineSteps(this.selectedPipeline.id);
                }
              });
            },
            error: (error) => {
              console.error('Error adding step to pipeline:', error);
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: 'Failed to add step to pipeline. Please try again.'
                }
              });
            }
          });
        } else if (selected.type === 'script') {
          const script = selected.item as any;
          this.apiService.addPipelineStep(this.selectedPipeline.id, undefined, script.id).subscribe({
            next: (step) => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Script "${script.name}" added to pipeline successfully!`
                }
              }).afterClosed().subscribe(() => {
                if (this.selectedPipeline?.id) {
                  this.loadPipelineSteps(this.selectedPipeline.id);
                }
              });
            },
            error: (error) => {
              console.error('Error adding step to pipeline:', error);
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: 'Failed to add step to pipeline. Please try again.'
                }
              });
            }
          });
        }
      }
    });
  }

  removeStep(step: PipelineStep) {
    if (!step.id || !this.selectedPipeline?.id) {
      return;
    }

    const agentName = step.name || step.agent?.name || step.script?.name || 'Unknown';
    const pipelineId = this.selectedPipeline.id;

    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Remove "${agentName}" from pipeline?`,
        showConfirm: true,
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.removePipelineStep(pipelineId, step.id!).subscribe({
          next: () => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: true,
                message: `Step removed from pipeline successfully!`
              }
            }).afterClosed().subscribe(() => {
              this.loadPipelineSteps(pipelineId);
            });
          },
          error: (error) => {
            console.error('Error removing step:', error);
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: false,
                message: 'Failed to remove step. Please try again.'
              }
            });
          }
        });
      }
    });
  }

  dropStep(event: CdkDragDrop<PipelineStep[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

  moveItemInArray(this.pipelineSteps, event.previousIndex, event.currentIndex);

  if (!this.selectedPipeline?.id) {
    return;
  }

    this.isReorderingSteps = true;
    const stepIdsInOrder = this.pipelineSteps.map(step => step.id!);

    this.apiService.reorderPipelineSteps(this.selectedPipeline.id, stepIdsInOrder).subscribe({
      next: (updatedSteps) => {
        this.isReorderingSteps = false;
        this.pipelineSteps = updatedSteps;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error reordering steps:', error);
        this.isReorderingSteps = false;
        this.loadPipelineSteps(this.selectedPipeline!.id!);
      }
    });
  }

  runPipeline() {
    if (!this.selectedPipeline?.id || this.pipelineSteps.length === 0 || !this.project?.id) {
      return;
    }

    this.isRunningPipeline = true;
    this.runningPipelineId = this.selectedPipeline.id;
    const pipelineId = this.selectedPipeline.id;
    const projectId = this.project.id;
    const isStepByStep = this.selectedPipeline.type === 'step_by_step';

    this.apiService.runPipeline(projectId, pipelineId).subscribe({
      next: () => {
        const url = isStepByStep
          ? '/run-step-by-step'
          : '/runpipelines';
        const urlWithParams = url + `?pipelineId=${pipelineId}&projectId=${projectId}`;
        window.open(urlWithParams, '_blank');
      },
      error: (err) => {
        console.error('Error running pipeline:', err);
        this.isRunningPipeline = false;
        this.runningPipelineId = null;
        this.showMessage('Error running pipeline: ' + err.message, 'error');
      }
    });
  }

  viewRunningPipeline() {
    if (!this.runningPipelineId || !this.project?.id) {
      return;
    }
    const isStepByStep = this.selectedPipeline?.type === 'step_by_step';
    const url = isStepByStep
      ? `/run-step-by-step?pipelineId=${this.runningPipelineId}&projectId=${this.project.id}`
      : `/runpipelines?pipelineId=${this.runningPipelineId}&projectId=${this.project.id}`;
    window.open(url, '_blank');
  }

  checkRunningPipeline() {
    if (!this.selectedPipeline?.id || !this.project?.id) {
      return;
    }
    this.apiService.getLatestPipelineRun(this.selectedPipeline.id).subscribe({
      next: (run) => {
        const isRunning = run && run.status === 'running';
        const isPipelineRunning = this.selectedPipeline && this.selectedPipeline.status === 'running';
        if (isRunning || isPipelineRunning) {
          this.isRunningPipeline = true;
          this.runningPipelineId = this.selectedPipeline!.id ?? null;
          this.pipelineStatus = 'running';
        } else {
          this.isRunningPipeline = false;
          this.runningPipelineId = null;
          this.pipelineStatus = run?.status ?? null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRunningPipeline = false;
        this.runningPipelineId = null;
      }
    });
  }

  startRunningCheckInterval() {
    if (this.runningCheckInterval) {
      clearInterval(this.runningCheckInterval);
    }
    this.runningCheckInterval = setInterval(() => {
      this.checkRunningPipeline();
    }, 3000);
  }

  openRunHistory() {
    if (!this.project?.id) {
      return;
    }

    this.router.navigate(['/pipeline-run-history'], {
      queryParams: {
        projectId: this.project.id,
        pipelineId: this.selectedPipeline?.id
      }
    });
  }

  deletePipeline(pipeline: Pipeline, event: Event) {
    event.stopPropagation();

    if (!pipeline.id || !this.project?.id) {
      return;
    }

    const pipelineName = pipeline.name;
    const projectId = this.project.id;

    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Do you really want to delete the pipeline "${pipelineName}"?`,
        showConfirm: true,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deletePipeline(projectId, pipeline.id!).subscribe({
          next: (response) => {
            console.log('Delete response:', response);
            this.pipelines = this.pipelines.filter(p => p.id !== pipeline.id);
            if (this.selectedPipeline?.id === pipeline.id) {
              this.selectedPipeline = null;
            }
            this.cdr.detectChanges();
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: true,
                message: `Pipeline "${pipelineName}" deleted successfully!`
              }
            }).afterClosed().subscribe(() => {
              if (this.project) {
                this.loadPipelines(this.project.id!);
              }
            });
          },
          error: (error) => {
            console.error('Error deleting pipeline:', error);
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: false,
                message: 'Falha ao excluir pipeline. Tente novamente.'
              }
            });
          }
        });
      }
    });
  }

  duplicatePipeline(pipeline: Pipeline, event: Event) {
    event.stopPropagation();

    if (!pipeline.id || !this.project?.id) {
      return;
    }

    const suggestedName = this.generateDuplicateName(pipeline.name);
    const projectId = this.project.id;

    this.dialog.open(DuplicatePipelineDialogComponent, {
      width: '500px',
      data: { name: suggestedName }
    }).afterClosed().subscribe((newName: string | undefined) => {
      if (newName && this.project?.id) {
        this.apiService.duplicatePipeline(this.project.id, pipeline.id!, newName).subscribe({
          next: (duplicated) => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: true,
                message: `Pipeline "${newName}" created successfully!`
              }
            }).afterClosed().subscribe(() => {
              if (this.project) {
                this.loadPipelines(this.project.id!);
              }
              this.pipelinesExpanded = true;
            });
          },
          error: (error) => {
            console.error('Error duplicating pipeline:', error);
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: false,
                message: 'Failed to duplicate pipeline. Please try again.'
              }
            });
          }
        });
      }
    });
  }

  generateDuplicateName(baseName: string): string {
    const candidate = baseName + 'copy';
    const existingNames = this.pipelines.map(p => p.name.toLowerCase());

    if (!existingNames.includes(candidate.toLowerCase())) {
      return candidate;
    }

    let counter = 1;
    while (existingNames.includes((candidate + '(' + counter + ')').toLowerCase())) {
      counter++;
    }
    return candidate + '(' + counter + ')';
  }

  openInput(step: PipelineStep): void {
    const pipelineId = this.selectedPipeline?.id;
    if (!pipelineId || !step.id) {
      return;
    }

    this.apiService.getPipelineSteps(pipelineId).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.id === step.id) || step;
        this.dialog.open(StepIODialogComponent, {
          data: {
            step: updatedStep,
            pipelineId: pipelineId,
            mode: 'input'
          },
          width: '600px',
          panelClass: 'custom-dialog'
        }).afterClosed().subscribe((savedStep) => {
          if (savedStep) {
            const index = this.pipelineSteps.findIndex(s => s.id === step.id);
            if (index >= 0) {
              this.pipelineSteps[index] = savedStep;
            }
          }
        });
      },
      error: (err) => {
        console.error('Error loading step:', err);
        this.dialog.open(StepIODialogComponent, {
          data: {
            step: step,
            pipelineId: pipelineId,
            mode: 'input'
          },
          width: '600px',
          panelClass: 'custom-dialog'
        });
      }
    });
  }

  openOutput(step: PipelineStep): void {
    const pipelineId = this.selectedPipeline?.id;
    if (!pipelineId || !step.id) {
      return;
    }

    this.apiService.getPipelineSteps(pipelineId).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.id === step.id) || step;
        this.dialog.open(StepIODialogComponent, {
          data: {
            step: updatedStep,
            pipelineId: pipelineId,
            mode: 'output'
          },
          width: '600px',
          panelClass: 'custom-dialog'
        }).afterClosed().subscribe((savedStep) => {
          if (savedStep) {
            const index = this.pipelineSteps.findIndex(s => s.id === step.id);
            if (index >= 0) {
              this.pipelineSteps[index] = savedStep;
            }
          }
        });
      },
      error: (err) => {
        console.error('Error loading step:', err);
        this.dialog.open(StepIODialogComponent, {
          data: {
            step: step,
            pipelineId: pipelineId,
            mode: 'output'
          },
          width: '600px',
          panelClass: 'custom-dialog'
        });
      }
    });
  }

  openCli(step: PipelineStep): void {
    const pipelineId = this.selectedPipeline?.id;
    if (!pipelineId || !step.id) {
      return;
    }

    this.apiService.getPipelineSteps(pipelineId).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.id === step.id) || step;
        this.dialog.open(StepCliDialogComponent, {
          data: {
            step: updatedStep,
            pipelineId: pipelineId
          },
          width: '500px',
          panelClass: 'custom-dialog'
        }).afterClosed().subscribe((savedStep) => {
          if (savedStep) {
            const index = this.pipelineSteps.findIndex(s => s.id === step.id);
            if (index >= 0) {
              this.pipelineSteps[index] = savedStep;
            }
          }
        });
      },
      error: (err) => {
        console.error('Error loading step:', err);
        this.dialog.open(StepCliDialogComponent, {
          data: {
            step: step,
            pipelineId: pipelineId
          },
          width: '500px',
          panelClass: 'custom-dialog'
        });
      }
    });
  }

  openPrompt(step: PipelineStep): void {
    const prompt = step.agent?.prompt || step.script?.content || '';
    const title = step.agent?.name || step.script?.name || 'Step Prompt';
    const type: 'agent' | 'script' = step.agent ? 'agent' : 'script';

    this.dialog.open(PromptDialogComponent, {
      data: {
        title: title,
        prompt: prompt,
        type: type
      },
      width: '600px',
      panelClass: 'custom-dialog'
    });
  }

  openSettings(step: PipelineStep): void {
    const pipelineId = this.selectedPipeline?.id;
    if (!pipelineId || !step.id) {
      return;
    }

    this.apiService.getPipelineSteps(pipelineId).subscribe({
      next: (steps) => {
        const updatedStep = steps.find(s => s.id === step.id) || step;
        this.dialog.open(StepSettingsDialogComponent, {
          data: {
            step: updatedStep,
            pipelineId: pipelineId,
            projectTarget: this.project?.target
          },
          width: '650px',
          maxHeight: '80vh',
          panelClass: 'custom-dialog'
        }).afterClosed().subscribe((savedStep) => {
          if (savedStep) {
            const index = this.pipelineSteps.findIndex(s => s.id === step.id);
            if (index >= 0) {
              this.pipelineSteps[index] = savedStep;
              this.cdr.detectChanges();
            }
          }
        });
      },
      error: (err) => {
        console.error('Error loading step:', err);
        this.dialog.open(StepSettingsDialogComponent, {
          data: {
            step: step,
            pipelineId: pipelineId,
            projectTarget: this.project?.target
          },
          width: '650px',
          maxHeight: '80vh',
          panelClass: 'custom-dialog'
        }).afterClosed().subscribe((savedStep) => {
          if (savedStep) {
            const index = this.pipelineSteps.findIndex(s => s.id === step.id);
            if (index >= 0) {
              this.pipelineSteps[index] = savedStep;
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }
}
