import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { ApiService, Project, Pipeline, PipelineStep, Agent, Target } from '../../services/api.service';
import { SelectAgentDialogComponent, SelectedStep } from '../../components/select-agent-dialog/select-agent-dialog.component';
import { SelectSkillDialogComponent } from '../../components/select-skill-dialog/select-skill-dialog.component';
import { SelectCommandDialogComponent } from '../../components/select-command-dialog/select-command-dialog.component';
import { SelectScriptDialogComponent } from '../../components/select-script-dialog/select-script-dialog.component';
import { SelectInstructionDialogComponent } from '../../components/select-instruction-dialog/select-instruction-dialog.component';
import { SelectPluginDialogComponent } from '../../components/select-plugin-dialog/select-plugin-dialog.component';
import { SelectToolDialogComponent } from '../../components/select-tool-dialog/select-tool-dialog.component';
import { ProjectAgentsDialogComponent } from '../../components/project-agents-dialog/project-agents-dialog.component';
import { ProjectSkillsDialogComponent } from '../../components/project-skills-dialog/project-skills-dialog.component';
import { ProjectCommandsDialogComponent } from '../../components/project-commands-dialog/project-commands-dialog.component';
import { ProjectScriptsDialogComponent } from '../../components/project-scripts-dialog/project-scripts-dialog.component';
import { ProjectInstructionsDialogComponent } from '../../components/project-instructions-dialog/project-instructions-dialog.component';
import { ProjectPluginsDialogComponent } from '../../components/project-plugins-dialog/project-plugins-dialog.component';
import { ProjectToolsDialogComponent } from '../../components/project-tools-dialog/project-tools-dialog.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';
import { StepIODialogComponent } from '../../components/step-io-dialog/step-io-dialog.component';
import { StepCliDialogComponent } from '../../components/step-cli-dialog/step-cli-dialog.component';
import { StepSettingsDialogComponent } from '../../components/step-settings-dialog/step-settings-dialog.component';
import { CreateFileDialogComponent } from '../../components/create-file-dialog/create-file-dialog.component';

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
  imports: [CommonModule, NgClass, MenuBarComponent, MatButtonModule, MatMenuModule, MatIconModule, MatTooltipModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatSelectModule, FormsModule, MatDialogModule, DragDropModule, PipelineResultDialogComponent, SelectAgentDialogComponent, SelectSkillDialogComponent, SelectCommandDialogComponent, SelectScriptDialogComponent, SelectInstructionDialogComponent, SelectPluginDialogComponent, SelectToolDialogComponent, ProjectSkillsDialogComponent, ProjectCommandsDialogComponent, ProjectScriptsDialogComponent, ProjectAgentsDialogComponent, ProjectInstructionsDialogComponent, ProjectPluginsDialogComponent, ProjectToolsDialogComponent, PanelToggleComponent, StepIODialogComponent, StepCliDialogComponent, StepSettingsDialogComponent, PromptDialogComponent, CreateFileDialogComponent],
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
  baseUrl = 'http://localhost:8080/';
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
  
  private runningCheckInterval: any;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private projectContext: ProjectContextService
  ) {}

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
  }

  /**
   * Limpa o intervalo de verificação quando o componente é destruído.
   */
  ngOnDestroy() {
    if (this.runningCheckInterval) {
      clearInterval(this.runningCheckInterval);
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
            message: 'Pipeline criada com sucesso!'
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

  /**
   * Abre o diálogo para visualizar as skills do projeto.
   */
  openViewSkillsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectSkillsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  /**
   * Abre o diálogo para adicionar uma skill ao projeto.
   */
  openAddSkillDialog() {
    if (!this.project?.id) {
      return;
    }
    const dialogRef = this.dialog.open(SelectSkillDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });

    dialogRef.afterClosed().subscribe((selectedSkills) => {
      if (selectedSkills && selectedSkills.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedSkills.length} skill(s) added to project!`
          }
        });
      }
    });
  }

  /**
   * Abre o diálogo para visualizar os comandos do projeto.
   */
  openViewCommandsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectCommandsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  /**
   * Abre o diálogo para adicionar um comando ao projeto.
   */
  openAddCommandDialog() {
    if (!this.project?.id) {
      return;
    }
    const dialogRef = this.dialog.open(SelectCommandDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });

    dialogRef.afterClosed().subscribe((selectedCommands) => {
      if (selectedCommands && selectedCommands.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedCommands.length} command(s) added to project!`
          }
        });
      }
    });
  }

  /**
   * Abre o diálogo para visualizar os scripts do projeto.
   */
  openViewScriptsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectScriptsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  /**
   * Abre o diálogo para adicionar um script ao projeto.
   */
  openAddScriptDialog() {
    if (!this.project?.id) {
      return;
    }
    const dialogRef = this.dialog.open(SelectScriptDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });

    dialogRef.afterClosed().subscribe((selectedScripts) => {
      if (selectedScripts && selectedScripts.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedScripts.length} script(s) added to project!`
          }
        });
      }
    });
  }

  /**
   * Abre o diálogo para visualizar os agentes do projeto.
   */
  openViewAgentsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectAgentsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  /**
   * Abre o diálogo para adicionar um agente ao projeto.
   */
  openAddAgentDialog() {
    const projectId = this.project?.id;
    if (!projectId) {
      return;
    }
    const dialogRef = this.dialog.open(SelectAgentDialogComponent, {
      width: '600px',
      data: { projectId, mode: 'project' }
    });

    dialogRef.afterClosed().subscribe((selectedAgents: Agent[]) => {
      if (selectedAgents && selectedAgents.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedAgents.length} agent(s) added to project!`
          }
        });
      }
    });
  }

  /**
   * Abre o diálogo para visualizar as instruções do projeto.
   */
  openViewInstructionsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectInstructionsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  /**
   * Abre o diálogo para adicionar uma instrução ao projeto.
   */
  openAddInstructionDialog() {
    const projectId = this.project?.id;
    if (!projectId) {
      return;
    }
    const dialogRef = this.dialog.open(SelectInstructionDialogComponent, {
      width: '600px',
      data: { projectId }
    });

    dialogRef.afterClosed().subscribe((selectedInstructions) => {
      if (selectedInstructions && selectedInstructions.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedInstructions.length} instruction(s) added to project!`
          }
        });
      }
    });
  }

  /**
   * Abre o diálogo para visualizar os plugins do projeto.
   */
  openViewPluginsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectPluginsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  openAddPluginDialog() {
    const projectId = this.project?.id;
    if (!projectId) {
      return;
    }
    const dialogRef = this.dialog.open(SelectPluginDialogComponent, {
      width: '600px',
      data: { projectId }
    });

    dialogRef.afterClosed().subscribe((selectedPlugins) => {
      if (selectedPlugins && selectedPlugins.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedPlugins.length} plugin(s) added to project!`
          }
        });
      }
    });
  }

  openViewToolsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ProjectToolsDialogComponent, {
      width: '900px',
      data: { projectId: this.project.id }
    });
  }

  openAddToolDialog() {
    const projectId = this.project?.id;
    if (!projectId) {
      return;
    }
    const dialogRef = this.dialog.open(SelectToolDialogComponent, {
      width: '600px',
      data: { projectId }
    });

    dialogRef.afterClosed().subscribe((selectedTools) => {
      if (selectedTools && selectedTools.length > 0) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: {
            success: true,
            message: `${selectedTools.length} tool(s) added to project!`
          }
        });
      }
    });
  }

  openCreateFileDialog() {
    const projectId = this.project?.id;
    if (!projectId) {
      return;
    }
    this.dialog.open(CreateFileDialogComponent, {
      width: '600px',
      data: { projectId }
    });
  }

  removeStep(step: PipelineStep) {
    if (!step.id || !this.selectedPipeline?.id) {
      return;
    }

    const agentName = step.agent?.name || step.script?.name || 'Unknown';
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

    console.log('DEBUG dropStep: prevIndex=', event.previousIndex, 'currIndex=', event.currentIndex);
    console.log('DEBUG dropStep: before swap =', this.pipelineSteps.map(s => s.id));
    
    const temp = this.pipelineSteps[event.previousIndex];
    this.pipelineSteps[event.previousIndex] = this.pipelineSteps[event.currentIndex];
    this.pipelineSteps[event.currentIndex] = temp;
    
    console.log('DEBUG dropStep: after swap =', this.pipelineSteps.map(s => s.id));
    console.log('DEBUG dropStep: selectedPipeline =', this.selectedPipeline?.id);
    
    if (!this.selectedPipeline?.id) {
      console.log('DEBUG dropStep: early return - no pipeline selected');
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
        message: `Deseja realmente excluir a pipeline "${pipelineName}"?`,
        showConfirm: true,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deletePipeline(projectId, pipeline.id!).subscribe({
          next: () => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: true,
                message: `Pipeline "${pipelineName}" excluída com sucesso!`
              }
            }).afterClosed().subscribe(() => {
              if (this.selectedPipeline?.id === pipeline.id) {
                this.selectedPipeline = null;
              }
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
