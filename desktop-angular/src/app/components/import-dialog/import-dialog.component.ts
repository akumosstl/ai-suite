import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

export interface ImportDialogData {
  loading?: boolean;
  result?: ImportResult;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  totalProcessed: number;
  details: ImportDetail[];
}

export interface ImportDetail {
  type: string;
  name: string;
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  template: `
    <div class="import-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">file_upload</mat-icon>
        <h2>Import Data</h2>
      </div>
      
      <div class="dialog-content">
        <div *ngIf="!data.result && !data.loading" class="upload-section">
          <p class="description">Upload a .sql file to import data:</p>
          
          <div class="file-input-wrapper">
            <input
              type="file"
              id="fileInput"
              accept=".sql"
              (change)="onFileSelected($event)"
              [disabled]="data.loading"
              #fileInput>
            <label for="fileInput" class="file-input-label" [class.has-file]="selectedFileName">
              <mat-icon>description</mat-icon>
              <span>{{ selectedFileName || 'Choose a .sql file' }}</span>
            </label>
          </div>
        </div>
        
        <div *ngIf="data.loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Importing data...</p>
        </div>
        
        <div *ngIf="data.result" class="result-section">
          <div class="result-summary" [class.success]="data.result.imported > 0" [class.warning]="data.result.skipped > 0">
            <mat-icon>{{ data.result.imported > 0 ? 'check_circle' : 'warning' }}</mat-icon>
            <span>
              {{ data.result.imported }} imported, {{ data.result.skipped }} skipped
            </span>
          </div>
          
          <div class="result-details">
            <h3>Details:</h3>
            <div class="details-list">
              <div 
                *ngFor="let detail of data.result.details" 
                class="detail-item"
                [class.success]="detail.success"
                [class.skipped]="!detail.success">
                <mat-icon>{{ detail.success ? 'check' : 'block' }}</mat-icon>
                <span class="detail-type">{{ detail.type }}:</span>
                <span class="detail-name">{{ detail.name }}</span>
                <span class="detail-message">{{ detail.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          {{ data.result ? 'Close' : 'Cancel' }}
        </button>
        <button 
          *ngIf="!data.result" 
          mat-raised-button 
          (click)="onImport()" 
          class="import-btn" 
          [disabled]="data.loading || !selectedFile">
          <mat-icon>upload</mat-icon>
          Import
        </button>
      </div>
    </div>
  `,
  styles: [`
    .import-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 500px;
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #4fc3f7;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #ffffff;
    }

    .dialog-content {
      padding: 24px;
      background: #1e1e1e;
      min-height: 200px;
      max-height: 400px;
      overflow-y: auto;
    }

    .description {
      margin: 0 0 16px 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .file-input-wrapper {
      margin-top: 16px;
    }

    .file-input-wrapper input[type="file"] {
      display: none;
    }

    .file-input-label {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #252525;
      border: 2px dashed #3a3a3a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .file-input-label:hover {
      border-color: #4fc3f7;
      background: #2a2a2a;
    }

    .file-input-label.has-file {
      border-style: solid;
      border-color: #4fc3f7;
    }

    .file-input-label mat-icon {
      color: #4fc3f7;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .file-input-label span {
      color: #e0e0e0;
      font-size: 0.95rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    .loading-container p {
      margin: 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .result-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .result-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
    }

    .result-summary.success {
      background: rgba(56, 142, 60, 0.15);
      border: 1px solid #388e3c;
      color: #81c784;
    }

    .result-summary.warning {
      background: rgba(255, 152, 0, 0.15);
      border: 1px solid #ff9800;
      color: #ffb74d;
    }

    .result-summary mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .result-details h3 {
      margin: 0 0 12px 0;
      color: #e0e0e0;
      font-size: 1rem;
      font-weight: 500;
    }

    .details-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #252525;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .detail-item.success {
      border-left: 3px solid #388e3c;
    }

    .detail-item.skipped {
      border-left: 3px solid #ff9800;
    }

    .detail-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .detail-item.success mat-icon {
      color: #388e3c;
    }

    .detail-item.skipped mat-icon {
      color: #ff9800;
    }

    .detail-type {
      color: #4fc3f7;
      font-weight: 500;
    }

    .detail-name {
      color: #e0e0e0;
    }

    .detail-message {
      color: #888;
      font-size: 0.85rem;
      margin-left: auto;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
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

    .import-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
    }

    .import-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #388e3c 0%, #43a047 100%);
    }

    .import-btn:disabled {
      opacity: 0.5;
    }

    .import-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ImportDialogComponent {
  selectedFile: File | null = null;
  selectedFileName: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportDialogData
  ) {
    if (!data.loading) {
      data.loading = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onImport(): void {
    if (!this.selectedFile) return;
    
    this.data.loading = true;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    this.dialogRef.close({ file: this.selectedFile, formData });
  }
}
