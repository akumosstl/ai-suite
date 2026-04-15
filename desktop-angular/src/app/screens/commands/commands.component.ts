import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
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
import { ApiService, Command, Project } from '../../services/api.service';
import { NewProjectDialogComponent } from '../../components/new-project-dialog/new-project-dialog.component';
import { OpenProjectDialogComponent } from '../../components/open-project-dialog/open-project-dialog.component';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { PromptEditorModalComponent } from '../../components/prompt-editor-modal/prompt-editor-modal.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';

/**
 * Componente de Gerenciamento de Comandos.
 * Permite criar, editar, buscar e excluir comandos do sistema.
 * Fornece interface para visualização de lista paginada e formulário de detalhes.
 * 
 * @component
 * @name CommandsComponent
 * @selector app-commands
 */
@Component({
  selector: 'app-commands',
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
  template: `
    <div class="commands-container">
      <app-menu-bar></app-menu-bar>
      
      <div class="content" [class.left-collapsed]="leftPanelCollapsed">
        <div class="left-panel" [class.collapsed]="leftPanelCollapsed">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>terminal</mat-icon>
              <span>Commands</span>
            </div>
            <button class="icon-btn add-btn" (click)="clearForm()" title="Add new command">
              <mat-icon>add_circle</mat-icon>
            </button>
          </div>
          
          <div class="search-section">
            <mat-form-field class="search-field" appearance="outline">
              <mat-label>Search by name...</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            <mat-form-field class="search-field" appearance="outline">
              <mat-label>Namespace</mat-label>
              <input matInput 
                     [(ngModel)]="searchNamespace" 
                     [matAutocomplete]="searchNamespaceAutoComplete"
                     (input)="onSearchNamespaceChange($event.target.value)"
                     (keyup.enter)="search()">
              <mat-autocomplete #searchNamespaceAutoComplete="matAutocomplete">
                <mat-option *ngFor="let ns of filteredSearchNamespaces" [value]="ns">
                  {{ ns }}
                </mat-option>
              </mat-autocomplete>
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
            <span>Loading commands...</span>
          </div>
          
          <div class="command-list">
            <div class="list-item" *ngFor="let command of commands" 
                 [class.selected]="command === selectedCommand"
                 (click)="selectCommand(command)">
              <div class="command-avatar">
                <mat-icon>terminal</mat-icon>
              </div>
              <div class="command-info">
                <span class="command-name">{{ command.name }}</span>
                <span class="command-namespace">{{ command.namespace }} • {{ command.scope }}</span>
              </div>
              <button class="icon-btn delete-btn" (click)="deleteCommandInline(command, $event)" title="Delete command">
                <mat-icon>delete</mat-icon>
              </button>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
            <div *ngIf="commands.length === 0 && !loading" class="empty-state">
              <mat-icon>terminal</mat-icon>
              <span>No commands found</span>
              <small>Create your first command</small>
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
              <span>Command Details</span>
            </div>
            <div class="header-actions" *ngIf="selectedCommand">
              <button class="icon-btn clear-btn" (click)="clearForm()" title="Clear form">
                <mat-icon>refresh</mat-icon>
              </button>
              <button class="icon-btn delete-btn" (click)="deleteCommand()" title="Delete command">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="form-container">
            <div class="form-row">
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="formCommand.name" placeholder="Enter command name">
                <mat-icon matPrefix>badge</mat-icon>
              </mat-form-field>
              
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Namespace</mat-label>
                <input matInput 
                       [(ngModel)]="formCommand.namespace" 
                       [matAutocomplete]="namespaceAutoComplete"
                       (input)="onNamespaceChange($event.target.value)">
                <mat-autocomplete #namespaceAutoComplete="matAutocomplete">
                  <mat-option *ngFor="let ns of filteredNamespaces" [value]="ns">
                    {{ ns }}
                  </mat-option>
                </mat-autocomplete>
                <mat-icon matPrefix>category</mat-icon>
              </mat-form-field>
              
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Path</mat-label>
                <input matInput [(ngModel)]="formCommand.path" placeholder="Enter path">
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>
            </div>
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="formCommand.description" rows="3" placeholder="Describe this command's purpose"></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
            
            <div class="prompt-field-container" (click)="openCommandEditor()">
              <mat-form-field class="full-width command-field" appearance="outline">
                <mat-label>Command</mat-label>
                <input matInput 
                       [value]="getPromptPreview(formCommand.command)" 
                       disabled
                       class="prompt-preview-input">
                <mat-icon matPrefix>code</mat-icon>
              </mat-form-field>
              <button mat-icon-button 
                      type="button"
                      class="prompt-edit-btn" 
                      title="Edit command">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
            
            <div class="button-row">
              <button class="btn btn-primary" (click)="saveCommand()" [disabled]="!formCommand.name">
                <mat-icon>save</mat-icon>
                {{ formCommand.id ? 'Update Command' : 'Create Command' }}
              </button>
              <button class="btn btn-secondary" (click)="clearForm()">
                <mat-icon>refresh</mat-icon>
                Clear Form
              </button>
            </div>
            
            <div *ngIf="statusMessage" class="status-message" [ngClass]="getStatusClass()">
              <mat-icon>{{ statusMessage.includes('Error') ? 'error' : 'check_circle' }}</mat-icon>
              {{ statusMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .commands-container {
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
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid #3a3a3a;
      background: #2a2a2a;
      color: #b0b0b0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .icon-btn:hover {
      background: #3a3a3a;
      color: #ffffff;
    }
    
    .icon-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .icon-btn.add-btn:hover {
      background: #0277bd;
      border-color: #29b6f6;
      color: #ffffff;
    }
    
    .list-item .icon-btn.delete-btn {
      margin-left: auto;
      opacity: 0.6;
    }
    
    .list-item .icon-btn.delete-btn:hover {
      background: #c62828;
      border-color: #f44336;
      color: #ffffff;
      opacity: 1;
    }
    
    .icon-btn.delete-btn:hover {
      background: #c62828;
      border-color: #f44336;
      color: #ffffff;
    }
    
    .icon-btn.search-btn:hover {
      background: #0277bd;
      border-color: #29b6f6;
      color: #ffffff;
    }
    
    .icon-btn.clear-btn:hover {
      background: #1565c0;
      border-color: #1976d2;
      color: #ffffff;
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
    
    .command-list {
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
      background: linear-gradient(135deg, #0277bd 0%, #29b6f6 100%);
      border-color: #29b6f6;
    }
    
    .command-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .list-item.selected .command-avatar {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .command-avatar mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #4fc3f7;
    }
    
    .list-item.selected .command-avatar mat-icon {
      color: #ffffff;
    }
    
    .command-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .command-name {
      color: #e0e0e0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-item.selected .command-name {
      color: #ffffff;
    }
    
    .command-namespace {
      font-size: 0.8rem;
      color: #888;
    }
    
    .list-item.selected .command-namespace {
      color: rgba(255, 255, 255, 0.7);
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
    
    .right-panel .panel-header {
      padding: 20px 24px;
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
    
    .command-field {
      margin-bottom: 8px;
    }
    
    .prompt-field-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
      margin-top: 8px;
    }

    ::ng-deep .prompt-field-container .mat-form-field {
      cursor: pointer;
      pointer-events: auto;
    }

    ::ng-deep .prompt-field-container .mat-form-field:hover {
      opacity: 0.9;
    }

    ::ng-deep .prompt-field-container .mat-form-field .mat-mdc-text-field-wrapper {
      height: 54px !important;
    }

    ::ng-deep .prompt-field-container .mat-form-field input {
      height: 20px !important;
    }

    .prompt-field-container:hover {
      opacity: 0.9;
    }
    
    .prompt-field-container .command-field {
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
      background: linear-gradient(135deg, #0277bd 0%, #29b6f6 100%);
      color: #ffffff;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #29b6f6 0%, #4fc3f7 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(41, 182, 246, 0.3);
    }
    
    .btn-primary:disabled {
      background: #3a3a3a;
      color: #666;
      cursor: not-allowed;
    }
    
    .btn-secondary {
      background: #2a2a2a;
      color: #b0b0b0;
      border: 1px solid #3a3a3a;
    }
    
    .btn-secondary:hover {
      background: #3a3a3a;
      color: #ffffff;
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
      background: rgba(76, 175, 80, 0.15);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }
    
    .status-message.error {
      background: rgba(244, 67, 54, 0.15);
      color: #e57373;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }
    
    .status-message.info {
      background: rgba(41, 182, 246, 0.15);
      color: #4fc3f7;
      border: 1px solid rgba(41, 182, 246, 0.3);
    }
  `]

})

