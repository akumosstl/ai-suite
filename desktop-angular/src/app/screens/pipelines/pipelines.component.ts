import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService, PipelineRun, PipelineRunStep } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';
import { OutputDialogComponent } from '../../components/output-dialog/output-dialog.component';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    ConfirmDialogComponent,
    OutputDialogComponent
  ],
  template: `
    <div class="pipelines-screen">
      <div class="top-menu">
        <div class="panel-title">
          <mat-icon>alt_route</mat-icon>
          <span>Pipeline Executions</span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" (click)="goBack()" title="Back">
            <mat-icon>reply</mat-icon>
          </button>
          <button class="icon-btn" (click)="loadRuns()" title="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
          <button class="icon-btn danger-btn" (click)="cleanupRuns()" [disabled]="cleaningUp" title="Cleanup history (keeps running)">
            <mat-icon>delete_sweep</mat-icon>
          </button>
        </div>
      </div>

      <div class="main-content">
        <div class="left-panel">
          <div class="panel-header">
            <div class="panel-title">
              <mat-icon>list</mat-icon>
              <span>All Runs</span>
              <span class="count-badge">{{ totalElements }}</span>
            </div>
          </div>

          <div class="search-section">
            <mat-form-field class="search-field" appearance="outline" floatLabel="always">
              <mat-label>Search by project name...</mat-label>
              <input matInput [(ngModel)]="searchProjectName" (keyup.enter)="searchRuns()">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            <button class="icon-btn" (click)="searchRuns()" title="Search">
              <mat-icon>search</mat-icon>
            </button>
            <button class="icon-btn" (click)="clearSearch()" title="Clear" *ngIf="searchProjectName">
              <mat-icon>close</mat-icon>
            </button>
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
            <div class="run-status-badge" [class]="run.status || 'pending'">
              {{ run.status || 'pending' }}
            </div>
            <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
            
          <div class="empty-state" *ngIf="runs.length === 0">
            <mat-icon>alt_route</mat-icon>
            <span>No pipeline runs yet</span>
            <small>Run a pipeline to see results</small>
          </div>
          </div>
          
          <div class="pagination" *ngIf="totalPages > 0">
            <button class="page-btn" (click)="prevPage()" [disabled]="currentPage === 0">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div class="page-numbers">
              <button 
                *ngFor="let p of getPageNumbers()" 
                class="page-num"
                [class.active]="p === currentPage"
                (click)="goToPage(p)"
              >
                {{ p + 1 }}
              </button>
            </div>
            <button class="page-btn" (click)="nextPage()" [disabled]="currentPage >= totalPages - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
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
    .pipelines-screen {
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

    .top-menu .left-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
    }

    .back-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .back-btn span {
      font-size: 0.8rem;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .page-title mat-icon {
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

    .search-section {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #2a2a2a;
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

    ::ng-deep .search-field .mdc-notched-outline__notch {
      border-left: none !important;
      border-right: none !important;
    }

    ::ng-deep .search-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .search-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
    }

    .runs-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .list-item {
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

    .list-item:hover {
      border-color: #3a3a3a;
      background: #222;
    }

    .list-item.selected {
      background: rgba(79, 195, 247, 0.08);
      border-color: #4fc3f7;
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

    .run-project {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .run-item.selected .run-project {
      color: #4fc3f7;
      opacity: 0.7;
    }

    .run-date {
      font-size: 0.75rem;
      color: #888;
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
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-num {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      background: transparent;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #888;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-num:hover {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
    }

    .page-num.active {
      background: rgba(79, 195, 247, 0.15);
      border-color: #4fc3f7;
      color: #4fc3f7;
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

    .step-badge.failed {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }

    .details-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .btn-primary {
      background: rgba(79, 195, 247, 0.15);
      color: #4fc3f7;
      border: 1px solid #4fc3f7;
    }

    .btn-primary:hover:not(:disabled) {
      background: rgba(79, 195, 247, 0.25);
    }

    .btn-primary:disabled {
      background: #1a1a1a;
      color: #555;
      border-color: #2a2a2a;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      color: #888;
      border: 1px solid #3a3a3a;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #2a2a2a;
      color: #fff;
      border-color: #4fc3f7;
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

    .status-message {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      padding: 14px 18px;
      border-radius: 10px;
      font-size: 0.9rem;
    }

    .status-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-message.success {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }

    .status-message.error {
      background: rgba(255, 82, 82, 0.1);
      color: #ff5252;
      border: 1px solid rgba(255, 82, 82, 0.2);
    }

    .status-message.info {
      background: rgba(79, 195, 247, 0.1);
      color: #4fc3f7;
      border: 1px solid rgba(79, 195, 247, 0.2);
    }

    ::ng-deep .mdc-notched-outline__leading,
    ::ng-deep .mdc-notched-outline__notch,
    ::ng-deep .mdc-notched-outline__trailing {
      border-color: #3a3a3a !important;
    }

    ::ng-deep .mdc-notched-outline__notch {
      border-left: none !important;
      border-right: none !important;
    }

    ::ng-deep .mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7 !important;
    }

    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }

    ::ng-deep .mat-focused .mdc-floating-label {
      color: #4fc3f7 !important;
    }

    ::ng-deep input[matInput], ::ng-deep textarea[matInput] {
      color: #e0e0e0 !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 0.9rem !important;
    }

    ::ng-deep input[matInput]::placeholder, ::ng-deep textarea[matInput]::placeholder {
      color: #666;
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
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
  `]
})
export class PipelinesComponent implements OnInit {
  runs: PipelineRun[] = [];
  selectedRun: PipelineRun | null = null;
  selectedStep: PipelineRunStep | null = null;
  cleaningUp = false;
  
  searchProjectName = '';
  
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

  @HostListener('document:keydown.control.alt.p')
  onGoBack(): void {
    this.goBack();
  }

  @HostListener('document:keydown.control.shift.u')
  onRefresh(): void {
    this.loadRuns();
  }
  
  loadRuns(page = 0, projectName?: string) {
    const searchName = projectName !== undefined ? projectName : (this.searchProjectName || undefined);
    this.selectedRun = null;
    this.selectedStep = null;
    this.apiService.getAllPipelineRuns(page, this.pageSize, searchName).subscribe({
      next: (response: any) => {
        console.log('Loaded runs:', response.runs);
        this.runs = response.runs || [];
        this.currentPage = response.currentPage || 0;
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        if (this.runs.length > 0) {
          this.selectRun(this.runs[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading runs:', err)
    });
  }
  
  searchRuns() {
    this.selectedRun = null;
    this.selectedStep = null;
    this.loadRuns(0, this.searchProjectName);
  }
  
  clearSearch() {
    this.searchProjectName = '';
    this.selectedRun = null;
    this.selectedStep = null;
    this.loadRuns(0);
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
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  selectRun(run: PipelineRun) {
    this.selectedRun = run;
    this.selectedStep = null;
    
    if (run.steps && run.steps.length > 0) {
      this.selectStep(run.steps[0]);
    }
  }
  
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
        next: (result) => {
          console.log('Cleanup result:', result);
          this.cleaningUp = false;
          this.selectedRun = null;
          this.selectedStep = null;
          this.loadRuns();
        },
        error: (err) => {
          console.error('Cleanup error:', err);
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
}
