import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, Template } from '../../services/api.service';

export interface PromptEditorData {
  prompt: string;
  type: 'agents' | 'skills' | 'commands' | 'scripts';
  title?: string;
}

export interface PromptEditorResult {
  prompt: string;
}

@Component({
  selector: 'app-prompt-editor-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">edit_note</mat-icon>
        <h2 class="dialog-title">{{ data.title || 'Edit Prompt' }}</h2>
      </div>
      
      <div class="dialog-content">
        <div class="template-section">
          <mat-form-field class="template-select" appearance="outline">
            <mat-label>Template</mat-label>
            <mat-select [(ngModel)]="selectedTemplateId" (selectionChange)="onTemplateSelect()">
              <mat-option [value]="null">-- Select a template --</mat-option>
              <mat-option *ngFor="let template of templates" [value]="template.id">
                {{ template.name }}
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>description</mat-icon>
          </mat-form-field>
          
          <div *ngIf="loadingTemplates" class="loading-spinner">
            <mat-spinner diameter="24"></mat-spinner>
          </div>
        </div>
        
        <mat-form-field class="full-width prompt-field" appearance="outline">
          <mat-label>Prompt</mat-label>
          <textarea matInput 
                    [(ngModel)]="editedPrompt" 
                    rows="15" 
                    placeholder="Enter the prompt content"
                    (ngModelChange)="onPromptChange()"></textarea>
          <mat-icon matPrefix>code</mat-icon>
        </mat-form-field>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSave()" class="save-btn">
          <mat-icon>save</mat-icon>
          Save
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      flex-direction: column;
      min-width: 700px;
      max-width: 900px;
      min-height: 500px;
      max-height: 80vh;
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
      flex-shrink: 0;
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
      flex: 1;
      padding: 24px;
      min-height: 300px;
      max-height: 60vh;
      background: #1e1e1e;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    
    .template-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .template-select {
      flex: 1;
    }
    
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .full-width {
      width: 100%;
    }
    
    .prompt-field {
      flex: 1;
      min-height: 350px;
    }

    ::ng-deep .prompt-field .mat-mdc-text-field-wrapper {
      height: 100%;
    }

    ::ng-deep .prompt-field textarea {
      height: 300px !important;
    }
    
    mat-form-field {
      margin-bottom: 4px;
    }
    
    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mat-mdc-text-field-wrapper {
      background-color: #2a2a2a;
      border-radius: 8px;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
    }
    
    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-floating-label {
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
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
      border-radius: 0 0 12px 12px;
      margin: 0;
      flex-shrink: 0;
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
    
    .save-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }
    
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }
    
    .save-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }
    
    .save-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class PromptEditorModalComponent implements OnInit {
  editedPrompt = '';
  selectedTemplateId: number | null = null;
  templates: Template[] = [];
  loadingTemplates = false;

  constructor(
    public dialogRef: MatDialogRef<PromptEditorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptEditorData,
    private apiService: ApiService
  ) {
    this.editedPrompt = data.prompt || '';
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.apiService.getTemplatesByType(this.data.type).subscribe({
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

  onTemplateSelect(): void {
    if (this.selectedTemplateId) {
      const template = this.templates.find(t => t.id === this.selectedTemplateId);
      if (template && template.template) {
        if (this.editedPrompt) {
          this.editedPrompt = this.editedPrompt + '\n\n' + template.template;
        } else {
          this.editedPrompt = template.template;
        }
        this.selectedTemplateId = null;
      }
    }
  }

  onPromptChange(): void {
  }

  onCancel(): void {
    this.dialogRef.close({ prompt: this.data.prompt });
  }

  onSave(): void {
    this.dialogRef.close({ prompt: this.editedPrompt });
  }
}