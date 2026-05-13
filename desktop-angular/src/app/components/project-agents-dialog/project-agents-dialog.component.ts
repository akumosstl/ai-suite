import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ApiService, Agent } from '../../services/api.service';

export interface ProjectAgentsDialogData {
  projectId: number;
}

@Component({
  selector: 'app-project-agents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTabsModule,
    ConfirmDialogComponent
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">smart_toy</mat-icon>
      <h2 class="dialog-title">Project Agents</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-tab-group [(selectedIndex)]="selectedTab" class="custom-tabs">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>list</mat-icon>
            <span>Project Agents</span>
          </ng-template>
          <div class="tab-content">
            <div class="table-container">
              <div *ngIf="loading" class="loading-overlay">
                <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                <span>Loading agents...</span>
              </div>
              
              <div *ngIf="!loading && projectAgents.length === 0" class="empty-state">
                <mat-icon class="empty-icon">smart_toy</mat-icon>
                <span class="empty-text">No agents assigned</span>
                <span class="empty-hint">Click the "Add Agents" tab to add agents to this project</span>
              </div>
              
              <table mat-table [dataSource]="projectAgents" class="agent-table" *ngIf="!loading && projectAgents.length > 0">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Agent Name</th>
                  <td mat-cell *matCellDef="let agent">
                    <div class="agent-name">
                      <mat-icon class="agent-icon">smart_toy</mat-icon>
                      {{ agent.name }}
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let agent">
                    <span class="category-badge">{{ agent.namespace }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="level">
                  <th mat-header-cell *matHeaderCellDef>Level</th>
                  <td mat-cell *matCellDef="let agent">
                    <span class="level-badge">{{ agent.level }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let agent">
                    <button mat-icon-button (click)="removeAgent(agent, $event)" class="remove-btn" title="Remove agent">
                      <mat-icon>remove_circle</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="agent-row"></tr>
              </table>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>add_circle</mat-icon>
            <span>Add Agents to Project</span>
          </ng-template>
          <div class="tab-content">
            <div class="search-section">
    <mat-form-field class="search-field" appearance="outline" floatLabel="always">
      <mat-label>Search agents...</mat-label>
      <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              <button mat-stroked-button (click)="search()" class="search-btn">
                <mat-icon>search</mat-icon>
                Search
              </button>
              <button mat-icon-button (click)="clearSearch()" aria-label="Clear search" class="clear-btn" *ngIf="searchTerm">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="table-container">
              <div *ngIf="loadingAvailable" class="loading-overlay">
                <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                <span>Loading agents...</span>
              </div>
              <div *ngIf="!loadingAvailable && availableAgents.length === 0" class="empty-state">
                <mat-icon class="empty-icon">smart_toy</mat-icon>
                <span class="empty-text">No agents found</span>
                <span class="empty-hint">Create a new agent or adjust your search</span>
              </div>
              <table mat-table [dataSource]="availableAgents" class="agent-table" *ngIf="!loadingAvailable && availableAgents.length > 0">
                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-checkbox (change)="$event ? toggleAllRows() : null" [checked]="selection.hasValue() && isAllSelected()" [indeterminate]="selection.hasValue() && !isAllSelected()"></mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox (click)="$event.stopPropagation()" (change)="$event ? toggleRow(row) : null" [checked]="selection.isSelected(row)"></mat-checkbox>
                  </td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Agent Name</th>
                  <td mat-cell *matCellDef="let agent">
                    <div class="agent-name">
                      <mat-icon class="agent-icon">smart_toy</mat-icon>
                      {{ agent.name }}
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let agent">
                    <span class="category-badge">{{ agent.namespace }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="scope">
                  <th mat-header-cell *matHeaderCellDef>Scope</th>
                  <td mat-cell *matCellDef="let agent">{{ agent.scope }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="availableColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: availableColumns;" class="agent-row" [class.selected]="selection.isSelected(row)" (click)="toggleRow(row)"></tr>
              </table>
            </div>
            <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageIndex]="currentPage" [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)" showFirstLastButtons class="custom-paginator"></mat-paginator>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onClose()" class="close-btn">
        <mat-icon>close</mat-icon>
        Close
      </button>
      <button mat-raised-button color="primary" (click)="onAdd()" [disabled]="selection.isEmpty()" class="add-btn" *ngIf="selectedTab === 1">
        <mat-icon>add</mat-icon>
        Add {{ selection.selected.length > 0 ? selection.selected.length + ' ' : '' }}Agent{{ selection.selected.length !== 1 ? 's' : '' }}
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
    
    .custom-tabs {
      background: #1a1a1a;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab-header {
      background: #252525;
      border-bottom: 1px solid #3a3a3a;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab {
      color: #b0b0b0 !important;
      opacity: 1 !important;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab.mdc-tab--active {
      color: #64b5f6 !important;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab .mdc-tab__text-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab .mdc-tab__text-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content--underline {
      border-color: #64b5f6 !important;
    }

    .tab-content {
      padding: 0;
      background: #1e1e1e;
    }

    .search-section {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      align-items: center;
      border-bottom: 1px solid #3a3a3a;
      background: #1a1a1a;
    }
    
    .search-field {
      flex: 1;
    }
    
    ::ng-deep .search-field .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }
    
    ::ng-deep .search-field .mdc-notched-outline__leading,
    ::ng-deep .search-field .mdc-notched-outline__notch,
    ::ng-deep .search-field .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }
    
    .search-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #b0b0b0;
      border-color: #555;
    }
    
    .search-btn:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    .clear-btn {
      color: #888;
    }
    
    .clear-btn:hover {
      background-color: #3a3a3a;
      color: #ff8a80;
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
    
    .agent-table {
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
    
    .agent-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .agent-icon {
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
    
    .level-badge {
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
    
    .agent-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .agent-row:hover {
      background-color: #333 !important;
    }
    
    .agent-row.selected {
      background-color: #1565c0 !important;
    }
    
    .remove-btn {
      color: #ff8a80;
    }
    
    .remove-btn:hover {
      background-color: rgba(255, 138, 128, 0.1);
    }
    
    ::ng-deep .custom-paginator {
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
      border-top: 1px solid #3a3a3a !important;
      padding: 0 24px !important;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-icon-button {
      color: #b0b0b0 !important;
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
    
    .add-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }
    
    .add-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }
    
    .add-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }
    
    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #64b5f6 !important;
    }
    
    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-checkbox.mat-mdc-checkbox-checked .mdc-checkbox__background {
      background-color: #64b5f6 !important;
      border-color: #64b5f6 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectAgentsDialogComponent {
  selectedTab = 0;
  searchTerm = '';
  projectAgents: Agent[] = [];
  availableAgents: Agent[] = [];
  loading = false;
  loadingAvailable = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  displayedColumns = ['name', 'category', 'level', 'actions'];
  availableColumns = ['select', 'name', 'category', 'scope'];
  
  selection: { isSelected: (row: Agent) => boolean; hasValue: () => boolean; selected: Agent[]; toggle: (row: Agent) => void; clear: () => void; isEmpty: () => boolean } = {
    isSelected: () => false,
    hasValue: () => false,
    selected: [],
    toggle: () => {},
    clear: () => {},
    isEmpty: () => true
  };

  constructor(
    public dialogRef: MatDialogRef<ProjectAgentsDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: ProjectAgentsDialogData
  ) {
    this.loadProjectAgents();
    this.loadAvailableAgents();
    this.initSelection();
  }

  private initSelection(): void {
    const selectedAgents: Agent[] = [];
    this.selection = {
      isSelected: (row: Agent) => selectedAgents.some(s => s.id === row.id),
      hasValue: () => selectedAgents.length > 0,
      get selected() {
        return selectedAgents;
      },
      toggle: (row: Agent) => {
        const index = selectedAgents.findIndex(s => s.id === row.id);
        if (index >= 0) {
          selectedAgents.splice(index, 1);
        } else {
          selectedAgents.push(row);
        }
        this.cdr.detectChanges();
      },
      clear: () => {
        selectedAgents.length = 0;
        this.cdr.detectChanges();
      },
      isEmpty: () => selectedAgents.length === 0
    };
  }

  loadProjectAgents(): void {
    this.loading = true;
    this.apiService.getProjectAgents(this.data.projectId).subscribe({
      next: (agents) => {
        this.projectAgents = agents || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading project agents:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAvailableAgents(): void {
    this.loadingAvailable = true;
    if (this.searchTerm.trim()) {
      this.apiService.searchAgents(this.searchTerm, '', this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error searching agents:', err);
          this.loadingAvailable = false;
        }
      });
    } else {
      this.apiService.getAgents(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error loading agents:', err);
          this.loadingAvailable = false;
        }
      });
    }
  }

  handleResponse(response: any): void {
    if (response && Array.isArray(response.agents)) {
      this.availableAgents = response.agents;
    } else if (Array.isArray(response)) {
      this.availableAgents = response;
    } else {
      this.availableAgents = [];
    }
    this.totalElements = response?.totalElements ?? this.availableAgents.length;
    this.loadingAvailable = false;
    this.cdr.detectChanges();
  }

  search(): void {
    this.currentPage = 0;
    this.loadAvailableAgents();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadAvailableAgents();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAvailableAgents();
  }

  toggleRow(row: Agent): void {
    this.selection.toggle(row);
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.availableAgents.forEach(agent => {
        if (!this.selection.isSelected(agent)) {
          this.selection.toggle(agent);
        }
      });
    }
  }

  isAllSelected(): boolean {
    return this.availableAgents.length > 0 && this.availableAgents.every(agent => this.selection.isSelected(agent));
  }

  removeAgent(agent: Agent, event: Event): void {
    event.stopPropagation();
    if (agent.id) {
      this.apiService.removeAgentFromProject(this.data.projectId, agent.id).subscribe({
        next: () => {
          this.loadProjectAgents();
        },
        error: (err) => {
          console.error('Error removing agent:', err);
        }
      });
    }
  }

  onAdd(): void {
    if (this.selection.selected.length > 0 && this.data.projectId) {
      const agentIds = this.selection.selected
        .filter(s => s.id)
        .map(s => s.id as number);
      
      this.apiService.addAgentsToProject(this.data.projectId, agentIds).subscribe({
        next: () => {
          this.dialogRef.close(this.selection.selected);
        },
        error: (err) => {
          if (err.status === 409 && err.error?.error === 'FILE_ALREADY_EXISTS') {
            this.showOverwriteConfirmation(err.error.message, () => {
              this.apiService.addAgentsToProject(this.data.projectId, agentIds, true).subscribe({
                next: () => {
                  this.dialogRef.close(this.selection.selected);
                },
                error: (retryErr) => {
                  console.error('Error adding agents to project:', retryErr);
                }
              });
            });
          } else {
            console.error('Error adding agents to project:', err);
          }
        }
      });
    }
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onAdd();
  }

  showOverwriteConfirmation(fileName: string, onConfirm: () => void): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'File Already Exists',
        message: `${fileName} already exists. Do you want to overwrite it?`
      },
      panelClass: 'custom-dialog-panel'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        onConfirm();
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}