import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'

interface PluginRegistry {
  plugins: Array<{
    name: string
    version: string
    namespace: string
    documentationUrl: string
    downloadUrl?: string
    description?: string
  }>
}

@Component({
  selector: 'app-plugins-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <mat-icon class="header-icon">extension</mat-icon>
        <h2 class="modal-title">Tools</h2>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="left-panel">
          <div class="panel-header">
            <h3 class="panel-title">Available Tools</h3>
            <div class="search-container">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                class="search-input" 
                placeholder="Search tools..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()">
              <mat-icon 
                *ngIf="searchTerm" 
                class="clear-icon" 
                (click)="clearSearch()">
                close
              </mat-icon>
            </div>
          </div>
          
          <div class="plugins-list">
            <div *ngIf="loading" class="loading-state">
              <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
              <span>Loading tools...</span>
            </div>

            <div *ngIf="!loading && filteredPlugins.length === 0" class="empty-state">
              <mat-icon class="empty-icon">extension</mat-icon>
              <span class="empty-text">{{ searchTerm ? 'No tools found' : 'No tools available' }}</span>
            </div>

            <div 
              *ngFor="let plugin of paginatedPlugins" 
              class="plugin-item"
              [class.selected]="selectedPlugin === plugin"
              (click)="selectPlugin(plugin)">
              <div class="plugin-info">
                <div class="plugin-name">{{ plugin.name }}</div>
                <div class="plugin-version">v{{ plugin.version }}</div>
                <div class="plugin-namespace">{{ plugin.namespace }}</div>
              </div>
              <mat-icon class="navigate-icon">navigate_next</mat-icon>
            </div>

            <mat-paginator
              *ngIf="filteredPlugins.length > 0"
              [length]="filteredPlugins.length"
              [pageSize]="pageSize"
              [pageIndex]="pageIndex"
              [showFirstLastButtons]="true"
              [pageSizeOptions]="[10]"
              (page)="onPageChange($event)"
              class="paginator">
            </mat-paginator>
          </div>
        </div>

        <div class="right-panel">
          <div *ngIf="!selectedPlugin" class="no-selection">
            <mat-icon class="select-icon">touch_app</mat-icon>
            <span class="select-text">Select a tool to view documentation</span>
          </div>
          
          <div *ngIf="selectedPlugin" class="plugin-content">
            <div class="plugin-detail-header">
              <h3 class="plugin-detail-name">{{ selectedPlugin.name }}</h3>
              <span class="plugin-detail-version">v{{ selectedPlugin.version }}</span>
            </div>
            <div class="plugin-detail-namespace">{{ selectedPlugin.namespace }}</div>
            <div *ngIf="selectedPlugin.description" class="plugin-detail-description">
              {{ selectedPlugin.description }}
            </div>
            <div class="plugin-detail-actions">
              <a 
                mat-button
                [href]="selectedPlugin.documentationUrl"
                target="_blank"
                class="documentation-link">
                <mat-icon>open_in_new</mat-icon>
                Open Documentation
              </a>
              <a 
                mat-button
                *ngIf="selectedPlugin.downloadUrl && selectedPlugin.downloadUrl !== ''"
                [href]="selectedPlugin.downloadUrl"
                target="_blank"
                class="download-link">
                <mat-icon>download</mat-icon>
                Download
              </a>
            </div>
           
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      flex-direction: column;
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      width: 80vw;
      height: 80vh;
      max-width: 1600px;
      max-height: 1000px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #81d4fa;
    }

    .modal-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 500;
      color: #ffffff;
      flex: 1;
    }

    .close-btn {
      color: #888;
    }

    .close-btn:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }

    .modal-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-panel {
      width: 350px;
      border-right: 1px solid #3a3a3a;
      display: flex;
      flex-direction: column;
      background: #1e1e1e;
    }

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #3a3a3a;
      background: #252525;
    }

    .panel-title {
      margin: 0 0 12px 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .search-container {
      display: flex;
      align-items: center;
      background: #1e1e1e;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      padding: 0 12px;
      transition: all 0.2s ease;
    }

    .search-container:focus-within {
      border-color: #81d4fa;
    }

    .search-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #e0e0e0;
      font-size: 0.9rem;
      padding: 10px 8px;
    }

    .search-input::placeholder {
      color: #666;
    }

    .clear-icon {
      color: #666;
      font-size: 18px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      padding: 4px;
    }

    .clear-icon:hover {
      color: #e0e0e0;
    }

    .plugins-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #888;
      gap: 12px;
    }

    .empty-icon,
    .select-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #555;
    }

    .empty-text,
    .select-text {
      font-size: 1rem;
      font-weight: 500;
      color: #b0b0b0;
    }

    .plugin-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      margin-bottom: 4px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .plugin-item:hover {
      background-color: #2a2a2a;
      border-color: #3a3a3a;
    }

    .plugin-item.selected {
      background-color: rgba(129, 212, 250, 0.15);
      border-color: #81d4fa;
    }

    .plugin-info {
      flex: 1;
    }

    .plugin-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: #e0e0e0;
      margin-bottom: 2px;
    }

    .plugin-version {
      font-size: 0.75rem;
      color: #81d4fa;
      margin-bottom: 2px;
    }

    .plugin-namespace {
      font-size: 0.75rem;
      color: #666;
    }

    .navigate-icon {
      color: #555;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .paginator {
      border-top: 1px solid #3a3a3a;
      background: #252525;
    }

    ::ng-deep .mat-mdc-paginator {
      background: transparent !important;
    }

    ::ng-deep .mat-mdc-paginator-container {
      min-height: 40px;
    }

    ::ng-deep .mat-mdc-paginator-page-size-label,
    ::ng-deep .mat-mdc-paginator-range-label {
      color: #888;
    }

    ::ng-deep .mat-mdc-paginator-icon {
      fill: #888;
    }

    .right-panel {
      flex: 1;
      background: #1e1e1e;
      overflow: hidden;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #888;
      gap: 12px;
    }

    .plugin-content {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .plugin-detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .plugin-detail-name {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #ffffff;
    }

    .plugin-detail-version {
      font-size: 0.9rem;
      color: #81d4fa;
      background: rgba(129, 212, 250, 0.1);
      padding: 4px 12px;
      border-radius: 20px;
    }

    .plugin-detail-namespace {
      font-size: 0.9rem;
      color: #888;
      font-family: monospace;
    }

    .plugin-detail-description {
      font-size: 0.95rem;
      color: #e0e0e0;
      padding: 16px;
      background: #252525;
      border-radius: 8px;
      border-left: 3px solid #81d4fa;
      line-height: 1.6;
    }

    .plugin-detail-actions {
      display: flex;
      gap: 12px;
    }

    .documentation-link {
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      color: #81d4fa;
      border: 1px solid #81d4fa;
    }

    .documentation-link:hover {
      background-color: rgba(129, 212, 250, 0.1);
    }

    .documentation-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .download-link {
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      color: #4caf50;
      border: 1px solid #4caf50;
    }

    .download-link:hover {
      background-color: rgba(76, 175, 80, 0.1);
    }

    .download-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .documentation-frame {
      flex: 1;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      background: #0d0d0d;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      background: #1e1e1e;
      border-top: 1px solid #3a3a3a;
    }

    .cancel-btn {
      color: #ff8a80;
      border-color: #5c2b2b;
    }

    .cancel-btn:hover {
      background-color: #5c2b2b;
      color: #ff8a80;
    }

    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #81d4fa !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PluginsModalComponent {
  plugins: Array<{
    name: string
    version: string
    namespace: string
    documentationUrl: string
    downloadUrl?: string
    description?: string
  }> = []
  filteredPlugins: Array<{
    name: string
    version: string
    namespace: string
    documentationUrl: string
    downloadUrl?: string
    description?: string
  }> = []
  paginatedPlugins: Array<{
    name: string
    version: string
    namespace: string
    documentationUrl: string
    downloadUrl?: string
    description?: string
  }> = []
  selectedPlugin: any = null
  loading = false
  pageSize = 10
  pageIndex = 0
  searchTerm = ''

  constructor(
    private dialogRef: MatDialogRef<PluginsModalComponent>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlugins()
  }

  loadPlugins(): void {
    this.loading = true
    this.cdr.detectChanges()
    
    this.apiService.getPluginRegistry().subscribe({
      next: (data: PluginRegistry) => {
        this.plugins = data.plugins || []
        this.filteredPlugins = [...this.plugins]
        this.updatePaginatedPlugins()
        this.loading = false
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.error('Error loading plugins:', err)
        this.loading = false
        this.cdr.detectChanges()
      }
    })
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase().trim()
    
    if (term === '') {
      this.filteredPlugins = [...this.plugins]
    } else {
      this.filteredPlugins = this.plugins.filter(plugin => 
        plugin.name.toLowerCase().startsWith(term)
      )
    }
    
    this.pageIndex = 0
    this.updatePaginatedPlugins()
  }

  clearSearch(): void {
    this.searchTerm = ''
    this.filteredPlugins = [...this.plugins]
    this.pageIndex = 0
    this.updatePaginatedPlugins()
  }

  updatePaginatedPlugins(): void {
    const start = this.pageIndex * this.pageSize
    const end = start + this.pageSize
    this.paginatedPlugins = this.filteredPlugins.slice(start, end)
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex
    this.updatePaginatedPlugins()
  }

  selectPlugin(plugin: any): void {
    this.selectedPlugin = plugin
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}