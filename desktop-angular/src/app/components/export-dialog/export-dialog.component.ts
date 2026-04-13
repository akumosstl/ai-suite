import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

export interface ExportDialogData {
  loading?: boolean;
}

interface ExportItem {
  key: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="export-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">file_download</mat-icon>
        <h2>Export Data</h2>
      </div>
      
      <div class="dialog-content">
        <p class="description">Select the data types to export:</p>
        
        <div class="export-items-grid" *ngIf="!data.loading">
          <div class="export-item" *ngFor="let item of exportItems">
            <mat-checkbox
              [(ngModel)]="item.selected"
              color="primary"
              class="item-checkbox">
              <span class="item-label">{{ item.label }}</span>
            </mat-checkbox>
          </div>
        </div>
        
        <div class="loading-container" *ngIf="data.loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Exporting data...</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn" [disabled]="data.loading">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button (click)="onExport()" class="export-btn" [disabled]="data.loading || !hasSelection()">
          <mat-icon>download</mat-icon>
          Export
        </button>
      </div>
    </div>
  `,
  styles: [`
    .export-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 400px;
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

    .export-items-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .export-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: #252525;
      border-radius: 8px;
      border: 1px solid #3a3a3a;
      transition: all 0.2s ease;
    }

    .export-item:hover {
      border-color: #4fc3f7;
      background: #2a2a2a;
    }

    .item-checkbox {
      width: 100%;
    }

    .item-label {
      color: #e0e0e0;
      font-size: 1rem;
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

    .export-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
    }

    .export-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%);
    }

    .export-btn:disabled {
      opacity: 0.5;
    }

    .export-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ExportDialogComponent {
  exportItems: ExportItem[] = [
    { key: 'agents', label: 'Agents', selected: false },
    { key: 'skills', label: 'Skills', selected: false },
    { key: 'instructions', label: 'Instructions', selected: false },
    { key: 'plugins', label: 'Plugins', selected: false },
    { key: 'tools', label: 'Tools', selected: false },
    { key: 'commands', label: 'Commands', selected: false },
    { key: 'scripts', label: 'Scripts', selected: false },
    { key: 'templates', label: 'Templates', selected: false }
  ];

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData,
    private apiService: ApiService
  ) {
    if (!data.loading) {
      data.loading = false;
    }
  }

  hasSelection(): boolean {
    return this.exportItems.some(item => item.selected);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onExport(): void {
    const selectedTypes = this.exportItems
      .filter(item => item.selected)
      .map(item => item.key);
    
    this.data.loading = true;
    
    this.apiService.exportData(selectedTypes).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.sql';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.data.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Export error:', err);
        this.data.loading = false;
      }
    });
  }
}
