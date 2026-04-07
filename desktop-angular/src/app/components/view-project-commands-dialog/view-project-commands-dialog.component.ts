import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, Command } from '../../services/api.service';

export interface ViewProjectCommandsDialogData {
  projectId: number;
}

@Component({
  selector: 'app-view-project-commands-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">terminal</mat-icon>
      <h2 class="dialog-title">Project Commands</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="table-container">
        <div *ngIf="loading" class="loading-overlay">
          <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
          <span>Loading commands...</span>
        </div>
        
        <div *ngIf="!loading && commands.length === 0" class="empty-state">
          <mat-icon class="empty-icon">terminal</mat-icon>
          <span class="empty-text">No commands assigned</span>
          <span class="empty-hint">Click the + button to add commands to this project</span>
        </div>
        
        <table mat-table [dataSource]="commands" class="command-table" *ngIf="!loading && commands.length > 0">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Command Name</th>
            <td mat-cell *matCellDef="let command">
              <div class="command-name">
                <mat-icon class="command-icon">terminal</mat-icon>
                {{ command.name }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let command">
              <span class="category-badge">{{ command.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="scope">
            <th mat-header-cell *matHeaderCellDef>Scope</th>
            <td mat-cell *matCellDef="let command">
              <span class="scope-badge">{{ command.scope }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let command">
              <button mat-icon-button (click)="removeCommand(command, $event)" class="remove-btn" title="Remove command">
                <mat-icon>remove_circle</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="command-row"></tr>
        </table>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onClose()" class="close-btn">
        <mat-icon>close</mat-icon>
        Close
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
      color: #64b5f6;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.3px;
    }
    
    .dialog-content {
      padding: 0 !important;
      min-width: 520px;
      max-width: 600px;
      background: #1e1e1e !important;
    }
    
    .table-container {
      position: relative;
      min-height: 200px;
      margin: 0 24px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #3a3a3a;
      background: #2a2a2a;
    }
    
    .loading-overlay,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #888;
      gap: 12px;
    }
    
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #555;
    }
    
    .empty-text {
      font-size: 1.1rem;
      font-weight: 500;
      color: #b0b0b0;
    }
    
    .empty-hint {
      font-size: 0.875rem;
      color: #666;
    }
    
    .command-table {
      width: 100%;
      background: transparent;
    }
    
    ::ng-deep .mat-mdc-header-cell {
      background-color: #252525 !important;
      color: #888 !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      border-bottom: 1px solid #3a3a3a !important;
      padding: 16px !important;
    }
    
    ::ng-deep .mat-mdc-cell {
      color: #e0e0e0 !important;
      font-size: 0.9rem !important;
      padding: 16px !important;
      border-bottom: 1px solid #333 !important;
    }
    
    .command-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .command-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #64b5f6;
    }
    
    .category-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
      background: rgba(100, 181, 246, 0.2);
      color: #64b5f6;
    }
    
    .scope-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
      background: rgba(255, 202, 40, 0.2);
      color: #ffca28;
    }
    
    .command-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .command-row:hover {
      background-color: #333 !important;
    }
    
    .remove-btn {
      color: #ff8a80;
    }
    
    .remove-btn:hover {
      background-color: rgba(255, 138, 128, 0.1);
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
    
    .close-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #b0b0b0;
      border-color: #555;
    }
    
    .close-btn:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #64b5f6 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewProjectCommandsDialogComponent {
  commands: Command[] = [];
  loading = false;
  displayedColumns = ['name', 'category', 'scope', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<ViewProjectCommandsDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: ViewProjectCommandsDialogData
  ) {
    this.loadCommands();
  }

  loadCommands(): void {
    this.loading = true;
    this.apiService.getProjectCommands(this.data.projectId).subscribe({
      next: (commands) => {
        this.commands = commands || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading project commands:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeCommand(command: Command, event: Event): void {
    event.stopPropagation();
    if (command.id) {
      this.apiService.removeCommandFromProject(this.data.projectId, command.id).subscribe({
        next: () => {
          this.loadCommands();
        },
        error: (err) => {
          console.error('Error removing command:', err);
        }
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
