import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService, PipelineStep } from '../../services/api.service';

export interface StepSettingsDialogData {
  step: PipelineStep;
  pipelineId: number;
  projectTarget?: string;
}

@Component({
  selector: 'app-step-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">settings</mat-icon>
      <h2 class="dialog-title">Step Settings</h2>
      <span class="step-label">Step: {{ step.name || step.agent?.name || step.script?.name || 'Unknown' }}</span>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-tab-group animationDuration="200ms" [(selectedIndex)]="selectedTabIndex">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>input</mat-icon>
            <span>Input</span>
          </ng-template>
          <div class="tab-content">
            <mat-form-field class="type-field" appearance="outline">
              <mat-label>File Type</mat-label>
              <mat-select [(ngModel)]="inputType" (selectionChange)="onInputTypeChange()">
                <mat-option value="yml">YML</mat-option>
                <mat-option value="json">JSON</mat-option>
                <mat-option value="cmd">CMD</mat-option>
                <mat-option value="txt">TXT</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="editor-container">
              <div class="editor-header">
                <mat-icon>code</mat-icon>
                <span>Input Content</span>
              </div>
              <textarea 
                #inputEditor
                class="content-editor" 
                [(ngModel)]="inputContent"
                [class.json-syntax]="inputType === 'json'"
                [class.yml-syntax]="inputType === 'yml'"
                [class.cmd-syntax]="inputType === 'cmd'"
                placeholder="Enter input content here..."
                spellcheck="false"
                (keydown)="onInputEditorKeydown($event)">
              </textarea>
            </div>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>output</mat-icon>
            <span>Output</span>
          </ng-template>
          <div class="tab-content">
            <mat-form-field class="type-field" appearance="outline">
              <mat-label>File Type</mat-label>
              <mat-select [(ngModel)]="outputType" (selectionChange)="onOutputTypeChange()">
                <mat-option value="yml">YML</mat-option>
                <mat-option value="json">JSON</mat-option>
                <mat-option value="cmd">CMD</mat-option>
                <mat-option value="txt">TXT</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="editor-container">
              <div class="editor-header">
                <mat-icon>code</mat-icon>
                <span>Output Content</span>
              </div>
              <textarea 
                #outputEditor
                class="content-editor" 
                [(ngModel)]="outputContent"
                [class.json-syntax]="outputType === 'json'"
                [class.yml-syntax]="outputType === 'yml'"
                [class.cmd-syntax]="outputType === 'cmd'"
                placeholder="Enter output content here..."
                spellcheck="false"
                (keydown)="onOutputEditorKeydown($event)">
              </textarea>
            </div>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>terminal</mat-icon>
            <span>CLI</span>
          </ng-template>
          <div class="tab-content cli-tab">
            <mat-form-field appearance="outline" class="full-width" *ngIf="isScriptStep">
              <mat-label>Runtime</mat-label>
              <mat-select [(ngModel)]="selectedRuntime" (selectionChange)="onCliChange()">
                <mat-option value="cmd">cmd</mat-option>
                <mat-option value="node">node</mat-option>
                <mat-option value="java">java</mat-option>
                <mat-option value="py">py</mat-option>
                <mat-option value="custom">Custom...</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width" *ngIf="!isScriptStep">
              <mat-label>CLI</mat-label>
              <mat-select [(ngModel)]="selectedCli" (selectionChange)="onCliChange()">
                <mat-option *ngFor="let target of targets" [value]="target.name">{{ target.name }}</mat-option>
                <mat-option *ngIf="selectedCli === 'custom'" value="custom">Custom...</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width" *ngIf="showCustomCliInput">
              <mat-label>Custom CLI</mat-label>
              <input matInput [(ngModel)]="customCli" placeholder="Enter custom CLI name">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Parameters</mat-label>
              <input matInput [(ngModel)]="parameters" placeholder="Enter parameters">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Arguments</mat-label>
              <input matInput [(ngModel)]="arguments_" placeholder="Enter arguments">
            </mat-form-field>
    </div>
  </mat-tab>

  <mat-tab *ngIf="!isScriptStep">
    <ng-template mat-tab-label>
      <mat-icon>smart_toy</mat-icon>
      <span>Engine</span>
    </ng-template>
    <div class="tab-content engine-tab">
      <div class="engine-info">
        <mat-icon>info</mat-icon>
        <span>Select the execution engine. <strong>langchain4j</strong> uses native LLM APIs directly. <strong>CLI</strong> uses the configured CLI tool.</span>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Engine</mat-label>
        <mat-select [(ngModel)]="selectedEngine" (selectionChange)="onEngineChange()">
          <mat-option value="langchain">langchain4j (Native LLM)</mat-option>
          <mat-option value="cli">CLI (External Tool)</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width" *ngIf="selectedEngine === 'langchain'">
        <mat-label>LLM Provider</mat-label>
        <mat-select [(ngModel)]="selectedLlmProvider" (selectionChange)="onEngineChange()">
          <mat-option value="openai">OpenAI</mat-option>
          <mat-option value="google">Google Gemini</mat-option>
          <mat-option value="anthropic">Anthropic</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width" *ngIf="selectedEngine === 'langchain'">
        <mat-label>Model</mat-label>
        <input matInput [(ngModel)]="selectedLlmModel" [placeholder]="getModelPlaceholder()">
      </mat-form-field>

      <div class="engine-hint" *ngIf="selectedEngine === 'langchain'">
        <mat-icon>vpn_key</mat-icon>
        <span>API keys are configured in <strong>Settings &gt; AI Engine</strong></span>
      </div>
    </div>
  </mat-tab>

  <mat-tab>
    <ng-template mat-tab-label>
      <mat-icon>description</mat-icon>
      <span>Prompt</span>
    </ng-template>
          <div class="tab-content prompt-tab">
            <div class="prompt-type-selector">
              <span class="prompt-type-label">Type:</span>
              <span class="prompt-type-value">{{ step.agent ? 'Agent' : 'Script' }}</span>
            </div>
            <div class="editor-container">
              <div class="editor-header">
                <mat-icon>description</mat-icon>
                <span>Prompt Content</span>
              </div>
              <textarea 
                #promptEditor
                class="content-editor prompt-editor" 
                [(ngModel)]="promptContent"
                placeholder="Enter prompt content here..."
                spellcheck="false">
              </textarea>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" class="save-btn">
        <mat-icon>save</mat-icon>
        Save All
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
      padding: 0 !important;
      min-width: 750px;
      max-width: 900px;
      max-height: 70vh;
      background: #1e1e1e !important;
    }

    ::ng-deep .mat-mdc-tab-labels {
      background: #252525;
      border-bottom: 1px solid #3a3a3a;
      justify-content: space-between;
    }

    ::ng-deep .mat-mdc-tab-header {
      overflow-x: hidden;
    }

    ::ng-deep .mat-mdc-tab {
      color: #888 !important;
      min-width: 120px;
      flex: 1;
    }

    ::ng-deep .mat-mdc-tab.mat-mdc-tab-label-active {
      color: #4fc3f7 !important;
    }

    ::ng-deep .mat-mdc-tab .mat-icon {
      margin-right: 6px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      background: #1e1e1e;
    }

    .tab-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cli-tab {
      gap: 12px;
    }

.prompt-tab {
  gap: 12px;
}

.engine-tab {
  gap: 12px;
}

.engine-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(79, 195, 247, 0.08);
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #b0b0b0;
  line-height: 1.5;
}

