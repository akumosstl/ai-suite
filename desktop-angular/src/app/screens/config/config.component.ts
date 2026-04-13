import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService, Target } from '../../services/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    FormsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="config-container">
      <div class="top-bar">
        <div class="logo-section">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradConfig" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#3b82f6"/>
                  <stop offset="50%" stop-color="#06b6d4"/>
                  <stop offset="100%" stop-color="#22d3ee"/>
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="6" fill="url(#logoGradConfig)"/>
              <text x="18" y="24" text-anchor="middle" fill="#080809" font-family="monospace" font-weight="900" font-size="12">&lt;/&gt;</text>
            </svg>
          </div>
          <h1>Agentic</h1>
        </div>
        <button class="home-button" (click)="goHome()">
          <mat-icon>home</mat-icon>
          Home
        </button>
      </div>

      <div class="main-content">
        <div class="left-panel">
          <div class="panel-header">
            <mat-icon>settings</mat-icon>
            <span>Configuration</span>
          </div>
          <mat-nav-list>
            <a mat-list-item (click)="showTargetList()" [class.active]="selectedMenu === 'target'">
              <mat-icon matListItemIcon>flag</mat-icon>
              <span matListItemTitle>Target</span>
            </a>
          </mat-nav-list>
        </div>

        <div class="right-panel" *ngIf="selectedMenu === 'target'">
          <div class="content-area">
            <div class="targets-table-section" *ngIf="viewMode === 'list' || viewMode === 'form'">
              <div class="section-header">
                <h2><mat-icon>flag</mat-icon> Targets</h2>
                <button mat-mini-fab color="primary" (click)="addNewTarget()" class="add-btn" title="Add New Target">
                  <mat-icon>add</mat-icon>
                </button>
              </div>

              <table class="targets-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Skills Path</th>
                    <th>Commands Path</th>
                    <th>Scripts Path</th>
                    <th>Agents Path</th>
                    <th>Instructions Path</th>
                    <th>Plugins Path</th>
                    <th>Tools Path</th>
                    <th class="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    *ngFor="let target of targets" 
                    (click)="selectTargetToEdit(target)"
                    [class.selected]="selectedTarget?.id === target.id"
                    class="target-row"
                  >
                    <td>
                      <mat-icon class="row-icon">flag</mat-icon>
                      {{ target.name }}
                    </td>
                    <td>{{ target.skillsPath }}</td>
                    <td>{{ target.commandsPath }}</td>
                    <td>{{ target.scriptsPath }}</td>
                    <td>{{ target.agentsPath }}</td>
                    <td>{{ target.instructionsPath }}</td>
                    <td>{{ target.pluginsPath }}</td>
                    <td>{{ target.toolsPath }}</td>
                    <td class="actions-col" (click)="$event.stopPropagation()">
                      <button mat-icon-button (click)="deleteTarget(target, $event)" class="delete-btn" title="Delete Target">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="targets.length === 0">
                    <td colspan="9" class="empty-row">No targets found. Click + to add one.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="target-form-section" *ngIf="viewMode === 'form'">
              <div class="form-header">
                <h3>
                  <mat-icon>edit</mat-icon>
                  {{ isEditing ? 'Edit Target' : 'New Target' }}
                </h3>
                <button mat-icon-button (click)="closeForm()" class="close-form-btn">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              
              <div class="target-form">
                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput [(ngModel)]="targetForm.name" placeholder="Enter target name">
                  <mat-icon matPrefix>badge</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Skills Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.skillsPath" placeholder="e.g., .opencode/skills">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Commands Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.commandsPath" placeholder="e.g., .opencode/commands">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Scripts Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.scriptsPath" placeholder="e.g., .opencode/scripts">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Agents Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.agentsPath" placeholder="e.g., .opencode/agents">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Instructions Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.instructionsPath" placeholder="e.g., .opencode/instructions">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Plugins Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.pluginsPath" placeholder="e.g., .opencode/plugins">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Tools Path</mat-label>
                  <input matInput [(ngModel)]="targetForm.toolsPath" placeholder="e.g., .opencode/tools">
                  <mat-icon matPrefix>folder</mat-icon>
                </mat-form-field>

                <div class="form-actions">
                  <button mat-stroked-button (click)="cancelTarget()" class="cancel-btn" *ngIf="isEditing">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                  <button mat-stroked-button (click)="closeForm()" class="cancel-btn">
                    <mat-icon>close</mat-icon>
                    Cancel
                  </button>
                  <button mat-raised-button color="primary" (click)="saveTarget()" [disabled]="!targetForm.name" class="save-btn">
                    <mat-icon>save</mat-icon>
                    {{ isEditing ? 'Update' : 'Create' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0d0d0d;
      color: white;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
      border-bottom: 1px solid #2a2a2a;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      display: flex;
      align-items: center;
      filter: drop-shadow(0 2px 6px rgba(34, 211, 238, 0.3));
    }

    .logo-icon svg {
      display: block;
    }

    .top-bar h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #ffffff;
    }

    .home-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #1e1e1e;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      color: #b0b0b0;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .home-button:hover {
      background: #2a2a2a;
      color: #4fc3f7;
      border-color: #4fc3f7;
    }

    .home-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-panel {
      width: 240px;
      background: #111111;
      border-right: 1px solid #2a2a2a;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid #2a2a2a;
      color: #888;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .panel-header mat-icon {
      color: #4fc3f7;
    }

    .right-panel {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: #0d0d0d;
    }

    .content-area {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .targets-table-section {
      background: #111111;
      border-radius: 12px;
      border: 1px solid #2a2a2a;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #2a2a2a;
    }

    .section-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-size: 1.1rem;
    }

    .section-header h2 mat-icon {
      color: #4fc3f7;
    }

    .add-btn {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .add-btn:hover {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }

    .targets-table {
      width: 100%;
      border-collapse: collapse;
    }

    .targets-table thead {
      background: #1a1a1a;
    }

    .targets-table th {
      padding: 14px 16px;
      text-align: left;
      color: #888;
      font-weight: 500;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #2a2a2a;
    }

    .targets-table td {
      padding: 14px 16px;
      color: #b0b0b0;
      font-size: 0.9rem;
      border-bottom: 1px solid #1e1e1e;
    }

    .target-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .target-row:hover {
      background: #1e1e1e;
    }

    .target-row.selected {
      background: rgba(79, 195, 247, 0.1);
      border-left: 3px solid #4fc3f7;
    }

    .target-row td:first-child {
      color: #ffffff;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .row-icon {
      color: #4fc3f7;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .actions-col {
      width: 60px;
      text-align: center;
    }

    .targets-table th.actions-col {
      text-align: center;
    }

    .delete-btn {
      color: #666;
      transition: all 0.2s ease;
    }

    .delete-btn:hover {
      color: #ff5252;
      background: rgba(255, 82, 82, 0.1);
    }

    .empty-row {
      text-align: center;
      color: #555;
      padding: 32px !important;
    }

    .target-form-section {
      background: #111111;
      border-radius: 12px;
      border: 1px solid #2a2a2a;
      overflow: hidden;
    }

    .form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #2a2a2a;
    }

    .form-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-size: 1.1rem;
    }

    .form-header h3 mat-icon {
      color: #4fc3f7;
    }

    .close-form-btn {
      color: #888;
    }

    .close-form-btn:hover {
      color: #ffffff;
    }

    .target-form {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 600px;
    }

    .full-width {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }

    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mat-mdc-text-field-wrapper {
      background-color: #1e1e1e;
      border-radius: 8px;
    }

    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__trailing {
      border-color: #3a3a3a;
    }

    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-notched-outline__trailing {
      border-color: #4fc3f7;
    }

    ::ng-deep .mdc-floating-label {
      color: #888 !important;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-floating-label {
      color: #4fc3f7 !important;
    }

    ::ng-deep input[matInput] {
      color: #ffffff !important;
    }

    ::ng-deep input[matInput]::placeholder {
      color: #666;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      justify-content: flex-end;
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

    .save-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
    }

    .save-btn:disabled {
      background: #3a3a3a;
      color: #666;
    }

    .save-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-nav-list {
      padding: 8px;
    }

    ::ng-deep mat-nav-list a.mat-mdc-list-item {
      border-radius: 8px;
      margin-bottom: 4px;
    }

    ::ng-deep mat-nav-list a.mat-mdc-list-item:hover {
      background: #1e1e1e;
    }

    ::ng-deep mat-nav-list a.mat-mdc-list-item.active {
      background: rgba(79, 195, 247, 0.15);
    }

    ::ng-deep mat-nav-list a.mat-mdc-list-item.active .mat-mdc-list-item-title {
      color: #4fc3f7;
    }

    ::ng-deep mat-nav-list a.mat-mdc-list-item mat-icon {
      color: #888;
    }

    ::ng-deep mat-nav-list a.mat-mdc-list-item.active mat-icon {
      color: #4fc3f7;
    }
  `]
})
export class ConfigComponent implements OnInit {
  targets: Target[] = [];
  selectedMenu: string = 'target';
  selectedTarget: Target | null = null;
  isEditing = false;
  viewMode: 'list' | 'form' = 'list';

  targetForm: {
    name: string;
    skillsPath: string;
    commandsPath: string;
    scriptsPath: string;
    agentsPath: string;
    instructionsPath: string;
    pluginsPath: string;
    toolsPath: string;
  } = {
    name: '',
    skillsPath: '',
    commandsPath: '',
    scriptsPath: '',
    agentsPath: '',
    instructionsPath: '',
    pluginsPath: '',
    toolsPath: ''
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.showTargetList();
    this.loadTargets();
  }

  loadTargets(): void {
    this.apiService.getTargets().subscribe({
      next: (targets) => {
        this.targets = targets;
        this.cdr.detectChanges();
        if (this.targets.length === 0) {
          this.createDefaultTarget();
        }
      },
      error: () => {
        this.targets = [];
        this.cdr.detectChanges();
        this.createDefaultTarget();
      }
    });
  }

  createDefaultTarget(): void {
    const defaultTarget: Target = {
      name: 'opencode',
      skillsPath: '.opencode\\skills',
      commandsPath: '.opencode\\commands',
      scriptsPath: '.opencode\\scripts',
      agentsPath: '.opencode\\agents',
      instructionsPath: '.opencode\\instructions',
      pluginsPath: '.opencode\\plugins',
      toolsPath: '.opencode\\tools'
    };
    this.apiService.createTarget(defaultTarget).subscribe({
      next: (created) => {
        this.targets = [created];
        this.cdr.detectChanges();
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/menu']);
  }

  showTargetList(): void {
    this.selectedMenu = 'target';
    this.viewMode = 'list';
    this.selectedTarget = null;
  }

  selectTargetToEdit(target: Target): void {
    this.selectedTarget = target;
    this.isEditing = true;
    this.viewMode = 'form';
    this.targetForm = {
      name: target.name,
      skillsPath: target.skillsPath || '',
      commandsPath: target.commandsPath || '',
      scriptsPath: target.scriptsPath || '',
      agentsPath: target.agentsPath || '',
      instructionsPath: target.instructionsPath || '',
      pluginsPath: target.pluginsPath || '',
      toolsPath: target.toolsPath || ''
    };
  }

  addNewTarget(): void {
    this.selectedTarget = null;
    this.isEditing = false;
    this.viewMode = 'form';
    this.targetForm = {
      name: '',
      skillsPath: '',
      commandsPath: '',
      scriptsPath: '',
      agentsPath: '',
      instructionsPath: '',
      pluginsPath: '',
      toolsPath: ''
    };
  }

  closeForm(): void {
    this.viewMode = 'list';
    this.selectedTarget = null;
    this.targetForm = {
      name: '',
      skillsPath: '',
      commandsPath: '',
      scriptsPath: '',
      agentsPath: '',
      instructionsPath: '',
      pluginsPath: '',
      toolsPath: ''
    };
  }

  deleteTarget(target: Target, event: Event): void {
    event.stopPropagation();
    
    const dialogData: ConfirmDialogData = {
      title: 'Delete Target',
      message: `Are you sure you want to delete the target "${target.name}"? This action cannot be undone.`
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.apiService.deleteTarget(target.id!).subscribe({
          next: () => {
            this.targets = this.targets.filter(t => t.id !== target.id);
            if (this.selectedTarget?.id === target.id) {
              this.closeForm();
            }
            this.cdr.detectChanges();
            this.snackBar.open('Target deleted successfully', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to delete target', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  cancelTarget(): void {
    if (this.selectedTarget?.id) {
      this.deleteTarget(this.selectedTarget, new Event('click'));
    }
  }

  saveTarget(): void {
    const target: Target = {
      name: this.targetForm.name,
      skillsPath: this.targetForm.skillsPath,
      commandsPath: this.targetForm.commandsPath,
      scriptsPath: this.targetForm.scriptsPath,
      agentsPath: this.targetForm.agentsPath,
      instructionsPath: this.targetForm.instructionsPath,
      pluginsPath: this.targetForm.pluginsPath,
      toolsPath: this.targetForm.toolsPath
    };

    if (this.isEditing && this.selectedTarget?.id) {
      this.apiService.updateTarget(this.selectedTarget.id, target).subscribe({
        next: (updated) => {
          const index = this.targets.findIndex(t => t.id === updated.id);
          if (index !== -1) {
            this.targets[index] = updated;
          }
          this.selectedTarget = updated;
          this.cdr.detectChanges();
          this.snackBar.open('Target updated successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to update target', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.apiService.createTarget(target).subscribe({
        next: (created) => {
          this.targets.push(created);
          this.selectedTarget = created;
          this.isEditing = true;
          this.cdr.detectChanges();
          this.snackBar.open('Target created successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to create target', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
