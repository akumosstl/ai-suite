import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface EditFileDialogData {
  fileName: string;
  path: string;
  content: string;
  type: 'skill' | 'tool' | 'instruction' | 'plugin';
}

export interface EditFileDialogResult {
  content: string;
}

@Component({
  selector: 'app-edit-file-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="modal-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">edit_document</mat-icon>
        <h2 class="dialog-title">Edit File: {{ data.fileName }}</h2>
      </div>
      
      <div class="dialog-content">
        <div class="file-info">
          <mat-icon>folder</mat-icon>
          <span class="file-path">{{ data.path }}/{{ data.fileName }}</span>
        </div>
        
        <mat-form-field class="full-width content-field" appearance="outline">
          <mat-label>File Content</mat-label>
          <textarea matInput 
                    [(ngModel)]="editedContent" 
                    rows="20" 
                    placeholder="Enter the file content"></textarea>
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
      min-width: 600px;
      max-width: 900px;
      min-height: 520px;
      max-height: 90vh;
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
      color: #ffb74d;
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
      min-height: 320px;
      max-height: calc(90vh - 140px);
      background: #1e1e1e;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    
    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #252525;
      border-radius: 8px;
      color: #4fc3f7;
      font-size: 0.875rem;
      font-family: monospace;
    }
    
    .file-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .content-field {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    ::ng-deep .content-field .mat-mdc-form-field-flex {
      display: flex;
      flex: 1;
      min-height: 330px;
    }

    ::ng-deep .content-field .mat-mdc-text-field-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 330px;
    }

    ::ng-deep .content-field .mat-mdc-form-field-infix {
      display: flex;
      flex: 1;
      padding: 12px 0;
      min-height: 330px;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element {
      flex: 1;
      min-height: 330px;
      overflow-y: auto;
      resize: none;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      box-shadow: none !important;
      font-family: monospace;
      font-size: 0.875rem;
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
      border-color: #ffb74d;
    }
    
    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-floating-label {
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
      background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
    }
    
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
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
export class EditFileDialogComponent implements OnInit {
  editedContent = '';

  constructor(
    public dialogRef: MatDialogRef<EditFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditFileDialogData
  ) {
    this.editedContent = data.content || '';
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({ content: this.editedContent });
  }
}
