import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { ApiService, Agent, Skill, Command, Script, Pipeline, Project } from '../../services/api.service';

/**
 * Interface que representa os itens de um namespace.
 * Contém o tipo, namespace, lista de itens e contagem total.
 */
interface NamespaceItems {
  /** Tipo de item (agent, skill, command, script) */
  type: string;
  /** Nome do namespace */
  namespace: string;
  /** Array de itens do namespace */
  items: any[];
  /** Total de itens no namespace */
  totalCount: number;
}

/**
 * Interface que representa o resultado de uma operação de limpeza de namespace.
 */
interface ClearResult {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  /** Número de itens deletados */
  deletedCount: number;
  /** Mensagem de resultado */
  message: string;
}

/**
 * Componente de gerenciamento de namespaces.
 * Exibe uma visão geral dos namespaces organizados por tipo (agents, scripts)
 * e permite visualizar detalhes, limpar itens e buscar por namespace.
 * 
 * @componentName NamespacesComponent
 * @selector app-namespaces
 */
@Component({
  selector: 'app-namespaces',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MenuBarComponent,
    PanelToggleComponent
  ],
  template: `
    <div class="namespaces-container">
      <app-menu-bar></app-menu-bar>
      
      <div class="content" [class.left-collapsed]="leftPanelCollapsed">
        <div class="left-panel" [class.collapsed]="leftPanelCollapsed">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>dns</mat-icon>
              <span>Namespace - {{ getTypeLabel() }}</span>
            </div>
          </div>
          
          <div class="type-selector">
            <button class="type-btn" [class.active]="selectedType === 'agents'" (click)="selectType('agents')">
              <mat-icon>smart_toy</mat-icon>
              <span>Agents</span>
            </button>
            <button class="type-btn" [class.active]="selectedType === 'scripts'" (click)="selectType('scripts')">
              <mat-icon>code</mat-icon>
              <span>Scripts</span>
            </button>
            <button class="type-btn" [class.active]="selectedType === 'instructions'" (click)="selectType('instructions')">
              <mat-icon>description</mat-icon>
              <span>Instructions</span>
            </button>
          </div>
          
          <div class="search-section">
            <mat-form-field class="search-field" appearance="outline">
              <mat-label>Search by namespace...</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            <div class="search-buttons">
              <button class="icon-btn search-btn" (click)="search()" title="Search">
                <mat-icon>search</mat-icon>
              </button>
              <button class="icon-btn clear-btn" (click)="clearSearch()" title="Clear" *ngIf="searchTerm">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
          
          <div *ngIf="loading === true" class="loading-state">
            <mat-spinner diameter="32" color="primary"></mat-spinner>
            <span>Loading namespaces...</span>
          </div>
          
          <div class="namespace-list">
            <div class="list-item" *ngFor="let ns of namespaces" 
                 [class.selected]="ns === selectedNamespace"
                 (click)="selectNamespace(ns)">
              <div class="namespace-avatar">
                <mat-icon>dns</mat-icon>
              </div>
              <div class="namespace-info">
                <span class="namespace-name">{{ ns }}</span>
              </div>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
            <div *ngIf="namespaces.length === 0 && !loading" class="empty-state">
              <mat-icon>dns</mat-icon>
              <span>No namespaces found</span>
              <small>Namespaces will appear here</small>
            </div>
          </div>
        </div>
        
        <app-panel-toggle 
          [isCollapsed]="leftPanelCollapsed"
          (toggle)="toggleLeftPanel()"
          [class.collapsed]="leftPanelCollapsed">
        </app-panel-toggle>
        
        <div class="right-panel">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>dashboard</mat-icon>
              <span>Namespace Dashboard</span>
            </div>
            <div class="header-actions" *ngIf="selectedNamespace">
              <button class="icon-btn clear-btn" (click)="clearNamespace()" title="Clear namespace items">
                <mat-icon>delete_sweep</mat-icon>
                <span>Clear</span>
              </button>
            </div>
          </div>
          
          <div class="dashboard-content" *ngIf="selectedNamespace">
            <div class="namespace-header">
              <span class="namespace-label">Namespace:</span>
              <span class="namespace-value">{{ selectedNamespace }}</span>
              <span class="item-count">({{ namespaceItems?.totalCount || 0 }} items)</span>
            </div>
            
            <div class="dashboard-section">
              <div class="section-header">
                <mat-icon>list</mat-icon>
                <span>{{ getTypeLabel() }} in this namespace</span>
              </div>
              
              <div *ngIf="loadingItems" class="loading-state small">
                <mat-spinner diameter="24"></mat-spinner>
              </div>
              
              <table mat-table [dataSource]="namespaceItems?.items || []" class="items-table" *ngIf="!loadingItems && namespaceItems?.items?.length">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.name }}</td>
                </ng-container>
                
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let item">{{ item.description || '-' }}</td>
                </ng-container>
                
                <ng-container matColumnDef="scope">
                  <th mat-header-cell *matHeaderCellDef>Scope</th>
                  <td mat-cell *matCellDef="let item">{{ item.scope }}</td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
              
              <div *ngIf="!loadingItems && (!namespaceItems?.items || namespaceItems?.items?.length === 0)" class="empty-section">
                <span>No items in this namespace</span>
              </div>
            </div>
            
            <div class="dashboard-section">
              <div class="section-header">
                <mat-icon>account_tree</mat-icon>
                <span>Pipelines using this namespace</span>
                <span class="badge">{{ pipelines.length }}</span>
              </div>
              
              <div class="reference-list" *ngIf="pipelines.length > 0">
                <div class="reference-item" *ngFor="let pipeline of pipelines">
                  <mat-icon>linear_scale</mat-icon>
                  <span>{{ pipeline.name }}</span>
                </div>
              </div>
              
              <div *ngIf="pipelines.length === 0" class="empty-section">
                <span>No pipelines using this namespace</span>
              </div>
            </div>
            
            <div class="dashboard-section">
              <div class="section-header">
                <mat-icon>folder</mat-icon>
                <span>Projects using this namespace</span>
                <span class="badge">{{ projects.length }}</span>
              </div>
              
              <div class="reference-list" *ngIf="projects.length > 0">
                <div class="reference-item" *ngFor="let project of projects">
                  <mat-icon>folder</mat-icon>
                  <span>{{ project.name }}</span>
                </div>
              </div>
              
              <div *ngIf="projects.length === 0" class="empty-section">
                <span>No projects using this namespace</span>
              </div>
            </div>
          </div>
          
          <div class="no-selection" *ngIf="!selectedNamespace">
            <mat-icon>dns</mat-icon>
            <span>Select a namespace to view details</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .namespaces-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0d0d0d;
    }
    
    .content {
      display: flex;
      flex: 1;
      gap: 0;
      overflow: hidden;
    }
    
    .left-panel {
      width: 420px;
      background: linear-gradient(180deg, #1a1a1a 0%, #151515 100%);
      border-right: 1px solid #2a2a2a;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                  min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .left-panel.collapsed {
      width: 0;
      min-width: 0;
      border-right: none;
      opacity: 0;
    }
    
    .content.left-collapsed .right-panel {
      flex: 1;
    }
    
    app-panel-toggle {
      position: relative;
      flex-shrink: 0;
      z-index: 10;
    }
    
    app-panel-toggle.collapsed {
      left: 0;
    }
    
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
    .panel-title mat-icon {
      color: #4fc3f7;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .icon-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #3a3a3a;
      background: #2a2a2a;
      color: #b0b0b0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .icon-btn:hover {
      background: #3a3a3a;
      color: #ffffff;
    }
    
    .icon-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .icon-btn.clear-btn:hover {
      background: #c62828;
      border-color: #f44336;
      color: #ffffff;
    }
    
    .type-selector {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: #1a1a1a;
      border-bottom: 1px solid #2a2a2a;
      flex-wrap: wrap;
    }
    
    .type-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #b0b0b0;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .type-btn:hover {
      background: #3a3a3a;
      color: #ffffff;
    }
    
    .type-btn.active {
      background: #1565c0;
      border-color: #1976d2;
      color: #ffffff;
    }
    
    .type-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .search-section {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      background: #1a1a1a;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .search-field {
      flex: 1;
    }
    
    .search-buttons {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .icon-btn.search-btn,
    .icon-btn.clear-btn {
      padding: 6px;
      min-width: 32px;
      min-height: 32px;
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
    
    .icon-btn.search-btn:hover {
      background: #1565c0;
      border-color: #1976d2;
      color: #ffffff;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: #888;
    }
    
    .loading-state.small {
      padding: 16px;
    }
    
    .namespace-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    
    .list-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      margin-bottom: 8px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
    }
    
    .list-item:hover {
      background: #252525;
      border-color: #3a3a3a;
      transform: translateX(4px);
    }
    
    .list-item.selected {
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
      border-color: #1976d2;
    }
    
    .namespace-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .list-item.selected .namespace-avatar {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .namespace-avatar mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #4fc3f7;
    }
    
    .list-item.selected .namespace-avatar mat-icon {
      color: #ffffff;
    }
    
    .namespace-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .namespace-name {
      color: #e0e0e0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-item.selected .namespace-name {
      color: #ffffff;
    }
    
    .chevron {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #555;
      transition: transform 0.2s ease;
    }
    
    .list-item:hover .chevron {
      transform: translateX(4px);
      color: #888;
    }
    
    .list-item.selected .chevron {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #666;
      gap: 8px;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #444;
    }
    
    .empty-state span {
      font-size: 0.95rem;
      color: #888;
    }
    
    .empty-state small {
      font-size: 0.8rem;
      color: #555;
    }
    
    .right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0d0d0d;
      overflow: hidden;
    }
    
    .right-panel .panel-header {
      padding: 20px 24px;
    }
    
    .dashboard-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
    
    .namespace-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
      border-radius: 10px;
      margin-bottom: 24px;
    }
    
    .namespace-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }
    
    .namespace-value {
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .item-count {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }
    
    .dashboard-section {
      margin-bottom: 24px;
      background: #1a1a1a;
      border-radius: 10px;
      border: 1px solid #2a2a2a;
      overflow: hidden;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 500;
    }
    
    .section-header mat-icon {
      color: #4fc3f7;
    }
    
    .badge {
      margin-left: auto;
      padding: 4px 10px;
      background: #2a2a2a;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #b0b0b0;
    }
    
    .items-table {
      width: 100%;
      background: transparent;
    }
    
    ::ng-deep .items-table .mat-mdc-header-cell {
      background: #1a1a1a !important;
      color: #888 !important;
      border-bottom: 1px solid #2a2a2a;
    }
    
    ::ng-deep .items-table .mat-mdc-cell {
      color: #e0e0e0;
      border-bottom: 1px solid #2a2a2a;
    }
    
    ::ng-deep .items-table .mat-mdc-row:hover {
      background: #252525;
    }
    
    .reference-list {
      padding: 12px;
    }
    
    .reference-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 6px;
      color: #e0e0e0;
      background: #252525;
      margin-bottom: 6px;
    }
    
    .reference-item mat-icon {
      color: #4fc3f7;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .empty-section {
      padding: 24px;
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }
    
    .no-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #666;
      gap: 12px;
    }
    
    .no-selection mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #444;
    }
    
    .no-selection span {
      font-size: 1rem;
      color: #888;
    }
  `]
})
export class NamespacesComponent implements OnInit {
  namespaces: string[] = [];
  allNamespaces: string[] = [];
  selectedNamespace: string | null = null;
  selectedType = 'agents';
  searchTerm = '';
  loading = false;
  loadingItems = false;
  leftPanelCollapsed = false;
  
