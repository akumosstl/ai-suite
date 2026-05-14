import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

export interface ProjectReadmeDialogData {
  projectId: number;
  readme: string;
}

@Component({
  selector: 'app-project-readme-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">description</mat-icon>
      <h2 class="dialog-title">Project README</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-form-field class="full-width" appearance="outline" floatLabel="always">
        <mat-label>README Content (Markdown)</mat-label>
        <textarea matInput [(ngModel)]="readmeContent" rows="20" placeholder="Write your project README in Markdown format..."></textarea>
        <mat-icon matPrefix>edit</mat-icon>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn" [disabled]="isSaving">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="isSaving" class="save-btn">
        <mat-icon *ngIf="!isSaving">save</mat-icon>
        <mat-icon *ngIf="isSaving" class="spin">sync</mat-icon>
        {{ isSaving ? 'Saving...' : 'Save README' }}
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
      color: #81c784;
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
      width: 800px;
      min-width: 800px;
      background: #1e1e1e !important;
    }
    
    .full-width {
      width: 100%;
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
      border-color: #81c784;
    }
    
    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-floating-label {
      color: #81c784 !important;
    }
    
    ::ng-deep textarea[matInput] {
      color: #ffffff !important;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
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
    
    .cancel-btn mat-icon,
    .save-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .save-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
    }
    
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #43a047 0%, #388e3c 100%);
    }
    
    .save-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }
    
    .spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectReadmeDialogComponent {
  readmeContent = '';
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<ProjectReadmeDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: ProjectReadmeDialogData
  ) {
    if (data?.readme) {
      this.readmeContent = data.readme;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.data?.projectId) {
      return;
    }

    this.isSaving = true;
    this.apiService.updateProjectReadme(this.data.projectId, this.readmeContent).subscribe({
      next: (project) => {
        this.isSaving = false;
        this.dialogRef.close(project);
      },
      error: (err) => {
        console.error('Error saving README:', err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSave();
  }
}