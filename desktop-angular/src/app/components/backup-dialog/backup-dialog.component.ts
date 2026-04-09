import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { ApiService } from '../../services/api.service';

export interface BackupDialogData {
  loading?: boolean;
  result?: BackupResult | null;
}

export interface BackupResult {
  success?: boolean;
  filePath?: string;
  message?: string;
}

@Component({
  selector: 'app-backup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    A11yModule
  ],
  template: `
    <div class="backup-dialog" cdkTrapFocus>
      <div class="dialog-header">
        <mat-icon class="header-icon">backup</mat-icon>
        <h2>Database Backup</h2>
      </div>
      
      <div class="dialog-content">
        <ng-container *ngIf="!data.loading && !data.result">
          <p class="description">Choose the location and name for your backup file:</p>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Directory</mat-label>
            <input matInput [(ngModel)]="directory" placeholder="C:\Users\YourName\Documents">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>File Name</mat-label>
            <input matInput [(ngModel)]="fileName" placeholder="backup.sql">
          </mat-form-field>
        </ng-container>

        <ng-container *ngIf="data.loading">
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Creating backup...</p>
          </div>
        </ng-container>

        <ng-container *ngIf="data.result && !data.loading">
          <div class="result-container" [class.success]="data.result.success" [class.error]="!data.result.success">
            <mat-icon class="result-icon">{{ data.result.success ? 'check_circle' : 'error' }}</mat-icon>
            <div class="result-content">
              <h3>{{ data.result.success ? 'Backup Successful' : 'Backup Failed' }}</h3>
              <p class="result-message">{{ data.result.message }}</p>
              <p class="result-path" *ngIf="data.result.filePath">
                <strong>File:</strong> {{ data.result.filePath }}
              </p>
            </div>
          </div>
        </ng-container>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn" [disabled]="data.loading">
          <mat-icon>close</mat-icon>
          {{ data.result ? 'Close' : 'Cancel' }}
        </button>
        <button mat-raised-button (click)="onBackup()" class="backup-btn" [disabled]="data.loading || !isValid()">
          <mat-icon>backup</mat-icon>
          Start Backup
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }
    
    .backup-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 450px;
      position: relative;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .dialog-content {
      padding: 24px;
      background: #1e1e1e;
      min-height: 180px;
    }

    .description {
      margin: 0 0 16px 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
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

    .result-container {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      border-radius: 8px;
    }

    .result-container.success {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid #4caf50;
    }

    .result-container.error {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid #f44336;
    }

    .result-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .result-container.success .result-icon {
      color: #4caf50;
    }

    .result-container.error .result-icon {
      color: #f44336;
    }

    .result-content h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: #ffffff;
    }

    .result-message {
      margin: 0 0 8px 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .result-path {
      margin: 0;
      color: #888;
      font-size: 0.85rem;
      word-break: break-all;
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

    .cancel-btn:hover:not(:disabled) {
      background-color: #3a3a3a;
      color: #ffffff;
    }

    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .backup-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
    }

    .backup-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #388e3c 0%, #43a047 100%);
    }

    .backup-btn:disabled {
      opacity: 0.5;
    }

    .backup-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class BackupDialogComponent {
  directory = '';
  fileName = 'backup.sql';

  constructor(
    public dialogRef: MatDialogRef<BackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BackupDialogData,
    private apiService: ApiService
  ) {
    if (!data.loading) {
      data.loading = false;
    }
    if (!data.result) {
      data.result = null;
    }
  }

  isValid(): boolean {
    return this.fileName.trim().length > 0;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onBackup(): void {
    this.data.loading = true;
    
    const dir = this.directory.trim() || '';
    const name = this.fileName.trim() || 'backup.sql';
    
    this.apiService.backupDatabase(dir, name).subscribe({
      next: (result: BackupResult) => {
        this.data.loading = false;
        this.data.result = result;
      },
      error: (err) => {
        this.data.loading = false;
        this.data.result = {
          success: false,
          message: err.error?.message || err.message || 'Backup failed'
        };
      }
    });
  }
}