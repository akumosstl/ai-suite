import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2>{{ data.title }}</h2>
      </div>
      
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button (click)="onConfirm()" class="confirm-btn">
          <mat-icon>check</mat-icon>
          Confirm
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 360px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .warning-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ff9800;
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
    }

    .dialog-content p {
      margin: 0;
      color: #b0b0b0;
      font-size: 0.95rem;
      line-height: 1.5;
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

    .confirm-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
    }

    .confirm-btn:hover {
      background: linear-gradient(135deg, #e53935 0%, #d32f2f 100%);
    }

    .confirm-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
