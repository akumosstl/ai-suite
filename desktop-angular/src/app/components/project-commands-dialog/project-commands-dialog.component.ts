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
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService, Command } from '../../services/api.service';

export interface ProjectCommandsDialogData {
  projectId: number;
}

@Component({
  selector: 'app-project-commands-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatCheckboxModule, MatTabsModule],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">terminal</mat-icon>
      <h2 class="dialog-title">Project Commands</h2>
    </div>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group [(selectedIndex)]="selectedTab" class="custom-tabs">
        <mat-tab>
          <ng-template mat-tab-label><mat-icon>list</mat-icon><span>Project Commands</span></ng-template>
          <div class="tab-content">
            <div class="table-container">
              <div *ngIf="loading" class="loading-overlay"><mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner><span>Loading commands...</span></div>
              <div *ngIf="!loading && projectItems.length === 0" class="empty-state"><mat-icon class="empty-icon">terminal</mat-icon><span class="empty-text">No commands assigned</span><span class="empty-hint">Click the "Add Commands" tab to add commands to this project</span></div>
              <table mat-table [dataSource]="projectItems" class="item-table" *ngIf="!loading && projectItems.length > 0">
                <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Command Name</th><td mat-cell *matCellDef="let item"><div class="item-name"><mat-icon class="item-icon">terminal</mat-icon>{{ item.name }}</div></td></ng-container>
                <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let item"><span class="category-badge">{{ item.namespace }}</span></td></ng-container>
                <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let item"><button mat-icon-button (click)="removeItem(item, $event)" class="remove-btn" title="Remove command"><mat-icon>remove_circle</mat-icon></button></td></ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="item-row"></tr>
              </table>
            </div>
          </div>
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label><mat-icon>add_circle</mat-icon><span>Add Commands to Project</span></ng-template>
          <div class="tab-content">
            <div class="search-section">
              <mat-form-field class="search-field" appearance="outline"><mat-label>Search commands...</mat-label><input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Type to search..."><mat-icon matPrefix>search</mat-icon></mat-form-field>
              <button mat-stroked-button (click)="search()" class="search-btn"><mat-icon>search</mat-icon>Search</button>
              <button mat-icon-button (click)="clearSearch()" aria-label="Clear search" class="clear-btn" *ngIf="searchTerm"><mat-icon>close</mat-icon></button>
            </div>
            <div class="table-container">
              <div *ngIf="loadingAvailable" class="loading-overlay"><mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner><span>Loading commands...</span></div>
              <div *ngIf="!loadingAvailable && availableItems.length === 0" class="empty-state"><mat-icon class="empty-icon">terminal</mat-icon><span class="empty-text">No commands found</span><span class="empty-hint">Create a new command or adjust your search</span></div>
              <table mat-table [dataSource]="availableItems" class="item-table" *ngIf="!loadingAvailable && availableItems.length > 0">
                <ng-container matColumnDef="select"><th mat-header-cell *matHeaderCellDef><mat-checkbox (change)="$event ? toggleAllRows() : null" [checked]="selection.hasValue() && isAllSelected()" [indeterminate]="selection.hasValue() && !isAllSelected()"></mat-checkbox></th><td mat-cell *matCellDef="let row"><mat-checkbox (click)="$event.stopPropagation()" (change)="$event ? toggleRow(row) : null" [checked]="selection.isSelected(row)"></mat-checkbox></td></ng-container>
                <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Command Name</th><td mat-cell *matCellDef="let item"><div class="item-name"><mat-icon class="item-icon">terminal</mat-icon>{{ item.name }}</div></td></ng-container>
                <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let item"><span class="category-badge">{{ item.namespace }}</span></td></ng-container>
                <tr mat-header-row *matHeaderRowDef="availableColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: availableColumns;" class="item-row" [class.selected]="selection.isSelected(row)" (click)="toggleRow(row)"></tr>
              </table>
            </div>
            <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageIndex]="currentPage" [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)" showFirstLastButtons class="custom-paginator"></mat-paginator>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onClose()" class="close-btn"><mat-icon>close</mat-icon>Close</button>
      <button mat-raised-button color="primary" (click)="onAdd()" [disabled]="selection.isEmpty()" class="add-btn" *ngIf="selectedTab === 1"><mat-icon>add</mat-icon>Add {{ selection.selected.length > 0 ? selection.selected.length + ' ' : '' }}Command{{ selection.selected.length !== 1 ? 's' : '' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { display: flex; align-items: center; gap: 12px; padding: 20px 24px; background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%); border-bottom: 1px solid #3a3a3a; border-radius: 12px 12px 0 0; }
    .header-icon { font-size: 28px; width: 28px; height: 28px; color: #ffb74d; }
    .dialog-title { margin: 0; font-size: 1.25rem; font-weight: 500; color: #ffffff; letter-spacing: 0.3px; }
    .dialog-content { padding: 0 !important; min-width: 520px; max-width: 600px; background: #1e1e1e !important; }
    .custom-tabs { background: #1a1a1a; }
    ::ng-deep .custom-tabs .mat-mdc-tab-header { background: #252525; border-bottom: 1px solid #3a3a3a; }
    ::ng-deep .custom-tabs .mat-mdc-tab { color: #b0b0b0 !important; }
    ::ng-deep .custom-tabs .mat-mdc-tab.mdc-tab--active { color: #ffb74d !important; }
    ::ng-deep .custom-tabs .mat-mdc-tab .mdc-tab__text-label { display: flex; align-items: center; gap: 8px; }
    ::ng-deep .custom-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content--underline { border-color: #ffb74d !important; }
    .tab-content { padding: 0; background: #1e1e1e; }
    .search-section { display: flex; gap: 12px; padding: 20px 24px; align-items: center; border-bottom: 1px solid #3a3a3a; background: #1a1a1a; }
    .search-field { flex: 1; }
    ::ng-deep .search-field .mat-mdc-form-field-icon-prefix { padding-right: 8px !important; color: #888; }
    .search-btn { display: flex; align-items: center; gap: 6px; color: #b0b0b0; border-color: #555; }
    .search-btn:hover { background-color: #3a3a3a; color: #ffffff; }
    .clear-btn { color: #888; }
    .clear-btn:hover { background-color: #3a3a3a; color: #ff8a80; }
    .table-container { position: relative; min-height: 200px; margin: 0 24px; border-radius: 8px; overflow: hidden; border: 1px solid #3a3a3a; background: #2a2a2a; }
    .loading-overlay, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: #888; gap: 12px; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #555; }
    .empty-text { font-size: 1.1rem; font-weight: 500; color: #b0b0b0; }
    .empty-hint { font-size: 0.875rem; color: #666; }
    .item-table { width: 100%; background: transparent; }
    ::ng-deep .mat-mdc-header-cell { background-color: #252525 !important; color: #888 !important; font-weight: 600 !important; font-size: 0.8rem !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; border-bottom: 1px solid #3a3a3a !important; padding: 16px !important; }
    ::ng-deep .mat-mdc-cell { color: #e0e0e0 !important; font-size: 0.9rem !important; padding: 16px !important; border-bottom: 1px solid #333 !important; }
    .item-name { display: flex; align-items: center; gap: 10px; }
    .item-icon { font-size: 20px; width: 20px; height: 20px; color: #ffb74d; }
    .category-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; background: rgba(255, 183, 77, 0.2); color: #ffb74d; }
    .item-row { cursor: pointer; transition: all 0.2s ease; }
    .item-row:hover { background-color: #333 !important; }
    .item-row.selected { background-color: #1565c0 !important; }
    .remove-btn { color: #ff8a80; }
    .remove-btn:hover { background-color: rgba(255, 138, 128, 0.1); }
    ::ng-deep .custom-paginator { background-color: #1a1a1a !important; color: #e0e0e0 !important; border-top: 1px solid #3a3a3a !important; padding: 0 24px !important; }
    ::ng-deep .custom-paginator .mat-mdc-icon-button { color: #b0b0b0 !important; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px !important; background: #1e1e1e; border-top: 1px solid #3a3a3a; border-radius: 0 0 12px 12px; margin: 0 !important; }
    .close-btn { display: flex; align-items: center; gap: 6px; color: #b0b0b0; border-color: #555; }
    .close-btn:hover { background-color: #3a3a3a; color: #ffffff; }
    .add-btn { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); }
    .add-btn:hover:not(:disabled) { background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%); }
    .add-btn:disabled { background: #3a3a3a; color: #666; }
    ::ng-deep .mat-mdc-progress-spinner circle { stroke: #ffb74d !important; }
    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__background { border-color: #888 !important; }
    ::ng-deep .mat-mdc-checkbox.mat-mdc-checkbox-checked .mdc-checkbox__background { background-color: #ffb74d !important; border-color: #ffb74d !important; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCommandsDialogComponent {
  selectedTab = 0;
  searchTerm = '';
  projectItems: Command[] = [];
  availableItems: Command[] = [];
  loading = false;
  loadingAvailable = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  displayedColumns = ['name', 'category', 'actions'];
  availableColumns = ['select', 'name', 'category'];
  selection: { isSelected: (row: Command) => boolean; hasValue: () => boolean; selected: Command[]; toggle: (row: Command) => void; clear: () => void; isEmpty: () => boolean } = { isSelected: () => false, hasValue: () => false, selected: [], toggle: () => {}, clear: () => {}, isEmpty: () => true };
  constructor(public dialogRef: MatDialogRef<ProjectCommandsDialogComponent>, private apiService: ApiService, private cdr: ChangeDetectorRef, @Inject(MAT_DIALOG_DATA) public data: ProjectCommandsDialogData) { this.loadProjectItems(); this.loadAvailableItems(); this.initSelection(); }
  private initSelection(): void { const selectedItems: Command[] = []; this.selection = { isSelected: (row: Command) => selectedItems.some(s => s.id === row.id), hasValue: () => selectedItems.length > 0, get selected() { return selectedItems; }, toggle: (row: Command) => { const index = selectedItems.findIndex(s => s.id === row.id); if (index >= 0) { selectedItems.splice(index, 1); } else { selectedItems.push(row); } this.cdr.detectChanges(); }, clear: () => { selectedItems.length = 0; this.cdr.detectChanges(); }, isEmpty: () => selectedItems.length === 0 }; }
  loadProjectItems(): void { this.loading = true; this.apiService.getProjectCommands(this.data.projectId).subscribe({ next: (items) => { this.projectItems = items || []; this.loading = false; this.cdr.detectChanges(); }, error: (err) => { console.error('Error loading project commands:', err); this.loading = false; this.cdr.detectChanges(); } }); }
  loadAvailableItems(): void { this.loadingAvailable = true; if (this.searchTerm.trim()) { this.apiService.searchCommands(this.searchTerm, '', this.currentPage, this.pageSize).subscribe({ next: (response) => { this.handleResponse(response); }, error: (err) => { console.error('Error searching commands:', err); this.loadingAvailable = false; } }); } else { this.apiService.getCommands(this.currentPage, this.pageSize).subscribe({ next: (response) => { this.handleResponse(response); }, error: (err) => { console.error('Error loading commands:', err); this.loadingAvailable = false; } }); } }
  handleResponse(response: any): void { if (response && Array.isArray(response.commands)) { this.availableItems = response.commands; } else if (Array.isArray(response)) { this.availableItems = response; } else { this.availableItems = []; } this.totalElements = response?.totalElements ?? this.availableItems.length; this.loadingAvailable = false; this.cdr.detectChanges(); }
  search(): void { this.currentPage = 0; this.loadAvailableItems(); }
  clearSearch(): void { this.searchTerm = ''; this.currentPage = 0; this.loadAvailableItems(); }
  onPageChange(event: PageEvent): void { this.currentPage = event.pageIndex; this.pageSize = event.pageSize; this.loadAvailableItems(); }
  toggleRow(row: Command): void { this.selection.toggle(row); }
  toggleAllRows(): void { if (this.isAllSelected()) { this.selection.clear(); } else { this.availableItems.forEach(item => { if (!this.selection.isSelected(item)) { this.selection.toggle(item); } }); } }
  isAllSelected(): boolean { return this.availableItems.length > 0 && this.availableItems.every(item => this.selection.isSelected(item)); }
  removeItem(item: Command, event: Event): void { event.stopPropagation(); if (item.id) { this.apiService.removeCommandFromProject(this.data.projectId, item.id).subscribe({ next: () => { this.loadProjectItems(); }, error: (err) => { console.error('Error removing command:', err); } }); } }
  onAdd(): void { if (this.selection.selected.length > 0 && this.data.projectId) { const itemIds = this.selection.selected.filter(s => s.id).map(s => s.id as number); this.apiService.addCommandsToProject(this.data.projectId, itemIds).subscribe({ next: () => { this.dialogRef.close(this.selection.selected); }, error: (err) => { console.error('Error adding commands to project:', err); } }); } }
  onClose(): void { this.dialogRef.close(); }
}