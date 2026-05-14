import { Component, Inject, OnInit, ViewEncapsulation, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface EditFileDialogData {
  fileName: string;
  path: string;
  content: string;
  type: 'skill' | 'tool' | 'plugin';
}

export interface EditFileDialogResult {
  content: string;
}

type FileType = 'json' | 'markdown' | 'xml' | 'yaml' | 'javascript' | 'python' | 'plaintext' | 'html' | 'css' | 'sql' | 'shell' | 'unknown';

@Component({
  selector: 'app-edit-file-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="modal-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">edit_document</mat-icon>
        <h2 class="dialog-title">Edit File: {{ data.fileName }}</h2>
        <span class="file-type-badge" [ngClass]="fileType">{{ fileType | uppercase }}</span>
      </div>
      
      <div class="dialog-content">
        <div class="file-info">
          <mat-icon>folder</mat-icon>
          <span class="file-path">{{ data.path }}/{{ data.fileName }}</span>
        </div>
        
        <mat-form-field class="full-width content-field" appearance="outline" floatLabel="always">
          <mat-label>File Content</mat-label>
          <textarea matInput 
                    #contentTextarea
                    class="content-editor"
                    [ngStyle]="getTextareaStyles()"
                    [style.color]="fileType === 'json' ? '#ce9178' : (fileType === 'yaml' ? '#9cdcfe' : '')"
                    [(ngModel)]="editedContent" 
                    rows="20" 
                    (keydown.tab)="onTabKey($event)"
                    ></textarea>
          <mat-icon matPrefix>code</mat-icon>
        </mat-form-field>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSave()" class="save-btn">
          <mat-icon>save</mat-icon>
          Save
        </button>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-input-element {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 0.9rem !important;
    }

    ::ng-deep textarea.mat-mdc-input-element {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 0.9rem !important;
    }

    .modal-container {
      background: #1e1e1e;
      min-width: 600px;
      max-width: 900px;
      min-height: 520px;
      max-height: 90vh;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
      flex-shrink: 0;
    }
    
    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ffb74d;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.3px;
      flex: 1;
    }

    .file-type-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .file-type-badge.json {
      background: rgba(229, 115, 115, 0.15);
      color: #ef5350;
      border: 1px solid rgba(239, 83, 80, 0.3);
    }

    .file-type-badge.markdown {
      background: rgba(79, 195, 247, 0.15);
      color: #29b6f6;
      border: 1px solid rgba(41, 182, 246, 0.3);
    }

    .file-type-badge.xml {
      background: rgba(255, 183, 77, 0.15);
      color: #ffa726;
      border: 1px solid rgba(255, 167, 38, 0.3);
    }

    .file-type-badge.yaml {
      background: rgba(102, 187, 106, 0.15);
      color: #66bb6a;
      border: 1px solid rgba(102, 187, 106, 0.3);
    }

    .file-type-badge.javascript {
      background: rgba(255, 229, 100, 0.15);
      color: #ffe64d;
      border: 1px solid rgba(255, 230, 77, 0.3);
    }

    .file-type-badge.python {
      background: rgba(130, 177, 255, 0.15);
      color: #82b1ff;
      border: 1px solid rgba(130, 177, 255, 0.3);
    }

    .file-type-badge.html {
      background: rgba(255, 138, 101, 0.15);
      color: #ff8a65;
      border: 1px solid rgba(255, 138, 101, 0.3);
    }

    .file-type-badge.css {
      background: rgba(205, 220, 255, 0.15);
      color: #cddcff;
      border: 1px solid rgba(205, 220, 255, 0.3);
    }

    .file-type-badge.sql {
      background: rgba(197, 225, 165, 0.15);
      color: #c5e1a5;
      border: 1px solid rgba(197, 225, 165, 0.3);
    }

    .file-type-badge.shell {
      background: rgba(197, 202, 233, 0.15);
      color: #b3e5fc;
      border: 1px solid rgba(179, 229, 252, 0.3);
    }

    .file-type-badge.plaintext {
      background: rgba(176, 190, 197, 0.15);
      color: #b0bec5;
      border: 1px solid rgba(176, 190, 197, 0.3);
    }

    .file-type-badge.unknown {
      background: rgba(158, 158, 158, 0.15);
      color: #9e9e9e;
      border: 1px solid rgba(158, 158, 158, 0.3);
    }
    
    .dialog-content {
      flex: 1;
      padding: 24px;
      min-height: 320px;
      max-height: calc(90vh - 140px);
      background: #1e1e1e;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    
    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #252525;
      border-radius: 8px;
      color: #4fc3f7;
      font-size: 0.875rem;
      font-family: monospace;
    }
    
    .file-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .content-field {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    ::ng-deep .content-field .mat-mdc-form-field-flex {
      display: flex;
      flex: 1;
      min-height: 330px;
    }

    ::ng-deep .content-field .mat-mdc-text-field-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 330px;
    }

    ::ng-deep .content-field .mat-mdc-form-field-infix {
      display: flex;
      flex: 1;
      padding: 12px 0;
      min-height: 330px;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element {
      flex: 1;
      min-height: 330px;
      overflow-y: auto;
      resize: none;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      box-shadow: none !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #d4d4d4;
      caret-color: #ffb74d;
      padding: 8px 0;
      transition: color 0.2s ease;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element:hover {
      color: #e0e0e0;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element::selection {
      background: rgba(255, 183, 77, 0.3);
      color: #ffffff;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element::-webkit-scrollbar-track {
      background: #252525;
      border-radius: 5px;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      border-radius: 5px;
      border: 2px solid #252525;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element::-webkit-scrollbar-thumb:hover {
      background: #5a5a5a;
    }

    ::ng-deep .content-field textarea.mat-mdc-input-element::-webkit-scrollbar-corner {
      background: #252525;
    }

    /* File type specific colors */
    ::ng-deep .content-field textarea.editor-markdown {
      color: #c3e88d;
    }
    ::ng-deep .content-field textarea.editor-markdown:hover {
      color: #d4ed9e;
    }

    ::ng-deep .content-field textarea.editor-xml {
      color: #e6c07b;
    }
    ::ng-deep .content-field textarea.editor-xml:hover {
      color: #f0d08c;
    }

    ::ng-deep .content-field textarea.editor-yaml {
      color: #89ddff;
    }
    ::ng-deep .content-field textarea.editor-yaml:hover {
      color: #9fe6ff;
    }

    /* Syntax highlighting classes - same as step-settings-dialog */
    ::ng-deep textarea.mat-mdc-input-element.json-syntax {
      color: #ce9178 !important;
    }

    ::ng-deep textarea.mat-mdc-input-element.yml-syntax {
      color: #9cdcfe !important;
    }

    ::ng-deep .content-field textarea.editor-json {
      color: #ce9178;
    }
    ::ng-deep .content-field textarea.editor-json:hover {
      color: #e0a899;
    }

    ::ng-deep .content-field textarea.editor-javascript {
      color: #c5e3f6;
    }
    ::ng-deep .content-field textarea.editor-javascript:hover {
      color: #d4ebf8;
    }

    ::ng-deep .content-field textarea.editor-python {
      color: #c792ea;
    }
    ::ng-deep .content-field textarea.editor-python:hover {
      color: #d4a3ec;
    }

    ::ng-deep .content-field textarea.editor-html {
      color: #f78c6c;
    }
    ::ng-deep .content-field textarea.editor-html:hover {
      color: #fa9c7c;
    }

    ::ng-deep .content-field textarea.editor-css {
      color: #c5e3f6;
    }
    ::ng-deep .content-field textarea.editor-css:hover {
      color: #d4ebf8;
    }

    ::ng-deep .content-field textarea.editor-sql {
      color: #89ddff;
    }
    ::ng-deep .content-field textarea.editor-sql:hover {
      color: #9fe6ff;
    }

    ::ng-deep .content-field textarea.editor-shell {
      color: #c3e88d;
    }
    ::ng-deep .content-field textarea.editor-shell:hover {
      color: #d4ed9e;
    }

    ::ng-deep .content-field textarea.editor-plaintext {
      color: #b0b0b0;
    }
    ::ng-deep .content-field textarea.editor-plaintext:hover {
      color: #c0c0c0;
    }
    
    mat-form-field {
      margin-bottom: 4px;
    }
    
    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mat-mdc-text-field-wrapper {
      background-color: #2a2a2a;
      border-radius: 8px;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__trailing {
      border-color: #ffb74d;
    }
    
    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-floating-label {
      color: #ffb74d !important;
    }
    
    ::ng-deep textarea[matInput],
    ::ng-deep .content-field textarea.mat-mdc-input-element {
      color: #d4d4d4 !important;
    }
    
    ::ng-deep textarea[matInput]::placeholder,
    ::ng-deep .content-field textarea.mat-mdc-input-element::placeholder {
      color: #666;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 28px 24px;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
      border-radius: 0 0 12px 12px;
      margin: 0;
      flex-shrink: 0;
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
      background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
    }
    
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
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
  `]
})
export class EditFileDialogComponent implements OnInit {
  @ViewChild('contentTextarea') contentTextarea!: ElementRef<HTMLTextAreaElement>;
  
  editedContent = '';
  fileType: FileType = 'unknown';

  constructor(
    public dialogRef: MatDialogRef<EditFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditFileDialogData
  ) {
    this.editedContent = data.content || '';
    this.fileType = this.detectFileType(data.fileName);
  }

  ngOnInit(): void {
  }

  getTextareaStyles(): Record<string, string> {
    const baseStyles: Record<string, string> = {
      'font-family': "'Consolas', 'Monaco', 'Courier New', monospace",
      'font-size': '0.9rem'
    };

    if (this.fileType === 'json') {
      baseStyles['color'] = '#ce9178';
    } else if (this.fileType === 'yaml') {
      baseStyles['color'] = '#9cdcfe';
    }

    return baseStyles;
  }

  private detectFileType(fileName: string): FileType {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const typeMap: Record<string, FileType> = {
      'json': 'json',
      'md': 'markdown',
      'markdown': 'markdown',
      'xml': 'xml',
      'xaml': 'xml',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'css',
      'less': 'css',
      'js': 'javascript',
      'ts': 'javascript',
      'jsx': 'javascript',
      'tsx': 'javascript',
      'py': 'python',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'shell',
      'bat': 'shell',
      'cmd': 'shell',
      'txt': 'plaintext',
      'log': 'plaintext',
      'env': 'plaintext',
      'properties': 'plaintext'
    };
    return typeMap[ext] || 'unknown';
  }

  onTabKey(event: Event): void {
    event.preventDefault();
    const keyboardEvent = event as KeyboardEvent;
    const textarea = this.contentTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    this.editedContent = this.editedContent.substring(0, start) + '  ' + this.editedContent.substring(end);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({ content: this.editedContent });
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSave();
  }
}
