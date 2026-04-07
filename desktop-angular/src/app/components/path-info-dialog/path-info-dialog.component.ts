import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PathInfoDialogData {
  title: string;
  message: string;
  icon?: string;
}

@Component({
  selector: 'app-path-info-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="info-dialog">
      <div class="dialog-header">
        <mat-icon class="info-icon">{{ data.icon || 'info' }}</mat-icon>
        <h2>{{ data.title }}</h2>
      </div>
      
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>

      <div class="dialog-actions">
        <button mat-raised-button (click)="onClose()" class="ok-btn">
          <mat-icon>check</mat-icon>
          OK
        </button>
      </div>
    </div>
  `,
  styles: [`
    .info-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .info-icon {
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
      letter-spacing: 0.3px;
    }

    .dialog-content {
      padding: 24px;
      background: #1e1e1e;
    }

    .dialog-content p {
      margin: 0;
      color: #b0b0b0;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
    }

    .ok-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .ok-btn:hover {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }

    .ok-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class PathInfoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PathInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PathInfoDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
