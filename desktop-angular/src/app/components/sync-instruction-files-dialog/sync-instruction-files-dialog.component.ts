import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService, InstructionFile } from '../../services/api.service';

export interface SyncInstructionFilesDialogData {
  files: InstructionFile[];
  instructionName: string;
  targetPath: string;
  loading: boolean;
}

export interface SyncInstructionFilesDialogResult {
  targetPath: string;
  selectedFiles: InstructionFile[];
}

interface SelectableFile extends InstructionFile {
  selected: boolean;
}

@Component({
  selector: 'app-sync-instruction-files-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="sync-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">sync</mat-icon>
        <h2>Sync Files to Filesystem</h2>
      </div>

      <div class="dialog-content">
        <p class="description">
          Select files to create in the filesystem. The files will be created relative to the target path.
        </p>

        <mat-form-field class="path-field" appearance="outline" floatLabel="always">
          <mat-label>Target Path</mat-label>
          <input matInput [(ngModel)]="targetPath" placeholder="/path/to/directory">
          <mat-icon matPrefix>folder</mat-icon>
        </mat-form-field>

        <div class="files-section" *ngIf="!data.loading">
          <div class="section-header">
            <span>Available Files ({{ selectedCount }} selected)</span>
            <button mat-button (click)="selectAll()" *ngIf="files.length > 0">
              Select All
            </button>
          </div>

          <div class="files-list">
            <div class="file-item" *ngFor="let file of files; let i = index">
              <mat-checkbox
                [(ngModel)]="file.selected"
                color="primary"
                class="file-checkbox">
                <div class="file-info">
                  <span class="file-name">{{ file.fileName }}</span>
                  <span class="file-path">{{ file.path }}</span>
                </div>
              </mat-checkbox>
            </div>
          </div>
        </div>

        <div class="loading-container" *ngIf="data.loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Creating files...</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn" [disabled]="data.loading">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button (click)="onCreate()" class="create-btn" 
                [disabled]="data.loading || !targetPath || selectedCount === 0">
          <mat-icon>save</mat-icon>
          Create
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sync-dialog {
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      min-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ffb74d;
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
      min-height: 250px;
    }

    .description {
      margin: 0 0 16px 0;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .path-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .files-section {
      background: #252525;
      border-radius: 8px;
      border: 1px solid #3a3a3a;
      padding: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      color: #e0e0e0;
      font-size: 0.9rem;
    }

    .section-header button {
      color: #4fc3f7;
      font-size: 0.8rem;
      padding: 0 8px;
    }

    .files-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .file-item {
      padding: 10px 12px;
      border-bottom: 1px solid #3a3a3a;
      transition: all 0.2s ease;
    }

    .file-item:last-child {
      border-bottom: none;
    }

    .file-item:hover {
      background: #2a2a2a;
    }

    .file-checkbox {
      width: 100%;
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .file-name {
      color: #4fc3f7;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .file-path {
      color: #888;
      font-size: 0.8rem;
      font-family: monospace;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    .loading-container p {
      margin: 0;
      color: #b0b0b0;
      font-size: 0.95rem;
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

    .cancel-btn:hover:not(:disabled) {
      background-color: #3a3a3a;
      color: #ffffff;
    }

    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .create-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    }

    .create-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
    }

    .create-btn:disabled {
      opacity: 0.5;
    }

    .create-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .path-field .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }

    ::ng-deep .path-field .mdc-notched-outline__leading,
    ::ng-deep .path-field .mdc-notched-outline__notch,
    ::ng-deep .path-field .mdc-notched-outline__trailing {
      border-color: #3a3a3a !important;
    }

    ::ng-deep .path-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .path-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .path-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #ffb74d !important;
    }

    ::ng-deep .path-field .mdc-floating-label {
      color: #888 !important;
    }

    ::ng-deep .path-field .mat-mdc-input-element {
      color: #ffffff !important;
    }
  `]
})
export class SyncInstructionFilesDialogComponent {
  targetPath: string;
  private selectableFiles: SelectableFile[] = [];

  constructor(
    public dialogRef: MatDialogRef<SyncInstructionFilesDialogComponent, SyncInstructionFilesDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: SyncInstructionFilesDialogData,
    private apiService: ApiService
  ) {
    this.targetPath = data.targetPath || '';
    this.selectableFiles = data.files.map(f => ({ ...f, selected: true }));
  }

  get files(): SelectableFile[] {
    return this.selectableFiles;
  }

  get selectedCount(): number {
    return this.selectableFiles.filter(f => f.selected).length;
  }

  selectAll(): void {
    const allSelected = this.selectableFiles.every(f => f.selected);
    this.selectableFiles.forEach(f => f.selected = !allSelected);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    const selectedFiles = this.selectableFiles.filter(f => f.selected);
    this.dialogRef.close({
      targetPath: this.targetPath,
      selectedFiles
    });
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    if (this.targetPath && this.selectedCount > 0) {
      this.onCreate();
    }
  }
}