import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipelineRunStep } from '../../services/api.service';

export interface OutputDialogData {
  step: PipelineRunStep;
  type: 'input' | 'output';
}

@Component({
  selector: 'app-output-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="output-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">{{ data.type === 'output' ? 'output' : 'input' }}</mat-icon>
        <h2 class="dialog-title">{{ data.type === 'output' ? 'Output' : 'Input' }}</h2>
        <span class="step-label">{{ data.step.agentName || data.step.scriptName || 'Unknown' }}</span>
        <button class="copy-btn" (click)="copyContent()" title="Copy to clipboard">
          <mat-icon>content_copy</mat-icon>
          <span>Copy</span>
        </button>
        <button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <pre class="output-content">{{ getContent() }}</pre>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .output-dialog {
      background: #121212;
      color: #e0e0e0;
      width: 80vw;
      height: 70vh;
      max-width: 900px;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
      flex-shrink: 0;
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

    .step-label {
      font-size: 0.85rem;
      color: #888;
      padding: 4px 12px;
      background: #2a2a2a;
      border-radius: 12px;
    }

    .copy-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #e0e0e0;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .copy-btn:hover {
      background: #3a3a3a;
      border-color: #4fc3f7;
    }

    .copy-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .copy-btn span {
      font-size: 0.85rem;
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
      flex: 1;
      padding: 20px !important;
      overflow: auto !important;
      background: #0d0d0d !important;
    }

    .output-content {
      margin: 0;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      color: #b0b0b0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
  `]
})
export class OutputDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OutputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OutputDialogData
  ) {}

  getContent(): string {
    if (this.data.type === 'output') {
      return this.data.step.outputContent || 'No output yet...';
    } else {
      return this.data.step.inputContent || 'No input';
    }
  }

  copyContent() {
    const content = this.getContent();
    if (content && content !== 'No output yet...' && content !== 'No input') {
      navigator.clipboard.writeText(content).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}