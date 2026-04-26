import { Component, Inject, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

export interface UpdateDialogData {
  currentVersion: string
  newVersion: string
}

@Component({
  selector: 'app-update-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="update-dialog">
      <div class="dialog-header">
        <mat-icon class="update-icon">system_update</mat-icon>
        <h2>New Update Available</h2>
      </div>
      
      <div class="dialog-content">
        <p>A new version of the software is available.</p>
        <div class="version-info">
          <span class="label">Current version:</span>
          <span class="version">{{ data.currentVersion }}</span>
        </div>
        <div class="version-info">
          <span class="label">New version:</span>
          <span class="version new">{{ data.newVersion }}</span>
        </div>
        <p class="hint">Please update your software to get the latest features and fixes.</p>
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
    .update-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 380px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .update-icon {
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
    }

    .dialog-content p {
      margin: 0 0 16px 0;
      color: #b0b0b0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .version-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #2a2a2a;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .label {
      color: #888;
      font-size: 0.9rem;
    }

    .version {
      color: #ffffff;
      font-weight: 500;
      font-family: monospace;
    }

    .version.new {
      color: #4fc3f7;
    }

    .hint {
      color: #888 !important;
      font-size: 0.85rem !important;
      margin-top: 16px !important;
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
export class UpdateDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close()
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onClose();
  }
}