import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface InstructionFileData {
  path: string;
  fileName: string;
  content: string;
}

@Component({
  selector: 'app-add-instruction-file-dialog',
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
      <mat-icon class="header-icon">attach_file</mat-icon>
      <h2 class="dialog-title">Add File</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="form-section">
        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Path</mat-label>
          <input matInput [(ngModel)]="filePath" required autocomplete="off" placeholder="e.g., reference/java-style.md">
          <mat-icon matPrefix>folder</mat-icon>
          <mat-hint>Subfolder and file name (e.g., reference/java-style.md)</mat-hint>
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>File</mat-label>
          <input matInput [value]="fileName" readonly placeholder="Select a file">
          <mat-icon matPrefix>description</mat-icon>
          <button mat-icon-button matSuffix (click)="fileInput.click()" type="button" aria-label="Browse file">
            <mat-icon>folder_open</mat-icon>
          </button>
          <input #fileInput type="file" hidden (change)="onFileSelected($event)">
        </mat-form-field>

        <div class="file-preview" *ngIf="fileContent">
          <mat-icon>text_snippet</mat-icon>
          <span>{{ fileName }} ({{ fileContent.length }} chars)</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onAdd()" [disabled]="!filePath || !fileContent" class="save-btn">
        <mat-icon>add</mat-icon>
        Add File
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
      padding: 24px;
      background: #252525;
      min-width: 400px;
    }
    
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .file-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #1e1e1e;
      border-radius: 8px;
      color: #4fc3f7;
      font-size: 0.875rem;
    }
    
    .file-preview mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #2d2d2d;
      border-top: 1px solid #3a3a3a;
      border-radius: 0 0 12px 12px;
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
export class AddInstructionFileDialogComponent {
  filePath = '';
  fileName = '';
  fileContent = '';

  constructor(
    public dialogRef: MatDialogRef<AddInstructionFileDialogComponent>
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fileName = file.name;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.fileContent = reader.result as string;
      };
      reader.readAsText(file);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    const result: InstructionFileData = {
      path: this.filePath,
      fileName: this.fileName,
      content: this.fileContent
    };
    this.dialogRef.close(result);
  }
}