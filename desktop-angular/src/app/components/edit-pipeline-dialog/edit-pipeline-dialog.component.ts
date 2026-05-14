import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface EditPipelineData {
  id: number;
  name: string;
  description: string;
  outputExtension?: string;
}

@Component({
  selector: 'app-edit-pipeline-dialog',
  standalone: true,
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
    <div class="dialog-header">
      <mat-icon class="header-icon">edit</mat-icon>
      <h2 class="dialog-title">Edit Pipeline</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="form-section">
        <mat-form-field class="full-width" appearance="outline" floatLabel="always">
          <mat-label>Pipeline Name</mat-label>
          <input matInput [(ngModel)]="pipeline.name" required maxlength="64" autocomplete="off" placeholder="Enter pipeline name">
          <mat-icon matPrefix>alt_route</mat-icon>
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline" floatLabel="always">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="pipeline.description" rows="3" maxlength="256" placeholder="Describe your pipeline (optional)"></textarea>
          <mat-icon matPrefix>description</mat-icon>
        </mat-form-field>
        <mat-form-field class="full-width" appearance="outline" floatLabel="always">
          <mat-label>Output Extension</mat-label>
          <input matInput [(ngModel)]="pipeline.outputExtension" placeholder="e.g., json" autocomplete="off">
          <mat-icon matPrefix>description</mat-icon>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!pipeline.name" class="save-btn">
        <mat-icon>save</mat-icon>
        Save Changes
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
      padding: 24px !important;
      min-width: 420px;
      max-width: 480px;
      background: #1e1e1e !important;
    }
    
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .full-width {
      width: 100%;
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
export class EditPipelineDialogComponent implements OnInit {
  pipeline: { name: string; description: string; outputExtension?: string } = {
    name: '',
    description: '',
    outputExtension: ''
  };

  constructor(
    public dialogRef: MatDialogRef<EditPipelineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPipelineData
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.pipeline.name = this.data.name;
      this.pipeline.description = this.data.description;
      this.pipeline.outputExtension = this.data.outputExtension ?? '';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

onSave(): void {
    this.dialogRef.close(this.pipeline);
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSave();
  }
}
