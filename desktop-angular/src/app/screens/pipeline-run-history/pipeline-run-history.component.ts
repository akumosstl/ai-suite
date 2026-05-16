import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { ConsoleOutputDialogComponent } from '../../components/console-output-dialog/console-output-dialog.component';

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
    ConfirmDialogComponent,
    ConsoleOutputDialogComponent
  ],
  template: `
    <div class="history-screen">
      <div class="top-menu">
        <div class="panel-title">
          <mat-icon>history</mat-icon>
          <span>Pipeline Run History</span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" (click)="goBack()" title="Back to project">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <button class="icon-btn" (click)="refresh()" title="Refresh" [disabled]="loading">
            <mat-icon [class.spinning]="loading">refresh</mat-icon>
          </button>
          <button class="icon-btn" 
            [class.active]="autoRefresh" 
            [class.running]="selectedRun?.status === 'running'"
            (click)="toggleAutoRefresh()" 
            [title]="autoRefresh ? 'Stop auto-refresh' : 'Auto-refresh'"
            [disabled]="selectedRun?.status !== 'running' && selectedRun?.status !== 'pending'">
            <mat-icon [class.spinning]="autoRefresh">sync</mat-icon>
          </button>
        </div>
      </div>

      <div class="main-content">
        <div class="left-panel">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>list</mat-icon>
              <span>Run History</span>
              <span class="count-badge">{{ totalElements }}</span>
            </div>
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
            <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
          <div class="empty-state" *ngIf="runs.length === 0">
            <mat-icon>history</mat-icon>
            <span>No runs yet</span>
            <small>Run a pipeline to see history</small>
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
              <button class="console-btn" (click)="openConsoleOutput()">
                <mat-icon>terminal</mat-icon>
                <span>Console</span>
              </button>
              <button class="file-output-btn" (click)="openFileOutputModal()" [disabled]="selectedRun?.status === 'running'">
                <mat-icon>insert_drive_file</mat-icon>
                <span>File output</span>
              </button>
            </div>
          </div>
          
          <div class="no-run-selected" *ngIf="!selectedRun">
            <mat-icon>touch_app</mat-icon>
            <span>Select a run from the left panel</span>
            <small>Click to view details</small>
          </div>

          <div class="no-step-selected" *ngIf="selectedRun && !selectedStep && selectedRun.steps?.length">
            <mat-icon>touch_app</mat-icon>
            <span>Click on a step to view details</span>
            <small>Select a step above</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-screen {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0d0d0d;
      color: #fff;
    }

    .top-menu {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .panel-title mat-icon {
      color: #4fc3f7;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:hover:not(:disabled) {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
    }

    .icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .icon-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .icon-btn.danger-btn:hover:not(:disabled) {
      border-color: #ff5252;
      color: #ff5252;
      background: rgba(255, 82, 82, 0.1);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .icon-btn .spinning {
      animation: spin 1s linear infinite;
    }

    .icon-btn.active {
      border-color: #4caf50;
      color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
    }

    .icon-btn.active:hover:not(:disabled) {
      background: rgba(76, 175, 80, 0.2);
    }

    .icon-btn.running:not(.active) {
      border-color: #ff9800;
      color: #ff9800;
    }

    .main-content {
      flex: 1;
      display: flex;
      gap: 0;
      overflow: hidden;
    }

    .left-panel {
      width: 420px;
      background: linear-gradient(180deg, #1a1a1a 0%, #151515 100%);
      border-right: 1px solid #2a2a2a;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #1e1e1e;
      border-bottom: 1px solid #2a2a2a;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      flex: 1;
      color: #fff;
    }

    .count-badge {
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
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
      gap: 14px;
      padding: 14px 16px;
      margin-bottom: 8px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
    }

    .run-item:hover {
      border-color: #3a3a3a;
      background: #222;
    }

    .run-item.selected {
      background: rgba(79, 195, 247, 0.08);
      border-color: #4fc3f7;
    }

    .run-item.completed .run-indicator {
      background: rgba(76, 175, 80, 0.15);
      color: #81c784;
    }

    .run-item.failed .run-indicator {
      background: rgba(244, 67, 54, 0.15);
      color: #e57373;
    }

    .run-item.running .run-indicator {
      background: rgba(255, 152, 0, 0.15);
      color: #ffb74d;
    }

    .run-indicator {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2a2a2a;
      color: #4fc3f7;
      flex-shrink: 0;
    }

    .run-item.selected .run-indicator {
      background: rgba(79, 195, 247, 0.15);
    }

    .run-indicator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .run-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .run-name {
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .run-item.selected .run-name {
      color: #4fc3f7;
    }

    .run-date {
      font-size: 0.75rem;
      color: #888;
    }

    .run-item.selected .run-date {
      color: #4fc3f7;
      opacity: 0.7;
    }

    .run-status-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7rem;
      text-transform: capitalize;
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
      font-weight: 600;
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

    .run-status-badge.pending {
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
    }

    .chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #555;
      transition: transform 0.15s;
    }

    .run-item:hover .chevron {
      transform: translateX(4px);
      color: #888;
    }

    .run-item.selected .chevron {
      color: #4fc3f7;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 64px 32px;
      color: #555;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #333;
    }

    .empty-state span {
      font-size: 1rem;
      color: #888;
    }

    .empty-state small {
      font-size: 0.8rem;
      color: #555;
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
      background: #0d0d0d;
      overflow: hidden;
      padding: 24px;
    }

    .pipeline-directory {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .pipeline-directory mat-icon {
      color: #ff9800;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .dir-path {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
      color: #888;
      word-break: break-all;
    }

    .pipeline-visualization {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
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
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .pipeline-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
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
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      min-width: 120px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .pipeline-step:hover {
      border-color: #3a3a3a;
      background: #222;
    }

    .pipeline-step.selected {
      border-color: #4fc3f7;
      background: rgba(79, 195, 247, 0.08);
    }

    .pipeline-step.completed {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.08);
    }

    .pipeline-step.completed .step-number {
      background: linear-gradient(135deg, #4caf50 0%, #43a047 100%);
    }

    .pipeline-step.running {
      border-color: #ff9800;
      background: rgba(255, 152, 0, 0.08);
    }

    .pipeline-step.pending {
      border-color: #555;
      background: #1a1a1a;
    }

    .pipeline-step.ready {
      border-color: #9c27b0;
      background: rgba(156, 39, 176, 0.08);
    }

    .pipeline-step.ready .step-number {
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
    }

    .pipeline-step.failed {
      border-color: #f44336;
      background: rgba(244, 67, 54, 0.08);
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
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pipeline-step.selected .step-icon {
      background: rgba(79, 195, 247, 0.15);
    }

    .step-icon mat-icon {
      color: #4fc3f7;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .pipeline-step.completed .step-icon {
      background: rgba(76, 175, 80, 0.15);
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
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pipeline-step.selected .step-info .step-name {
      color: #4fc3f7;
    }

    .step-namespace {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pipeline-step.selected .step-namespace {
      color: #4fc3f7;
      opacity: 0.7;
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
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
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
      font-weight: 600;
      color: #fff;
    }

    .step-badge {
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
      text-transform: capitalize;
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
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
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
      padding: 12px 20px;
      background: rgba(79, 195, 247, 0.15);
      border: 1px solid #4fc3f7;
      border-radius: 8px;
      color: #4fc3f7;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .output-btn:hover:not(:disabled) {
      background: rgba(79, 195, 247, 0.25);
    }

    .output-btn:disabled {
      background: #1a1a1a;
      color: #555;
      border-color: #2a2a2a;
      cursor: not-allowed;
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
      padding: 12px 20px;
      background: rgba(255, 152, 0, 0.15);
      border: 1px solid #ff9800;
      border-radius: 8px;
      color: #ffb74d;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .file-output-btn:hover:not(:disabled) {
      background: rgba(255, 152, 0, 0.25);
    }

    .file-output-btn:disabled {
      background: #1a1a1a;
      color: #555;
      border-color: #2a2a2a;
      cursor: not-allowed;
    }

    .file-output-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ff9800;
    }

    .console-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(76, 175, 80, 0.15);
      border: 1px solid #4caf50;
      border-radius: 8px;
      color: #81c784;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .console-btn:hover {
      background: rgba(76, 175, 80, 0.25);
    }

    .console-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #81c784;
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
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
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
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      color: #e0e0e0;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .no-run-selected, .no-step-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 64px 32px;
      color: #555;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
    }

    .no-run-selected mat-icon, .no-step-selected mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #333;
    }

    .no-run-selected span, .no-step-selected span {
      font-size: 1rem;
      color: #888;
    }

    .no-run-selected small, .no-step-selected small {
      font-size: 0.8rem;
      color: #555;
    }
  `]
})
export class PipelineRunHistoryComponent implements OnInit, OnDestroy {
  runs: PipelineRun[] = [];
  selectedRun: PipelineRun | null = null;
  selectedStep: PipelineRunStep | null = null;
  projectId: number | null = null;
  pipelineId: number | null = null;
  loading = false;
  autoRefresh = false;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  
  private eventSource?: EventSource;
  private pollingInterval: any;
  
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
  
