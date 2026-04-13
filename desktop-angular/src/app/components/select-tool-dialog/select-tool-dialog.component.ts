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
import { ApiService, Tool } from '../../services/api.service';
import { SelectionModel } from '@angular/cdk/collections';

export interface SelectToolDialogData {
  projectId: number;
}

@Component({
  selector: 'app-select-tool-dialog',
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
      <mat-icon class="header-icon">build</mat-icon>
      <h2 class="dialog-title">Add Tools to Project</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="search-section">
        <mat-form-field class="search-field" appearance="outline">
          <mat-label>Search tools...</mat-label>
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
          <span>Loading tools...</span>
        </div>
        
        <div *ngIf="!loading && tools.length === 0" class="empty-state">
          <mat-icon class="empty-icon">build</mat-icon>
          <span class="empty-text">No tools found</span>
          <span class="empty-hint">Create a new tool or adjust your search</span>
        </div>
        
        <table mat-table [dataSource]="tools" class="tool-table" *ngIf="!loading && tools.length > 0">
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
              Tool Name
            </th>
            <td mat-cell *matCellDef="let tool">
              <div class="tool-name">
                <mat-icon class="tool-icon">build</mat-icon>
                {{ tool.name }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">category</mat-icon>
              Category
            </th>
            <td mat-cell *matCellDef="let tool">
              <span class="category-badge">{{ tool.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="namespace">
            <th mat-header-cell *matHeaderCellDef>
              <mat-icon class="column-icon">code</mat-icon>
              Namespace
            </th>
            <td mat-cell *matCellDef="let tool">
              <span class="namespace-badge">{{ tool.namespace }}</span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="tool-row"
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
        Add {{ selection.selected.length > 0 ? selection.selected.length + ' ' : '' }}Tool{{ selection.selected.length !== 1 ? 's' : '' }}
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
      min-width: 650px;
      max-width: 800px;
      background: #1e1e1e !important;
    }
    
    .search-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: #252525;
      border-bottom: 1px solid #3a3a3a;
    }
    
    .search-field {
      flex: 1;
      max-width: 400px;
    }
    
    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    
    ::ng-deep .search-field .mat-mdc-text-field-wrapper {
      background-color: #2a2a2a !important;
    }
    
    ::ng-deep .search-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    ::ng-deep .search-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    ::ng-deep .search-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: #444 !important;
    }
    
    ::ng-deep .search-field .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
    ::ng-deep .search-field .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
    ::ng-deep .search-field .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
      border-color: #555 !important;
    }
    
    ::ng-deep .search-field .mat-mdc-form-field-flex {
      height: 48px;
    }
    
    ::ng-deep .search-field input {
      color: #e0e0e0 !important;
    }
    
    ::ng-deep .search-field .mat-mdc-floating-label {
      color: #888 !important;
    }
    
    ::ng-deep .search-field .mat-mdc-input-element::placeholder {
      color: #666 !important;
    }
    
    .search-btn {
      color: #b0b0b0;
      border-color: #555;
      height: 48px;
    }
    
    .search-btn:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    .clear-btn {
      color: #888;
    }
    
    .clear-btn:hover {
      color: #ffffff;
    }
    
    .table-container {
      position: relative;
      min-height: 300px;
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
    
    .tool-row.selected {
      background-color: rgba(255, 204, 128, 0.15) !important;
    }
    
    ::ng-deep .custom-paginator {
      background: #252525 !important;
      border-top: 1px solid #3a3a3a;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-paginator-container {
      color: #b0b0b0;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-icon-button {
      color: #b0b0b0;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-icon-button:disabled {
      color: #555;
    }
    
    ::ng-deep .custom-paginator .mat-mdc-select-value {
      color: #b0b0b0;
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
    
    .select-btn {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #ffcc80 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectToolDialogComponent {
  tools: Tool[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  displayedColumns = ['select', 'name', 'category', 'namespace'];
  selection = new SelectionModel<Tool>(true, []);

  constructor(
    public dialogRef: MatDialogRef<SelectToolDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SelectToolDialogData
  ) {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    const searchOrList = this.searchTerm 
      ? this.apiService.searchTools(this.searchTerm, '', this.currentPage, this.pageSize)
      : this.apiService.getTools(this.currentPage, this.pageSize);

    searchOrList.subscribe({
      next: (response: any) => {
        this.tools = response.tools || response.content || [];
        this.totalElements = response.totalElements || this.tools.length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tools:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  search(): void {
    this.currentPage = 0;
    this.loadTools();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadTools();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTools();
  }

  toggleRow(row: Tool): void {
    this.selection.toggle(row);
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.tools.forEach(tool => {
        if (!this.selection.isSelected(tool)) {
          this.selection.toggle(tool);
        }
      });
    }
  }

  isAllSelected(): boolean {
    return this.tools.length > 0 && this.tools.every(tool => this.selection.isSelected(tool));
  }

  onSelect(): void {
    if (this.selection.selected.length > 0 && this.data.projectId) {
      const toolIds = this.selection.selected
        .filter(t => t.id)
        .map(t => t.id as number);
      
      this.apiService.addToolsToProject(this.data.projectId, toolIds).subscribe({
        next: () => {
          this.dialogRef.close(this.selection.selected);
        },
        error: (err) => {
          console.error('Error adding tools to project:', err);
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