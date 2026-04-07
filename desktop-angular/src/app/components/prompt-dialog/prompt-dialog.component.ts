import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PromptDialogData {
  title: string;
  prompt: string;
  type: 'agent' | 'script';
}

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="prompt-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">description</mat-icon>
        <h2 class="dialog-title">{{ data.title }}</h2>
        <span class="type-badge">{{ data.type }}</span>
        <button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <pre class="prompt-text">{{ data.prompt || 'No prompt defined...' }}</pre>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button class="btn btn-secondary" (click)="close()">
          <mat-icon>close</mat-icon>
          Close
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .prompt-dialog {
      background: #121212;
      color: #e0e0e0;
      min-width: 500px;
      max-width: 80vw;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }

    .header-icon {
      color: #4fc3f7;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
      flex: 1;
    }

    .type-badge {
      font-size: 0.75rem;
      text-transform: uppercase;
      padding: 4px 10px;
      background: #2a2a2a;
      border-radius: 12px;
      color: #888;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #2a2a2a;
      color: #e0e0e0;
    }

    .dialog-content {
      padding: 20px !important;
      background: #0d0d0d !important;
      max-height: 60vh;
      overflow: auto;
    }

    .prompt-text {
      margin: 0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9rem;
      color: #b0b0b0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      background: #121212;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #2a2a2a;
    }

    mat-dialog-actions {
      padding: 16px 20px !important;
      background: #1e1e1e !important;
      border-top: 1px solid #2a2a2a;
      margin: 0 !important;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #2a2a2a;
      color: #e0e0e0;
    }

    .btn-secondary:hover {
      background: #3a3a3a;
    }
  `]
})
export class PromptDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData
  ) {}

  close() {
    this.dialogRef.close();
  }
}
