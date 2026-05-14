import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService, Script, Template } from '../../services/api.service';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { PromptEditorModalComponent } from '../../components/prompt-editor-modal/prompt-editor-modal.component';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';

/**
 * Componente de Gerenciamento de Scripts.
 * Permite criar, editar, buscar e excluir scripts do sistema.
 * Fornece interface para visualização de lista paginada e formulário de detalhes.
 * 
 * @component
 * @name ScriptsComponent
 * @selector app-scripts
 */
@Component({
  selector: 'app-scripts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatPaginatorModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MenuBarComponent,
    PipelineResultDialogComponent,
    PromptEditorModalComponent,
    PanelToggleComponent
  ],
  template: `
    <div class="scripts-container">
      <app-menu-bar></app-menu-bar>
      
      <div class="content" [class.left-collapsed]="leftPanelCollapsed">
        <div class="left-panel" [class.collapsed]="leftPanelCollapsed">
          <div class="panel-header">
      <div class="panel-title">
      <mat-icon>code</mat-icon>
      <span>Scripts</span>
      <span class="count-badge">{{ totalElements }}</span>
    </div>
            <button class="icon-btn add-btn" (click)="clearForm()" title="Add new script">
              <mat-icon>add</mat-icon>
            </button>
          </div>
          
          <div class="search-section">
<mat-form-field class="search-field" appearance="outline" floatLabel="always">
            <mat-label>Search by name...</mat-label>
            <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field class="search-field" appearance="outline" floatLabel="always">
            <mat-label>Namespace</mat-label>
            <input matInput
                   [(ngModel)]="searchNamespace">
            <mat-icon matPrefix>category</mat-icon>
          </mat-form-field>
            <button class="icon-btn search-btn" (click)="search()" title="Search">
              <mat-icon>search</mat-icon>
            </button>
            <button class="icon-btn clear-btn" (click)="clearSearch()" title="Clear" *ngIf="searchTerm || searchNamespace">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div *ngIf="loading === true" class="loading-state">
            <mat-spinner diameter="32" color="primary"></mat-spinner>
            <span>Loading scripts...</span>
          </div>
          
          <div class="script-list">
            <div class="list-item" *ngFor="let script of scripts" 
                 [class.selected]="script === selectedScript"
                 (click)="selectScript(script)">
              <div class="script-avatar">
                <mat-icon>description</mat-icon>
              </div>
              <div class="script-info">
                <span class="script-name">{{ script.name }}</span>
                <span class="script-namespace">{{ script.namespace }}</span>
              </div>
              <button class="icon-btn delete-btn" (click)="deleteScriptInline(script, $event)" title="Delete script">
                <mat-icon>delete</mat-icon>
              </button>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
            <div *ngIf="scripts.length === 0 && !loading" class="empty-state">
              <mat-icon>description</mat-icon>
              <span>No scripts found</span>
              <small>Create your first script</small>
            </div>
          </div>
          
          <mat-paginator class="custom-paginator"
                         [length]="totalElements"
                         [pageSize]="pageSize"
                         [pageIndex]="currentPage"
                         (page)="onPageChange($event)"
                         showFirstLastButtons>
          </mat-paginator>
        </div>
        
        <app-panel-toggle 
          [isCollapsed]="leftPanelCollapsed"
          (toggle)="toggleLeftPanel()"
          [class.collapsed]="leftPanelCollapsed">
        </app-panel-toggle>
        
        <div class="right-panel">
          <div class="panel-header">
      <div class="panel-title">
      <mat-icon>settings</mat-icon>
      <span>Script Details</span>
      <span class="count-badge" *ngIf="selectedScript">{{ selectedScript.name }}</span>
    </div>
            <div class="header-actions" *ngIf="selectedScript">
              <button class="icon-btn clear-btn" (click)="clearForm()" title="Clear form">
                <mat-icon>refresh</mat-icon>
              </button>
              <button class="icon-btn danger-btn" (click)="deleteScript()" title="Delete script">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="form-container">
            <div class="form-row">
<mat-form-field class="form-field" appearance="outline" floatLabel="always">
              <mat-label>Name</mat-label>
              <input matInput [(ngModel)]="formScript.name">
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field class="form-field" appearance="outline" floatLabel="always">
              <mat-label>Namespace</mat-label>
              <input matInput
                     [(ngModel)]="formScript.namespace">
              <mat-icon matPrefix>category</mat-icon>
            </mat-form-field>

            <mat-form-field class="form-field" appearance="outline" floatLabel="always">
              <mat-label>Path</mat-label>
              <input matInput [(ngModel)]="formScript.path">
              <mat-icon matPrefix>link</mat-icon>
            </mat-form-field>
            </div>
            
<mat-form-field class="full-width" appearance="outline" floatLabel="always">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="formScript.description" rows="3"></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline" floatLabel="always">
              <mat-label>Template</mat-label>
              <mat-select (selectionChange)="onTemplateSelect($event)">
                <mat-option [value]="null">-- Select a template --</mat-option>
                <mat-option *ngFor="let template of templates" [value]="template.id">
                  {{ template.name }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
            <div class="textarea-actions">
              <button mat-icon-button type="button" (click)="copyToClipboard(formScript.content)" [disabled]="!formScript.content" title="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
              <button mat-icon-button type="button" (click)="openContentEditor()" title="Open in editor">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </div>
            
  <mat-form-field class="full-width prompt-field" appearance="outline" floatLabel="always">
      <mat-label>Script Content</mat-label>
              <textarea matInput [(ngModel)]="formScript.content" rows="10"
              [ngStyle]="{'font-family': 'Consolas, Monaco, Courier New, monospace', 'font-size': '0.9rem'}"></textarea>
              <mat-icon matPrefix>code</mat-icon>
            </mat-form-field>
            <div *ngIf="statusMessage" class="status-message" [ngClass]="getStatusClass()">
              <mat-icon>{{ statusMessage.includes('Error') ? 'error' : 'check_circle' }}</mat-icon>
              {{ statusMessage }}
            </div>
            
            <div class="button-row">
              <button class="btn btn-primary" (click)="saveScript()" [disabled]="!formScript.name">
                <mat-icon>save</mat-icon>
                {{ formScript.id ? 'Update Script' : 'Create Script' }}
              </button>
              <button class="btn btn-secondary" (click)="clearForm()">
                <mat-icon>refresh</mat-icon>
                Clear Form
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
  .scripts-container {
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

  .list-item .icon-btn.delete-btn {
  margin-left: auto;
  opacity: 0.6;
  }

  .list-item .icon-btn.delete-btn:hover:not(:disabled) {
  border-color: #ff5252;
  color: #ff5252;
  background: rgba(255, 82, 82, 0.1);
  opacity: 1;
  }

  .icon-btn.delete-btn:hover:not(:disabled) {
  border-color: #ff5252;
  color: #ff5252;
  background: rgba(255, 82, 82, 0.1);
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

  .search-section {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #2a2a2a;
  }

  .search-field {
  flex: 1;
  }

  .filter-label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 8px;
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

  .loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: #888;
  }

  .script-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  }

  .danger-btn:hover:not(:disabled) {
  border-color: #ff5252;
  color: #ff5252;
  background: rgba(255, 82, 82, 0.1);
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

  .script-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  }

  .list-item.selected .script-avatar {
  background: rgba(79, 195, 247, 0.15);
  }

  .script-avatar mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #4fc3f7;
  }

  .list-item.selected .script-avatar mat-icon {
  color: #4fc3f7;
  }

  .script-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  }

  .script-name {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  }

  .list-item.selected .script-name {
  color: #4fc3f7;
  }

  .script-namespace {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  }

  .list-item.selected .script-namespace {
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

  ::ng-deep .custom-paginator {
  background: #1a1a1a !important;
  color: #e0e0e0 !important;
  border-top: 1px solid #2a2a2a !important;
  }

  ::ng-deep .custom-paginator .mat-mdc-icon-button {
  color: #b0b0b0 !important;
  }

  ::ng-deep .custom-paginator .mat-mdc-icon-button:hover {
  background-color: #2a2a2a !important;
  color: #ffffff !important;
  }

  .right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0d0d0d;
  overflow: hidden;
  }

  .count-badge {
  background: rgba(79, 195, 247, 0.2);
  color: #4fc3f7;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  }

  .right-panel .panel-header {
  padding: 16px 20px;
  }

  .form-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  }

  .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  }

  .form-field {
  flex: 1;
  }

  .full-width {
  width: 100%;
  margin-bottom: 8px;
  }

  .prompt-field {
  margin-bottom: 8px;
  margin-top: 8px;
  }

  ::ng-deep .prompt-field .mat-mdc-text-field-wrapper {
  height: auto !important;
  min-height: 120px !important;
  }

  ::ng-deep .prompt-field .mat-mdc-form-field-flex {
  height: auto !important;
  min-height: 120px !important;
  align-items: flex-start !important;
  }

  ::ng-deep .prompt-field .mat-mdc-form-field-infix {
  height: auto !important;
  min-height: 100px !important;
  padding: 12px 0 !important;
  border-top: none !important;
  border-bottom: none !important;
  }

  ::ng-deep .prompt-field input {
  height: auto !important;
  }

  ::ng-deep .prompt-field textarea.mat-mdc-input-element {
  min-height: 100px !important;
  height: 100% !important;
  width: 100% !important;
  overflow: auto !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  box-shadow: none !important;
  resize: none !important;
  display: block !important;
  }

  .prompt-field-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  }

  ::ng-deep .prompt-field-container .mat-form-field {
  cursor: pointer;
  pointer-events: auto;
  }

  ::ng-deep .prompt-field-container .mat-form-field:hover {
  opacity: 0.9;
  }

  .prompt-field-container:hover {
  opacity: 0.9;
  }

  .prompt-field-container .prompt-field {
  flex: 1;
  }

  .prompt-edit-btn {
  color: #4fc3f7;
  flex-shrink: 0;
  margin-top: 8px;
  cursor: pointer;
  pointer-events: auto;
  }

  .prompt-edit-btn:hover {
  background: rgba(79, 195, 247, 0.1);
  }

  ::ng-deep .mat-mdc-form-field-icon-prefix {
  padding-right: 8px !important;
  color: #888;
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
  color: #ffffff !important;
  }

  ::ng-deep input[matInput]::placeholder,
  ::ng-deep textarea[matInput]::placeholder {
  color: #666;
  }

  ::ng-deep .mat-mdc-select-panel {
  background: #2a2a2a !important;
  }

  ::ng-deep .mat-mdc-option {
  color: #e0e0e0 !important;
  }

  ::ng-deep .mat-mdc-option:hover {
  background: #3a3a3a !important;
  }

  ::ng-deep .mat-mdc-option.mat-mdc-option-active {
  background: #3a3a3a !important;
  }

  ::ng-deep .mdc-list-item__content {
  display: flex;
  align-items: center;
  gap: 8px;
  }

  .button-row {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #2a2a2a;
  }

  .btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  }

  .btn mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  }

  .btn-primary {
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
  border: 1px solid #4fc3f7;
  }

  .btn-primary:hover:not(:disabled) {
  background: rgba(79, 195, 247, 0.25);
  }

  .btn-primary:disabled {
  background: #1a1a1a;
  color: #555;
  border-color: #2a2a2a;
  cursor: not-allowed;
  }

  .btn-secondary {
  background: transparent;
  color: #888;
  border: 1px solid #3a3a3a;
  }

  .btn-secondary:hover:not(:disabled) {
  background: #2a2a2a;
  color: #fff;
  border-color: #4fc3f7;
  }

  .status-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 0.9rem;
  }

  .status-message mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  }

  .status-message.success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.2);
  }

  .status-message.error {
  background: rgba(255, 82, 82, 0.1);
  color: #ff5252;
  border: 1px solid rgba(255, 82, 82, 0.2);
  }

  .status-message.info {
  background: rgba(79, 195, 247, 0.1);
  color: #4fc3f7;
  border: 1px solid rgba(79, 195, 247, 0.2);
  }

  .textarea-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-start;
  margin-bottom: 4px;
  }

  .textarea-actions button {
  width: 32px;
  height: 32px;
  line-height: 32px;
  }

  .textarea-actions mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  }
  `]
})
/**
 * Tela de gerenciamento de scripts customizados.
 * Permite visualizar, criar e editar scripts do sistema.
 *
 * @author Seu Nome
 * @since 2024
 * @component
 * @description Componente de tela para operações com scripts customizados.
 */
