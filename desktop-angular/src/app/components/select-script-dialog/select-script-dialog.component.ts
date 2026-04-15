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
import { ApiService, Script } from '../../services/api.service';

/**
 * Interface de dados para o diálogo de seleção de scripts.
 * @property projectId - ID do projeto ao qual os scripts serão adicionados.
 */
export interface SelectScriptDialogData {
  projectId: number;
}

/**
 * Componente de diálogo para seleção de scripts.
 * Permite buscar e selecionar scripts para adicionar a um projeto.
 * Suporta pesquisa paginada e seleção múltipla.
 * 
 * @componentName SelectScriptDialog
 * @selector app-select-script-dialog
 */
@Component({
  selector: 'app-select-script-dialog',
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
      <mat-icon class="header-icon">code</mat-icon>
      <h2 class="dialog-title">Add Scripts to Project</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="search-section">
        <mat-form-field class="search-field" appearance="outline">
          <mat-label>Search scripts...</mat-label>
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
          <span>Loading scripts...</span>
        </div>
        
        <div *ngIf="!loading && scripts.length === 0" class="empty-state">
          <mat-icon class="empty-icon">code</mat-icon>
          <span class="empty-text">No scripts found</span>
          <span class="empty-hint">Create a new script or adjust your search</span>
        </div>
        
        <table mat-table [dataSource]="scripts" class="script-table" *ngIf="!loading && scripts.length > 0">
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
              Script Name
            </th>
            <td mat-cell *matCellDef="let script">
              <div class="script-name">
                <mat-icon class="script-icon">code</mat-icon>
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
              <span class="category-badge">{{ script.category }}</span>
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
        Add {{ selection.selected.length > 0 ? selection.selected.length + ' ' : '' }}Script{{ selection.selected.length !== 1 ? 's' : '' }}
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
      color: #ba68c8;
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
      border-color: #ba68c8;
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
    
    .script-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .script-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
      background: rgba(186, 104, 200, 0.2);
      color: #ba68c8;
    }
    
    .script-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .script-row:hover {
      background-color: #333 !important;
    }
    
    .script-row.selected {
      background-color: #7b1fa2 !important;
    }
    
    .script-row.selected .script-icon {
      color: #ffffff;
    }
    
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
      background: linear-gradient(135deg, #8e24aa 0%, #7b1fa2 100%);
    }
    
    .select-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%);
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
      stroke: #ba68c8 !important;
    }
    
    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: #888 !important;
    }
    
    ::ng-deep .mat-mdc-checkbox.mat-mdc-checkbox-checked .mdc-checkbox__background {
      background-color: #ba68c8 !important;
      border-color: #ba68c8 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectScriptDialogComponent {
  searchTerm = '';
  scripts: Script[] = [];
  loading = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  displayedColumns = ['select', 'name', 'category', 'scope'];
  selection: { isSelected: (row: Script) => boolean; hasValue: () => boolean; selected: Script[]; toggle: (row: Script) => void; clear: () => void; isEmpty: () => boolean } = {
    isSelected: () => false,
    hasValue: () => false,
    selected: [],
    toggle: () => {},
    clear: () => {},
    isEmpty: () => true
  };

  constructor(
    public dialogRef: MatDialogRef<SelectScriptDialogComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SelectScriptDialogData
  ) {
    this.loadScripts();
    this.initSelection();
  }

  private initSelection(): void {
    const selectedScripts: Script[] = [];
    this.selection = {
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

  loadScripts(): void {
    /**
     * Carrega a lista de scripts do backend.
     * Utiliza pesquisa se houver termo de busca, caso contrário carrega todos.
     */
    this.loading = true;
    if (this.searchTerm.trim()) {
      this.apiService.searchScripts(this.searchTerm, '', this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error searching scripts:', err);
          this.loading = false;
        }
      });
    } else {
      this.apiService.getScripts(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          console.error('Error loading scripts:', err);
          this.loading = false;
        }
      });
    }
  }

  handleResponse(response: any): void {
    if (response && Array.isArray(response.scripts)) {
      this.scripts = response.scripts;
    } else if (Array.isArray(response)) {
      this.scripts = response;
    } else {
      this.scripts = [];
    }
    this.totalElements = response?.totalElements ?? this.scripts.length;
    this.totalPages = response?.totalPages ?? 1;
    this.loading = false;
    this.cdr.detectChanges();
  }

  search(): void {
    /**
     * Executa a pesquisa de scripts resetando para a primeira página.
     */
    this.currentPage = 0;
    this.loadScripts();
  }

  clearSearch(): void {
    /**
     * Limpa o termo de pesquisa e recarrega a lista de scripts.
     */
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadScripts();
  }

  onPageChange(event: PageEvent): void {
    /**
     * Manipula a mudança de página na paginação.
     * @param event - Evento de mudança de página contendo índice e tamanho.
     */
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadScripts();
  }

  toggleRow(row: Script): void {
    /**
     * Alterna a seleção de um script específico.
     * @param row - Script a ser selecionado ou desmarcado.
     */
    this.selection.toggle(row);
  }

  toggleAllRows(): void {
    /**
     * Alterna a seleção de todos os scripts visíveis na tabela.
     * Se todos estiverem selecionados, desmarca todos.
     */
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.scripts.forEach(script => {
        if (!this.selection.isSelected(script)) {
          this.selection.toggle(script);
        }
      });
    }
  }

  isAllSelected(): boolean {
    /**
     * Verifica se todos os scripts visíveis estão selecionados.
     * @returns true se todos os scripts estão selecionados.
     */
    return this.scripts.length > 0 && this.scripts.every(script => this.selection.isSelected(script));
  }

  onSelect(): void {
    /**
     * Confirma a seleção e fecha o diálogo.
     * Adiciona os scripts selecionados ao projeto via API.
     */
    if (this.selection.selected.length > 0 && this.data.projectId) {
      const scriptIds = this.selection.selected
        .filter(s => s.id)
        .map(s => s.id as number);
      
      console.log('Adding scripts to project:', this.data.projectId, 'scripts:', scriptIds);
      this.apiService.addScriptsToProject(this.data.projectId, scriptIds).subscribe({
        next: (result) => {
          console.log('Scripts added successfully:', result);
          this.dialogRef.close(this.selection.selected);
        },
        error: (err) => {
          console.error('Error adding scripts to project:', err);
        }
      });
    } else {
      this.dialogRef.close(this.selection.selected);
    }
  }

  onCancel(): void {
    /**
     * Cancela a operação e fecha o diálogo sem selecionar nada.
     */
    this.dialogRef.close();
  }
}
