import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
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
import { ApiService, Agent, Script } from '../../services/api.service';

/**
 * Componente de diálogo para seleção de agentes.
 * Permite buscar e selecionar agentes ou scripts para adicionar a um projeto ou pipeline.
 * 
 * @componentName SelectAgentDialog
 * @selector app-select-agent-dialog
 */
export interface SelectAgentDialogData {
  projectId?: number;
  mode: 'project' | 'pipeline';
}

/**
 * Representa um item selecionado no diálogo, podendo ser um agente ou script.
 */
export interface SelectedStep {
  type: 'agent' | 'script';
  item: Agent | Script;
}

/**
 * Componente de diálogo para seleção de agentes.
 * Permite buscar e selecionar agentes ou scripts para adicionar a um projeto ou pipeline.
 * Suporta pesquisa paginada e seleção múltipla.
 * 
 * @componentName SelectAgentDialog
 * @selector app-select-agent-dialog
 */
@Component({
  selector: 'app-select-agent-dialog',
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
    MatTabsModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">{{ data.mode === 'pipeline' ? 'playlist_add' : 'smart_toy' }}</mat-icon>
      <h2 class="dialog-title">{{ data.mode === 'pipeline' ? 'Add Step to Pipeline' : 'Add Agents to Project' }}</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-tab-group *ngIf="data.mode === 'pipeline'" [(selectedIndex)]="selectedTab" class="custom-tabs">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>smart_toy</mat-icon>
            <span>Agents</span>
          </ng-template>
          <div class="tab-content">
            <div class="search-section">
              <mat-form-field class="search-field" appearance="outline">
                <mat-label>Search agents...</mat-label>
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
                <span>Loading agents...</span>
              </div>
              <div *ngIf="!loading && agents.length === 0" class="empty-state">
                <mat-icon class="empty-icon">smart_toy</mat-icon>
                <span class="empty-text">No agents found</span>
                <span class="empty-hint">Create a new agent or adjust your search</span>
              </div>
              <table mat-table [dataSource]="agents" class="agent-table" *ngIf="!loading && agents.length > 0">
                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-checkbox (change)="$event ? toggleAllRows() : null" [checked]="selection.hasValue() && isAllSelected()" [indeterminate]="selection.hasValue() && !isAllSelected()"></mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox (click)="$event.stopPropagation()" (change)="$event ? toggleRow(row) : null" [checked]="selection.isSelected(row)"></mat-checkbox>
                  </td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">badge</mat-icon>
                    Agent Name
                  </th>
                  <td mat-cell *matCellDef="let agent">
                    <div class="agent-name">
                      <mat-icon class="agent-icon">smart_toy</mat-icon>
                      {{ agent.name }}
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">namespace</mat-icon>
                    Category
                  </th>
                  <td mat-cell *matCellDef="let agent">
                    <span class="category-badge">{{ agent.namespace }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="scope">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">language</mat-icon>
                    Scope
                  </th>
                  <td mat-cell *matCellDef="let agent">{{ agent.scope }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="agent-row" [class.selected]="selection.isSelected(row)" (click)="toggleRow(row)"></tr>
              </table>
            </div>
            <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageIndex]="currentPage" [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)" showFirstLastButtons class="custom-paginator"></mat-paginator>
          </div>
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>code</mat-icon>
            <span>Scripts</span>
          </ng-template>
          <div class="tab-content">
            <div class="search-section">
              <mat-form-field class="search-field" appearance="outline">
                <mat-label>Search scripts...</mat-label>
                <input matInput [(ngModel)]="scriptSearchTerm" (keyup.enter)="searchScripts()" placeholder="Type to search...">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              <button mat-stroked-button (click)="searchScripts()" class="search-btn">
                <mat-icon>search</mat-icon>
                Search
              </button>
              <button mat-icon-button (click)="clearScriptSearch()" aria-label="Clear search" class="clear-btn" *ngIf="scriptSearchTerm">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="table-container">
              <div *ngIf="scriptsLoading" class="loading-overlay">
                <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                <span>Loading scripts...</span>
              </div>
              <div *ngIf="!scriptsLoading && scripts.length === 0" class="empty-state">
                <mat-icon class="empty-icon">code</mat-icon>
                <span class="empty-text">No scripts found</span>
                <span class="empty-hint">Create a new script or adjust your search</span>
              </div>
              <table mat-table [dataSource]="scripts" class="agent-table" *ngIf="!scriptsLoading && scripts.length > 0">
                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-checkbox (change)="$event ? toggleAllScriptRows() : null" [checked]="scriptSelection.hasValue() && isAllScriptsSelected()" [indeterminate]="scriptSelection.hasValue() && !isAllScriptsSelected()"></mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox (click)="$event.stopPropagation()" (change)="$event ? toggleScriptRow(row) : null" [checked]="scriptSelection.isSelected(row)"></mat-checkbox>
                  </td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">description</mat-icon>
                    Script Name
                  </th>
                  <td mat-cell *matCellDef="let script">
                    <div class="agent-name">
                      <mat-icon class="agent-icon">code</mat-icon>
                      {{ script.name }}
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="language">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">translate</mat-icon>
                    Language
                  </th>
                  <td mat-cell *matCellDef="let script">
                    <span class="category-badge">{{ script.language }}</span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="scriptColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: scriptColumns;" class="agent-row" [class.selected]="scriptSelection.isSelected(row)" (click)="toggleScriptRow(row)"></tr>
              </table>
            </div>
            <mat-paginator [length]="scriptTotalElements" [pageSize]="scriptPageSize" [pageIndex]="scriptCurrentPage" [pageSizeOptions]="[5, 10, 25]" (page)="onScriptPageChange($event)" showFirstLastButtons class="custom-paginator"></mat-paginator>
          </div>
        </mat-tab>
      </mat-tab-group>
      <div *ngIf="data.mode === 'project'">
        <div class="search-section">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Search agents...</mat-label>
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
            <span>Loading agents...</span>
          </div>
          <div *ngIf="!loading && agents.length === 0" class="empty-state">
            <mat-icon class="empty-icon">smart_toy</mat-icon>
            <span class="empty-text">No agents found</span>
            <span class="empty-hint">Create a new agent or adjust your search</span>
          </div>
          <table mat-table [dataSource]="agents" class="agent-table" *ngIf="!loading && agents.length > 0">
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox (change)="$event ? toggleAllRows() : null" [checked]="selection.hasValue() && isAllSelected()" [indeterminate]="selection.hasValue() && !isAllSelected()"></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox (click)="$event.stopPropagation()" (change)="$event ? toggleRow(row) : null" [checked]="selection.isSelected(row)"></mat-checkbox>
              </td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>
                <mat-icon class="column-icon">badge</mat-icon>
                Agent Name
              </th>
              <td mat-cell *matCellDef="let agent">
                <div class="agent-name">
                  <mat-icon class="agent-icon">smart_toy</mat-icon>
                  {{ agent.name }}
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>
                <mat-icon class="column-icon">category</mat-icon>
                Category
              </th>
              <td mat-cell *matCellDef="let agent">
                <span class="category-badge">{{ agent.namespace }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="scope">
              <th mat-header-cell *matHeaderCellDef>
                <mat-icon class="column-icon">language</mat-icon>
                Scope
              </th>
              <td mat-cell *matCellDef="let agent">{{ agent.scope }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="agent-row" [class.selected]="selection.isSelected(row)" (click)="toggleRow(row)"></tr>
          </table>
        </div>
        <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageIndex]="currentPage" [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)" showFirstLastButtons class="custom-paginator"></mat-paginator>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSelect()" [disabled]="data.mode === 'pipeline' ? (selectedTab === 0 ? selection.isEmpty() : scriptSelection.isEmpty()) : selection.isEmpty()" class="select-btn">
        <mat-icon>check</mat-icon>
        {{ data.mode === 'pipeline' ? 'Add to Pipeline' : ('Add ' + (selection.selected.length > 0 ? selection.selected.length + ' ' : '') + 'Agent' + (selection.selected.length !== 1 ? 's' : '')) }}
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
      color: #4fc3f7;
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
      border-color: #4fc3f7;
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
    
    .agent-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .agent-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #4fc3f7;
    }
    
    .category-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
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
    
    .agent-row.selected .agent-icon {
      color: #ffffff;
    }
    
    .agent-row.selected .category-badge {
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
      stroke: #4fc3f7 !important;
    }
    
    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-checkbox.mat-mdc-checkbox-checked .mdc-checkbox__background {
      background-color: #4fc3f7 !important;
      border-color: #4fc3f7 !important;
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
      color: #4fc3f7 !important;
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
      border-color: #4fc3f7 !important;
    }

    .tab-content {
      padding: 0;
      background: #1e1e1e;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectAgentDialogComponent {
  searchTerm = '';
  agents: Agent[] = [];
  loading = false;

  scripts: Script[] = [];
  scriptsLoading = false;
  scriptSearchTerm = '';
  scriptCurrentPage = 0;
  scriptPageSize = 10;
  scriptTotalElements = 0;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  selectedTab = 0;

  displayedColumns = ['select', 'name', 'category', 'scope'];
  scriptColumns = ['select', 'name', 'language'];
  selection: { isSelected: (row: Agent) => boolean; hasValue: () => boolean; selected: Agent[]; toggle: (row: Agent) => void; clear: () => void; isEmpty: () => boolean } = {
    isSelected: () => false,
    hasValue: () => false,
    selected: [],
    toggle: () => {},
    clear: () => {},
    isEmpty: () => true
  };
  scriptSelection: { isSelected: (row: Script) => boolean; hasValue: () => boolean; selected: Script[]; toggle: (row: Script) => void; clear: () => void; isEmpty: () => boolean } = {
    isSelected: () => false,
    hasValue: () => false,
    selected: [],
    toggle: () => {},
    clear: () => {},
    isEmpty: () => true
  };

  constructor(
    public dialogRef: MatDialogRef<SelectAgentDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SelectAgentDialogData
  ) {
    if (!this.data.mode) {
      this.data.mode = 'project';
    }
    this.loadAgents();
    this.initSelection();
    if (this.data.mode === 'pipeline') {
      this.loadScripts();
      this.initScriptSelection();
    }
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

  private initScriptSelection(): void {
    const selectedScripts: Script[] = [];
    this.scriptSelection = {
      isSelected: (row: Script) => selectedScripts.some(s => s.id === row.id),
      hasValue: () => selectedScripts.length > 0,
      get selected() {
        return selectedScripts;
      },
      toggle: (row: Script) => {
        const index = selectedScripts.findIndex(s => s.id === row.id);
        if (index >= 0) {
          selectedScripts.splice(index, 1);
        } else {
          selectedScripts.push(row);
        }
        this.cdr.detectChanges();
      },
      clear: () => {
        selectedScripts.length = 0;
        this.cdr.detectChanges();
      },
      isEmpty: () => selectedScripts.length === 0
    };
  }

  loadAgents(): void {
    /**
     * Carrega a lista de agentes do backend.
     * Utiliza pesquisa se houver termo de busca, caso contrário carrega todos.
     */
    this.loading = true;
    if (this.searchTerm.trim()) {
      this.apiService.searchAgents(this.searchTerm, '', this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error searching agents:', err);
          this.loading = false;
        }
      });
    } else {
      this.apiService.getAgents(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error loading agents:', err);
          this.loading = false;
        }
      });
    }
  }

  loadScripts(): void {
    /**
     * Carrega a lista de scripts do backend.
     * Utiliza pesquisa se houver termo de busca, caso contrário carrega todos.
     */
    this.scriptsLoading = true;
    if (this.scriptSearchTerm.trim()) {
      this.apiService.searchScripts(this.scriptSearchTerm, '', this.scriptCurrentPage, this.scriptPageSize).subscribe({
        next: (response) => {
          this.handleScriptResponse(response);
        },
        error: (err) => {
          console.error('Error searching scripts:', err);
          this.scriptsLoading = false;
        }
      });
    } else {
      this.apiService.getScripts(this.scriptCurrentPage, this.scriptPageSize).subscribe({
        next: (response) => {
          this.handleScriptResponse(response);
        },
        error: (err) => {
          console.error('Error loading scripts:', err);
          this.scriptsLoading = false;
        }
      });
    }
  }

  handleResponse(response: any): void {
    if (response && Array.isArray(response.agents)) {
      this.agents = response.agents;
    } else if (Array.isArray(response)) {
      this.agents = response;
    } else {
      this.agents = [];
    }
    this.totalElements = response?.totalElements ?? this.agents.length;
    this.totalPages = response?.totalPages ?? 1;
    this.loading = false;
    this.cdr.detectChanges();
  }

  handleScriptResponse(response: any): void {
    if (response && Array.isArray(response.scripts)) {
      this.scripts = response.scripts;
    } else if (Array.isArray(response)) {
      this.scripts = response;
    } else {
      this.scripts = [];
    }
    this.scriptTotalElements = response?.totalElements ?? this.scripts.length;
    this.scriptsLoading = false;
    this.cdr.detectChanges();
  }

  search(): void {
    /**
     * Executa a pesquisa de agentes resetting para a primeira página.
     */
    this.currentPage = 0;
    this.loadAgents();
  }

  clearSearch(): void {
    /**
     * Limpa o termo de pesquisa e recarrega a lista de agentes.
     */
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadAgents();
  }

  searchScripts(): void {
    /**
     * Executa a pesquisa de scripts resetando para a primeira página.
     */
    this.scriptCurrentPage = 0;
    this.loadScripts();
  }

  clearScriptSearch(): void {
    /**
     * Limpa o termo de pesquisa de scripts e recarrega a lista.
     */
    this.scriptSearchTerm = '';
    this.scriptCurrentPage = 0;
    this.loadScripts();
  }

  onPageChange(event: PageEvent): void {
    /**
     * Manipula a mudança de página na paginação de agentes.
     * @param event - Evento de mudança de página contendo índice e tamanho.
     */
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAgents();
  }

  onScriptPageChange(event: PageEvent): void {
    /**
     * Manipula a mudança de página na paginação de scripts.
     * @param event - Evento de mudança de página contendo índice e tamanho.
     */
    this.scriptCurrentPage = event.pageIndex;
    this.scriptPageSize = event.pageSize;
    this.loadScripts();
  }

  toggleRow(row: Agent): void {
    /**
     * Alterna a seleção de um agente específico.
     * @param row - Agente a ser selecionado ou desmarcado.
     */
    this.selection.toggle(row);
  }

  toggleScriptRow(row: Script): void {
    /**
     * Alterna a seleção de um script específico.
     * @param row - Script a ser selecionado ou desmarcado.
     */
    this.scriptSelection.toggle(row);
  }

  toggleAllRows(): void {
    /**
     * Alterna a seleção de todos os agentes visíveis na tabela.
     * Se todos estiverem selecionados, desmarca todos.
     */
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.agents.forEach(agent => {
        if (!this.selection.isSelected(agent)) {
          this.selection.toggle(agent);
        }
      });
    }
  }

  toggleAllScriptRows(): void {
    /**
     * Alterna a seleção de todos os scripts visíveis na tabela.
     * Se todos estiverem selecionados, desmarca todos.
     */
    if (this.isAllScriptsSelected()) {
      this.scriptSelection.clear();
    } else {
      this.scripts.forEach(script => {
        if (!this.scriptSelection.isSelected(script)) {
          this.scriptSelection.toggle(script);
        }
      });
    }
  }

  isAllSelected(): boolean {
    /**
     * Verifica se todos os agentes visíveis estão selecionados.
     * @returns true se todos os agentes estão selecionados.
     */
    return this.agents.length > 0 && this.agents.every(agent => this.selection.isSelected(agent));
  }

  isAllScriptsSelected(): boolean {
    /**
     * Verifica se todos os scripts visíveis estão selecionados.
     * @returns true se todos os scripts estão selecionados.
     */
    return this.scripts.length > 0 && this.scripts.every(script => this.scriptSelection.isSelected(script));
  }

  onSelect(): void {
    /**
     * Confirma a seleção e fecha o diálogo.
     * Em modo 'pipeline', retorna apenas o primeiro item selecionado.
     * Em modo 'project', adiciona os selecionados ao projeto via API.
     */
    if (this.data.mode === 'pipeline') {
      if (this.selectedTab === 0 && this.selection.selected.length > 0) {
        this.dialogRef.close({ type: 'agent', item: this.selection.selected[0] });
      } else if (this.selectedTab === 1 && this.scriptSelection.selected.length > 0) {
        this.dialogRef.close({ type: 'script', item: this.scriptSelection.selected[0] });
      }
    } else {
      if (this.selection.selected.length > 0 && this.data.projectId) {
        const agentIds = this.selection.selected
          .filter(s => s.id)
          .map(s => s.id as number);
        
        this.apiService.addAgentsToProject(this.data.projectId, agentIds).subscribe({
          next: () => {
            this.dialogRef.close(this.selection.selected);
          },
          error: (err) => {
            console.error('Error adding agents to project:', err);
          }
        });
      } else {
        this.dialogRef.close(this.selection.selected);
      }
    }
  }

  onCancel(): void {
    /**
     * Cancela a operação e fecha o diálogo sem selecionar nada.
     */
    this.dialogRef.close();
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSelect();
  }
}
