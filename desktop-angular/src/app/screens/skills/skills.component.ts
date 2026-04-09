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
import { ApiService, Skill, SkillFile, Project } from '../../services/api.service';
import { NewProjectDialogComponent } from '../../components/new-project-dialog/new-project-dialog.component';
import { OpenProjectDialogComponent } from '../../components/open-project-dialog/open-project-dialog.component';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { AddSkillFileDialogComponent, SkillFileData } from '../../components/add-skill-file-dialog/add-skill-file-dialog.component';
import { PromptEditorModalComponent } from '../../components/prompt-editor-modal/prompt-editor-modal.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';

@Component({
  selector: 'app-skills',
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
    <div class="skills-container">
      <app-menu-bar></app-menu-bar>
      
      <div class="content" [class.left-collapsed]="leftPanelCollapsed">
        <div class="left-panel" [class.collapsed]="leftPanelCollapsed">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>psychology</mat-icon>
              <span>Skills</span>
            </div>
            <button class="icon-btn add-btn" (click)="clearForm()" title="Add new skill">
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
            <span>Loading skills...</span>
          </div>
          
          <div class="skill-list">
            <div class="list-item" *ngFor="let skill of skills" 
                 [class.selected]="skill === selectedSkill"
                 (click)="selectSkill(skill)">
              <div class="skill-avatar">
                <mat-icon>lightbulb</mat-icon>
              </div>
              <div class="skill-info">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-namespace">{{ skill.namespace }}</span>
              </div>
              <button class="icon-btn delete-btn" (click)="deleteSkillInline(skill, $event)" title="Delete skill">
                <mat-icon>delete</mat-icon>
              </button>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
            <div *ngIf="skills.length === 0 && !loading" class="empty-state">
              <mat-icon>psychology_alt</mat-icon>
              <span>No skills found</span>
              <small>Create your first skill</small>
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
              <span>Skill Details</span>
            </div>
            <div class="header-actions" *ngIf="selectedSkill">
              <button class="icon-btn clear-btn" (click)="clearForm()" title="Clear form">
                <mat-icon>refresh</mat-icon>
              </button>
              <button class="icon-btn delete-btn" (click)="deleteSkill()" title="Delete skill">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="form-container">
            <div class="form-row">
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="formSkill.name" placeholder="Enter skill name">
                <mat-icon matPrefix>badge</mat-icon>
              </mat-form-field>
              
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Namespace</mat-label>
                <input matInput 
                       [(ngModel)]="formSkill.namespace" 
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
                <input matInput [(ngModel)]="formSkill.path" placeholder="Enter path">
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>
            </div>
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="formSkill.description" rows="3" placeholder="Describe this skill's purpose"></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
            
            <div class="prompt-field-container" (click)="openInstructionsEditor()">
              <mat-form-field class="full-width instructions-field" appearance="outline">
                <mat-label>Instructions</mat-label>
                <input matInput 
                       [value]="getPromptPreview(formSkill.instructions)" 
                       disabled
                       class="prompt-preview-input">
                <mat-icon matPrefix>code</mat-icon>
              </mat-form-field>
              <button mat-icon-button 
                      type="button"
                      class="prompt-edit-btn" 
                      title="Edit instructions">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
            
            <div class="files-section">
              <div class="section-header">
                <mat-icon>attach_file</mat-icon>
                <span>Files</span>
                <button mat-stroked-button class="add-file-btn" (click)="openAddFileDialog()">
                  <mat-icon>add</mat-icon>
                  Add File
                </button>
              </div>
              
              <div class="files-table" *ngIf="formSkillFiles.length > 0">
                <div class="file-row header">
                  <span class="file-path">Path</span>
                  <span class="file-name">File Name</span>
                  <span class="file-actions">Actions</span>
                </div>
                <div class="file-row" *ngFor="let file of formSkillFiles; let i = index">
                  <span class="file-path">{{ file.path }}</span>
                  <span class="file-name">{{ file.fileName }}</span>
                  <button mat-icon-button class="delete-btn" (click)="removeFile(i)" title="Remove file">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="no-files" *ngIf="formSkillFiles.length === 0">
                <mat-icon>folder_open</mat-icon>
                <span>No files added yet. Click "Add File" to upload reference files.</span>
              </div>
            </div>
            
            <div class="button-row">
              <button class="btn btn-primary" (click)="saveSkill()" [disabled]="!formSkill.name">
                <mat-icon>save</mat-icon>
                {{ formSkill.id ? 'Update Skill' : 'Create Skill' }}
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
    .skills-container {
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
      color: #ffb74d;
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
      background: #e65100;
      border-color: #ff9800;
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
      background: #e65100;
      border-color: #ff9800;
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
      border-color: #ffb74d;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: #888;
    }
    
    .skill-list {
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
      background: linear-gradient(135deg, #e65100 0%, #ff9800 100%);
      border-color: #ff9800;
    }
    
    .skill-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .list-item.selected .skill-avatar {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .skill-avatar mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #ffb74d;
    }
    
    .list-item.selected .skill-avatar mat-icon {
      color: #ffffff;
    }
    
    .skill-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .skill-name {
      color: #e0e0e0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-item.selected .skill-name {
      color: #ffffff;
    }
    
    .skill-namespace {
      font-size: 0.8rem;
      color: #888;
    }
    
    .list-item.selected .skill-namespace {
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
    
    .instructions-field {
      margin-bottom: 8px;
    }
    
    .prompt-field-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
    }
    
    .prompt-field-container:hover {
      opacity: 0.9;
    }
    
    .prompt-field-container .instructions-field {
      flex: 1;
    }
    
    .prompt-edit-btn {
      color: #ffb74d;
      flex-shrink: 0;
      margin-top: 8px;
      cursor: pointer;
    }
    
    .prompt-edit-btn:hover {
      background: rgba(255, 183, 77, 0.1);
    }
    
    .files-section {
      margin-bottom: 16px;
      background: #1a1a1a;
      border-radius: 8px;
      border: 1px solid #2a2a2a;
      padding: 16px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #e0e0e0;
    }
    
    .section-header mat-icon {
      color: #4fc3f7;
    }
    
    .section-header span {
      font-weight: 500;
      flex: 1;
    }
    
    .add-file-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #4fc3f7 !important;
      border-color: #4fc3f7 !important;
    }
    
    .add-file-btn:hover {
      background: rgba(79, 195, 247, 0.1);
    }
    
    .files-table {
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .file-row {
      display: grid;
      grid-template-columns: 2fr 1fr 50px;
      gap: 8px;
      padding: 10px 12px;
      align-items: center;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .file-row:last-child {
      border-bottom: none;
    }
    
    .file-row.header {
      background: #252525;
      font-weight: 500;
      color: #888;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    
    .file-path {
      color: #e0e0e0;
      font-family: monospace;
      font-size: 0.875rem;
    }
    
    .file-name {
      color: #4fc3f7;
      font-family: monospace;
      font-size: 0.875rem;
    }
    
    .file-row .delete-btn {
      color: #ef5350;
    }
    
    .file-row .delete-btn:hover {
      background: rgba(239, 83, 80, 0.1);
    }
    
    .no-files {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      color: #666;
      font-size: 0.875rem;
    }
    
    .no-files mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
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
      border-color: #ffb74d !important;
    }
    
    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .mat-focused .mdc-floating-label {
      color: #ffb74d !important;
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
      background: linear-gradient(135deg, #ff9800 0%, #e65100 100%);
      color: #ffffff;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #ffb74d 0%, #ff9800 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
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
      background: rgba(255, 152, 0, 0.15);
      color: #ffb74d;
      border: 1px solid rgba(255, 152, 0, 0.3);
    }
  `]

})

export class SkillsComponent implements OnInit {
  fromHome = false;
  skills: Skill[] = [];
  selectedSkill: Skill | null = null;
  namespaces: string[] = [];
  filteredNamespaces: string[] = [];
  filteredSearchNamespaces: string[] = [];
  formSkill: Skill = this.getEmptySkill();
  formSkillFiles: SkillFile[] = [];
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

  goHome() {
    this.router.navigate(['/menu'])
  }

  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  private getEmptySkill(): Skill {
    return {
      name: '',
      namespace: this.namespaces.length > 0 ? this.namespaces[0] : '',
      description: '',
      instructions: '',
      path: ''
    };
  }

  loadNamespaces(): void {
    this.apiService.getSkillNamespaces().subscribe({
      next: (namespaces) => {
        this.namespaces = namespaces;
        this.filteredNamespaces = [...this.namespaces];
        this.filteredSearchNamespaces = [...this.namespaces];
        if (this.namespaces.length > 0 && !this.formSkill.namespace) {
          this.formSkill.namespace = this.namespaces[0];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading namespaces:', err);
      }
    });
  }

  onNamespaceChange(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredNamespaces = this.namespaces.filter(ns => 
      ns.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredNamespaces.includes(value)) {
      this.filteredNamespaces = [value, ...this.filteredNamespaces];
    }
  }

  onSearchNamespaceChange(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredSearchNamespaces = this.namespaces.filter(ns => 
      ns.toLowerCase().startsWith(filterValue)
    );
    if (filterValue && !this.filteredSearchNamespaces.includes(value)) {
      this.filteredSearchNamespaces = [value, ...this.filteredSearchNamespaces];
    }
  }

  openAddFileDialog(): void {
    const dialogRef = this.dialog.open(AddSkillFileDialogComponent, {
      width: '500px',
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result: SkillFileData) => {
      this.ngZone.run(() => {
        if (result) {
          const newFile: SkillFile = {
            path: result.path,
            fileName: result.fileName,
            content: result.content
          };
          this.formSkillFiles.push(newFile);
          this.cdr.detectChanges();
        }
      });
    });
  }

  removeFile(index: number): void {
    this.ngZone.run(() => {
      this.formSkillFiles.splice(index, 1);
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    console.log('SkillsComponent ngOnInit');
    this.loadNamespaces();
    this.loadSkills();
  }

  loadSkills(): void {
    console.log('Loading skills...');
    this.loading = true;
    console.log('Calling API...');
    this.apiService.getSkills(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('API response:', response);
          // Backend returns { skills: [], currentPage, totalElements, totalPages }
          if (response && Array.isArray(response.skills)) {
            this.skills = response.skills;
          } else if (Array.isArray(response)) {
            this.skills = response;
          } else {
            this.skills = [];
          }
          console.log('Skills set:', this.skills);
          this.totalElements = response?.totalElements ?? this.skills.length;
          this.totalPages = response?.totalPages ?? 1;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loading set to false');
          if (this.skills.length > 0 && !this.selectedSkill) {
            this.selectSkill(this.skills[0]);
          }
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API error:', err);
          this.statusMessage = 'Error loading skills: ' + err.message;
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
      this.apiService.searchSkills(this.searchTerm, this.searchNamespace, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (response && Array.isArray(response.skills)) {
              this.skills = response.skills;
            } else if (Array.isArray(response)) {
              this.skills = response;
            } else {
              this.skills = [];
            }
            this.totalElements = response?.totalElements ?? this.skills.length;
            this.totalPages = response?.totalPages ?? 1;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching skills: ' + err.message;
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
    this.loadSkills();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.search();
    } else {
      this.loadSkills();
    }
  }

  selectSkill(skill: Skill): void {
    this.cdr.markForCheck();
    this.selectedSkill = { ...skill };
    this.formSkill = { ...skill };
    this.statusMessage = `Skill selected: ${skill.name}`;
  }

  saveSkill(): void {
    if (!this.formSkill.name) {
      this.statusMessage = 'Error: Name is required';
      return;
    }

    const saveFiles = (skillId: number) => {
      if (this.formSkillFiles.length > 0) {
        const filePromises = this.formSkillFiles.map(file => 
          new Promise<void>((resolve) => {
            this.apiService.addSkillFile(skillId, file.path, file.fileName, file.content).subscribe({
              next: () => resolve(),
              error: () => resolve()
            });
          })
        );
        Promise.all(filePromises).then(() => {
          this.formSkillFiles = [];
          setTimeout(() => this.loadSkills(), 0);
        });
      } else {
        setTimeout(() => this.loadSkills(), 0);
      }
    };

    if (this.formSkill.id) {
      // Update existing skill
      this.apiService.updateSkill(this.formSkill.id, this.formSkill).subscribe({
        next: (updated) => {
          this.ngZone.run(() => {
            this.statusMessage = `Skill '${updated.name}' updated successfully`;
            this.selectedSkill = { ...updated };
            saveFiles(updated.id!);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error: ' + err.message;
          });
        }
      });
    } else {
      // Create new skill
      this.apiService.createSkill(this.formSkill).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.statusMessage = `Skill '${created.name}' created successfully`;
            this.selectedSkill = { ...created };
            this.formSkill = { ...created };
            if (created.id) {
              saveFiles(created.id);
            }
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error: ' + err.message;
          });
        }
      });
    }
  }

  deleteSkill(): void {
    if (!this.selectedSkill?.id) {
      this.statusMessage = 'No skill selected to delete';
      return;
    }
    const id = this.selectedSkill.id;
    const name = this.selectedSkill.name;
    this.apiService.deleteSkill(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = `Skill '${name}' deleted successfully`;
          this.selectedSkill = null;
          this.cdr.detectChanges();
          setTimeout(() => this.loadSkills(), 0);
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

  deleteSkillInline(skill: Skill, event: Event): void {
    event.stopPropagation();
    
    if (!skill.id) {
      return;
    }

    const skillName = skill.name;
    const skillId = skill.id;
    
    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Deseja realmente excluir a skill "${skillName}"?`,
        showConfirm: true,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deleteSkill(skillId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Skill "${skillName}" excluída com sucesso!`
                }
              }).afterClosed().subscribe(() => {
                setTimeout(() => {
                  if (this.selectedSkill?.id === skillId) {
                    this.selectedSkill = null;
                  }
                  this.loadSkills();
                }, 0);
              });
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: 'Falha ao excluir skill. Tente novamente.'
                }
              });
            });
          }
        });
      }
    });
  }

  clearForm(): void {
    this.selectedSkill = null;
    this.formSkill = this.getEmptySkill();
    this.formSkillFiles = [];
    this.statusMessage = 'Form cleared - ready for new skill';
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

  openInstructionsEditor(): void {
    const dialogRef = this.dialog.open(PromptEditorModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      data: {
        prompt: this.formSkill.instructions,
        type: 'skills',
        title: 'Edit Skill Instructions'
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.prompt !== undefined) {
        this.formSkill.instructions = result.prompt;
      }
    });
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
          // Here you would typically load the project data or switch to project view
          // For now, just show a message
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
}
