import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Shortcut {
  keys: string;
  action: string;
  description: string;
}

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="shortcuts-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">keyboard</mat-icon>
        <h2 class="dialog-title">Keyboard Shortcuts</h2>
        <button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="shortcuts-list">
          <div class="shortcuts-section">
            <h3>Navigation</h3>
            <div class="shortcut-item" *ngFor="let shortcut of navigationShortcuts">
              <span class="shortcut-keys">{{ shortcut.keys }}</span>
              <span class="shortcut-action">{{ shortcut.action }}</span>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h3>Editor</h3>
            <div class="shortcut-item" *ngFor="let shortcut of editorShortcuts">
              <span class="shortcut-keys">{{ shortcut.keys }}</span>
              <span class="shortcut-action">{{ shortcut.action }}</span>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h3>Project</h3>
            <div class="shortcut-item" *ngFor="let shortcut of projectShortcuts">
              <span class="shortcut-keys">{{ shortcut.keys }}</span>
              <span class="shortcut-action">{{ shortcut.action }}</span>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h3>Pipeline Executions</h3>
            <div class="shortcut-item" *ngFor="let shortcut of pipelineExecutionsShortcuts">
              <span class="shortcut-keys">{{ shortcut.keys }}</span>
              <span class="shortcut-action">{{ shortcut.action }}</span>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h3>Dialogs</h3>
            <div class="shortcut-item" *ngFor="let shortcut of dialogShortcuts">
              <span class="shortcut-keys">{{ shortcut.keys }}</span>
              <span class="shortcut-action">{{ shortcut.action }}</span>
            </div>
          </div>
        </div>
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
    .shortcuts-dialog {
      background: #121212;
      color: #e0e0e0;
      min-width: 450px;
      max-width: 500px;
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
      flex: 1;
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .close-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #333;
      color: #fff;
    }

    .dialog-content {
      padding: 0;
      max-height: 60vh;
      overflow-y: auto;
    }

    .shortcuts-list {
      padding: 12px 20px;
    }

    .shortcuts-section {
      margin-bottom: 20px;
    }

    .shortcuts-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #4fc3f7;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #1a1a1a;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .shortcut-keys {
      font-family: monospace;
      font-size: 13px;
      color: #ff9800;
      background: #2a2a2a;
      padding: 4px 10px;
      border-radius: 4px;
      min-width: 100px;
      text-align: center;
    }

    .shortcut-action {
      flex: 1;
      margin-left: 16px;
      font-size: 14px;
      color: #ccc;
    }

    mat-dialog-actions {
      padding: 16px 20px;
      background: #1e1e1e;
      border-top: 1px solid #2a2a2a;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-secondary {
      background: #333;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #444;
    }
  `]
})
export class ShortcutsDialogComponent {
  navigationShortcuts: Shortcut[] = [
    { keys: 'Ctrl+Shift+A', action: 'Agents', description: 'Go to Agents page' },
    { keys: 'Ctrl+Shift+S', action: 'Scripts', description: 'Go to Scripts page' },
    { keys: 'Ctrl+Shift+T', action: 'Templates', description: 'Go to Templates page' },
    { keys: 'Ctrl+Shift+N', action: 'Namespaces', description: 'Go to Namespaces page' },
    { keys: 'Ctrl+Shift+I', action: 'Instructions', description: 'Go to Instructions page' },
    { keys: 'Ctrl+Shift+L', action: 'Pipelines', description: 'Go to Pipelines page' },
    { keys: 'Ctrl+Shift+P', action: 'Project', description: 'Go to Project page' },
    { keys: 'Ctrl+B', action: 'Toggle Panel', description: 'Toggle left panel' },
    { keys: 'Ctrl+Shift+Q', action: 'Shortcuts', description: 'Open shortcuts info' },
    { keys: 'Ctrl+Shift+X', action: 'Tools', description: 'Open tools menu' },
    { keys: 'Ctrl+Alt+H', action: 'Home', description: 'Go to home/menu page' },
  ];

  editorShortcuts: Shortcut[] = [
    { keys: 'Ctrl+Shift+E', action: 'Open in Editor', description: 'Open content in editor (Agents, Scripts, Instructions)' },
    { keys: 'Ctrl+Shift+K', action: 'Copy to Clipboard', description: 'Copy content to clipboard (Agents, Scripts, Instructions)' },
  ];

projectShortcuts: Shortcut[] = [
    { keys: 'Ctrl+Shift+R', action: 'Run Pipeline', description: 'Run selected pipeline' },
    { keys: 'Ctrl+X', action: 'Stop Pipeline', description: 'Stop running pipeline (only when running)' },
  ];

  pipelineExecutionsShortcuts: Shortcut[] = [
    { keys: 'Ctrl+Alt+P', action: 'Back', description: 'Go back to project (Pipeline Executions page)' },
    { keys: 'Ctrl+Shift+U', action: 'Refresh', description: 'Refresh runs list (Pipeline Executions page)' },
  ];

  dialogShortcuts: Shortcut[] = [
    { keys: 'Ctrl+Enter', action: 'Confirm/Save', description: 'Confirm or save in dialogs' },
  ];

  constructor(private dialogRef: MatDialogRef<ShortcutsDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}