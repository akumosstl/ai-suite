import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, PipelineRun, PipelineRunStep } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { OutputDialogComponent } from '../../components/output-dialog/output-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-pipeline-run-history',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    OutputDialogComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="history-screen">
      <div class="top-menu">
        <button class="back-btn" (click)="goBack()" title="Back to project">
          <mat-icon>arrow_back</mat-icon>
          <span>Back</span>
        </button>
      <div class="page-title">
        <mat-icon>history</mat-icon>
        <span>Pipeline Run History</span>
      </div>
      <button class="refresh-btn" (click)="refresh()" title="Refresh" [disabled]="loading">
        <mat-icon [class.spinning]="loading">refresh</mat-icon>
        <span>Refresh</span>
      </button>
      </div>
      
      <div class="main-content">
        <div class="left-panel">
          <div class="panel-header">
            <mat-icon>list</mat-icon>
            <h3>Run History</h3>
          </div>
          
        <div class="runs-list">
        <div *ngIf="loading" class="loading-state">
          <mat-spinner diameter="32" color="primary"></mat-spinner>
          <span>Loading runs...</span>
        </div>
        <ng-container *ngIf="!loading">
        <div class="run-item"
                 *ngFor="let run of runs; let i = index"
                 [class.completed]="run.status === 'completed'"
                 [class.failed]="run.status === 'failed'"
                 [class.running]="run.status === 'running'"
                 [class.selected]="selectedRun?.id === run.id"
                 (click)="selectRun(run)">
              <div class="run-indicator">
                <mat-icon *ngIf="run.status === 'completed'">check_circle</mat-icon>
                <mat-icon *ngIf="run.status === 'failed'">error</mat-icon>
                <mat-icon *ngIf="run.status === 'running'">play_arrow</mat-icon>
                <mat-icon *ngIf="!run.status || run.status === 'pending'">schedule</mat-icon>
              </div>
              <div class="run-details">
                <span class="run-name">Run #{{ runs.length - i }}</span>
                <span class="run-date">{{ formatDate(run.createdAt) }}</span>
              </div>
              <div class="run-status-badge" [class]="run.status || 'pending'">
                {{ run.status || 'pending' }}
              </div>
            </div>
            
          <div class="empty-list" *ngIf="runs.length === 0">
            <mat-icon>info</mat-icon>
            <span>No runs yet</span>
          </div>
        </ng-container>
        </div>
          
      <mat-paginator class="custom-paginator"
        [length]="totalElements"
        [pageSize]="pageSize"
        [pageIndex]="currentPage"
        (page)="onPageChange($event)"
        showFirstLastButtons>
      </mat-paginator>
        </div>
        
        <div class="right-panel">
          <div class="pipeline-directory" *ngIf="selectedRun?.runDir">
            <mat-icon>folder</mat-icon>
            <span class="dir-path">{{ selectedRun?.runDir }}</span>
          </div>
          
          <div class="pipeline-visualization" *ngIf="selectedRun && selectedRun.steps?.length">
            <div class="pipeline-header">
              <mat-icon>alt_route</mat-icon>
              <h3>Pipeline Flow</h3>
            </div>
            
            <div class="pipeline-steps">
              <ng-container *ngFor="let step of selectedRun.steps; let i = index">
                <div class="pipeline-step"
                     [class.completed]="step.status === 'completed'"
                     [class.running]="step.status === 'running'"
                     [class.pending]="step.status === 'pending'"
                     [class.failed]="step.status === 'failed'"
                     [class.selected]="selectedStep?.id === step.id"
                     (click)="selectStep(step)">
                  <div class="step-number">{{ i + 1 }}</div>
                  <div class="step-icon">
                    <mat-icon *ngIf="step.agentName">smart_toy</mat-icon>
                    <mat-icon *ngIf="step.scriptName">code</mat-icon>
                  </div>
                  <div class="step-info">
                    <span class="step-name">{{ step.name || step.agentName || step.scriptName || 'Unknown' }}</span>
                    <span class="step-namespace">{{ step.agentNamespace || step.scriptNamespace || '' }}</span>
                  </div>
                </div>
                <div class="step-connector" *ngIf="i < selectedRun.steps!.length - 1">
                  <mat-icon>arrow_forward</mat-icon>
                </div>
              </ng-container>
            </div>
          </div>
          
          <div class="step-details-panel" *ngIf="selectedStep">
            <div class="details-header">
              <h3>Step Details</h3>
              <span class="step-badge" [class]="selectedStep.status || 'pending'">
                {{ selectedStep.status || 'pending' }}
              </span>
            </div>
            
            <div class="details-actions">
              <button class="output-btn" (click)="openOutputModal()">
                <mat-icon>output</mat-icon>
                <span>Output</span>
              </button>
              <button class="file-output-btn" (click)="openFileOutputModal()" [disabled]="selectedRun?.status === 'running'">
                <mat-icon>insert_drive_file</mat-icon>
                <span>File output</span>
              </button>
            </div>
          </div>
          
          <div class="no-run-selected" *ngIf="!selectedRun">
            <mat-icon>touch_app</mat-icon>
            <span>Select a run from the left panel to view details</span>
          </div>
          
          <div class="no-step-selected" *ngIf="selectedRun && !selectedStep && selectedRun.steps?.length">
            <mat-icon>touch_app</mat-icon>
            <span>Click on a step to view details</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-screen {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #121212;
      color: #e0e0e0;
    }
    
    .top-menu {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .back-btn:hover {
      background: #3a3a3a;
      border-color: #4fc3f7;
    }
    
    .back-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
.page-title mat-icon {
  color: #4fc3f7;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.refresh-btn:hover:not(:disabled) {
  background: #3a3a3a;
  border-color: #4fc3f7;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.refresh-btn mat-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
    
    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    .left-panel {
      width: 320px;
      background: #1a1a1a;
      border-right: 1px solid #2a2a2a;
      display: flex;
      flex-direction: column;
    }
    
    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .panel-header mat-icon {
      color: #4fc3f7;
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .runs-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    
    .run-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .run-item:hover {
      background: #252525;
      border-color: #3a3a3a;
    }
    
    .run-item.selected {
      border-color: #4fc3f7;
      background: rgba(79, 195, 247, 0.1);
    }
    
    .run-item.completed .run-indicator {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }
    
    .run-item.failed .run-indicator {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }
    
    .run-item.running .run-indicator {
      background: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }
    
    .run-indicator {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      color: #888;
      flex-shrink: 0;
    }
    
    .run-indicator mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .run-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .run-name {
      color: #e0e0e0;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    .run-date {
      font-size: 0.75rem;
      color: #888;
    }
    
    .run-status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      text-transform: capitalize;
      background: rgba(255, 255, 255, 0.1);
      color: #888;
    }
    
    .run-status-badge.completed {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }
    
    .run-status-badge.failed {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }
    
    .run-status-badge.running {
      background: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }
    
    .empty-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
    }
    
.empty-list mat-icon {
  font-size: 48px;
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #888;
}

::ng-deep .custom-paginator {
  background: #1a1a1a !important;
  color: #e0e0e0 !important;
  border-top: 1px solid #2a2a2a !important;
}

::ng-deep .custom-paginator .mat-mdc-icon-button {
  color: #b0b0b0 !important;
}

::ng-deep .custom-paginator .mat-mdc-icon-button:hover {
  background-color: #2a2a2a !important;
  color: #ffffff !important;
}

::ng-deep .custom-paginator .mat-mdc-paginator-range-label {
  color: #888 !important;
}

::ng-deep .custom-paginator .mat-mdc-paginator-page-size-label {
  color: #888 !important;
}

::ng-deep .custom-paginator .mat-mdc-select-value {
  color: #e0e0e0 !important;
}

::ng-deep .custom-paginator .mat-mdc-select-arrow {
  color: #888 !important;
}
    
    .right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px;
      overflow: hidden;
    }
    
    .pipeline-visualization {
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .pipeline-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .pipeline-header mat-icon {
      color: #4fc3f7;
    }
    
    .pipeline-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .pipeline-steps {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0;
      overflow-x: auto;
      padding: 10px 0;
    }
    
    .pipeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: #252525;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      min-width: 120px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .pipeline-step:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }
    
    .pipeline-step.selected {
      border-color: #4fc3f7;
    }
    
    .pipeline-step.completed {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
    }
    
    .pipeline-step.completed .step-number {
      background: linear-gradient(135deg, #4caf50 0%, #43a047 100%);
    }
    
    .pipeline-step.running {
      border-color: #ff9800;
      background: rgba(255, 152, 0, 0.1);
    }
    
    .pipeline-step.pending {
      border-color: #555;
      background: #252525;
    }
    
    .pipeline-step.ready {
      border-color: #9c27b0;
      background: rgba(156, 39, 176, 0.1);
    }
    
    .pipeline-step.ready .step-number {
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
    }
    
    .pipeline-step.failed {
      border-color: #f44336;
      background: rgba(244, 67, 54, 0.1);
    }
    
    .pipeline-step.failed .step-number {
      background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
    }
    
    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #555 0%, #444 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .step-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(79, 195, 247, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .step-icon mat-icon {
      color: #4fc3f7;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .pipeline-step.completed .step-icon {
      background: rgba(76, 175, 80, 0.2);
    }
    
    .pipeline-step.completed .step-icon mat-icon {
      color: #81c784;
    }
    
    .step-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
    }
    
    .step-info .step-name {
      color: #e0e0e0;
      font-weight: 500;
      font-size: 0.85rem;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .step-namespace {
      font-size: 0.7rem;
      color: #888;
      text-transform: capitalize;
    }
    
    .step-connector {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
    }
    
    .step-connector mat-icon {
      color: #555;
      font-size: 20px;
    }
    
    .step-details-panel {
      flex: 1;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      min-height: 200px;
    }
    
    .details-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .details-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .step-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      text-transform: capitalize;
      background: rgba(255, 255, 255, 0.1);
      color: #888;
    }
    
    .step-badge.completed {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }
    
    .step-badge.running {
      background: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }
    
    .step-badge.pending {
      background: rgba(255, 255, 255, 0.1);
      color: #888;
    }
    
    .step-badge.ready {
      background: rgba(156, 39, 176, 0.2);
      color: #ba68c8;
    }
    
    .step-badge.failed {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }
    
    .details-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .output-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #252525;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .output-btn:hover {
      background: #3a3a3a;
      border-color: #4fc3f7;
    }
    
    .output-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
    }
    
    .file-output-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #252525;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .file-output-btn:hover:not(:disabled) {
      background: #3a3a3a;
      border-color: #ff9800;
    }
    
    .file-output-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .file-output-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ff9800;
    }
    
    .pipeline-directory {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .pipeline-directory mat-icon {
      color: #ff9800;
    }
    
    .dir-path {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.85rem;
      color: #888;
      word-break: break-all;
    }
    
    .console-output {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0d0d0d;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
      min-height: 150px;
    }
    
    .console-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #1a1a1a;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .console-header mat-icon {
      color: #4caf50;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .console-header span {
      font-size: 0.85rem;
      color: #888;
      flex: 1;
    }

    .copy-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: #888;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }

    .copy-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .console-content {
      flex: 1;
      padding: 12px;
      overflow: auto;
    }
    
    .console-content pre {
      margin: 0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.85rem;
      color: #b0b0b0;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .no-run-selected, .no-step-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      color: #666;
    }
    
    .no-run-selected mat-icon, .no-step-selected mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
  `]
})
export class PipelineRunHistoryComponent implements OnInit {
  runs: PipelineRun[] = [];
  selectedRun: PipelineRun | null = null;
  selectedStep: PipelineRunStep | null = null;
  projectId: number | null = null;
  pipelineId: number | null = null;
  loading = false;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private projectContext: ProjectContextService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.projectId = params['projectId'] ? +params['projectId'] : this.projectContext.getProjectId();
      this.pipelineId = params['pipelineId'] ? +params['pipelineId'] : null;
      
      if (this.projectId) {
        this.loadRuns();
      }
    });
  }
  
  /**
   * Carrega as execuções do pipeline com paginação.
   * @param page O número da página a ser carregada.
   */
  loadRuns(page = 0) {
    if (!this.projectId) return;
    this.loading = true;

    const runsObservable = this.pipelineId
      ? this.apiService.getPipelineRunsByPipeline(this.pipelineId, page, this.pageSize)
      : this.apiService.getPipelineRunsByProject(this.projectId, page, this.pageSize);

    runsObservable.subscribe({
      next: (response: any) => {
        this.runs = response.runs || [];
        this.currentPage = response.currentPage || 0;
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        this.loading = false;
        if (this.runs.length > 0 && !this.selectedRun) {
          this.selectRun(this.runs[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading runs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  refresh() {
    this.loadRuns(this.currentPage);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.selectedRun = null;
    this.selectedStep = null;
    this.loadRuns(this.currentPage);
  }
  
  /**
   * Seleciona uma execução para visualização detalhada.
   * @param run A execução do pipeline a ser selecionada.
   */
  selectRun(run: PipelineRun) {
    this.selectedRun = run;
    this.selectedStep = null;
    
    if (run.steps && run.steps.length > 0) {
      this.selectStep(run.steps[0]);
    }
  }
  
  /**
   * Seleciona um passo para visualização detalhada.
   * @param step O passo a ser selecionado.
   */
  selectStep(step: PipelineRunStep) {
    this.selectedStep = step;
  }
  
  openOutputModal() {
    if (this.selectedStep) {
      this.dialog.open(OutputDialogComponent, {
        width: '80vw',
        height: '70vh',
        maxWidth: '900px',
        data: {
          step: this.selectedStep,
          type: 'output'
        },
        panelClass: 'output-dialog-panel'
      });
    }
  }

  openFileOutputModal() {
    if (!this.selectedStep || !this.selectedRun || !this.selectedRun.id) {
      return;
    }

    this.apiService.getStepFileOutput(this.selectedRun.id, this.selectedStep.stepOrder!).subscribe({
      next: (response: any) => {
        if (response.fileExists === false) {
          const dialogData: ConfirmDialogData = {
            title: 'File Not Found',
            message: response.message || 'Output file no longer exists. Expected path: ' + response.expectedPath
          };
          this.dialog.open(ConfirmDialogComponent, {
            width: '450px',
            data: dialogData
          });
        } else {
          this.dialog.open(OutputDialogComponent, {
            width: '80vw',
            height: '70vh',
            maxWidth: '900px',
            data: {
              step: {
                ...this.selectedStep,
                outputContent: response.content
              },
              type: 'output'
            },
            panelClass: 'output-dialog-panel'
          });
        }
      },
      error: (err: any) => {
        console.error('Error fetching file output:', err);
        const dialogData: ConfirmDialogData = {
          title: 'Error',
          message: 'Failed to fetch file output: ' + (err.message || 'Unknown error')
        };
        this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: dialogData
        });
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }
  
/**
    * Navega de volta para a página do projeto.
    */
  goBack() {
    if (this.projectId) {
      this.router.navigate(['/project', this.projectId], {
        queryParams: { pipelineId: this.pipelineId }
      });
    } else {
      this.router.navigate(['/project']);
    }
  }
}
