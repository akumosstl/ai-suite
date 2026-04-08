import { Component, Inject, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, PipelineStep } from '../../services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ConsoleOutputDialogData {
  step: PipelineStep;
  pipelineId?: number;
}

@Component({
  selector: 'app-console-output-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="console-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">terminal</mat-icon>
        <h2 class="dialog-title">Console Output</h2>
        <span class="step-label">{{ data.step.agent?.name || data.step.script?.name || 'Unknown' }}</span>
        <span class="status-badge" [class]="currentStatus">{{ currentStatus || 'pending' }}</span>
        <button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="console-wrapper" #consoleWrapper>
          <pre class="console-text">{{ currentOutput || 'No output yet...' }}</pre>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .console-dialog {
      background: #121212;
      color: #e0e0e0;
      width: 95vw;
      height: 90vh;
      max-width: none;
      max-height: none;
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
      color: #4caf50;
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

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      text-transform: capitalize;
    }

    .status-badge.completed {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }

    .status-badge.running {
      background: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }

    .status-badge.failed {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }

    .status-badge.pending {
      background: rgba(255, 255, 255, 0.1);
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
      flex: 1;
      padding: 20px !important;
      overflow: auto !important;
      background: #0d0d0d !important;
    }

    .console-wrapper {
      width: 100%;
      height: 100%;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      background: #0d0d0d;
      overflow: auto;
    }

    .console-text {
      margin: 0;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      color: #4caf50;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      padding: 16px;
    }
  `]
})
export class ConsoleOutputDialogComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('consoleWrapper') consoleWrapper?: ElementRef;
  
  currentOutput: string = '';
  currentStatus: string = 'pending';
  
  private destroy$ = new Subject<void>();
  private pollingInterval?: any;
  private lastOutputLength = 0;
  private autoScroll = true;
  
  constructor(
    public dialogRef: MatDialogRef<ConsoleOutputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConsoleOutputDialogData,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentOutput = data.step.outputContent || '';
    this.currentStatus = data.step.status || 'pending';
  }
  
  ngOnInit() {
    if (this.data.pipelineId && this.data.step.id) {
      this.startPolling();
    }
  }
  
  ngAfterViewChecked() {
    if (this.autoScroll && this.currentOutput.length > this.lastOutputLength) {
      this.scrollToBottom();
      this.lastOutputLength = this.currentOutput.length;
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
  
  private startPolling() {
    this.pollingInterval = setInterval(() => {
      if (this.data.pipelineId && this.data.step.id) {
        this.apiService.getPipelineSteps(this.data.pipelineId).subscribe({
          next: (steps) => {
            const step = steps.find((s: PipelineStep) => s.id === this.data.step.id);
            if (step) {
              if (step.outputContent && step.outputContent !== this.currentOutput) {
                this.currentOutput = step.outputContent;
              }
              if (step.status && step.status !== this.currentStatus) {
                this.currentStatus = step.status || 'pending';
              }
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.error('Error polling step output:', err)
        });
      }
    }, 2000);
  }
  
  private scrollToBottom() {
    if (this.consoleWrapper) {
      const element = this.consoleWrapper.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  
  close() {
    this.dialogRef.close();
  }
}
