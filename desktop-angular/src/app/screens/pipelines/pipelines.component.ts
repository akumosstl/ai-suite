import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService, PipelineRun, PipelineRunStep } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    ConfirmDialogComponent
  ],
  template: `
    <div class="pipelines-screen">
      <div class="top-menu">
        <div class="left-section">
          <button class="back-btn" (click)="goBack()" title="Back">
            <mat-icon>reply</mat-icon>
            <span>Back</span>
          </button>
          <div class="page-title">
            <mat-icon>alt_route</mat-icon>
            <span>Pipeline Executions</span>
          </div>
        </div>
        <button class="refresh-btn" (click)="loadRuns()" title="Refresh">
          <mat-icon>refresh</mat-icon>
        </button>
        <button class="cleanup-btn" (click)="cleanupRuns()" [disabled]="cleaningUp" title="Cleanup history (keeps running)">
          <mat-icon>delete_sweep</mat-icon>
          <span *ngIf="cleaningUp">Cleaning...</span>
        </button>
      </div>
      
      <div class="main-content">
        <div class="left-panel">
          <div class="panel-header">
            <mat-icon>list</mat-icon>
            <h3>All Runs</h3>
            <span class="run-count">{{ runs.length }}</span>
          </div>
          
          <div class="runs-list">
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
                <span class="run-name">{{ run.pipelineName || 'Pipeline #' + run.pipelineId }}</span>
                <span class="run-project">{{ run.projectName || 'Project #' + run.projectId }}</span>
                <span class="run-date">{{ formatDate(run.createdAt) }}</span>
              </div>
              <div class="run-actions">
                <button *ngIf="run.status === 'running'" 
                        class="icon-btn view-running-btn" 
                        (click)="viewRunningPipeline(run, $event)"
                        title="View Running Pipeline">
                  <mat-icon>visibility</mat-icon>
                </button>
              </div>
              <div class="run-status-badge" [class]="run.status || 'pending'">
                {{ run.status || 'pending' }}
              </div>
            </div>
            
            <div class="empty-list" *ngIf="runs.length === 0">
              <mat-icon>info</mat-icon>
              <span>No pipeline runs yet</span>
            </div>
          </div>
          
          <div class="pagination" *ngIf="totalPages > 1">
            <button class="page-btn" (click)="prevPage()" [disabled]="currentPage === 0">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
            <button class="page-btn" (click)="nextPage()" [disabled]="currentPage >= totalPages - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
        
        <div class="right-panel">
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
                    <span class="step-name">{{ step.agentName || step.scriptName || 'Unknown' }}</span>
                    <span class="step-category">{{ step.agentNamespace || step.scriptNamespace || '' }}</span>
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
              <button class="io-action-btn" (click)="showInput = true; showOutput = false" [class.active]="showInput">
                <mat-icon>input</mat-icon>
                <span>Input</span>
              </button>
              <button class="io-action-btn" (click)="showOutput = true; showInput = false" [class.active]="showOutput">
                <mat-icon>output</mat-icon>
                <span>Output</span>
              </button>
            </div>
            
            <div class="console-output">
              <div class="console-header">
                <mat-icon>terminal</mat-icon>
                <span>{{ showInput ? 'Input' : showOutput ? 'Output' : 'Console Output' }}</span>
                <button class="copy-btn" (click)="copyOutput()" title="Copy to clipboard">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
              <div class="console-content">
                <pre *ngIf="showInput">{{ selectedStep.inputContent || 'No input' }}</pre>
                <pre *ngIf="showOutput">{{ selectedStep.outputContent || 'No output yet...' }}</pre>
                <pre *ngIf="!showInput && !showOutput">{{ selectedStep.outputContent || 'No output yet...' }}</pre>
              </div>
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
    .pipelines-screen {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #121212;
      color: #e0e0e0;
    }
    
    .top-menu {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }

    .top-menu .left-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
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
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .back-btn span {
      font-size: 0.85rem;
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
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .refresh-btn:hover {
      background: #3a3a3a;
      border-color: #4fc3f7;
    }
    
    .cleanup-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .cleanup-btn:hover:not(:disabled) {
      background: #3a3a3a;
      border-color: #f44336;
    }
    
    .cleanup-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    .left-panel {
      width: 380px;
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
      flex: 1;
    }
    
    .run-count {
      background: #2a2a2a;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #888;
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
    
    .run-project {
      font-size: 0.75rem;
      color: #4fc3f7;
    }
    
    .run-date {
      font-size: 0.75rem;
      color: #888;
    }
    
    .run-actions {
      display: flex;
      gap: 4px;
    }
    
    .icon-btn {
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
    
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }
    
    .view-running-btn {
      color: #4fc3f7;
    }
    
    .view-running-btn:hover {
      background: rgba(79, 195, 247, 0.2);
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
    
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid #2a2a2a;
    }
    
    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .page-btn:hover:not(:disabled) {
      background: #3a3a3a;
      border-color: #4fc3f7;
    }
    
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .page-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .page-info {
      font-size: 0.85rem;
      color: #888;
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
    
    .step-category {
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
    
    .step-badge.failed {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }
    
    .details-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .io-action-btn {
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
    
    .io-action-btn:hover {
      background: #3a3a3a;
      border-color: #4fc3f7;
    }
    
    .io-action-btn.active {
      background: rgba(79, 195, 247, 0.2);
      border-color: #4fc3f7;
    }
    
    .io-action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
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
export class PipelinesComponent implements OnInit {
  runs: PipelineRun[] = [];
  selectedRun: PipelineRun | null = null;
  selectedStep: PipelineRunStep | null = null;
  showInput = false;
  showOutput = false;
  cleaningUp = false;
  
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  
  constructor(
    private router: Router,
    private apiService: ApiService,
    private projectContext: ProjectContextService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}
  
  ngOnInit() {
    this.loadRuns();
  }

  goBack(): void {
    const projectId = this.projectContext.getProjectId();
    if (projectId) {
      this.router.navigate(['/project', projectId]);
    } else {
      this.router.navigate(['/project']);
    }
  }
  
  loadRuns(page = 0) {
    this.apiService.getAllPipelineRuns(page, this.pageSize).subscribe({
      next: (response: any) => {
        this.runs = response.runs || [];
        this.currentPage = response.currentPage || 0;
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        if (this.runs.length > 0 && !this.selectedRun) {
          this.selectRun(this.runs[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading runs:', err)
    });
  }
  
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.selectedRun = null;
      this.selectedStep = null;
      this.loadRuns(page);
    }
  }
  
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }
  
  prevPage() {
    this.goToPage(this.currentPage - 1);
  }
  
  selectRun(run: PipelineRun) {
    this.selectedRun = run;
    this.selectedStep = null;
    this.showInput = false;
    this.showOutput = false;
    
    if (run.steps && run.steps.length > 0) {
      this.selectStep(run.steps[0]);
    }
  }
  
  selectStep(step: PipelineRunStep) {
    this.selectedStep = step;
  }
  
  viewRunningPipeline(run: PipelineRun, event: Event) {
    event.stopPropagation();
    if (!run.pipelineId || !run.projectId) {
      return;
    }
    const url = `/runpipelines?pipelineId=${run.pipelineId}&projectId=${run.projectId}`;
    window.open(url, '_blank');
  }

  cleanupRuns() {
    const dialogData: ConfirmDialogData = {
      title: 'Cleanup Pipeline History',
      message: 'Are you sure you want to delete all pipeline history except running ones?'
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.cleaningUp = true;
      this.apiService.cleanupAllPipelineRuns().subscribe({
        next: () => {
          this.cleaningUp = false;
          this.selectedRun = null;
          this.selectedStep = null;
          this.loadRuns();
        },
        error: () => {
          this.cleaningUp = false;
        }
      });
    });
  }
  
  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }
  
  copyOutput() {
    const content = this.showInput ? this.selectedStep?.inputContent : this.selectedStep?.outputContent;
    if (content) {
      navigator.clipboard.writeText(content).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }
}
