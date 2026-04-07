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
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService, Agent, Script } from '../../services/api.service';

export interface SelectAgentDialogData {
}

export interface SelectedStep {
  type: 'agent' | 'script';
  item: Agent | Script;
}

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
    MatTabsModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">add_task</mat-icon>
      <h2 class="dialog-title">Add Step to Pipeline</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-tab-group class="custom-tabs" (selectedTabChange)="onTabChange($event)">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">smart_toy</mat-icon>
            <span>Agents</span>
          </ng-template>
          
          <div class="tab-content">
            <div class="search-section">
              <mat-form-field class="search-field" appearance="outline">
                <mat-label>Search agents...</mat-label>
                <input matInput [(ngModel)]="agentSearchTerm" (keyup.enter)="searchAgents()" placeholder="Type to search...">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              <button mat-stroked-button (click)="searchAgents()" class="search-btn">
                <mat-icon>search</mat-icon>
                Search
              </button>
              <button mat-icon-button (click)="clearAgentSearch()" aria-label="Clear search" class="clear-btn" *ngIf="agentSearchTerm">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="table-container">
              <div *ngIf="loadingAgents" class="loading-overlay">
                <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                <span>Loading agents...</span>
              </div>
              
              <div *ngIf="!loadingAgents && agents.length === 0" class="empty-state">
                <mat-icon class="empty-icon">person_off</mat-icon>
                <span class="empty-text">No agents found</span>
                <span class="empty-hint">Create a new agent or adjust your search</span>
              </div>
              
              <table mat-table [dataSource]="agents" class="agent-table" *ngIf="!loadingAgents && agents.length > 0">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">badge</mat-icon>
                    Agent Name
                  </th>
                  <td mat-cell *matCellDef="let agent">
                    <div class="item-name">
                      <mat-icon class="item-icon agent-icon">smart_toy</mat-icon>
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
                    <span class="category-badge">{{ agent.category }}</span>
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
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    class="agent-row"
                    [class.selected]="row === selectedAgent"
                    (click)="selectAgent(row)">
                </tr>
              </table>
            </div>

            <mat-paginator
              [length]="totalAgentElements"
              [pageSize]="agentPageSize"
              [pageIndex]="agentCurrentPage"
              [pageSizeOptions]="[5, 10, 25]"
              (page)="onAgentPageChange($event)"
              showFirstLastButtons
              class="custom-paginator">
            </mat-paginator>
          </div>
        </mat-tab>
        
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">code</mat-icon>
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
              <div *ngIf="loadingScripts" class="loading-overlay">
                <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                <span>Loading scripts...</span>
              </div>
              
              <div *ngIf="!loadingScripts && scripts.length === 0" class="empty-state">
                <mat-icon class="empty-icon">code_off</mat-icon>
                <span class="empty-text">No scripts found</span>
                <span class="empty-hint">Create a new script or adjust your search</span>
              </div>
              
              <table mat-table [dataSource]="scripts" class="script-table" *ngIf="!loadingScripts && scripts.length > 0">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">badge</mat-icon>
                    Script Name
                  </th>
                  <td mat-cell *matCellDef="let script">
                    <div class="item-name">
                      <mat-icon class="item-icon script-icon">code</mat-icon>
                      {{ script.name }}
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">category</mat-icon>
                    Category
                  </th>
                  <td mat-cell *matCellDef="let script">
                    <span class="category-badge script-badge">{{ script.category }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="scope">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="column-icon">language</mat-icon>
                    Scope
                  </th>
                  <td mat-cell *matCellDef="let script">{{ script.scope }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    class="script-row"
                    [class.selected]="row === selectedScript"
                    (click)="selectScript(row)">
                </tr>
              </table>
            </div>

            <mat-paginator
              [length]="totalScriptElements"
              [pageSize]="scriptPageSize"
              [pageIndex]="scriptCurrentPage"
              [pageSizeOptions]="[5, 10, 25]"
              (page)="onScriptPageChange($event)"
              showFirstLastButtons
              class="custom-paginator">
            </mat-paginator>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSelect()" [disabled]="!selectedAgent && !selectedScript" class="select-btn">
        <mat-icon>check</mat-icon>
        Add Step
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
    
    ::ng-deep .custom-tabs .mat-mdc-tab-header {
      background: #1a1a1a;
      border-bottom: 1px solid #3a3a3a;
    }
    
    ::ng-deep .custom-tabs .mat-mdc-tab {
      color: #b0b0b0 !important;
      opacity: 1 !important;
    }
    
    ::ng-deep .custom-tabs .mat-mdc-tab.mdc-tab--active {
      color: #ffffff !important;
    }
    
    ::ng-deep .custom-tabs .mat-mdc-tab .mdc-tab-indicator__content--underline {
      border-color: #4fc3f7 !important;
    }
    
    .tab-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .tab-content {
      padding: 0;
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
    
    .agent-table,
    .script-table {
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
    
    .item-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .item-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .agent-icon {
      color: #4fc3f7;
    }
    
    .script-icon {
      color: #ba68c8;
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
    
    .script-badge {
      background: rgba(186, 104, 200, 0.2);
      color: #ba68c8;
    }
    
    .agent-row,
    .script-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .agent-row:hover {
      background-color: #333 !important;
    }
    
    .script-row:hover {
      background-color: #333 !important;
    }
    
    .agent-row.selected {
      background-color: #1565c0 !important;
    }
    
    .script-row.selected {
      background-color: #7b1fa2 !important;
    }
    
    .agent-row.selected .agent-icon,
    .script-row.selected .script-icon {
      color: #ffffff;
    }
    
    .agent-row.selected .category-badge,
    .script-row.selected .category-badge {
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectAgentDialogComponent {
  agentSearchTerm = '';
  scriptSearchTerm = '';
  agents: Agent[] = [];
  scripts: Script[] = [];
  selectedAgent: Agent | null = null;
  selectedScript: Script | null = null;
  loadingAgents = false;
  loadingScripts = false;

  agentCurrentPage = 0;
  agentPageSize = 10;
  totalAgentElements = 0;

  scriptCurrentPage = 0;
  scriptPageSize = 10;
  totalScriptElements = 0;

  displayedColumns = ['name', 'category', 'scope'];

  constructor(
    public dialogRef: MatDialogRef<SelectAgentDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SelectAgentDialogData
  ) {
    this.loadAgents();
    this.loadScripts();
  }

  onTabChange(event: any): void {
    if (event.index === 0) {
      if (this.agents.length === 0) {
        this.loadAgents();
      }
    } else {
      if (this.scripts.length === 0) {
        this.loadScripts();
      }
    }
  }

  loadAgents(): void {
    this.loadingAgents = true;
    if (this.agentSearchTerm.trim()) {
      this.apiService.searchAgents(this.agentSearchTerm, '', this.agentCurrentPage, this.agentPageSize).subscribe({
        next: (response) => {
          this.handleAgentResponse(response);
        },
        error: (err) => {
          console.error('Error searching agents:', err);
          this.loadingAgents = false;
        }
      });
    } else {
      this.apiService.getAgents(this.agentCurrentPage, this.agentPageSize).subscribe({
        next: (response) => {
          this.handleAgentResponse(response);
        },
        error: (err) => {
          console.error('Error loading agents:', err);
          this.loadingAgents = false;
        }
      });
    }
  }

  handleAgentResponse(response: any): void {
    if (response && Array.isArray(response.agents)) {
      this.agents = response.agents;
    } else if (Array.isArray(response)) {
      this.agents = response;
    } else {
      this.agents = [];
    }
    this.totalAgentElements = response?.totalElements ?? this.agents.length;
    this.loadingAgents = false;
    this.selectedAgent = null;
    this.cdr.detectChanges();
  }

  loadScripts(): void {
    this.loadingScripts = true;
    if (this.scriptSearchTerm.trim()) {
      this.apiService.searchScripts(this.scriptSearchTerm, '', this.scriptCurrentPage, this.scriptPageSize).subscribe({
        next: (response) => {
          this.handleScriptResponse(response);
        },
        error: (err) => {
          console.error('Error searching scripts:', err);
          this.loadingScripts = false;
        }
      });
    } else {
      this.apiService.getScripts(this.scriptCurrentPage, this.scriptPageSize).subscribe({
        next: (response) => {
          this.handleScriptResponse(response);
        },
        error: (err) => {
          console.error('Error loading scripts:', err);
          this.loadingScripts = false;
        }
      });
    }
  }

  handleScriptResponse(response: any): void {
    if (response && Array.isArray(response.scripts)) {
      this.scripts = response.scripts;
    } else if (Array.isArray(response)) {
      this.scripts = response;
    } else {
      this.scripts = [];
    }
    this.totalScriptElements = response?.totalElements ?? this.scripts.length;
    this.loadingScripts = false;
    this.selectedScript = null;
    this.cdr.detectChanges();
  }

  searchAgents(): void {
    this.agentCurrentPage = 0;
    this.loadAgents();
  }

  clearAgentSearch(): void {
    this.agentSearchTerm = '';
    this.agentCurrentPage = 0;
    this.loadAgents();
  }

  searchScripts(): void {
    this.scriptCurrentPage = 0;
    this.loadScripts();
  }

  clearScriptSearch(): void {
    this.scriptSearchTerm = '';
    this.scriptCurrentPage = 0;
    this.loadScripts();
  }

  onAgentPageChange(event: PageEvent): void {
    this.agentCurrentPage = event.pageIndex;
    this.agentPageSize = event.pageSize;
    this.loadAgents();
  }

  onScriptPageChange(event: PageEvent): void {
    this.scriptCurrentPage = event.pageIndex;
    this.scriptPageSize = event.pageSize;
    this.loadScripts();
  }

  selectAgent(agent: Agent): void {
    this.selectedAgent = agent;
    this.selectedScript = null;
  }

  selectScript(script: Script): void {
    this.selectedScript = script;
    this.selectedAgent = null;
  }

  onSelect(): void {
    if (this.selectedAgent) {
      this.dialogRef.close({ type: 'agent', item: this.selectedAgent });
    } else if (this.selectedScript) {
      this.dialogRef.close({ type: 'script', item: this.selectedScript });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
