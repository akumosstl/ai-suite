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
import { ViewProjectSkillsDialogComponent } from '../../components/view-project-skills-dialog/view-project-skills-dialog.component';
import { ViewProjectCommandsDialogComponent } from '../../components/view-project-commands-dialog/view-project-commands-dialog.component';
import { ViewProjectScriptsDialogComponent } from '../../components/view-project-scripts-dialog/view-project-scripts-dialog.component';
import { ViewProjectAgentsDialogComponent } from '../../components/view-project-agents-dialog/view-project-agents-dialog.component';
import { ViewProjectInstructionsDialogComponent } from '../../components/view-project-instructions-dialog/view-project-instructions-dialog.component';
import { ViewProjectPluginsDialogComponent } from '../../components/view-project-plugins-dialog/view-project-plugins-dialog.component';
import { ViewProjectToolsDialogComponent } from '../../components/view-project-tools-dialog/view-project-tools-dialog.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';
import { StepIODialogComponent } from '../../components/step-io-dialog/step-io-dialog.component';
import { StepCliDialogComponent } from '../../components/step-cli-dialog/step-cli-dialog.component';
import { StepSettingsDialogComponent } from '../../components/step-settings-dialog/step-settings-dialog.component';
import { CreateFileDialogComponent } from '../../components/create-file-dialog/create-file-dialog.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, NgClass, MenuBarComponent, MatButtonModule, MatMenuModule, MatIconModule, MatTooltipModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatSelectModule, FormsModule, MatDialogModule, DragDropModule, PipelineResultDialogComponent, SelectAgentDialogComponent, SelectSkillDialogComponent, SelectCommandDialogComponent, SelectScriptDialogComponent, SelectInstructionDialogComponent, SelectPluginDialogComponent, SelectToolDialogComponent, ViewProjectSkillsDialogComponent, ViewProjectCommandsDialogComponent, ViewProjectScriptsDialogComponent, ViewProjectAgentsDialogComponent, ViewProjectInstructionsDialogComponent, ViewProjectPluginsDialogComponent, ViewProjectToolsDialogComponent, PanelToggleComponent, StepIODialogComponent, StepCliDialogComponent, StepSettingsDialogComponent, PromptDialogComponent, CreateFileDialogComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
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

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showMessage('Endpoint copied to clipboard', 'success');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.showMessage('Failed to copy endpoint', 'error');
    });
  }

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

  pausePipeline() {
    if (!this.selectedPipeline?.id || !this.project?.id) {
      return;
    }

    this.apiService.pausePipeline(this.project.id, this.selectedPipeline.id).subscribe({
      next: () => {
        this.showMessage('Pipeline paused successfully', 'success');
        this.isRunningPipeline = false;
        this.runningPipelineId = null;
        this.pipelineStatus = 'paused';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error pausing pipeline:', err);
        this.showMessage('Error pausing pipeline', 'error');
      }
    });
  }

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

  ngOnDestroy() {
    if (this.runningCheckInterval) {
      clearInterval(this.runningCheckInterval);
    }
  }

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
  
  cancelEditProject() {
    this.isEditingProject = false;
    this.editProject = { name: '', description: '', path: '', target: '' };
  }
  
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
  
  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

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

  private restoreSelectedPipeline(): void {
    const storedPipelineId = this.projectContext.getSelectedPipelineId();
    if (storedPipelineId && this.pipelines.length > 0) {
      const pipeline = this.pipelines.find(p => p.id === storedPipelineId);
      if (pipeline) {
        this.selectPipeline(pipeline);
      }
    }
  }

  togglePipelines() {
    this.pipelinesExpanded = !this.pipelinesExpanded;
  }

  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

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

  showProjectInfoPanel() {
    this.showProjectInfo = true;
    this.showPipelineForm = false;
    this.selectedPipeline = null;
    this.message = '';
  }

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
  
  onOutputExtensionChange(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredOutputExtensions = this.outputExtensions.filter(ext => 
      ext.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredOutputExtensions.includes(value)) {
      this.filteredOutputExtensions = [value, ...this.filteredOutputExtensions];
    }
  }
  
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

  openViewSkillsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ViewProjectSkillsDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });
  }

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

  openViewCommandsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ViewProjectCommandsDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });
  }

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

  openViewScriptsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ViewProjectScriptsDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });
  }

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

  openViewAgentsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ViewProjectAgentsDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });
  }

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

  openViewInstructionsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ViewProjectInstructionsDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id }
    });
  }

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

  openViewPluginsDialog() {
    if (!this.project?.id) {
      return;
    }
    this.dialog.open(ViewProjectPluginsDialogComponent, {
      width: '600px',
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
    this.dialog.open(ViewProjectToolsDialogComponent, {
      width: '600px',
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
        const isPaused = run && run.status === 'paused';
        const isPipelineRunning = this.selectedPipeline && this.selectedPipeline.status === 'running';
        const isPipelinePaused = this.selectedPipeline && this.selectedPipeline.status === 'paused';
        if (isRunning || isPipelineRunning) {
          this.isRunningPipeline = true;
          this.runningPipelineId = this.selectedPipeline!.id ?? null;
          this.pipelineStatus = 'running';
        } else if (isPaused || isPipelinePaused) {
          this.isRunningPipeline = false;
          this.runningPipelineId = this.selectedPipeline!.id ?? null;
          this.pipelineStatus = 'paused';
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
