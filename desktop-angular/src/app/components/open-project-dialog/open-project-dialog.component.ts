import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, Project } from '../../services/api.service';
import { Router } from '@angular/router';
import { PipelineResultDialogComponent } from '../pipeline-result-dialog.component';

/**
 * Interface para dados de entrada do diálogo de abertura de projeto.
 * Pode ser utilizada para passar parâmetros iniciais como termo de busca.
 */
export interface OpenProjectDialogData {
  // Could pass something like initial search term if needed
}

/**
 * Componente de diálogo para abertura de projetos existentes.
 * Permite listar, buscar, selecionar e excluir projetos.
 * 
 * @componentName OpenProjectDialogComponent
 * @selector app-open-project-dialog
 */
@Component({
  selector: 'app-open-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    PipelineResultDialogComponent
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">folder_open</mat-icon>
      <h2 class="dialog-title">Open Project</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="search-section">
        <mat-form-field class="search-field" appearance="outline" floatLabel="always">
          <mat-label>Search projects...</mat-label>
          <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Type to search...">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>
        <button mat-stroked-button (click)="search()" class="search-btn">
          <mat-icon>search</mat-icon>
          Search
        </button>
        <button mat-icon-button (click)="clearSearch()" aria-label="Clear search" class="clear-btn" *ngIf="searchTerm">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="table-container">
        <div *ngIf="loading" class="loading-overlay">
          <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
          <span>Loading projects...</span>
        </div>
        
        <div *ngIf="!loading && projects.length === 0" class="empty-state">
          <mat-icon class="empty-icon">folder_off</mat-icon>
          <span class="empty-text">No projects found</span>
          <span class="empty-hint">Create a new project or adjust your search</span>
        </div>
        
        <table mat-table [dataSource]="projects" class="project-table" *ngIf="!loading && projects.length > 0">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">badge</mat-icon>
              Project Name
            </th>
            <td mat-cell *matCellDef="let project">
              <div class="project-name">
                <mat-icon class="project-icon">folder</mat-icon>
                {{ project.name }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">schedule</mat-icon>
              Created
            </th>
            <td mat-cell *matCellDef="let project">{{ project.createdAt | date:'medium' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let project">
              <button mat-icon-button class="delete-btn" (click)="onDeleteProject($event, project)" title="Delete project">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="project-row"
              [class.selected]="row === selectedProject"
              (click)="selectProject(row)"
              (dblclick)="onOpenProject(row)">
          </tr>
        </table>
      </div>

      <mat-paginator
        [length]="totalElements"
        [pageSize]="pageSize"
        [pageIndex]="currentPage"
        [pageSizeOptions]="[5, 10, 25]"
        (page)="onPageChange($event)"
        showFirstLastButtons
        class="custom-paginator">
      </mat-paginator>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onOpen()" [disabled]="!selectedProject" class="open-btn">
        <mat-icon>launch</mat-icon>
        Open Project
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
      border-radius: 12px 12px 0 0;
    }
    
    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #4fc3f7;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.3px;
    }
    
    .dialog-content {
      padding: 0 !important;
      min-width: 520px;
      max-width: 600px;
      background: #1e1e1e !important;
    }
    
    .search-section {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      align-items: center;
      border-bottom: 1px solid #3a3a3a;
      background: #1a1a1a;
    }
    
    .search-field {
      flex: 1;
    }
    
    ::ng-deep .search-field .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }
    
    ::ng-deep .search-field .mdc-notched-outline__leading,
    ::ng-deep .search-field .mdc-notched-outline__notch,
    ::ng-deep .search-field .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }
    
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
    }
    
    .search-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #b0b0b0;
      border-color: #555;
    }
    
    .search-btn:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    .search-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .clear-btn {
      color: #888;
    }
    
    .clear-btn:hover {
      background-color: #3a3a3a;
      color: #ff8a80;
    }
    
    .table-container {
      position: relative;
      min-height: 200px;
      margin: 0 24px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #3a3a3a;
      background: #2a2a2a;
    }
    
    .loading-overlay,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #888;
      gap: 12px;
    }
    
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #555;
    }
    
    .empty-text {
      font-size: 1.1rem;
      font-weight: 500;
      color: #b0b0b0;
    }
    
    .empty-hint {
      font-size: 0.875rem;
      color: #666;
    }
    
    .project-table {
      width: 100%;
      background: transparent;
    }
    
    ::ng-deep .mat-mdc-header-cell {
      background-color: #252525 !important;
      color: #888 !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      border-bottom: 1px solid #3a3a3a !important;
      padding: 16px !important;
    }
    
    .column-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 8px;
      vertical-align: middle;
    }
    
    ::ng-deep .mat-mdc-cell {
      color: #e0e0e0 !important;
      font-size: 0.9rem !important;
      padding: 16px !important;
      border-bottom: 1px solid #333 !important;
    }
    
    .project-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .project-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #4fc3f7;
    }
    
    .project-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .project-row:hover {
      background-color: #333 !important;
    }
    
    .project-row.selected {
      background-color: #1565c0 !important;
    }
    
    .project-row.selected .project-icon {
      color: #ffffff;
    }
    
    ::ng-deep .custom-paginator {
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
      border-top: 1px solid #3a3a3a !important;
      padding: 0 24px !important;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-icon-button {
      color: #b0b0b0 !important;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-icon-button:hover {
      background-color: #3a3a3a !important;
      color: #ffffff !important;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-paginator-range-label,
    ::ng-deep .custom-paginator .mat-mdc-select-value-text {
      color: #b0b0b0 !important;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px !important;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
      border-radius: 0 0 12px 12px;
      margin: 0 !important;
    }
    
    .cancel-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #b0b0b0;
      border-color: #555;
    }
    
    .cancel-btn:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .open-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }
    
    .open-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }
    
    .open-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }
    
    .open-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #4fc3f7 !important;
    }
    
    .delete-btn {
      color: #888;
    }
    
    .delete-btn:hover {
      color: #f44336;
      background-color: rgba(244, 67, 54, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenProjectDialogComponent {
  searchTerm = '';
  projects: Project[] = [];
  selectedProject: Project | null = null;
  loading = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  displayedColumns = ['name', 'createdAt', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<OpenProjectDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: OpenProjectDialogData
  ) {
    this.loadProjects();
  }

  /**
   * Carrega a lista de projetos do servidor.
   * Utiliza busca por termo se searchTerm estiver definido, caso contrário carrega todos.
   */
  loadProjects(): void {
    console.log('Loading projects...');
    this.loading = true;
    if (this.searchTerm.trim()) {
      console.log('Searching projects with term:', this.searchTerm);
      this.apiService.searchProjects(this.searchTerm, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          console.log('Search response:', response);
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error searching projects:', err);
          this.loading = false;
        }
      });
    } else {
      console.log('Getting projects page:', this.currentPage, 'size:', this.pageSize);
      this.apiService.getProjects(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          console.log('Get projects response:', response);
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.loading = false;
        }
      });
    }
  }

  /**
   * Processa a resposta da API de projetos e atualiza o estado do componente.
   * Extrai a lista de projetos e informações de paginação.
   * 
   * @param response - Resposta da API contendo projetos e metadados de paginação
   */
  handleResponse(response: any): void {
    if (response && Array.isArray(response.projects)) {
      this.projects = response.projects;
    } else if (Array.isArray(response)) {
      this.projects = response;
    } else {
      this.projects = [];
    }
    this.totalElements = response?.totalElements ?? this.projects.length;
    this.totalPages = response?.totalPages ?? 1;
    this.loading = false;
    this.selectedProject = null;
    this.cdr.detectChanges();
  }

  /**
   * Executa a busca de projetos com o termo atual.
   * Reinicia a paginação para a primeira página antes de buscar.
   */
  search(): void {
    this.currentPage = 0;
    this.loadProjects();
  }

  /**
   * Limpa o termo de busca e recarrega todos os projetos.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadProjects();
  }

  /**
   * Manipula o evento de mudança de página do paginador.
   * Atualiza a página atual e o tamanho da página, então recarrega os projetos.
   * 
   * @param event - Evento de mudança de página do Angular Material
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  /**
   * Seleciona um projeto da lista.
   * 
   * @param project - Projeto a ser selecionado
   */
  selectProject(project: Project): void {
    this.selectedProject = project;
  }

  /**
   * Abre um projeto ao dar duplo clique na linha.
   *Fecha o diálogo e navega para a página do projeto.
   * 
   * @param project - Projeto a ser aberto
   */
  onOpenProject(project: Project): void {
    this.selectedProject = project;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.dialogRef.close(project);
      Promise.resolve().then(() => {
        this.router.navigate(['/project', project.id], {
          state: { project: project }
        })
      });
    });
  }

  /**
   * Abre o projeto selecionado no momento.
   * Requer que um projeto esteja selecionado.
   */
  onOpen(): void {
    if (this.selectedProject) {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.dialogRef.close(this.selectedProject)
        Promise.resolve().then(() => {
          this.router.navigate(['/project', this.selectedProject?.id], {
            state: { project: this.selectedProject }
          })
        })
      });
    }
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onOpen();
  }

  /**
   * Cancela a operação e fecha o diálogo.
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Exclui um projeto após confirmação do usuário.
   * Abre um diálogo de confirmação antes de chamar a API de exclusão.
   * 
   * @param event - Evento do clique para impedir propagação
   * @param project - Projeto a ser excluído
   */
  onDeleteProject(event: Event, project: Project): void {
    event.stopPropagation();
    if (!project.id) {
      return;
    }
    const dialogRef = this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Are you sure you want to delete "${project.name}"?`,
        showConfirm: true,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && project.id) {
        this.apiService.deleteProject(project.id).subscribe({
          next: () => {
            this.loadProjects();
          },
          error: (err) => {
            console.error('Error deleting project:', err);
          }
        });
      }
    });
  }
}
