import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { ApiService, Agent, Skill, Command, Script, Pipeline } from '../../services/api.service';

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
            <span>Namespaces</span>
            <span class="count-badge">{{ namespaces.length }}</span>
          </div>
          <div class="header-actions">
            <button class="icon-btn add-btn" (click)="clearSelection()" title="Clear selection">
              <mat-icon>refresh</mat-icon>
            </button>
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

        </div>

        <div class="search-section">
          <mat-form-field class="search-field" appearance="outline" floatLabel="always">
            <mat-label>Search by namespace...</mat-label>
            <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <button class="icon-btn search-btn" (click)="search()" title="Search">
            <mat-icon>search</mat-icon>
          </button>
          <button class="icon-btn clear-btn" (click)="clearSearch()" title="Clear" *ngIf="searchTerm">
            <mat-icon>close</mat-icon>
          </button>
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
              <span class="namespace-type">{{ getTypeLabel() }}</span>
            </div>
            <mat-icon class="chevron">chevron_right</mat-icon>
          </div>

          <div *ngIf="namespaces.length === 0 && !loading" class="empty-state">
            <mat-icon>dns</mat-icon>
            <span>No namespaces found</span>
            <small>Create agents or scripts to generate namespaces</small>
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
            <span class="count-badge" *ngIf="selectedNamespace">{{ selectedNamespace }}</span>
          </div>
          <div class="header-actions" *ngIf="selectedNamespace">
            <button class="icon-btn" (click)="clearSelection()" title="Clear selection">
              <mat-icon>refresh</mat-icon>
            </button>
            <button class="icon-btn export-btn" (click)="exportNamespace()" title="Export namespace as SQL">
              <mat-icon>file_download</mat-icon>
            </button>
            <button class="icon-btn danger-btn" (click)="clearNamespace()" title="Clear namespace items">
              <mat-icon>delete_sweep</mat-icon>
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
              <span class="count-badge">{{ namespaceItems?.totalCount || 0 }}</span>
            </div>

            <div *ngIf="loadingItems" class="loading-state small">
              <mat-spinner diameter="24"></mat-spinner>
            </div>

            <div class="items-list" *ngIf="!loadingItems && namespaceItems?.items?.length">
              <div class="item-row" *ngFor="let item of namespaceItems?.items">
                <div class="item-avatar">
                  <mat-icon>{{ selectedType === 'agents' ? 'smart_toy' : 'code' }}</mat-icon>
                </div>
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-description">{{ item.description || 'No description' }}</span>
                </div>
                <span class="item-scope" *ngIf="item.scope">{{ item.scope }}</span>
              </div>
            </div>

            <div *ngIf="!loadingItems && (!namespaceItems?.items || namespaceItems?.items?.length === 0)" class="empty-section">
              <mat-icon>info</mat-icon>
              <span>No items in this namespace</span>
            </div>
          </div>

          <div class="dashboard-section">
            <div class="section-header">
              <mat-icon>account_tree</mat-icon>
              <span>Pipelines using this namespace</span>
              <span class="count-badge">{{ pipelines.length }}</span>
            </div>

            <div class="reference-list" *ngIf="pipelines.length > 0">
              <div class="reference-item" *ngFor="let pipeline of pipelines">
                <div class="reference-avatar">
                  <mat-icon>linear_scale</mat-icon>
                </div>
                <div class="reference-info">
                  <span class="reference-name">{{ pipeline.name }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="pipelines.length === 0" class="empty-section">
              <mat-icon>info</mat-icon>
              <span>No pipelines using this namespace</span>
            </div>
          </div>


        </div>

        <div class="no-selection" *ngIf="!selectedNamespace">
          <mat-icon>dns</mat-icon>
          <span>Select a namespace to view details</span>
          <small>Choose a namespace from the list</small>
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
      color: #fff;
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
      transition: width 0.08s ease-out,
      min-width 0.08s ease-out,
      opacity 0.08s ease-out;
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
      padding: 16px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .panel-title mat-icon {
      color: #4fc3f7;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:hover:not(:disabled) {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
    }

    .icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .icon-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .icon-btn.add-btn:hover:not(:disabled) {
      background: rgba(79, 195, 247, 0.15);
      color: #4fc3f7;
      border-color: #4fc3f7;
    }

    .icon-btn.search-btn:hover:not(:disabled) {
      background: rgba(79, 195, 247, 0.15);
      color: #4fc3f7;
      border-color: #4fc3f7;
    }

    .icon-btn.clear-btn:hover:not(:disabled) {
      background: rgba(79, 195, 247, 0.15);
      color: #4fc3f7;
      border-color: #4fc3f7;
    }

    .icon-btn.export-btn:hover:not(:disabled) {
      background: rgba(76, 175, 80, 0.15);
      color: #4caf50;
      border-color: #4caf50;
    }

    .danger-btn:hover:not(:disabled) {
      border-color: #ff5252;
      color: #ff5252;
      background: rgba(255, 82, 82, 0.1);
    }

    .count-badge {
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .type-selector {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      border-top: 1px solid #2a2a2a;
      flex-wrap: wrap;
    }

    .type-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .type-btn:hover {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
    }

    .type-btn.active {
      background: rgba(79, 195, 247, 0.15);
      border-color: #4fc3f7;
      color: #4fc3f7;
    }

    .type-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .search-section {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #2a2a2a;
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

    ::ng-deep .search-field .mdc-notched-outline__notch {
      border-left: none !important;
      border-right: none !important;
    }

    [dir=rtl] ::ng-deep .search-field .mdc-notched-outline__notch {
      border-left: none !important;
      border-right: none !important;
    }

    ::ng-deep .search-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
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
      transition: all 0.2s;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
    }

    .list-item:hover {
      border-color: #3a3a3a;
      background: #222;
    }

    .list-item.selected {
      background: rgba(79, 195, 247, 0.08);
      border-color: #4fc3f7;
    }

    .namespace-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .list-item.selected .namespace-avatar {
      background: rgba(79, 195, 247, 0.15);
    }

    .namespace-avatar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
    }

    .list-item.selected .namespace-avatar mat-icon {
      color: #4fc3f7;
    }

    .namespace-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .namespace-name {
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .list-item.selected .namespace-name {
      color: #4fc3f7;
    }

    .namespace-type {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .list-item.selected .namespace-type {
      color: #4fc3f7;
      opacity: 0.7;
    }

    .chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #555;
      transition: transform 0.15s;
    }

    .list-item:hover .chevron {
      transform: translateX(4px);
      color: #888;
    }

    .list-item.selected .chevron {
      color: #4fc3f7;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 64px 32px;
      color: #555;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #333;
    }

    .empty-state span {
      font-size: 1rem;
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
      padding: 16px 20px;
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
      background: rgba(79, 195, 247, 0.1);
      border: 1px solid rgba(79, 195, 247, 0.2);
      border-radius: 10px;
      margin-bottom: 24px;
    }

    .namespace-label {
      color: #888;
      font-size: 0.9rem;
    }

    .namespace-value {
      color: #4fc3f7;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .item-count {
      color: #888;
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
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .section-header mat-icon {
      color: #4fc3f7;
    }

    .items-list {
      padding: 12px;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 10px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      transition: all 0.2s;
    }

    .item-row:hover {
      border-color: #3a3a3a;
      background: #222;
    }

    .item-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-avatar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .item-name {
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-description {
      font-size: 0.75rem;
      color: #888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-scope {
      font-size: 0.75rem;
      color: #4fc3f7;
      background: rgba(79, 195, 247, 0.15);
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .reference-list {
      padding: 12px;
    }

    .reference-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 10px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      transition: all 0.2s;
    }

    .reference-item:hover {
      border-color: #3a3a3a;
      background: #222;
    }

    .reference-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .reference-avatar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
    }

    .reference-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .reference-name {
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 32px 24px;
      color: #555;
    }

    .empty-section mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #333;
    }

    .empty-section span {
      font-size: 0.9rem;
      color: #888;
    }

    .no-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 64px 32px;
      color: #555;
    }

    .no-selection mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #333;
    }

    .no-selection span {
      font-size: 1rem;
      color: #888;
    }

    .no-selection small {
      font-size: 0.8rem;
      color: #555;
    }

    ::ng-deep .mdc-notched-outline__leading,
    ::ng-deep .mdc-notched-outline__notch,
    ::ng-deep .mdc-notched-outline__trailing {
      border-color: #3a3a3a !important;
    }

    ::ng-deep .mdc-notched-outline__notch {
      border-left: none !important;
      border-right: none !important;
    }

    [dir=rtl] ::ng-deep .mdc-notched-outline__notch {
      border-left: none !important;
      border-right: none !important;
    }

    ::ng-deep .mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7 !important;
    }

    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }

    ::ng-deep .mat-focused .mdc-floating-label {
      color: #4fc3f7 !important;
    }

    ::ng-deep input[matInput],
    ::ng-deep textarea[matInput] {
      color: #e0e0e0 !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 0.9rem !important;
    }

    ::ng-deep input[matInput]::placeholder,
    ::ng-deep textarea[matInput]::placeholder {
      color: #666;
    }
  `]
})
export class NamespacesComponent implements OnInit, OnDestroy {
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

  clearSelection(): void {
    this.selectedNamespace = null;
    this.namespaceItems = null;
    this.pipelines = [];
  }

  @HostListener('document:keydown.control.b')
  onToggleLeftPanel(): void {
    this.toggleLeftPanel();
  }
  
  /**
   * Retorna o label legível para o tipo de namespace selecionado.
   * @returns String com o label do tipo
   */
  getTypeLabel(): string {
    const labels: { [key: string]: string } = {
      'agents': 'Agents',
      'scripts': 'Scripts'
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
    this.loadNamespaces();
}

ngOnInit(): void {
    this.loadNamespaces();
  }

  ngOnDestroy(): void {
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

  exportNamespace(): void {
    if (!this.selectedNamespace) return;

    this.apiService.exportNamespace(this.selectedType, this.selectedNamespace).subscribe({
      next: (blob: Blob) => {
        this.ngZone.run(() => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = this.selectedNamespace!.replace(/[^a-zA-Z0-9\-_]/g, '_') + '_' + this.selectedType + '.sql';
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.dialog.open(PipelineResultDialogComponent, {
            data: {
              success: false,
              message: 'Error exporting namespace: ' + (err.message || 'Unknown error')
            }
          });
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