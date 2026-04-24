import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { ApiService, Template } from '../../services/api.service';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatPaginatorModule,
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
    <div class="templates-container">
      <app-menu-bar></app-menu-bar>
      
      <div class="content" [class.left-collapsed]="leftPanelCollapsed">
        <div class="left-panel" [class.collapsed]="leftPanelCollapsed">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>description</mat-icon>
              <span>Templates - {{ getTypeLabel() }}</span>
            </div>
            <button class="icon-btn add-btn" (click)="clearForm()" title="Add new template">
              <mat-icon>add</mat-icon>
            </button>
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
              <mat-icon>list_alt</mat-icon>
              <span>Instructions</span>
            </button>
          </div>
          
          <div class="search-section">
            <mat-form-field class="search-field" appearance="outline">
              <mat-label>Search by name...</mat-label>
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
            <span>Loading templates...</span>
          </div>
          
          <div class="template-list">
            <div class="list-item" *ngFor="let template of templates" 
                 [class.selected]="template === selectedTemplate"
                 (click)="selectTemplate(template)">
              <div class="template-avatar">
                <mat-icon>description</mat-icon>
              </div>
              <div class="template-info">
                <span class="template-name">{{ template.name }}</span>
                <span class="template-description">{{ template.description || 'No description' }}</span>
              </div>
              <button class="icon-btn delete-btn" (click)="deleteTemplateInline(template, $event)" title="Delete template">
                <mat-icon>delete</mat-icon>
              </button>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
            <div *ngIf="templates.length === 0 && !loading" class="empty-state">
              <mat-icon>description</mat-icon>
              <span>No templates found</span>
              <small>Create your first template</small>
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
              <mat-icon>edit</mat-icon>
              <span>Template Details</span>
            </div>
            <div class="header-actions" *ngIf="selectedTemplate">
              <button class="icon-btn clear-btn" (click)="clearForm()" title="Clear form">
                <mat-icon>refresh</mat-icon>
              </button>
              <button class="icon-btn delete-btn" (click)="deleteTemplate()" title="Delete template">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="form-container">
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput [(ngModel)]="formTemplate.name" placeholder="Enter template name">
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="formTemplate.description" rows="3" placeholder="Describe this template"></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
            
            <mat-form-field class="full-width template-field" appearance="outline">
              <mat-label>Template</mat-label>
              <textarea matInput [(ngModel)]="formTemplate.template" rows="15" placeholder="Enter the template content"></textarea>
              <mat-icon matPrefix>code</mat-icon>
            </mat-form-field>
            
            <div class="button-row">
              <button class="btn btn-primary" (click)="saveTemplate()" [disabled]="!formTemplate.name || !formTemplate.template || !selectedType">
                <mat-icon>save</mat-icon>
                {{ formTemplate.id ? 'Update Template' : 'Create Template' }}
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
    .templates-container {
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
      background: #1565c0;
      border-color: #1976d2;
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
      background: #1565c0;
      border-color: #1976d2;
      color: #ffffff;
    }
    
    .icon-btn.clear-btn:hover {
      background: #1565c0;
      border-color: #1976d2;
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
    
    .template-list {
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
    
    .template-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .list-item.selected .template-avatar {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .template-avatar mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #4fc3f7;
    }
    
    .list-item.selected .template-avatar mat-icon {
      color: #ffffff;
    }
    
    .template-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .template-name {
      color: #e0e0e0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-item.selected .template-name {
      color: #ffffff;
    }
    
    .template-description {
      font-size: 0.8rem;
      color: #888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-item.selected .template-description {
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
    
    .form-field {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    
    .template-field {
      margin-bottom: 8px;
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
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: #ffffff;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
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
      background: rgba(33, 150, 243, 0.15);
      color: #64b5f6;
      border: 1px solid rgba(33, 150, 243, 0.3);
    }
  `]
})
export class TemplatesComponent implements OnInit {
  templates: Template[] = [];
  selectedTemplate: Template | null = null;
  formTemplate: Template = this.getEmptyTemplate();
  searchTerm = '';
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  statusMessage = '';
  leftPanelCollapsed = false;
  selectedType = 'agents';

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  private getEmptyTemplate(): Template {
    return {
      name: '',
      description: '',
      template: '',
      type: this.selectedType
    };
  }

  getTypeLabel(): string {
    const labels: { [key: string]: string } = {
      'agents': 'Agents',
      'scripts': 'Scripts',
      'instructions': 'Instructions'
    };
    return labels[this.selectedType] || 'Unknown';
  }

  selectType(type: string): void {
    this.selectedType = type;
    this.formTemplate.type = type;
    this.selectedTemplate = null;
    this.currentPage = 0;
    this.clearForm();
    this.loadTemplates();
  }

  ngOnInit(): void {
    console.log('TemplatesComponent ngOnInit');
    this.selectedType = 'agents';
    this.clearForm();
    this.loadTemplates();
  }

  loadTemplates(): void {
    console.log('Loading templates...');
    this.loading = true;
    this.apiService.getTemplates(this.selectedType, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('API response:', response);
          if (response && Array.isArray(response.templates)) {
            this.templates = response.templates;
          } else if (Array.isArray(response)) {
            this.templates = response;
          } else {
            this.templates = [];
          }
          this.totalElements = response?.totalElements ?? this.templates.length;
          this.totalPages = response?.totalPages ?? 1;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Templates set:', this.templates);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API error:', err);
          this.dialog.open(PipelineResultDialogComponent, {
            data: {
              success: false,
              message: 'Error loading templates: ' + err.message
            }
          });
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  search(): void {
    if (this.searchTerm.trim()) {
      this.currentPage = 0;
      this.loading = true;
      this.apiService.searchTemplates(this.selectedType, this.searchTerm, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (response && Array.isArray(response.templates)) {
              this.templates = response.templates;
            } else if (Array.isArray(response)) {
              this.templates = response;
            } else {
              this.templates = [];
            }
            this.totalElements = response?.totalElements ?? this.templates.length;
            this.totalPages = response?.totalPages ?? 1;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: {
                success: false,
                message: 'Error searching templates: ' + err.message
              }
            });
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
    this.currentPage = 0;
    this.loadTemplates();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchTerm.trim()) {
      this.search();
    } else {
      this.loadTemplates();
    }
  }

  selectTemplate(template: Template): void {
    this.cdr.markForCheck();
    this.selectedTemplate = { ...template };
    this.formTemplate = { ...template };
  }

  saveTemplate(): void {
    if (!this.formTemplate.name) {
      this.dialog.open(PipelineResultDialogComponent, {
        data: { success: false, message: 'Error: Name is required' }
      });
      return;
    }

    if (this.formTemplate.id) {
      this.apiService.updateTemplate(this.formTemplate.id, this.formTemplate).subscribe({
        next: (updated) => {
          this.ngZone.run(() => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: { success: true, message: `Template '${updated.name}' updated successfully` }
            });
            this.selectedTemplate = { ...updated };
            this.cdr.detectChanges();
            this.loadTemplates();
          });
        },
        error: (err) => {
          console.error('Update template error:', err);
          const errorMessage = err.error?.message || err.error?.error || err.message || 'Unknown error';
          this.ngZone.run(() => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: { success: false, message: 'Error updating template: ' + errorMessage }
            });
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      // Validate required fields
      if (!this.formTemplate.name.trim()) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: { success: false, message: 'Error: Template name is required' }
        });
        return;
      }
      if (!this.formTemplate.template || !this.formTemplate.template.trim()) {
        this.dialog.open(PipelineResultDialogComponent, {
          data: { success: false, message: 'Error: Template content is required' }
        });
        return;
      }

      // Create a clean template object without id for creation
      const templateToCreate: any = {
        name: this.formTemplate.name.trim(),
        template: this.formTemplate.template.trim(),
        type: this.formTemplate.type
      };
      
      // Only include description if it has content
      if (this.formTemplate.description && this.formTemplate.description.trim()) {
        templateToCreate.description = this.formTemplate.description.trim();
      }
      
      console.log('Creating template with data:', templateToCreate);
      this.apiService.createTemplate(templateToCreate).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: { success: true, message: `Template '${created.name}' created successfully` }
            });
            this.selectedTemplate = { ...created };
            this.formTemplate = { ...created };
            this.cdr.detectChanges();
            this.loadTemplates();
          });
        },
        error: (err) => {
          console.error('Create template error:', err);
          const errorMessage = err.error?.message || err.error?.error || err.message || 'Unknown error';
          this.ngZone.run(() => {
            this.dialog.open(PipelineResultDialogComponent, {
              data: { success: false, message: 'Error creating template: ' + errorMessage }
            });
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  deleteTemplate(): void {
    if (!this.selectedTemplate?.id) {
      this.dialog.open(PipelineResultDialogComponent, {
        data: { success: false, message: 'No template selected to delete' }
      });
      return;
    }
    const id = this.selectedTemplate.id;
    const name = this.selectedTemplate.name;
    this.apiService.deleteTemplate(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = `Template '${name}' deleted successfully`;
          this.selectedTemplate = null;
          this.clearForm();
          this.cdr.detectChanges();
          this.loadTemplates();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.dialog.open(PipelineResultDialogComponent, {
            data: { success: false, message: 'Error: ' + err.message }
          });
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteTemplateInline(template: Template, event: Event): void {
    event.stopPropagation();
    
    if (!template.id) {
      return;
    }

    const templateName = template.name;
    const templateId = template.id;
    
    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Do you really want to delete the template "${templateName}"?`,
        showConfirm: true,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deleteTemplate(templateId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.selectedTemplate = null;
              this.clearForm();
              this.loadTemplates();
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: 'Falha ao excluir template. Tente novamente.'
                }
              });
            });
          }
        });
      }
    });
  }

  clearForm(): void {
    this.selectedTemplate = null;
    this.formTemplate = this.getEmptyTemplate();
  }

  getStatusClass(): string {
    if (!this.statusMessage) return '';
    if (this.statusMessage.includes('Error')) return 'error';
    if (this.statusMessage.includes('success') || this.statusMessage.includes('updated') || this.statusMessage.includes('created') || this.statusMessage.includes('deleted')) return 'success';
    return 'info';
  }
}
