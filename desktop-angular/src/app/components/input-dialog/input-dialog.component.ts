import { Component, Inject, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, PipelineStep } from '../../services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Interface para dados de entrada do diálogo de input.
 * Contém o passo do pipeline e opcionalmente o ID do pipeline para polling.
 */
export interface InputDialogData {
  step: PipelineStep;
  pipelineId?: number;
}

/**
 * Componente de diálogo para visualização do input de um passo de pipeline.
 * Suporta polling para atualização em tempo real do conteúdo do input.
 * 
 * @componentName InputDialogComponent
 * @selector app-input-dialog
 */
@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="input-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">input</mat-icon>
        <h2 class="dialog-title">Input</h2>
        <span class="step-label">{{ data.step.name || data.step.agent?.name || data.step.script?.name || 'Unknown' }}</span>
        <button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="input-wrapper">
          <pre class="input-text">{{ currentInput || 'No input' }}</pre>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .input-dialog {
      background: #121212;
      color: #e0e0e0;
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
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
      color: #2196f3;
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

    .input-wrapper {
      width: 100%;
      min-height: 200px;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      background: #0d0d0d;
      overflow: auto;
    }

    .input-text {
      margin: 0;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      color: #64b5f6;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      padding: 16px;
    }
  `]
})
export class InputDialogComponent implements OnInit, OnDestroy {
  currentInput: string = '';
  
  private destroy$ = new Subject<void>();
  private pollingInterval?: any;
  
  constructor(
    public dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputDialogData,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentInput = data.step.inputContent || '';
  }
  
  ngOnInit() {
    if (this.data.pipelineId && this.data.step.id) {
      this.startPolling();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
  
  /**
   * Inicia o polling para atualizar o conteúdo do input em tempo real.
   * Verifica a cada 2 segundos se há novas mudanças no input do passo.
   */
  private startPolling() {
    this.pollingInterval = setInterval(() => {
      if (this.data.pipelineId && this.data.step.id) {
        this.apiService.getPipelineSteps(this.data.pipelineId).subscribe({
          next: (steps) => {
            const step = steps.find((s: PipelineStep) => s.id === this.data.step.id);
            if (step && step.inputContent && step.inputContent !== this.currentInput) {
              this.currentInput = step.inputContent;
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.error('Error polling step input:', err)
        });
      }
    }, 2000);
  }
  
  /**
   * Fecha o diálogo de input.
   */
  close() {
    this.dialogRef.close();
  }
}