  namespaceItems: NamespaceItems | null = null;
  pipelines: Pipeline[] = [];
  projects: Project[] = [];
  
  displayedColumns: string[] = ['name', 'description', 'scope'];
  
  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
  
  /**
   * Alterna o estado de recolhimento do painel esquerdo.
   */
  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }
  
  /**
   * Retorna o label legível para o tipo de namespace selecionado.
   * @returns String com o label do tipo
   */
  getTypeLabel(): string {
    const labels: { [key: string]: string } = {
      'agents': 'Agents',
      'scripts': 'Scripts',
      'instructions': 'Instructions'
    };
    return labels[this.selectedType] || 'Unknown';
  }
  
  /**
   * Seleciona um novo tipo de namespace e recarrega a lista.
   * @param type - Tipo de namespace (agents, skills, commands, scripts)
   */
  /**
   * Seleciona um novo tipo de namespace e reseta o estado.
   * @param type - Tipo de namespace (agents, skills, commands, scripts)
   */
  selectType(type: string): void {
    this.selectedType = type;
    this.selectedNamespace = null;
    this.namespaceItems = null;
    this.pipelines = [];
    this.projects = [];
    this.loadNamespaces();
  }
  
  ngOnInit(): void {
    this.loadNamespaces();
  }
  
  /**
   * Carrega a lista de namespaces do tipo selecionado.
   */
  loadNamespaces(): void {
    this.loading = true;
    this.apiService.getNamespacesByType(this.selectedType).subscribe({
      next: (namespaces) => {
        this.ngZone.run(() => {
          this.allNamespaces = namespaces || [];
          this.namespaces = [...this.allNamespaces];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error loading namespaces:', err);
          this.allNamespaces = [];
          this.namespaces = [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }
  
  /**
   * Filtra os namespaces pelo termo de busca.
   */
  /**
   * Filtra os namespaces pelo termo de busca.
   */
  search(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.namespaces = this.allNamespaces.filter(ns => 
        ns.toLowerCase().includes(term)
      );
    } else {
      this.clearSearch();
    }
  }
  
  /**
   * Limpa o filtro de busca e exibe todos os namespaces.
   */
  /**
   * Limpa o filtro de busca e exibe todos os namespaces.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.namespaces = [...this.allNamespaces];
  }
  
  /**
   * Seleciona um namespace e carrega seus detalhes.
   * @param namespace - Nome do namespace a ser selecionado
   */
  /**
   * Seleciona um namespace e carrega seus detalhes.
   * @param namespace - Nome do namespace a ser selecionado
   */
  selectNamespace(namespace: string): void {
    this.selectedNamespace = namespace;
    this.loadNamespaceDetails();
  }
  
  /**
   * Carrega os detalhes do namespace selecionado:
   * itens, pipelines e projetos que utilizam o namespace.
   */
  /**
   * Carrega os detalhes do namespace selecionado:
   * itens, pipelines e projetos que utilizam o namespace.
   */
  loadNamespaceDetails(): void {
    if (!this.selectedNamespace) return;
    
    this.loadingItems = true;
    
    this.apiService.getNamespaceItems(this.selectedType, this.selectedNamespace).subscribe({
      next: (result) => {
        this.ngZone.run(() => {
          this.namespaceItems = result;
          this.loadingItems = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error loading namespace items:', err);
          this.namespaceItems = null;
          this.loadingItems = false;
          this.cdr.detectChanges();
        });
      }
    });
    
    this.apiService.getPipelinesUsingNamespace(this.selectedType, this.selectedNamespace).subscribe({
      next: (pipelines) => {
        this.ngZone.run(() => {
          this.pipelines = pipelines || [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.pipelines = [];
          this.cdr.detectChanges();
        });
      }
    });
    
    this.apiService.getProjectsUsingNamespace(this.selectedType, this.selectedNamespace).subscribe({
      next: (projects) => {
        this.ngZone.run(() => {
          this.projects = projects || [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.projects = [];
          this.cdr.detectChanges();
        });
      }
    });
  }
  
  /**
   * Limpa todos os itens do namespace selecionado via diálogo de confirmação.
   * Remove apenas itens que não estão sendo usados por pipelines ou projetos.
   */
  /**
   * Limpa todos os itens do namespace selecionado via diálogo de confirmação.
   * Remove apenas itens que não estão sendo usados por pipelines ou projetos.
   */
  clearNamespace(): void {
    if (!this.selectedNamespace) return;
    
    const typeLabel = this.getTypeLabel();
    
    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Are you sure you want to clear all ${typeLabel.toLowerCase()} in namespace "${this.selectedNamespace}"? This will only delete items not used by any pipeline or project.`,
        showConfirm: true,
        confirmText: 'Clear',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.clearNamespace(this.selectedType, this.selectedNamespace!).subscribe({
          next: (result: ClearResult) => {
            this.ngZone.run(() => {
              if (result.success) {
                this.dialog.open(PipelineResultDialogComponent, {
                  data: {
                    success: true,
                    message: result.message
                  }
                }).afterClosed().subscribe(() => {
                  this.loadNamespaces();
                  this.selectedNamespace = null;
                  this.namespaceItems = null;
                  this.pipelines = [];
                  this.projects = [];
                });
              } else {
                this.dialog.open(PipelineResultDialogComponent, {
                  data: {
                    success: false,
                    message: result.message
                  }
                });
              }
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: 'Error clearing namespace: ' + err.message
                }
              });
              this.cdr.detectChanges();
            });
          }
        });
      }
    });
  }
}