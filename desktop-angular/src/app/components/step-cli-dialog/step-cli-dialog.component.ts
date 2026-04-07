import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService, PipelineStep } from '../../services/api.service';

export interface StepCliDialogData {
  step: PipelineStep;
  pipelineId: number;
}

@Component({
  selector: 'app-step-cli-dialog',
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
      <mat-icon class="header-icon">terminal</mat-icon>
      <h2 class="dialog-title">CLI Configuration</h2>
      <span class="step-label">Step: {{ data.step.agent?.name || data.step.script?.name || 'Unknown' }}</span>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="form-field-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>CLI</mat-label>
          <mat-select [(ngModel)]="selectedCli" (selectionChange)="onCliChange()">
            <mat-option value="opencode">opencode</mat-option>
            <mat-option value="copilot">copilot</mat-option>
            <mat-option value="custom">Custom...</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="selectedCli === 'custom'">
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
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" class="save-btn" [disabled]="!isValid()">
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
      min-width: 400px;
      max-width: 500px;
      background: #1e1e1e !important;
    }
    
    .form-field-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }

    ::ng-deep .full-width .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }

    ::ng-deep .full-width .mdc-notched-outline__leading,
    ::ng-deep .full-width .mdc-notched-outline__notch,
    ::ng-deep .full-width .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }

    ::ng-deep .full-width.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepCliDialogComponent {
  selectedCli = '';
  customCli = '';
  parameters = '';
  arguments_ = '';

  constructor(
    public dialogRef: MatDialogRef<StepCliDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: StepCliDialogData
  ) {
    const cli = data.step.cli || '';
    if (cli === 'opencode' || cli === 'copilot') {
      this.selectedCli = cli;
    } else if (cli) {
      this.selectedCli = 'custom';
      this.customCli = cli;
    } else {
      this.selectedCli = 'opencode';
    }
    this.parameters = data.step.parameters || '';
    this.arguments_ = data.step.arguments || '';
  }

  onCliChange(): void {
    this.cdr.detectChanges();
  }

  isValid(): boolean {
    if (this.selectedCli === 'custom') {
      return !!this.customCli.trim();
    }
    return !!this.selectedCli;
  }

  getCliValue(): string {
    if (this.selectedCli === 'custom') {
      return this.customCli.trim();
    }
    return this.selectedCli;
  }

  onSave(): void {
    this.apiService.saveStepCli(
      this.data.pipelineId,
      this.data.step.id!,
      this.getCliValue(),
      this.parameters,
      this.arguments_
    ).subscribe({
      next: (step) => {
        this.dialogRef.close(step);
      },
      error: (err) => {
        console.error('Error saving CLI:', err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
