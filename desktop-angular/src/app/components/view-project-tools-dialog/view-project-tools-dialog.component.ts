import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, Tool } from '../../services/api.service';

export interface ViewProjectToolsDialogData {
  projectId: number;
}

@Component({
  selector: 'app-view-project-tools-dialog',
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
      <mat-icon class="header-icon">build</mat-icon>
      <h2 class="dialog-title">Project Tools</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="table-container">
        <div *ngIf="loading" class="loading-overlay">
          <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
          <span>Loading tools...</span>
        </div>
        
        <div *ngIf="!loading && tools.length === 0" class="empty-state">
          <mat-icon class="empty-icon">build</mat-icon>
          <span class="empty-text">No tools assigned</span>
          <span class="empty-hint">Click the + button to add tools to this project</span>
        </div>
        
        <table mat-table [dataSource]="tools" class="tool-table" *ngIf="!loading && tools.length > 0">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Tool Name</th>
            <td mat-cell *matCellDef="let tool">
              <div class="tool-name">
                <mat-icon class="tool-icon">build</mat-icon>
                {{ tool.name }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let tool">
              <span class="category-badge">{{ tool.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="namespace">
            <th mat-header-cell *matHeaderCellDef>Namespace</th>
            <td mat-cell *matCellDef="let tool">
              <span class="namespace-badge">{{ tool.namespace }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let tool">
              <button mat-icon-button (click)="removeTool(tool, $event)" class="remove-btn" title="Remove tool">
                <mat-icon>remove_circle</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="tool-row"></tr>
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
      color: #ffcc80;
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
    
    .tool-table {
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
    
    .tool-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .tool-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ffcc80;
    }
    
    .category-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
      background: rgba(255, 204, 128, 0.2);
      color: #ffcc80;
    }
    
    .namespace-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: lowercase;
      background: rgba(255, 202, 40, 0.2);
      color: #ffca28;
    }
    
    .tool-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .tool-row:hover {
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
      stroke: #ffcc80 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewProjectToolsDialogComponent {
  tools: Tool[] = [];
  loading = false;
  displayedColumns = ['name', 'category', 'namespace', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<ViewProjectToolsDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: ViewProjectToolsDialogData
  ) {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    this.apiService.getProjectTools(this.data.projectId).subscribe({
      next: (tools) => {
        this.tools = tools || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading project tools:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeTool(tool: Tool, event: Event): void {
    event.stopPropagation();
    if (tool.id) {
      this.apiService.removeToolFromProject(this.data.projectId, tool.id).subscribe({
        next: () => {
          this.loadTools();
        },
        error: (err) => {
          console.error('Error removing tool:', err);
        }
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}