import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, ProjectFile } from '../../services/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

export interface CreateFileDialogData {
  projectId: number;
  fileId?: number;
  fileName?: string;
  content?: string;
  files?: ProjectFile[];
  showFileList?: boolean;
}

@Component({
  selector: 'app-create-file-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    ConfirmDialogComponent
  ],
  template: `
    <div class="file-dialog">
      <ng-container *ngIf="data.showFileList && !showForm">
        <div class="dialog-header">
          <mat-icon class="header-icon">folder</mat-icon>
          <h2 class="dialog-title">Select Config File</h2>
          <button class="close-btn" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <mat-dialog-content class="dialog-content">
          <div class="files-list-container">
            <div class="file-option new-file" (click)="createNew()">
              <mat-icon>add_circle</mat-icon>
              <span>Create New File</span>
            </div>
            <div class="file-option" *ngFor="let f of files" (click)="selectFile(f)">
              <mat-icon>description</mat-icon>
              <span>{{ f.fileName }}</span>
              <button class="delete-btn" (click)="deleteFile(f, $event)" title="Delete file">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </mat-dialog-content>
      </ng-container>

      <ng-container *ngIf="!data.showFileList || showForm">
        <div class="dialog-header">
          <mat-icon class="header-icon">{{ data.fileId ? 'edit' : 'insert_drive_file' }}</mat-icon>
          <h2 class="dialog-title">{{ data.fileId ? 'Edit' : 'Create' }} Config File</h2>
          <button class="close-btn" (click)="data.showFileList && showForm ? goBack() : close()">
            <mat-icon>{{ data.showFileList && showForm ? 'arrow_back' : 'close' }}</mat-icon>
          </button>
        </div>
        
        <mat-dialog-content class="dialog-content">
          <div class="form-group">
            <label for="fileName">
              <mat-icon>badge</mat-icon>
              File Name
            </label>
            <input 
              type="text" 
              id="fileName" 
              [(ngModel)]="fileName" 
              placeholder="e.g., opencode.json"
              class="form-input"
              [disabled]="!!data.fileId"
            />
          </div>
          
          <div class="form-group">
            <label for="content">
              <mat-icon>description</mat-icon>
              Content
            </label>
            <textarea 
              id="content" 
              [(ngModel)]="content" 
              placeholder="Enter file content..."
              class="form-textarea"
              rows="15"
            ></textarea>
          </div>
        </mat-dialog-content>
        
        <mat-dialog-actions align="end">
          <button class="btn btn-secondary" (click)="data.showFileList && showForm ? goBack() : close()">
            <mat-icon>close</mat-icon>
            {{ data.showFileList && showForm ? 'Back' : 'Cancel' }}
          </button>
          <button class="btn btn-primary" (click)="save()" [disabled]="!fileName || saving">
            <mat-icon *ngIf="!saving">save</mat-icon>
            <mat-icon *ngIf="saving" class="spin">sync</mat-icon>
            {{ saving ? 'Saving...' : (data.fileId ? 'Update' : 'Save') }}
          </button>
        </mat-dialog-actions>
      </ng-container>
    </div>
  `,
  styles: [`
    .file-dialog {
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

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: #b0b0b0;
    }

    .form-group label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      color: #e0e0e0;
      font-size: 0.95rem;
    }

    .form-input:focus {
      outline: none;
      border-color: #4fc3f7;
    }

    .form-textarea {
      width: 100%;
      padding: 12px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      color: #e0e0e0;
      font-size: 0.9rem;
      font-family: 'Consolas', 'Monaco', monospace;
      resize: vertical;
      min-height: 200px;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #4fc3f7;
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

    .btn-primary {
      background: #4fc3f7;
      color: #121212;
    }

    .btn-primary:hover {
      background: #29b6f6;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .files-list-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .file-option:hover {
      background: #2a2a2a;
      border-color: #4fc3f7;
    }

    .file-option span {
      flex: 1;
    }

    .file-option.new-file {
      border-color: #4fc3f7;
      color: #4fc3f7;
    }

    .file-option.new-file:hover {
      background: #1e3a4d;
    }

    .file-option mat-icon {
      color: #888;
    }

    .file-option.new-file mat-icon {
      color: #4fc3f7;
    }

    .delete-btn {
      margin-left: auto;
      background: transparent;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .delete-btn:hover {
      background: #d32f2f;
      color: #fff;
    }
  `]
})
export class CreateFileDialogComponent {
  fileName = '';
  content = '';
  saving = false;
  selectedFile: ProjectFile | null = null;
  showForm = false;
  deleting = false;
  files: ProjectFile[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateFileDialogData,
    private apiService: ApiService,
    private dialog: MatDialog
  ) {
    if (data.fileName) {
      this.fileName = data.fileName;
    }
    if (data.content) {
      this.content = data.content;
    }
    this.files = data.files ? [...data.files] : [];
  }

  selectFile(file: ProjectFile) {
    this.selectedFile = file;
    this.fileName = file.fileName;
    this.content = file.content || '';
    this.data.fileId = file.id;
    this.showForm = true;
  }

  createNew() {
    this.selectedFile = null;
    this.fileName = '';
    this.content = '';
    this.data.fileId = undefined;
    this.showForm = true;
  }

  goBack() {
    this.selectedFile = null;
    this.showForm = false;
  }

  save() {
    if (!this.fileName || this.saving) {
      return;
    }

    this.saving = true;

    if (this.data.fileId) {
      this.apiService.updateProjectFile(this.data.projectId, this.data.fileId, this.content).subscribe({
        next: () => {
          this.saving = false;
          this.dialogRef.close({ fileId: this.data.fileId, fileName: this.fileName, content: this.content });
        },
        error: (err) => {
          console.error('Error updating file:', err);
          this.saving = false;
        }
      });
    } else {
      this.apiService.createProjectFile(this.data.projectId, this.fileName, this.content).subscribe({
        next: (response) => {
          this.saving = false;
          this.dialogRef.close({ fileId: response.id, fileName: this.fileName, content: this.content });
        },
        error: (err) => {
          console.error('Error creating file:', err);
          this.saving = false;
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }

  deleteFile(file: ProjectFile, event: Event) {
    event.stopPropagation();
    if (!file.id || this.deleting) {
      return;
    }

    const dialogData: ConfirmDialogData = {
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.fileName}"? This action cannot be undone.`
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !file.id) {
        return;
      }

      this.deleting = true;
      this.apiService.deleteProjectFile(this.data.projectId, file.id).subscribe({
        next: () => {
          this.deleting = false;
          this.files = this.files.filter(f => f.id !== file.id);
        },
        error: (err) => {
          console.error('Error deleting file:', err);
          this.deleting = false;
        }
      });
    });
  }
}