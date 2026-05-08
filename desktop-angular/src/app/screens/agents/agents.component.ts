import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService, Agent, Project, Template } from '../../services/api.service';
import { NewProjectDialogComponent } from '../../components/new-project-dialog/new-project-dialog.component';
import { OpenProjectDialogComponent } from '../../components/open-project-dialog/open-project-dialog.component';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { PromptEditorModalComponent } from '../../components/prompt-editor-modal/prompt-editor-modal.component';
import { EditFileDialogComponent } from '../../components/edit-file-dialog/edit-file-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule,
    MatIconModule,
    MenuBarComponent,
    PipelineResultDialogComponent,
    PromptEditorModalComponent,
    PanelToggleComponent
  ],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css']
})
export class AgentsComponent implements OnInit, OnDestroy {
  fromHome = false;
  agents: Agent[] = [];
  selectedAgent: Agent | null = null;
  namespaces: string[] = [];
  filteredNamespaces: string[] = [];
  filteredSearchNamespaces: string[] = [];
  formAgent: Agent = this.getEmptyAgent();
  searchTerm = '';
  searchNamespace = '';
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  statusMessage = '';
  leftPanelCollapsed = false;
  templates: Template[] = [];
  loadingTemplates = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private projectContext: ProjectContextService
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state && nav.extras.state['fromHome']) {
      this.fromHome = true;
    } else if (window.history.state && window.history.state.fromHome) {
      this.fromHome = true;
    }
  }

  goHome() {
    this.router.navigate(['/menu'])
  }

toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  @HostListener('document:keydown.control.b')
  onToggleLeftPanel(): void {
    this.toggleLeftPanel();
  }

  @HostListener('document:keydown.control.shift.e')
  onOpenInEditor(): void {
    if (this.selectedAgent) {
      this.openPromptEditor();
    }
  }

  @HostListener('document:keydown.control.shift.k')
  onCopyToClipboard(): void {
    if (this.selectedAgent?.prompt) {
      this.copyToClipboard(this.selectedAgent.prompt);
    }
  }

  private getEmptyAgent(): Agent {
    return {
      name: '',
      namespace: this.namespaces.length > 0 ? this.namespaces[0] : '',
      description: '',
      prompt: '',
      scope: 'global',
      path: ''
    };
  }

  loadNamespaces(): void {
    this.apiService.getAgentNamespaces().subscribe({
      next: (namespaces) => {
        this.namespaces = namespaces;
        this.filteredNamespaces = [...this.namespaces];
        this.filteredSearchNamespaces = [...this.namespaces];
        if (this.namespaces.length > 0 && !this.formAgent.namespace) {
          this.formAgent.namespace = this.namespaces[0];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading namespaces:', err);
      }
    });
  }

  onNamespaceChange(value: string): void {
    this.formAgent.namespace = value;
    const filterValue = value.toLowerCase();
    this.filteredNamespaces = this.namespaces.filter(ns =>
      ns.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredNamespaces.includes(value)) {
      this.filteredNamespaces = [value, ...this.filteredNamespaces];
    }
  }

  displayNamespace(value: string): string {
    return value || '';
  }

  onSearchNamespaceChange(value: string): void {
    this.searchNamespace = value;
    const filterValue = value.toLowerCase();
    this.filteredSearchNamespaces = this.namespaces.filter(ns =>
      ns.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredSearchNamespaces.includes(value)) {
      this.filteredSearchNamespaces = [value, ...this.filteredSearchNamespaces];
    }
  }

  displaySearchNamespace(value: string): string {
    return value || '';
  }

  ngOnInit(): void {
    console.log('AgentsComponent ngOnInit');
    this.loadNamespaces();
    this.loadAgents();
    this.loadTemplates();
  }

  ngOnDestroy(): void {
  }

  loadAgents(): void {
    console.log('Loading agents...');
    this.loading = true;
    console.log('Calling API...');
    this.apiService.getAgents(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('API response:', response);
          if (response && Array.isArray(response.agents)) {
            this.agents = response.agents;
          } else if (Array.isArray(response)) {
            this.agents = response;
          } else {
            this.agents = [];
          }
          console.log('Agents set:', this.agents);
          this.totalElements = response?.totalElements ?? this.agents.length;
          this.totalPages = response?.totalPages ?? 1;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loading set to false');
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API error:', err);
          this.statusMessage = 'Error loading agents: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  search(): void {
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.currentPage = 0;
      this.loading = true;
      this.apiService.searchAgents(this.searchTerm, this.searchNamespace, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (response && Array.isArray(response.agents)) {
              this.agents = response.agents;
            } else if (Array.isArray(response)) {
              this.agents = response;
            } else {
              this.agents = [];
            }
            this.totalElements = response?.totalElements ?? this.agents.length;
            this.totalPages = response?.totalPages ?? 1;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching agents: ' + err.message;
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.clearSearch();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchNamespace = '';
    this.currentPage = 0;
    this.loadAgents();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.search();
    } else {
      this.loadAgents();
    }
  }

  selectAgent(agent: Agent): void {
    this.cdr.markForCheck();
    this.selectedAgent = { ...agent };
    this.formAgent = { ...agent };
    this.statusMessage = `Agent selected: ${agent.name}`;
  }

  saveAgent(): void {
    if (!this.formAgent.name) {
      this.statusMessage = 'Error: Name is required';
      return;
    }

    const agentData = {
      name: this.formAgent.name,
      namespace: this.formAgent.namespace || '',
      description: this.formAgent.description || '',
      prompt: this.formAgent.prompt || '',
      scope: this.formAgent.scope || 'global',
      path: this.formAgent.path || ''
    };

    if (this.formAgent.id) {
      this.apiService.updateAgent(this.formAgent.id, agentData).subscribe({
        next: (updated) => {
          this.ngZone.run(() => {
            this.statusMessage = `Agent '${updated.name}' updated successfully`;
            this.selectedAgent = { ...updated };
            this.formAgent = { ...updated };
            this.cdr.detectChanges();
            this.loadAgents();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            if (err.status === 409 && err.error?.error) {
              this.statusMessage = 'Error: ' + err.error.error;
            } else {
              this.statusMessage = 'Error: ' + err.message;
            }
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      const projectId = this.projectContext.getProjectId();
      this.apiService.createAgent(agentData, projectId || undefined).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.statusMessage = `Agent '${created.name}' created successfully`;
            this.selectedAgent = { ...created };
            this.formAgent = { ...created };
            this.cdr.detectChanges();
            this.loadAgents();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            if (err.status === 409 && err.error?.error) {
              this.statusMessage = 'Error: ' + err.error.error;
            } else {
              this.statusMessage = 'Error: ' + err.message;
            }
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  deleteAgent(): void {
    if (!this.selectedAgent?.id) {
      this.statusMessage = 'No agent selected to delete';
      return;
    }
    const id = this.selectedAgent.id;
    const name = this.selectedAgent.name;
    this.apiService.deleteAgent(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = `Agent '${name}' deleted successfully`;
          this.selectedAgent = null;
          this.cdr.detectChanges();
          setTimeout(() => this.loadAgents(), 0);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.statusMessage = 'Error: ' + err.message;
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteAgentInline(agent: Agent, event: Event): void {
    event.stopPropagation();

    if (!agent.id) {
      return;
    }

    const agentName = agent.name;
    const agentId = agent.id;

    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Do you really want to delete the agent "${agentName}"?`,
        showConfirm: true,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deleteAgent(agentId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Agent "${agentName}" deleted successfully!`
                }
              }).afterClosed().subscribe(() => {
                setTimeout(() => {
                  if (this.selectedAgent?.id === agentId) {
                    this.clearForm();
                  }
                  this.loadAgents();
                }, 0);
              });
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: err.error?.message || err.message || 'Falha ao excluir agente. Tente novamente.'
                }
              });
            });
          }
        });
      }
    });
  }

  clearForm(): void {
    this.selectedAgent = null;
    this.formAgent = this.getEmptyAgent();
    this.statusMessage = 'Form cleared - ready for new agent';
  }

  getStatusClass(): string {
    if (!this.statusMessage) return '';
    if (this.statusMessage.includes('Error')) return 'error';
    if (this.statusMessage.includes('success') || this.statusMessage.includes('updated') || this.statusMessage.includes('created') || this.statusMessage.includes('deleted')) return 'success';
    return 'info';
  }

  getPromptPreview(prompt: string | undefined): string {
    if (!prompt) return '';
    const words = prompt.trim().split(/\s+/);
    const preview = words.slice(0, 15).join(' ');
    return words.length > 15 ? preview + '...' : preview;
  }

  openPromptEditor(): void {
    const dialogRef = this.dialog.open(PromptEditorModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        prompt: this.formAgent.prompt,
        type: 'agents',
        title: 'Edit Agent Prompt'
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.ngZone.run(() => {
        if (result && result.prompt !== undefined) {
          this.formAgent.prompt = result.prompt;
          this.cdr.detectChanges();
        }
      });
    });
  }

  async copyToClipboard(text: string | undefined): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.statusMessage = 'Prompt copied to clipboard';
      setTimeout(() => this.statusMessage = '', 3000);
    } catch (err) {
      this.statusMessage = 'Failed to copy to clipboard';
    }
  }

  newProject(): void {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: Partial<Project> | undefined) => {
      if (result && result.name) {
        this.ngZone.run(() => {
          this.statusMessage = 'Creating project...';
          this.cdr.detectChanges();
        });
        this.apiService.createProject(result as Project).subscribe({
          next: (created) => {
            this.ngZone.run(() => {
              this.statusMessage = `Project '${created.name}' created successfully`;
              this.cdr.detectChanges();
              this.router.navigate(['/project']);
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.statusMessage = 'Error creating project: ' + err.message;
              this.cdr.detectChanges();
            });
          }
        });
      }
    });
  }

  openProject(): void {
    const dialogRef = this.dialog.open(OpenProjectDialogComponent, {
      width: '900px',
      height: '700px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((selectedProject: Project | undefined) => {
      if (selectedProject) {
        this.ngZone.run(() => {
          this.statusMessage = `Project '${selectedProject.name}' opened successfully`;
          this.cdr.detectChanges();
        });
      }
    });
  }

  exit(): void {
    window.close();
  }

  voltarProjeto(): void {
    const lastProjectId = localStorage.getItem('lastProjectId')
    if (lastProjectId) {
      this.router.navigate(['/project', lastProjectId])
    } else {
      this.router.navigate(['/project'])
    }
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.apiService.getTemplatesByType('agents').subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loadingTemplates = false;
      },
      error: () => {
        this.templates = [];
        this.loadingTemplates = false;
      }
    });
  }

  onTemplateSelect(event: any): void {
    const templateId = event.value;
    if (templateId) {
      const template = this.templates.find(t => t.id === templateId);
      if (template && template.template) {
        if (this.formAgent.prompt) {
          this.formAgent.prompt = this.formAgent.prompt + '\n\n' + template.template;
        } else {
          this.formAgent.prompt = template.template;
        }
      }
    }
  }
}