/**
 * Tela de gerenciamento de comandos customizados.
 * Permite visualizar, criar e editar comandos do sistema.
 *
 * @author Seu Nome
 * @since 2024
 * @component
 * @description Componente de tela para operações com comandos customizados.
 */
export class CommandsComponent implements OnInit {
  fromHome = false;
  commands: Command[] = [];
  selectedCommand: Command | null = null;
  namespaces: string[] = [];
  filteredNamespaces: string[] = [];
  filteredSearchNamespaces: string[] = [];
  formCommand: Command = this.getEmptyCommand();
  searchTerm = '';
  searchNamespace = '';
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  statusMessage = '';
  leftPanelCollapsed = false;

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

  /**
   * Navega para a tela do menu principal.
   */
  goHome() {
    this.router.navigate(['/menu'])
  }

  /**
   * Alterna a visibilidade do painel lateral esquerdo.
   */
  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  /**
   * Retorna um objeto Command vazio com valores padrão.
   * @returns Objeto Command com propriedades vazias
   */
  private getEmptyCommand(): Command {
    return {
      name: '',
      namespace: this.namespaces.length > 0 ? this.namespaces[0] : '',
      description: '',
      command: '',
      scope: 'global',
      path: ''
    };
  }

  /**
   * Carrega a lista de namespaces de comandos disponíveis.
   */
  loadNamespaces(): void {
    this.apiService.getCommandNamespaces().subscribe({
      next: (namespaces) => {
        this.namespaces = namespaces;
        this.filteredNamespaces = [...this.namespaces];
        this.filteredSearchNamespaces = [...this.namespaces];
        if (this.namespaces.length > 0 && !this.formCommand.namespace) {
          this.formCommand.namespace = this.namespaces[0];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading namespaces:', err);
      }
    });
  }

  /**
   * Filtra namespaces disponíveis no autocomplete de namespace do formulário.
   * @param value - Valor digitado pelo usuário
   */
  onNamespaceChange(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredNamespaces = this.namespaces.filter(ns => 
      ns.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredNamespaces.includes(value)) {
      this.filteredNamespaces = [value, ...this.filteredNamespaces];
    }
  }

  /**
   * Filtra namespaces disponíveis no autocomplete de busca.
   * @param value - Valor digitado pelo usuário
   */
  onSearchNamespaceChange(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredSearchNamespaces = this.namespaces.filter(ns => 
      ns.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredSearchNamespaces.includes(value)) {
      this.filteredSearchNamespaces = [value, ...this.filteredSearchNamespaces];
    }
  }

  /**
   * Inicializa o componente carregando namespaces e lista de comandos.
   */
  ngOnInit(): void {
    console.log('CommandsComponent ngOnInit');
    this.loadNamespaces();
    this.loadCommands();
  }

  /**
   * Carrega a lista de comandos do backend com paginação.
   */
  loadCommands(): void {
    console.log('Loading commands...');
    this.loading = true;
    console.log('Calling API...');
    this.apiService.getCommands(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('API response:', response);
          if (response && Array.isArray(response.commands)) {
            this.commands = response.commands;
          } else if (Array.isArray(response)) {
            this.commands = response;
          } else {
            this.commands = [];
          }
          console.log('Commands set:', this.commands);
          this.totalElements = response?.totalElements ?? this.commands.length;
          this.totalPages = response?.totalPages ?? 1;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loading set to false');
          if (this.commands.length > 0 && !this.selectedCommand) {
            this.selectCommand(this.commands[0]);
          }
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API error:', err);
          this.statusMessage = 'Error loading commands: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  /**
   * Busca comandos por nome e/ou namespace.
   */
  search(): void {
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.currentPage = 0;
      this.loading = true;
      this.apiService.searchCommands(this.searchTerm, this.searchNamespace, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (response && Array.isArray(response.commands)) {
              this.commands = response.commands;
            } else if (Array.isArray(response)) {
              this.commands = response;
            } else {
              this.commands = [];
            }
            this.totalElements = response?.totalElements ?? this.commands.length;
            this.totalPages = response?.totalPages ?? 1;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching commands: ' + err.message;
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
   * Limpa os filtros de busca e recarrega a lista completa de comandos.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchNamespace = '';
    this.currentPage = 0;
    this.loadCommands();
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
      this.loadCommands();
    }
  }

  /**
   * Seleciona um comando da lista e preenche o formulário com seus dados.
   * @param command - Comando selecionado
   */
  selectCommand(command: Command): void {
    this.cdr.markForCheck();
    this.selectedCommand = { ...command };
    this.formCommand = { ...command };
    this.statusMessage = `Command selected: ${command.name}`;
  }

  /**
   * Salva (cria ou atualiza) um comando no backend.
   */
  saveCommand(): void {
    if (!this.formCommand.name) {
      this.statusMessage = 'Error: Name is required';
      return;
    }

    if (this.formCommand.id) {
      this.apiService.updateCommand(this.formCommand.id, this.formCommand).subscribe({
        next: (updated) => {
          this.ngZone.run(() => {
            this.statusMessage = `Command '${updated.name}' updated successfully`;
            this.selectedCommand = { ...updated };
            this.cdr.detectChanges();
            setTimeout(() => this.loadCommands(), 0);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error: ' + err.message;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.currentPage = 0;
      this.apiService.createCommand(this.formCommand).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.statusMessage = `Command '${created.name}' created successfully`;
            this.selectedCommand = { ...created };
            this.formCommand = { ...created };
            this.cdr.detectChanges();
            setTimeout(() => this.loadCommands(), 0);
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
  }

  /**
   * Exclui o comando atualmente selecionado.
   */
  deleteCommand(): void {
    if (!this.selectedCommand?.id) {
      this.statusMessage = 'No command selected to delete';
      return;
    }
    const id = this.selectedCommand.id;
    const name = this.selectedCommand.name;
    this.apiService.deleteCommand(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = `Command '${name}' deleted successfully`;
          this.selectedCommand = null;
          this.cdr.detectChanges();
          setTimeout(() => this.loadCommands(), 0);
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
   * Exclui um comando da lista (modo inline com confirmação).
   * @param command - Comando a ser excluído
   * @param event - Evento do clique para stopPropagation
   */
  deleteCommandInline(command: Command, event: Event): void {
    event.stopPropagation();
    
    if (!command.id) {
      return;
    }

    const commandName = command.name;
    const commandId = command.id;
    
    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Deseja realmente excluir o comando "${commandName}"?`,
        showConfirm: true,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deleteCommand(commandId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Comando "${commandName}" excluído com sucesso!`
                }
              }).afterClosed().subscribe(() => {
                setTimeout(() => {
                  if (this.selectedCommand?.id === commandId) {
                    this.clearForm();
                  }
                  this.loadCommands();
                }, 0);
              });
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: 'Falha ao excluir comando. Tente novamente.'
                }
              });
            });
          }
        });
      }
    });
  }

  /**
   * Limpa o formulário, resetando para um novo comando vazio.
   */
  clearForm(): void {
    this.selectedCommand = null;
    this.formCommand = this.getEmptyCommand();
    this.statusMessage = 'Form cleared - ready for new command';
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
   * Gera uma prévia do comando com até 15 palavras.
   * @param prompt - Texto completo do comando
   * @returns Preview truncado
   */
  getPromptPreview(prompt: string | undefined): string {
    if (!prompt) return '';
    const words = prompt.trim().split(/\s+/);
    const preview = words.slice(0, 15).join(' ');
    return words.length > 15 ? preview + '...' : preview;
  }

  /**
   * Abre o editor de comando em um modal para edição do comando.
   */
  openCommandEditor(): void {
    const dialogRef = this.dialog.open(PromptEditorModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      data: {
        prompt: this.formCommand.command,
        type: 'commands',
        title: 'Edit Command'
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.prompt !== undefined) {
        this.formCommand.command = result.prompt;
      }
    });
  }

  /**
   * Abre o dialog para criar um novo projeto.
   */
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

  /**
   * Abre o dialog para selecionar e abrir um projeto existente.
   */
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

  /**
   * Fecha a janela atual do aplicativo.
   */
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
}