.engine-info mat-icon {
  color: #4fc3f7;
  font-size: 18px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.engine-info strong {
  color: #4fc3f7;
}

.engine-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #888;
}

.engine-hint mat-icon {
  color: #ffc107;
  font-size: 18px;
  width: 18px;
  height: 18px;
}

.engine-hint strong {
  color: #e0e0e0;
}

    .prompt-type-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #252525;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
    }

    .prompt-type-label {
      color: #888;
      font-size: 0.9rem;
    }

    .prompt-type-value {
      color: #4fc3f7;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .type-field, .full-width {
      width: 100%;
    }

    ::ng-deep .type-field .mat-mdc-form-field-icon-prefix,
    ::ng-deep .full-width .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }

    ::ng-deep .type-field .mdc-notched-outline__leading,
    ::ng-deep .type-field .mdc-notched-outline__notch,
    ::ng-deep .type-field .mdc-notched-outline__trailing,
    ::ng-deep .full-width .mdc-notched-outline__leading,
    ::ng-deep .full-width .mdc-notched-outline__notch,
    ::ng-deep .full-width .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }

    ::ng-deep .type-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .type-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .type-field.mat-focused .mdc-notched-outline__trailing,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__trailing {
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

    .content-editor {
      width: 100%;
      min-height: 180px;
      max-height: 250px;
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

    .prompt-editor {
      min-height: 200px;
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
export class StepSettingsDialogComponent {
  selectedTabIndex = 0;

  inputType = 'txt';
  inputContent = '';

  outputType = 'txt';
  outputContent = '';

  selectedCli = 'opencode';
  customCli = '';
  parameters = '';
  arguments_ = '';

  selectedRuntime = 'cmd';

  promptContent = '';

  selectedEngine: string = 'langchain';
  selectedLlmProvider: string = 'openai';
  selectedLlmModel: string = '';

  step: PipelineStep;
  targets: { name: string }[] = [];

  get isScriptStep(): boolean {
    return this.step.type === 'script';
  }

  get showCustomCliInput(): boolean {
    if (this.isScriptStep) {
      return this.selectedRuntime === 'custom';
    }
    return this.selectedCli === 'custom';
  }

  constructor(
    public dialogRef: MatDialogRef<StepSettingsDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: StepSettingsDialogData
  ) {
    this.step = data.step;

    this.inputContent = data.step.inputContent || '';
    this.inputType = data.step.inputType || 'txt';

    this.outputContent = data.step.stepOutput || '';
    this.outputType = data.step.stepOutputType || 'txt';

    this.apiService.getTargets().subscribe({
      next: (targets) => {
        this.targets = targets;
        this.initializeCliFromProjectTarget(data.projectTarget);
        this.cdr.detectChanges();
      },
      error: () => {
        this.initializeCliFromProjectTarget(data.projectTarget);
        this.cdr.detectChanges();
      }
    });

    if (this.isScriptStep) {
      this.selectedRuntime = data.step.runtime || 'cmd';
      this.customCli = data.step.cli || '';
    }
    this.parameters = data.step.parameters || '';
    this.arguments_ = data.step.arguments || '';

    this.promptContent = data.step.agent?.prompt || data.step.script?.content || '';

    if (data.step.engine) {
      this.selectedEngine = data.step.engine;
    } else if (data.step.cli) {
      this.selectedEngine = 'cli';
    }
    this.selectedLlmProvider = data.step.llmProvider || 'openai';
    this.selectedLlmModel = data.step.llmModel || '';
  }

  private initializeCliFromProjectTarget(projectTarget?: string): void {
    if (!this.isScriptStep) {
      const cli = this.step.cli || '';
      if (cli === 'opencode' || cli === 'copilot') {
        this.selectedCli = cli;
        return;
      }
      if (cli) {
        const targetMatch = this.targets.find(t => t.name.toLowerCase() === cli.toLowerCase());
        if (targetMatch) {
          this.selectedCli = cli;
          return;
        }
      }
      if (projectTarget) {
        const targetMatch = this.targets.find(t => t.name.toLowerCase() === projectTarget.toLowerCase());
        if (targetMatch) {
          this.selectedCli = projectTarget;
        } else if (projectTarget === 'opencode' || projectTarget === 'copilot') {
          this.selectedCli = projectTarget;
        }
      }
    }
  }

  onInputTypeChange(): void {
    this.cdr.detectChanges();
  }

  onOutputTypeChange(): void {
    this.cdr.detectChanges();
  }

  onCliChange(): void {
    if (this.selectedCli && this.selectedCli !== 'custom') {
      this.selectedEngine = 'cli';
    }
    this.cdr.detectChanges();
  }

  onEngineChange(): void {
    this.cdr.detectChanges();
  }

  getModelPlaceholder(): string {
    const defaults: Record<string, string> = {
      openai: 'gpt-4o-mini',
      google: 'gemini-2.0-flash',
      anthropic: 'claude-3-5-haiku-20241022'
    };
    return defaults[this.selectedLlmProvider] || '';
  }

  onInputEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      this.inputContent = this.inputContent.substring(0, start) + '  ' + this.inputContent.substring(end);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      this.cdr.detectChanges();
    }
  }

  onOutputEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      this.outputContent = this.outputContent.substring(0, start) + '  ' + this.outputContent.substring(end);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      this.cdr.detectChanges();
    }
  }

  getCliValue(): string {
    if (this.isScriptStep) {
      if (this.selectedRuntime === 'custom') {
        return this.customCli.trim();
      }
      return this.selectedRuntime;
    }
    if (this.selectedCli === 'custom') {
      return this.customCli.trim();
    }
    return this.selectedCli;
  }

  getRuntimeValue(): string | undefined {
    return this.isScriptStep ? this.selectedRuntime : '';
  }

  onSave(): void {
    const pipelineId = this.data.pipelineId;
    const stepId = this.data.step.id!;

    this.apiService.saveStepInput(pipelineId, stepId, this.inputContent, this.inputType).subscribe({
      next: () => {
        this.apiService.saveStepConfigOutput(pipelineId, stepId, this.outputContent, this.outputType).subscribe({
          next: () => {
            this.apiService.saveStepCli(
              pipelineId,
              stepId,
              this.isScriptStep ? '' : this.getCliValue(),
              this.parameters,
              this.arguments_,
              this.getRuntimeValue()
            ).subscribe({
              next: () => {
                const engineToSave = this.isScriptStep ? undefined : this.selectedEngine;
                const providerToSave = this.selectedEngine === 'langchain' ? this.selectedLlmProvider : undefined;
                const modelToSave = this.selectedEngine === 'langchain' && this.selectedLlmModel ? this.selectedLlmModel : undefined;

                if (engineToSave) {
                  this.apiService.saveStepEngine(pipelineId, stepId, engineToSave, providerToSave, modelToSave).subscribe({
                    next: (updatedStep) => {
                      this.dialogRef.close(updatedStep);
                    },
                    error: (err) => {
                      console.error('Error saving engine:', err);
                      this.dialogRef.close();
                    }
                  });
                } else {
                  this.dialogRef.close();
                }
              },
              error: (err) => {
                console.error('Error saving CLI:', err);
              }
            });
          },
          error: (err) => {
            console.error('Error saving output:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error saving input:', err);
      }
    });
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSave();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}