  ngOnDestroy() {
    this.disconnectSse();
    this.stopPolling();
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
    const previousSelectedId = this.selectedRun?.id;
    this.loadRuns(this.currentPage);
    if (previousSelectedId) {
      setTimeout(() => {
        const updatedRun = this.runs.find(r => r.id === previousSelectedId);
        if (updatedRun) {
          this.selectedRun = updatedRun;
          if (updatedRun.steps && updatedRun.steps.length > 0) {
            const currentSelectedStepId = this.selectedStep?.id;
            if (currentSelectedStepId) {
              const updatedStep = updatedRun.steps.find(s => s.id === currentSelectedStepId);
              if (updatedStep) {
                this.selectedStep = updatedStep;
              }
            } else if (this.selectedStep) {
              const matchingStep = updatedRun.steps.find(s => s.stepOrder === this.selectedStep?.stepOrder);
              if (matchingStep) {
                this.selectedStep = matchingStep;
              }
            }
          }
          this.cdr.detectChanges();
        }
      }, 100);
    }
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
    if (!this.projectId) return;
    
    this.selectedStep = null;
    
    this.apiService.getPipelineRunsByPipeline(this.pipelineId || run.pipelineId || 0, 0, 10).subscribe({
      next: (response: any) => {
        const runs = response.runs || [];
        const runningRun = runs.find((r: PipelineRun) => r.status === 'running' || r.status === 'pending');
        
        if (runningRun) {
          this.selectedRun = runningRun;
          if (runningRun.steps && runningRun.steps.length > 0) {
            this.selectStep(runningRun.steps[0]);
          }
          
          if (this.autoRefresh) {
            this.connectSse(runningRun.id!);
            this.startPolling();
          }
        } else {
          this.selectedRun = run;
          if (run.steps && run.steps.length > 0) {
            this.selectStep(run.steps[0]);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.selectedRun = run;
        if (run.steps && run.steps.length > 0) {
          this.selectStep(run.steps[0]);
        }
        this.cdr.detectChanges();
        console.error('Error fetching runs:', err);
      }
    });
  }
  
  toggleAutoRefresh() {
    if (this.autoRefresh) {
      this.autoRefresh = false;
      this.disconnectSse();
      this.stopPolling();
    } else {
      this.loadingRunsAndConnect();
    }
  }
  
  private loadingRunsAndConnect() {
    if (!this.projectId) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    const runsObservable = this.pipelineId
      ? this.apiService.getPipelineRunsByPipeline(this.pipelineId, 0, 1)
      : this.apiService.getPipelineRunsByProject(this.projectId, 0, 1);

    runsObservable.subscribe({
      next: (response: any) => {
        this.loading = false;
        const runs = response.runs || [];
        
        const runningRun = runs.find((r: PipelineRun) => r.status === 'running' || r.status === 'pending');
        
        if (runningRun) {
          this.selectedRun = runningRun;
          if (runningRun.steps && runningRun.steps.length > 0) {
            this.selectStep(runningRun.steps[0]);
          }
          this.autoRefresh = true;
          this.connectSse(runningRun.id!);
          this.startPolling();
          console.log('History: Connected to running run:', runningRun.id);
        } else if (runs.length > 0) {
          this.selectedRun = runs[0];
          if (runs[0].steps && runs[0].steps.length > 0) {
            this.selectStep(runs[0].steps[0]);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading runs:', err);
        this.cdr.detectChanges();
      }
    });
  }
  
  connectSse(runId: number) {
    this.disconnectSse();
    const baseUrl = 'http://localhost:1488';
    const sseUrl = `${baseUrl}/api/pipeline-runs/${runId}/stream`;
    console.log('History: Connecting to SSE:', sseUrl);
    this.eventSource = new EventSource(sseUrl);
    
    this.eventSource.addEventListener('connected', (event) => {
      console.log('History SSE connected:', event);
    });
    
    this.eventSource.addEventListener('step-output', (event) => {
      console.log('History SSE step-output received:', event.data);
      try {
        const data = JSON.parse(event.data);
        this.handleStepUpdate(data);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });
    
    this.eventSource.addEventListener('pipeline-complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('History Pipeline complete:', data);
        this.autoRefresh = false;
        this.disconnectSse();
        this.stopPolling();
        this.loadRuns(this.currentPage);
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    });
    
    this.eventSource.addEventListener('step-error', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('History Step error:', data);
        if (this.selectedRun?.steps) {
          const step = this.selectedRun.steps.find(s => s.stepOrder === data.stepOrder);
          if (step) {
            step.status = 'failed';
          }
        }
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error parsing SSE step-error:', e);
      }
    });
    
    this.eventSource.onerror = (error) => {
      console.error('History SSE error:', error);
      this.disconnectSse();
      if (this.autoRefresh && this.selectedRun?.id) {
        console.log('History: Attempting to reconnect SSE in 3 seconds...');
        setTimeout(() => {
          if (this.autoRefresh && this.selectedRun?.id) {
            this.connectSse(this.selectedRun.id);
          }
        }, 3000);
      }
    };
  }
  
  disconnectSse() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }
  
  startPolling(intervalMs: number = 3000) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      if (this.autoRefresh && this.selectedRun?.id) {
        this.pollRunStatus();
      } else {
        this.stopPolling();
      }
    }, intervalMs);
  }
  
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }
  
  pollRunStatus() {
    if (!this.selectedRun?.id) return;
    
    this.apiService.getPipelineRunById(this.selectedRun.id).subscribe({
      next: (run) => {
        if (run) {
          this.selectedRun = run;
          if (this.selectedStep) {
            const updatedStep = run.steps?.find(s => s.id === this.selectedStep?.id || s.stepOrder === this.selectedStep?.stepOrder);
            if (updatedStep) {
              this.selectedStep = updatedStep;
            }
          }
          if (run.status === 'completed' || run.status === 'failed' || run.status === 'stopped') {
            this.autoRefresh = false;
            this.disconnectSse();
            this.stopPolling();
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error polling run status:', err)
    });
  }
  
  handleStepUpdate(data: { runId?: number; pipelineId?: number; stepId: number; stepOrder: number; output: string; status: string }) {
    if (!this.selectedRun?.steps) return;
    
    const step = this.selectedRun.steps.find(s => s.stepOrder === data.stepOrder);
    if (step) {
      step.status = data.status;
      step.outputContent = data.output;
      
      if (data.status === 'completed') {
        const nextStep = this.selectedRun.steps.find(s => s.stepOrder === data.stepOrder + 1);
        if (nextStep) {
          nextStep.status = 'running';
        }
      } else if (data.status === 'running') {
        const prevStep = this.selectedRun.steps.find(s => s.stepOrder === data.stepOrder - 1);
        if (prevStep && prevStep.status !== 'completed' && prevStep.status !== 'failed') {
          prevStep.status = 'completed';
        }
      }
      
      if (this.selectedStep?.stepOrder === data.stepOrder) {
        this.selectedStep = step;
      }
      
      this.cdr.detectChanges();
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
  
  openConsoleOutput() {
    if (!this.selectedStep || !this.selectedRun?.id) return;
    
    this.apiService.getPipelineRunById(this.selectedRun.id).subscribe({
      next: (run) => {
        if (run) {
          const updatedStep = run.steps?.find(s => s.stepOrder === this.selectedStep?.stepOrder);
          if (updatedStep) {
            this.selectedStep = updatedStep;
          }
        }
        
        this.dialog.open(ConsoleOutputDialogComponent, {
          data: { step: this.selectedStep, pipelineId: this.pipelineId, runId: this.selectedRun?.id },
          width: '95vw',
          height: '90vh',
          maxWidth: 'none',
          maxHeight: 'none',
          panelClass: 'console-dialog-panel'
        });
        
        this.cdr.detectChanges();
      }
    });
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
