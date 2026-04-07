import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService, Command } from '../../services/api.service';

export interface SelectCommandDialogData {
  projectId: number;
}

@Component({
  selector: 'app-select-command-dialog',
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
    MatCheckboxModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">terminal</mat-icon>
      <h2 class="dialog-title">Add Commands to Project</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="search-section">
        <mat-form-field class="search-field" appearance="outline">
          <mat-label>Search commands...</mat-label>
          <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Type to search...">
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
        <div *ngIf="loading" class="loading-overlay">
          <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
          <span>Loading commands...</span>
        </div>
        
        <div *ngIf="!loading && commands.length === 0" class="empty-state">
          <mat-icon class="empty-icon">terminal</mat-icon>
          <span class="empty-text">No commands found</span>
          <span class="empty-hint">Create a new command or adjust your search</span>
        </div>
        
        <table mat-table [dataSource]="commands" class="command-table" *ngIf="!loading && commands.length > 0">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                (change)="$event ? toggleAllRows() : null"
                [checked]="selection.hasValue() && isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox
                (click)="$event.stopPropagation()"
                (change)="$event ? toggleRow(row) : null"
                [checked]="selection.isSelected(row)">
              </mat-checkbox>
            </td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">badge</mat-icon>
              Command Name
            </th>
            <td mat-cell *matCellDef="let command">
              <div class="command-name">
                <mat-icon class="command-icon">terminal</mat-icon>
                {{ command.name }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">category</mat-icon>
              Category
            </th>
            <td mat-cell *matCellDef="let command">
              <span class="category-badge">{{ command.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="scope">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">language</mat-icon>
              Scope
            </th>
            <td mat-cell *matCellDef="let command">{{ command.scope }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="command-row"
              [class.selected]="selection.isSelected(row)"
              (click)="toggleRow(row)">
          </tr>
        </table>
      </div>

      <mat-paginator
        [length]="totalElements"
        [pageSize]="pageSize"
        [pageIndex]="currentPage"
        [pageSizeOptions]="[5, 10, 25]"
        (page)="onPageChange($event)"
        showFirstLastButtons
        class="custom-paginator">
      </mat-paginator>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSelect()" [disabled]="selection.isEmpty()" class="select-btn">
        <mat-icon>check</mat-icon>
        Add {{ selection.selected.length > 0 ? selection.selected.length + ' ' : '' }}Command{{ selection.selected.length !== 1 ? 's' : '' }}
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
      margin: 0;
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
    
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #64b5f6;
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
    
    .search-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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
    
    .column-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 8px;
      vertical-align: middle;
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
    
    .command-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .command-row:hover {
      background-color: #333 !important;
    }
    
    .command-row.selected {
      background-color: #1565c0 !important;
    }
    
    .command-row.selected .command-icon {
      color: #ffffff;
    }
    
    .command-row.selected .category-badge {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
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
    
    ::ng-deep .custom-paginator .mat-mdc-icon-button:hover {
      background-color: #3a3a3a !important;
      color: #ffffff !important;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-paginator-range-label,
    ::ng-deep .custom-paginator .mat-mdc-select-value-text {
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
    
    .select-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }
    
    .select-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }
    
    .select-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }
    
    .select-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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
export class SelectCommandDialogComponent {
  searchTerm = '';
  commands: Command[] = [];
  loading = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  displayedColumns = ['select', 'name', 'category', 'scope'];
  selection: { isSelected: (row: Command) => boolean; hasValue: () => boolean; selected: Command[]; toggle: (row: Command) => void; clear: () => void; isEmpty: () => boolean } = {
    isSelected: () => false,
    hasValue: () => false,
    selected: [],
    toggle: () => {},
    clear: () => {},
    isEmpty: () => true
  };

  constructor(
    public dialogRef: MatDialogRef<SelectCommandDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SelectCommandDialogData
  ) {
    this.loadCommands();
    this.initSelection();
  }

  private initSelection(): void {
    const selectedCommands: Command[] = [];
    this.selection = {
      isSelected: (row: Command) => selectedCommands.some(c => c.id === row.id),
      hasValue: () => selectedCommands.length > 0,
      get selected() {
        return selectedCommands;
      },
      toggle: (row: Command) => {
        const index = selectedCommands.findIndex(c => c.id === row.id);
        if (index >= 0) {
          selectedCommands.splice(index, 1);
        } else {
          selectedCommands.push(row);
        }
        this.cdr.detectChanges();
      },
      clear: () => {
        selectedCommands.length = 0;
        this.cdr.detectChanges();
      },
      isEmpty: () => selectedCommands.length === 0
    };
  }

  loadCommands(): void {
    this.loading = true;
    if (this.searchTerm.trim()) {
      this.apiService.searchCommands(this.searchTerm, '', this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error searching commands:', err);
          this.loading = false;
        }
      });
    } else {
      this.apiService.getCommands(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error loading commands:', err);
          this.loading = false;
        }
      });
    }
  }

  handleResponse(response: any): void {
    if (response && Array.isArray(response.commands)) {
      this.commands = response.commands;
    } else if (Array.isArray(response)) {
      this.commands = response;
    } else {
      this.commands = [];
    }
    this.totalElements = response?.totalElements ?? this.commands.length;
    this.totalPages = response?.totalPages ?? 1;
    this.loading = false;
    this.cdr.detectChanges();
  }

  search(): void {
    this.currentPage = 0;
    this.loadCommands();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadCommands();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCommands();
  }

  toggleRow(row: Command): void {
    this.selection.toggle(row);
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.commands.forEach(command => {
        if (!this.selection.isSelected(command)) {
          this.selection.toggle(command);
        }
      });
    }
  }

  isAllSelected(): boolean {
    return this.commands.length > 0 && this.commands.every(command => this.selection.isSelected(command));
  }

  onSelect(): void {
    if (this.selection.selected.length > 0 && this.data.projectId) {
      const commandIds = this.selection.selected
        .filter(c => c.id)
        .map(c => c.id as number);
      
      this.apiService.addCommandsToProject(this.data.projectId, commandIds).subscribe({
        next: () => {
          this.dialogRef.close(this.selection.selected);
        },
        error: (err) => {
          console.error('Error adding commands to project:', err);
        }
      });
    } else {
      this.dialogRef.close(this.selection.selected);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
