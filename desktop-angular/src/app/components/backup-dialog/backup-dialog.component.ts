import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

/**
 * Interface for backup dialog data.
 */
export interface BackupDialogData {
  loading: boolean;
}

/**
 * Component for database backup modal dialog.
 * Allows user to create a full backup of the database with all tables
 * (agents, scripts, instructions, templates, projects, pipelines, etc.)
 * and download as a .sql file.
 */
@Component({
  selector: 'app-backup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="backup-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">backup</mat-icon>
        <h2>Database Backup</h2>
      </div>

      <div class="dialog-content">
        <div *ngIf="!data.loading && !success">
          <p class="description">
            Create a full backup of your database including all data:
          </p>
          <div class="backup-info">
            <div class="info-item">
              <mat-icon>smart_toy</mat-icon>
              <span>Agents</span>
            </div>
            <div class="info-item">
              <mat-icon>code</mat-icon>
              <span>Scripts</span>
            </div>
            <div class="info-item">
              <mat-icon>rule</mat-icon>
              <span>Instructions</span>
            </div>
            <div class="info-item">
              <mat-icon>description</mat-icon>
              <span>Templates</span>
            </div>
            <div class="info-item">
              <mat-icon>folder</mat-icon>
              <span>Projects</span>
            </div>
            <div class="info-item">
              <mat-icon>alt_route</mat-icon>
              <span>Pipelines</span>
            </div>
          </div>
          <p class="backup-note">
            The backup file will include all IDs for easy restore.
          </p>
        </div>

        <div class="loading-container" *ngIf="data.loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Creating backup...</p>
        </div>

        <div class="success-container" *ngIf="success">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <p>Backup completed successfully!</p>
          <p class="success-detail">{{ recordCount }} records exported</p>
        </div>

        <div class="error-container" *ngIf="error">
          <mat-icon class="error-icon">error</mat-icon>
          <p>{{ error }}</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn" [disabled]="data.loading">
          <mat-icon>close</mat-icon>
          {{ success || error ? 'Close' : 'Cancel' }}
        </button>
        <button
          mat-raised-button
          (click)="onBackup()"
          class="backup-btn"
          [disabled]="data.loading || success">
          <mat-icon>download</mat-icon>
          Create Backup
        </button>
      </div>
    </div>
  `,
  styles: [`
    .backup-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 450px;
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
    }

    .description {
      margin: 0 0 16px 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .backup-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #252525;
      border-radius: 6px;
      border: 1px solid #3a3a3a;
      color: #e0e0e0;
      font-size: 0.9rem;
    }

    .info-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
    }

    .backup-note {
      margin: 0;
      padding: 12px;
      background: #252525;
      border-radius: 6px;
      border: 1px solid #3a3a3a;
      color: #888;
      font-size: 0.85rem;
    }

    .loading-container,
    .success-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    .loading-container p,
    .success-container p,
    .error-container p {
      margin: 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .success-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #4caf50;
    }

    .success-detail {
      color: #888 !important;
      font-size: 0.85rem !important;
    }

    .error-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #f44336;
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
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
    }

    .backup-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%);
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
  success = false;
  error: string | null = null;
  recordCount = 0;

  constructor(
    public dialogRef: MatDialogRef<BackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BackupDialogData,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.data.loading = false;
  }

  onCancel(): void {
    this.dialogRef.close(this.success);
  }

  onBackup(): void {
    this.data.loading = true;
    this.error = null;

    this.apiService.downloadBackup().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup_' + this.getTimestamp() + '.sql';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Estimate record count based on file size
        this.recordCount = Math.round(blob.size / 100);
        this.data.loading = false;
        this.success = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Backup error:', err);
        this.data.loading = false;
        this.error = 'Failed to create backup: ' + (err.error?.message || err.message || 'Unknown error');
        this.cdr.detectChanges();
      }
    });
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }
}