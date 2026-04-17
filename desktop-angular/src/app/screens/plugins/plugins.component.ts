/**
 * Componente para gerenciamento de Plugins.
 * Permite criar, editar, listar, buscar e excluir plugins do sistema.
 * 
 * @Component PluginsComponent
 * selector: app-plugins
 */
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
import { ApiService, Plugin, PluginFile, Project, Template } from '../../services/api.service';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { AddPluginFileDialogComponent, PluginFileData } from '../../components/add-plugin-file-dialog/add-plugin-file-dialog.component';
import { PromptEditorModalComponent } from '../../components/prompt-editor-modal/prompt-editor-modal.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import { ProjectContextService } from '../../services/project-context.service';

@Component({
  selector: 'app-plugins',
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
    <div class="plugins-container">
      <app-menu-bar></app-menu-bar>
      
      <div class="content" [class.left-collapsed]="leftPanelCollapsed">
        <div class="left-panel" [class.collapsed]="leftPanelCollapsed">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>extension</mat-icon>
              <span>Plugins</span>
            </div>
            <button class="icon-btn add-btn" (click)="clearForm()" title="Add new plugin">
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
            <span>Loading plugins...</span>
          </div>
          
          <div class="plugin-list">
            <div class="list-item" *ngFor="let plugin of plugins" 
                 [class.selected]="plugin === selectedPlugin"
                 (click)="selectPlugin(plugin)">
              <div class="plugin-avatar">
                <mat-icon>extension</mat-icon>
              </div>
              <div class="plugin-info">
                <span class="plugin-name">{{ plugin.name }}</span>
                <span class="plugin-namespace">{{ plugin.namespace }}</span>
              </div>
              <button class="icon-btn delete-btn" (click)="deletePluginInline(plugin, $event)" title="Delete plugin">
                <mat-icon>delete</mat-icon>
              </button>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
            <div *ngIf="plugins.length === 0 && !loading" class="empty-state">
              <mat-icon>extension</mat-icon>
              <span>No plugins found</span>
              <small>Create your first plugin</small>
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
              <span>Plugin Details</span>
            </div>
            <div class="header-actions" *ngIf="selectedPlugin">
              <button class="icon-btn clear-btn" (click)="clearForm()" title="Clear form">
                <mat-icon>refresh</mat-icon>
              </button>
              <button class="icon-btn delete-btn" (click)="deletePlugin()" title="Delete plugin">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="form-container">
            <div class="form-row">
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="formPlugin.name" placeholder="Enter plugin name">
                <mat-icon matPrefix>badge</mat-icon>
              </mat-form-field>
              
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Namespace</mat-label>
                <input matInput 
                       [(ngModel)]="formPlugin.namespace" 
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
                <input matInput [(ngModel)]="formPlugin.path" placeholder="Enter path">
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>
            </div>
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="formPlugin.description" rows="3" placeholder="Describe this plugin's purpose"></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Template</mat-label>
              <mat-select (selectionChange)="onTemplateSelect($event)">
                <mat-option [value]="null">-- Select a template --</mat-option>
                <mat-option *ngFor="let template of templates" [value]="template.id">
                  {{ template.name }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Instructions</mat-label>
              <textarea matInput [(ngModel)]="formPlugin.instructions" rows="10" placeholder="Enter the instructions content"></textarea>
              <mat-icon matPrefix>code</mat-icon>
            </mat-form-field>
            
            <div class="files-section">
              <div class="section-header">
                <mat-icon>attach_file</mat-icon>
                <span>Files</span>
                <button mat-stroked-button class="add-file-btn" (click)="openAddFileDialog()">
                  <mat-icon>add</mat-icon>
                  Add File
                </button>
              </div>
              
              <div class="files-table" *ngIf="formPluginFiles.length > 0">
                <div class="file-row header">
                  <span class="file-path">Path</span>
                  <span class="file-name">File Name</span>
                  <span class="file-actions">Actions</span>
                </div>
                <div class="file-row" *ngFor="let file of formPluginFiles; let i = index">
                  <span class="file-path">{{ file.path }}</span>
                  <span class="file-name">{{ file.fileName }}</span>
                  <button mat-icon-button class="delete-btn" (click)="removeFile(i)" title="Remove file">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="no-files" *ngIf="formPluginFiles.length === 0">
                <mat-icon>folder_open</mat-icon>
                <span>No files added yet. Click "Add File" to upload reference files.</span>
              </div>
            </div>
            
            <div *ngIf="statusMessage" class="status-message" [ngClass]="getStatusClass()">
              <mat-icon>{{ statusMessage.includes('Error') ? 'error' : 'check_circle' }}</mat-icon>
              {{ statusMessage }}
            </div>
            <div class="button-row">
              <button class="btn btn-primary" (click)="savePlugin()" [disabled]="!formPlugin.name">
                <mat-icon>save</mat-icon>
                {{ formPlugin.id ? 'Update Plugin' : 'Create Plugin' }}
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
    .plugins-container {
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
      color: #ce93d8;
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
      background: #7b1fa2;
      border-color: #9c27b0;
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
      background: #7b1fa2;
      border-color: #9c27b0;
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
      border-color: #ce93d8;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: #888;
    }
    
    .plugin-list {
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
      background: linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%);
      border-color: #9c27b0;
    }
    
    .plugin-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .list-item.selected .plugin-avatar {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .plugin-avatar mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #ce93d8;
    }
    
    .list-item.selected .plugin-avatar mat-icon {
      color: #ffffff;
    }
    
    .plugin-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .plugin-name {
      color: #e0e0e0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-item.selected .plugin-name {
      color: #ffffff;
    }
    
    .plugin-namespace {
      font-size: 0.8rem;
      color: #888;
    }
    
    .list-item.selected .plugin-namespace {
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
    
    .prompt-field-container .instructions-field {
      flex: 1;
    }
    
    .prompt-edit-btn {
      color: #ce93d8;
      flex-shrink: 0;
      margin-top: 8px;
      cursor: pointer;
      pointer-events: auto;
    }

    .prompt-edit-btn:hover {
      background: rgba(206, 147, 216, 0.1);
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
      border-color: #ce93d8 !important;
    }
    
    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .mat-focused .mdc-floating-label {
      color: #ce93d8 !important;
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
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
      color: #ffffff;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #ba68c8 0%, #9c27b0 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
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
/**
 * Tela de gerenciamento de plugins.
 * Permite visualizar, adicionar e remover plugins do sistema.
 *
 * @author Seu Nome
 * @since 2024
 * @component
 * @description Componente de tela para operações com plugins.
 */
export class PluginsComponent implements OnInit {
  fromHome = false;
  plugins: Plugin[] = [];
  selectedPlugin: Plugin | null = null;
  namespaces: string[] = [];
  filteredNamespaces: string[] = [];
  filteredSearchNamespaces: string[] = [];
  formPlugin: Plugin = this.getEmptyPlugin();
  formPluginFiles: PluginFile[] = [];
  originalPluginFiles: PluginFile[] = [];
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

  /**
   * Navega para a tela inicial (menu).
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
   * Retorna um objeto Plugin vazio para o formulário.
   * @returns Objeto Plugin com valores padrão
   */
  private getEmptyPlugin(): Plugin {
    return {
      name: '',
      namespace: this.namespaces.length > 0 ? this.namespaces[0] : '',
      description: '',
      instructions: '',
      path: ''
    };
  }

  /**
   * Carrega a lista de namespaces disponíveis para plugins.
   */
  loadNamespaces(): void {
    this.apiService.getPluginNamespaces().subscribe({
      next: (namespaces) => {
        this.namespaces = namespaces;
        this.filteredNamespaces = [...this.namespaces];
        this.filteredSearchNamespaces = [...this.namespaces];
        if (this.namespaces.length > 0 && !this.formPlugin.namespace) {
          this.formPlugin.namespace = this.namespaces[0];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading namespaces:', err);
      }
    });
  }

  /**
   * Filtra os namespaces disponíveis com base no valor digitado.
   * @param value - Valor digitado para filtrar namespaces
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
   * Filtra os namespaces para o campo de busca.
   * @param value - Valor digitado para filtrar namespaces
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
   * Abre o diálogo para adicionar arquivo ao plugin.
   */
  openAddFileDialog(): void {
    const dialogRef = this.dialog.open(AddPluginFileDialogComponent, {
      width: '500px',
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result: PluginFileData) => {
      this.ngZone.run(() => {
        if (result) {
          const newFile: PluginFile = {
            path: result.path,
            fileName: result.fileName,
            content: result.content
          };
          this.formPluginFiles.push(newFile);
          this.cdr.detectChanges();
        }
      });
    });
  }

  /**
   * Remove um arquivo da lista de arquivos.
   * @param index - Índice do arquivo a remover
   */
  removeFile(index: number): void {
    const fileToRemove = this.formPluginFiles[index];
    this.ngZone.run(() => {
      this.formPluginFiles.splice(index, 1);
      this.cdr.detectChanges();
    });
    if (fileToRemove?.id) {
      this.apiService.deletePluginFile(fileToRemove.id).subscribe({
        next: () => console.log('File deleted from backend:', fileToRemove.id),
        error: (err) => console.error('Error deleting file:', err)
      });
    }
  }

  /**
   * Inicializa o componente carregando namespaces e plugins.
   */
  ngOnInit(): void {
    console.log('PluginsComponent ngOnInit');
    this.loadNamespaces();
    this.loadPlugins();
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.apiService.getTemplatesByType('plugins').subscribe({
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
        if (this.formPlugin.instructions) {
          this.formPlugin.instructions = this.formPlugin.instructions + '\n\n' + template.template;
        } else {
          this.formPlugin.instructions = template.template;
        }
      }
    }
  }

  /**
   * Carrega a lista de plugins do servidor.
   */
  loadPlugins(): void {
    console.log('Loading plugins...');
    this.loading = true;
    console.log('Calling API...');
    this.apiService.getPlugins(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('API response:', response);
          if (response && Array.isArray(response.plugins)) {
            this.plugins = response.plugins;
          } else if (Array.isArray(response)) {
            this.plugins = response;
          } else {
            this.plugins = [];
          }
          console.log('Plugins set:', this.plugins);
          this.totalElements = response?.totalElements ?? this.plugins.length;
          this.totalPages = response?.totalPages ?? 1;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loading set to false');
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API error:', err);
          this.statusMessage = 'Error loading plugins: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  /**
   * Busca plugins pelo termo e namespace.
   */
  search(): void {
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.currentPage = 0;
      this.loading = true;
      this.apiService.searchPlugins(this.searchTerm, this.searchNamespace, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (response && Array.isArray(response.plugins)) {
              this.plugins = response.plugins;
            } else if (Array.isArray(response)) {
              this.plugins = response;
            } else {
              this.plugins = [];
            }
            this.totalElements = response?.totalElements ?? this.plugins.length;
            this.totalPages = response?.totalPages ?? 1;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching plugins: ' + err.message;
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
   * Limpa filtros de busca e recarrega lista.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchNamespace = '';
    this.currentPage = 0;
    this.loadPlugins();
  }

  /**
   * Trata mudança de página.
   * @param event - Evento de paginação
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchTerm.trim() || this.searchNamespace.trim()) {
      this.search();
    } else {
      this.loadPlugins();
    }
  }

  /**
   * Seleciona plugin e carrega no formulário.
   * @param plugin - Plugin a selecionar
   */
  selectPlugin(plugin: Plugin): void {
    this.cdr.markForCheck();
    this.selectedPlugin = { ...plugin };
    this.formPlugin = { ...plugin };
    this.formPluginFiles = [];
    this.originalPluginFiles = [];
    if (plugin.id) {
      console.log('Loading files for plugin:', plugin.id);
      this.apiService.getPluginFiles(plugin.id).subscribe({
        next: (files) => {
          console.log('Loaded files:', files);
          this.ngZone.run(() => {
            this.formPluginFiles = files;
            this.originalPluginFiles = files;
            this.cdr.detectChanges();
          });
        },
        error: (err) => console.error('Error loading plugin files:', err)
      });
    }
    this.statusMessage = `Plugin selected: ${plugin.name}`;
  }

  /**
   * Salva o plugin (cria ou atualiza).
   */
  savePlugin(): void {
    if (!this.formPlugin.name) {
      this.statusMessage = 'Error: Name is required';
      return;
    }

    const syncPluginFiles = (pluginId: number, isNew: boolean) => {
      const currentIds = this.formPluginFiles.filter(f => f.id).map(f => f.id);
      
      const filesToDelete = this.originalPluginFiles.filter(f => f.id && !currentIds.includes(f.id));
      const filesToAdd = this.formPluginFiles.filter(f => !f.id);

      console.log('Sync files - Original:', this.originalPluginFiles);
      console.log('Sync files - Current:', this.formPluginFiles);
      console.log('Sync files - To delete:', filesToDelete);
      console.log('Sync files - To add:', filesToAdd);

      const deletePromises = filesToDelete.map(file => 
        new Promise<void>((resolve) => {
          if (file.id) {
            console.log('Deleting file:', file.id, file.fileName);
            this.apiService.deletePluginFile(file.id).subscribe({
              next: () => { console.log('Deleted file:', file.id); resolve(); },
              error: (err) => { console.error('Error deleting file:', err); resolve(); }
            });
          } else {
            resolve();
          }
        })
      );

      const addPromises = filesToAdd.map(file => 
        new Promise<void>((resolve) => {
          this.apiService.addPluginFile(pluginId, file.path, file.fileName, file.content).subscribe({
            next: () => resolve(),
            error: () => resolve()
          });
        })
      );

      Promise.all([...deletePromises, ...addPromises]).then(() => {
        this.originalPluginFiles = [];
        if (isNew) {
          this.formPluginFiles = [];
          this.loadPlugins();
        } else {
          loadPluginFiles(pluginId);
        }
      });
    };

    const loadPluginFiles = (pluginId: number) => {
      this.apiService.getPluginFiles(pluginId).subscribe({
        next: (files) => {
          this.ngZone.run(() => {
            this.formPluginFiles = files;
            this.originalPluginFiles = files;
            this.cdr.detectChanges();
          });
        },
        error: (err) => console.error('Error reloading plugin files:', err)
      });
    };

    if (this.formPlugin.id) {
      this.apiService.updatePlugin(this.formPlugin.id, this.formPlugin).subscribe({
        next: (updated) => {
          this.ngZone.run(() => {
            this.statusMessage = `Plugin '${updated.name}' updated successfully`;
            this.selectedPlugin = { ...updated };
            syncPluginFiles(updated.id!, false);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error: ' + err.message;
          });
        }
      });
    } else {
      this.apiService.createPlugin(this.formPlugin).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.statusMessage = `Plugin '${created.name}' created successfully`;
            this.selectedPlugin = { ...created };
            this.formPlugin = { ...created };
            if (created.id) {
              syncPluginFiles(created.id, true);
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

  /**
   * Exclui o plugin selecionado.
   */
  deletePlugin(): void {
    if (!this.selectedPlugin?.id) {
      this.statusMessage = 'No plugin selected to delete';
      return;
    }
    const id = this.selectedPlugin.id;
    const name = this.selectedPlugin.name;
    this.apiService.deletePlugin(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = `Plugin '${name}' deleted successfully`;
          this.selectedPlugin = null;
          this.cdr.detectChanges();
          setTimeout(() => this.loadPlugins(), 0);
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
   * Exclui plugin da lista.
   * @param plugin - Plugin a excluir
   * @param event - Evento do clique
   */
  deletePluginInline(plugin: Plugin, event: Event): void {
    event.stopPropagation();
    
    if (!plugin.id) {
      return;
    }

    const pluginName = plugin.name;
    const pluginId = plugin.id;
    
    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Deseja realmente excluir o plugin "${pluginName}"?`,
        showConfirm: true,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deletePlugin(pluginId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: true,
                  message: `Plugin "${pluginName}" excluído com sucesso!`
                }
              }).afterClosed().subscribe(() => {
                setTimeout(() => {
                  if (this.selectedPlugin?.id === pluginId) {
                    this.clearForm();
                  }
                  this.loadPlugins();
                }, 0);
              });
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: {
                  success: false,
                  message: err.error?.message || err.message || 'Falha ao excluir plugin. Tente novamente.'
                }
              });
            });
          }
        });
      }
    });
  }

  /**
   * Limpa o formulário.
   */
  clearForm(): void {
    this.selectedPlugin = null;
    this.formPlugin = this.getEmptyPlugin();
    this.formPluginFiles = [];
    this.originalPluginFiles = [];
    this.statusMessage = 'Form cleared - ready for new plugin';
  }

  /**
   * Retorna classe CSS do status.
   * @returns Classe CSS based message type
   */
  getStatusClass(): string {
    if (!this.statusMessage) return '';
    if (this.statusMessage.includes('Error')) return 'error';
    if (this.statusMessage.includes('success') || this.statusMessage.includes('updated') || this.statusMessage.includes('created') || this.statusMessage.includes('deleted')) return 'success';
    return 'info';
  }

  /**
   * Gera preview das instruções.
   * @param prompt - Conteúdo das instruções
   * @returns Preview truncado
   */
  getPromptPreview(prompt: string | undefined): string {
    if (!prompt) return '';
    const words = prompt.trim().split(/\s+/);
    const preview = words.slice(0, 15).join(' ');
    return words.length > 15 ? preview + '...' : preview;
  }

  /**
   * Abre editor modal de instruções.
   */
  openInstructionsEditor(): void {
    const dialogRef = this.dialog.open(PromptEditorModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      data: {
        prompt: this.formPlugin.instructions,
        type: 'plugins',
        title: 'Edit Plugin Instructions'
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.prompt !== undefined) {
        this.formPlugin.instructions = result.prompt;
      }
    });
  }
}