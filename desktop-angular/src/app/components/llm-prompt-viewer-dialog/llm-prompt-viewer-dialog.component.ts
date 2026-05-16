import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface LlmPromptViewerData {
  prompt: string;
  model: string;
  provider: string;
  timestamp: string;
}

@Component({
  selector: 'app-llm-prompt-viewer-dialog',
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
        <h2 class="dialog-title">LLM Prompt</h2>
        <span class="type-badge">{{ data.provider }}</span>
        <button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="meta-info">
        <div class="meta-item">
          <span class="meta-label">Model</span>
          <span class="meta-value">{{ data.model }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Timestamp</span>
          <span class="meta-value">{{ data.timestamp }}</span>
        </div>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <pre class="prompt-text">{{ data.prompt || 'No prompt available...' }}</pre>
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
      color: #f5a623;
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
      background: rgba(245, 166, 35, 0.15);
      border-radius: 12px;
      color: #f5a623;
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

    .meta-info {
      display: flex;
      gap: 24px;
      padding: 12px 20px;
      background: #151515;
      border-bottom: 1px solid #2a2a2a;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.5px;
    }

    .meta-value {
      font-size: 0.85rem;
      color: #fff;
      font-family: 'Consolas', 'Monaco', monospace;
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
export class LlmPromptViewerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LlmPromptViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LlmPromptViewerData
  ) {}

  close() {
    this.dialogRef.close();
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.close();
  }
}