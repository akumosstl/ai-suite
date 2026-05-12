import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService, PipelineStep } from '../../services/api.service';

export interface StepIODialogData {
  step: PipelineStep;
  pipelineId: number;
  mode: 'input' | 'output';
}

@Component({
  selector: 'app-step-io-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">{{ data.mode === 'input' ? 'input' : 'output' }}</mat-icon>
      <h2 class="dialog-title">{{ data.mode === 'input' ? 'Input' : 'Output' }} Configuration</h2>
      <span class="step-label">Step: {{ data.step.name || data.step.agent?.name || 'Unknown' }}</span>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-form-field class="type-field" appearance="outline">
        <mat-label>File Type</mat-label>
        <mat-select [(ngModel)]="selectedType" (selectionChange)="onTypeChange()">
          <mat-option value="yml">YML</mat-option>
          <mat-option value="json">JSON</mat-option>
          <mat-option value="cmd">CMD</mat-option>
          <mat-option value="txt">TXT</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="editor-container">
        <div class="editor-header">
          <mat-icon>code</mat-icon>
          <span>Content Editor</span>
          <span class="help-toggle" (click)="toggleHelp()">
            <mat-icon>help_outline</mat-icon>
            {{ showHelp ? 'Hide' : 'Show' }} syntax help
          </span>
        </div>
        <div class="syntax-help" *ngIf="showHelp">
          <div class="help-section">
            <strong>Dynamic References:</strong>
            <ul>
              <li><code>{{'{{'}}step:N:output{{'}}'}}</code> - Reference step N's output</li>
              <li><code>{{'{{'}}file:path/to/file.json{{'}}'}}</code> - Read content from file</li>
              <li><code>{{'{{'}}env:VARIABLE_NAME{{'}}'}}</code> - Read environment variable</li>
            </ul>
          </div>
        </div>
        <textarea 
          #editorTextarea
          class="content-editor" 
          [(ngModel)]="content"
          [class.json-syntax]="selectedType === 'json'"
          [class.yml-syntax]="selectedType === 'yml'"
          [class.cmd-syntax]="selectedType === 'cmd'"
          placeholder="Enter content here..."
          spellcheck="false"
          (keydown)="onEditorKeydown($event)">
        </textarea>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" class="save-btn">
        <mat-icon>save</mat-icon>
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
      border-radius: 12px 12px 0 0;
    }
    
    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #4fc3f7;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    .step-label {
      margin-left: auto;
      font-size: 0.85rem;
      color: #888;
      background: #2a2a2a;
      padding: 4px 12px;
      border-radius: 12px;
    }
    
    .dialog-content {
      padding: 24px !important;
      min-width: 500px;
      max-width: 600px;
      background: #1e1e1e !important;
    }
    
    .type-field {
      width: 100%;
      margin-bottom: 16px;
    }

    ::ng-deep .type-field .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }

    ::ng-deep .type-field .mdc-notched-outline__leading,
    ::ng-deep .type-field .mdc-notched-outline__notch,
    ::ng-deep .type-field .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }

    ::ng-deep .type-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .type-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .type-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
    }

    .editor-container {
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      overflow: hidden;
      background: #252525;
    }

    .editor-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #2a2a2a;
      border-bottom: 1px solid #3a3a3a;
      color: #888;
      font-size: 0.85rem;
    }

    .editor-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .help-toggle {
      margin-left: auto;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #4fc3f7;
      font-size: 0.8rem;
    }

    .help-toggle:hover {
      color: #81d4fa;
    }

    .help-toggle mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .syntax-help {
      padding: 12px 16px;
      background: #1a1a1a;
      border-bottom: 1px solid #3a3a3a;
      font-size: 0.8rem;
      color: #aaa;
    }

    .help-section ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .help-section li {
      margin: 4px 0;
    }

    .help-section code {
      background: #333;
      padding: 2px 6px;
      border-radius: 4px;
      color: #4fc3f7;
    }

    .content-editor {
      width: 100%;
      min-height: 250px;
      max-height: 350px;
      padding: 16px;
      background: #1a1a1a;
      color: #e0e0e0;
      border: none;
      outline: none;
      resize: vertical;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
      tab-size: 2;
    }

    .content-editor::placeholder {
      color: #555;
    }

    .json-syntax {
      color: #ce9178;
    }

    .yml-syntax {
      color: #9cdcfe;
    }

    .cmd-syntax {
      color: #d4d4d4;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px !important;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
      border-radius: 0 0 12px 12px;
      margin: 0 !important;
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
    
    .save-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0288d1 0%, #0277bd 100%);
    }
    
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #03a9f4 0%, #0288d1 100%);
    }

    .save-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }
    
    .save-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .mat-mdc-select-panel {
      background: #2a2a2a !important;
    }

    ::ng-deep .mat-mdc-option {
      color: #e0e0e0 !important;
    }

    ::ng-deep .mat-mdc-option:hover {
      background: #3a3a3a !important;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--selected {
      background: #4fc3f7 !important;
      color: #000 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepIODialogComponent {
  selectedType = 'txt';
  content = '';
  showHelp = false;

  constructor(
    public dialogRef: MatDialogRef<StepIODialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: StepIODialogData
  ) {
    if (data.mode === 'input') {
      this.content = data.step.inputContent || '';
      this.selectedType = data.step.inputType || 'txt';
    } else {
      this.content = data.step.outputContent || '';
      this.selectedType = data.step.outputType || 'txt';
    }
  }

  onTypeChange(): void {
    this.cdr.detectChanges();
  }

  toggleHelp(): void {
    this.showHelp = !this.showHelp;
    this.cdr.detectChanges();
  }

  onEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      this.content = this.content.substring(0, start) + '  ' + this.content.substring(end);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      this.cdr.detectChanges();
    }
  }

  onSave(): void {
    if (this.data.mode === 'input') {
      this.apiService.saveStepInput(
        this.data.pipelineId,
        this.data.step.id!,
        this.content,
        this.selectedType
      ).subscribe({
        next: (step) => {
          this.dialogRef.close(step);
        },
        error: (err) => {
          console.error('Error saving input:', err);
        }
      });
    } else {
      this.apiService.saveStepOutput(
        this.data.pipelineId,
        this.data.step.id!,
        this.content,
        this.selectedType
      ).subscribe({
        next: (step) => {
          this.dialogRef.close(step);
        },
        error: (err) => {
          console.error('Error saving output:', err);
        }
      });
    }
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSave();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