export class ScriptsComponent implements OnInit, OnDestroy {
  scripts: Script[] = [];
  selectedScript: Script | null = null;
  namespaces: string[] = [];
  formScript: Script = { name: '', namespace: '', description: '', content: '', scope: 'global', path: '' };
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
  ) {}

  /**
   * Retorna um objeto Script vazio com valores padrão.
   * @returns Objeto Script com propriedades vazias
   */
  private getEmptyScript(): Script {
    return {
      name: '',
      namespace: '',
      description: '',
      content: '',
      scope: 'global',
      path: ''
    };
  }

  ngOnInit(): void {
    console.log('ScriptsComponent ngOnInit');
    this.loadScripts();
    this.loadTemplates();
  }

  ngOnDestroy(): void {
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.apiService.getTemplatesByType('scripts').subscribe({
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
        if (this.formScript.content) {
          this.formScript.content = this.formScript.content + '\n\n' + template.template;
        } else {
          this.formScript.content = template.template;
        }
      }
    }
  }

  /**
   * Alterna a visibilidade do painel lateral esquerdo.
   */
  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  @HostListener('document:keydown.control.b')
  onToggleLeftPanel(): void {
    this.toggleLeftPanel();
  }

  @HostListener('document:keydown.control.alt.e')
  onOpenInEditor(): void {
    if (this.selectedScript) {
      this.openContentEditor();
    }
  }

  @HostListener('document:keydown.control.shift.k')
  onCopyToClipboard(): void {
    if (this.selectedScript?.content) {
      this.copyToClipboard(this.selectedScript.content);
    }
  }

  /**
   * Carrega a lista de scripts do backend com paginação.
   */
  loadScripts(): void {
    console.log('Loading scripts...');
    this.loading = true;
    console.log('Calling API...');
    this.apiService.getScripts(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('API response:', response);
          if (response && Array.isArray(response.scripts)) {
            this.scripts = response.scripts;
          } else if (Array.isArray(response)) {
            this.scripts = response;
          } else {
            this.scripts = [];
          }
          console.log('Scripts set:', this.scripts);
          this.totalElements = response?.totalElements ?? this.scripts.length;
          this.totalPages = response?.totalPages ?? 1;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loading set to false');
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API error:', err);
          this.statusMessage = 'Error loading scripts: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  /**
   * Busca scripts por nome e/ou namespace.
   */
  search(): void {
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.currentPage = 0;
      this.loading = true;
      this.apiService.searchScripts(this.searchTerm, this.searchNamespace, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (response && Array.isArray(response.scripts)) {
              this.scripts = response.scripts;
            } else if (Array.isArray(response)) {
              this.scripts = response;
            } else {
              this.scripts = [];
            }
            this.totalElements = response?.totalElements ?? this.scripts.length;
            this.totalPages = response?.totalPages ?? 1;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching scripts: ' + err.message;
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.clearSearch();
    }
  }

  /**
   * Limpa os filtros de busca e recarrega a lista completa de scripts.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchNamespace = '';
    this.currentPage = 0;
    this.loadScripts();
  }

  /**
   * Manipula mudança de página no componente de paginação.
   * @param event - Evento de mudança de página
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.search();
    } else {
      this.loadScripts();
    }
  }

  /**
   * Seleciona um script da lista e preenche o formulário com seus dados.
   * @param script - Script selecionado
   */
  selectScript(script: Script): void {
    this.cdr.markForCheck();
    this.selectedScript = { ...script };
    this.formScript = { ...script };
    this.statusMessage = `Script selected: ${script.name}`;
  }

  /**
   * Salva (cria ou atualiza) um script no backend.
   */
  saveScript(): void {
    if (!this.formScript.name) {
      this.statusMessage = 'Error: Name is required';
      return;
    }

    const scriptData = {
      name: this.formScript.name,
      namespace: this.formScript.namespace || '',
      description: this.formScript.description || '',
      content: this.formScript.content || '',
      scope: this.formScript.scope || 'global',
      path: this.formScript.path || ''
    };

    if (this.formScript.id) {
      this.apiService.updateScript(this.formScript.id, scriptData).subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            const updated = response.script || response;
            const impact = response.impact;
            this.statusMessage = `Script '${updated.name}' updated successfully`;
            if (impact && (impact.totalPipelines > 0 || impact.totalProjects > 0)) {
              const parts: string[] = [];
              if (impact.totalPipelines > 0) parts.push(`${impact.totalPipelines} pipeline(s)`);
              if (impact.totalProjects > 0) parts.push(`${impact.totalProjects} project(s)`);
              this.statusMessage += ` — Changes propagated to ${parts.join(' and ')}`;
            }
            this.selectedScript = { ...updated };
            this.formScript = { ...updated };
            this.loadScripts();
            this.cdr.detectChanges();
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
      this.currentPage = 0;
      this.apiService.createScript(scriptData).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.statusMessage = `Script '${created.name}' created successfully`;
            this.selectedScript = { ...created };
            this.formScript = { ...created };
            this.loadScripts();
            this.cdr.detectChanges();
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

  /**
   * Exclui o script atualmente selecionado.
   */
  deleteScript(): void {
    if (!this.selectedScript?.id) {
      this.statusMessage = 'No script selected to delete';
      return;
    }
    const id = this.selectedScript.id;
    const name = this.selectedScript.name;
    this.apiService.deleteScript(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = `Script '${name}' deleted successfully`;
          this.selectedScript = null;
          this.cdr.detectChanges();
          setTimeout(() => this.loadScripts(), 0);
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

  /**
   * Exclui um script da lista (modo inline com confirmação).
   * @param script - Script a ser excluído
   * @param event - Evento do clique para stopPropagation
   */
  deleteScriptInline(script: Script, event: Event): void {
    event.stopPropagation();
    
    if (!script.id) {
      return;
    }

    const scriptName = script.name;
    const scriptId = script.id;
    
    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Do you really want to delete the script "${scriptName}"?`,
        showConfirm: true,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deleteScript(scriptId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Script "${scriptName}" deleted successfully!`
                }
              }).afterClosed().subscribe(() => {
                setTimeout(() => {
                  if (this.selectedScript?.id === scriptId) {
                    this.clearForm();
                  }
                  this.loadScripts();
                }, 0);
              });
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: err.error?.message || err.message || 'Falha ao excluir script. Tente novamente.'
                }
              });
            });
          }
        });
      }
    });
  }

  /**
   * Limpa o formulário, resetando para um novo script vazio.
   */
  clearForm(): void {
    this.selectedScript = null;
    this.formScript = this.getEmptyScript();
    this.statusMessage = 'Form cleared - ready for new script';
  }

  /**
   * Retorna a classe CSS para estilização da mensagem de status.
   * @returns Classe CSS ('success', 'error' ou 'info')
   */
  getStatusClass(): string {
    if (!this.statusMessage) return '';
    if (this.statusMessage.includes('Error')) return 'error';
    if (this.statusMessage.includes('success') || this.statusMessage.includes('updated') || this.statusMessage.includes('created') || this.statusMessage.includes('deleted')) return 'success';
    return 'info';
  }

  /**
   * Gera uma prévia do conteúdo com até 15 palavras.
   * @param prompt - Texto completo do conteúdo
   * @returns Preview truncado
   */
  getPromptPreview(prompt: string | undefined): string {
    if (!prompt) return '';
    const words = prompt.trim().split(/\s+/);
    const preview = words.slice(0, 15).join(' ');
    return words.length > 15 ? preview + '...' : preview;
  }

  /**
   * Abre o editor de conteúdo em um modal para edição do script.
   */
  openContentEditor(): void {
    const dialogRef = this.dialog.open(PromptEditorModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        prompt: this.formScript.content,
        type: 'scripts',
        title: 'Edit Script Content'
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.ngZone.run(() => {
        if (result && result.prompt !== undefined) {
          this.formScript.content = result.prompt;
          this.cdr.detectChanges();
        }
      });
    });
  }

  async copyToClipboard(text: string | undefined): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.statusMessage = 'Script copied to clipboard';
      setTimeout(() => this.statusMessage = '', 3000);
    } catch (err) {
      this.statusMessage = 'Failed to copy to clipboard';
    }
  }
}
