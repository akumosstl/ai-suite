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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, Target, AppConfig, AppConfigTestResult } from '../../services/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

/**
 * Componente de configuração para gerenciamento de targets.
 * Permite criar, editar, excluir e visualizar targets que definem
 * os caminhos para diferentes recursos do projeto.
 * 
 * @componentName ConfigComponent
 * @selector app-config
 */
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
    MatDialogModule,
    MatSelectModule,
    MatProgressSpinnerModule
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
          <a mat-list-item (click)="showAiEngine()" [class.active]="selectedMenu === 'ai-engine'">
            <mat-icon matListItemIcon>smart_toy</mat-icon>
            <span matListItemTitle>AI Engine</span>
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
                <th>Agents Path</th>
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
                <td>{{ target.agentsPath }}</td>
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
              <mat-label>Agents Path</mat-label>
              <input matInput [(ngModel)]="targetForm.agentsPath" placeholder="e.g., .opencode/agents">
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

        <div class="right-panel" *ngIf="selectedMenu === 'ai-engine'">
          <div class="content-area">
            <div class="targets-table-section">
              <div class="section-header">
                <h2><mat-icon>smart_toy</mat-icon> AI Engine Configuration</h2>
                <button mat-mini-fab color="primary" (click)="loadAppConfigs()" class="add-btn" title="Refresh">
                  <mat-icon>refresh</mat-icon>
                </button>
              </div>

              <div class="ai-config-info">
                <mat-icon>info</mat-icon>
                <span>Configure API keys for LLM providers. Keys are stored locally and masked in the UI. The default engine is <strong>langchain4j</strong>; steps with CLI configured will use the CLI engine.</span>
              </div>

              <div class="default-provider-section" *ngIf="!aiConfigLoading">
                <div class="default-provider-row">
                  <mat-icon class="row-icon">tune</mat-icon>
                  <span class="default-provider-label">Default Provider</span>
                <mat-form-field appearance="outline" class="provider-select-field">
                  <mat-select [value]="defaultProvider" (selectionChange)="onDefaultProviderChange($event.value)">
                    <mat-option value="openai">OpenAI</mat-option>
                    <mat-option value="google">Google Gemini</mat-option>
                    <mat-option value="anthropic">Anthropic</mat-option>
                  </mat-select>
                </mat-form-field>
                </div>
      </div>

      <table class="targets-table" *ngIf="!aiConfigLoading">
        <thead>
          <tr>
            <th>Provider</th>
            <th>API Key</th>
            <th>Base URL</th>
            <th>Default Model</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let provider of providerList" class="target-row">
            <td>
              <mat-icon class="row-icon">{{ provider.icon }}</mat-icon>
              {{ provider.label }}
            </td>
            <td>
              <div class="api-key-cell">
                <input
                  [type]="revealedKeys[provider.apiKey] ? 'text' : 'password'"
                  class="api-key-input"
                  [value]="editingKeys[provider.apiKey] ?? getSavedApiKeyValue(provider.apiKey)"
                  (input)="onKeyInput(provider.apiKey, $event)"
                  [placeholder]="hasKeyConfigured(provider.apiKey) ? 'Key configured (masked)' : 'Enter API key'"
                />
                <button mat-icon-button (click)="toggleKeyReveal(provider.apiKey)" class="reveal-btn">
                  <mat-icon>{{ revealedKeys[provider.apiKey] ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </td>
            <td>
              <input
                class="api-key-input base-url-input"
                [value]="editingBaseUrls[provider.baseUrlKey] ?? getSavedBaseUrl(provider.baseUrlKey)"
                (input)="onBaseUrlInput(provider.baseUrlKey, $event)"
                [placeholder]="provider.baseUrlPlaceholder"
                [disabled]="!provider.hasBaseUrl"
              />
            </td>
            <td>
              <input
                class="api-key-input model-input"
                [value]="editingModels[provider.modelKey] ?? getSavedModelValue(provider.modelKey, provider.defaultModel)"
                (input)="onModelInput(provider.modelKey, $event)"
                [placeholder]="provider.defaultModel"
              />
            </td>
            <td class="actions-col">
              <button mat-icon-button (click)="testProvider(provider.name)" class="test-btn" [disabled]="testingProvider === provider.name">
                <mat-icon *ngIf="testingProvider !== provider.name">wifi_tethering</mat-icon>
                <mat-spinner *ngIf="testingProvider === provider.name" [diameter]="20"></mat-spinner>
              </button>
              <button mat-icon-button (click)="saveAiConfig(provider)" class="save-key-btn" title="Save">
                <mat-icon>save</mat-icon>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="ai-config-loading" *ngIf="aiConfigLoading">
        <mat-spinner [diameter]="40"></mat-spinner>
        <span>Loading configuration...</span>
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

.ai-config-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(79, 195, 247, 0.08);
  border-bottom: 1px solid #2a2a2a;
  font-size: 0.85rem;
  color: #b0b0b0;
  line-height: 1.5;
}

.ai-config-info mat-icon {
  color: #4fc3f7;
  font-size: 20px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.ai-config-info strong {
  color: #4fc3f7;
}

.api-key-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.api-key-input {
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 6px 10px;
  color: #ffffff;
  font-size: 0.85rem;
  font-family: monospace;
  width: 200px;
  outline: none;
  transition: border-color 0.2s;
}

.api-key-input:focus {
  border-color: #4fc3f7;
}

.api-key-input::placeholder {
  color: #555;
}

.api-key-input.model-input {
  width: 180px;
  font-family: inherit;
}

.api-key-input.base-url-input {
  width: 220px;
  font-family: inherit;
  font-size: 0.8rem;
}

.api-key-input.base-url-input:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.reveal-btn {
  color: #888;
  width: 32px;
  height: 32px;
  line-height: 32px;
}

.reveal-btn:hover {
  color: #4fc3f7;
}

.reveal-btn mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
}

.test-btn {
  color: #888;
}

.test-btn:hover:not(:disabled) {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.test-btn:disabled {
  color: #555;
}

.save-key-btn {
  color: #888;
}

.save-key-btn:hover {
  color: #4fc3f7;
  background: rgba(79, 195, 247, 0.1);
}

.ai-config-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  color: #888;
}

.default-provider-section {
  padding: 16px 20px;
  border-bottom: 1px solid #2a2a2a;
}

.default-provider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.default-provider-label {
  color: #b0b0b0;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 120px;
}

  .provider-select-field {
    min-width: 160px;
    font-size: 0.85rem;

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
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
    skillsPath?: string;
    commandsPath?: string;
    agentsPath: string;
    scriptsPath?: string;
    pluginsPath?: string;
    toolsPath?: string;
  } = {
    name: '',
    skillsPath: '',
    commandsPath: '',
    agentsPath: '',
    scriptsPath: '',
    pluginsPath: '',
    toolsPath: ''
  };

  aiConfigs: AppConfig[] = [];
  aiConfigLoading = false;
  revealedKeys: Record<string, boolean> = {};
  editingKeys: Record<string, string> = {};
  editingModels: Record<string, string> = {};
  editingBaseUrls: Record<string, string> = {};
  testingProvider: string | null = null;
  defaultProvider: string = 'openai';
  configMap: Record<string, string> = {};

  providerList = [
    { name: 'openai', apiKey: 'openai.api.key', modelKey: 'openai.default.model', baseUrlKey: 'openai.base.url', label: 'OpenAI', icon: 'psychology', defaultModel: 'gpt-4o-mini', hasBaseUrl: true, baseUrlPlaceholder: 'e.g. https://integrate.api.nvidia.com' },
    { name: 'google', apiKey: 'google.api.key', modelKey: 'google.default.model', baseUrlKey: '', label: 'Google Gemini', icon: 'cloud', defaultModel: 'gemini-2.0-flash', hasBaseUrl: false, baseUrlPlaceholder: '' },
    { name: 'anthropic', apiKey: 'anthropic.api.key', modelKey: 'anthropic.default.model', baseUrlKey: '', label: 'Anthropic', icon: 'auto_awesome', defaultModel: 'claude-3-5-haiku-20241022', hasBaseUrl: false, baseUrlPlaceholder: '' }
  ];

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

  /**
   * Carrega todos os targets do servidor via API.
   * Se não houver targets, cria um target padrão.
   */
  /**
   * Carrega todos os targets do servidor via API.
   * Se não houver targets, cria um target padrão.
   */
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
      agentsPath: '.opencode\\agents'
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
      agentsPath: target.agentsPath || '',
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
      agentsPath: '',
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
          error: (err) => {
            const message = err.error?.message || 'Failed to delete target';
            this.snackBar.open(message, 'Close', { duration: 5000 });
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

  showAiEngine(): void {
    this.selectedMenu = 'ai-engine';
    this.loadAppConfigs();
  }

  loadAppConfigs(): void {
    this.aiConfigLoading = true;
    this.apiService.getAppConfigs().subscribe({
      next: (configs) => {
        this.aiConfigs = configs;
        this.configMap = {};
        for (const cfg of configs) {
          this.configMap[cfg.configKey] = cfg.configValue ?? '';
        }
        this.defaultProvider = this.configMap['default.llm.provider'] || 'openai';
        this.aiConfigLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.aiConfigs = [];
        this.configMap = {};
        this.aiConfigLoading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Failed to load AI configuration', 'Close', { duration: 3000 });
      }
    });
  }

  getSavedApiKeyValue(apiKey: string): string {
    const masked = this.configMap[apiKey] ?? '';
    if (masked && masked.startsWith('****')) {
      return masked;
    }
    return masked;
  }

  hasKeyConfigured(apiKey: string): boolean {
    const val = this.configMap[apiKey] ?? '';
    return val.length > 0;
  }

  getSavedModelValue(modelKey: string, defaultModel: string): string {
    return this.configMap[modelKey] || defaultModel;
  }

  getSavedBaseUrl(baseUrlKey: string): string {
    if (!baseUrlKey) return '';
    return this.configMap[baseUrlKey] || '';
  }

  onBaseUrlInput(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingBaseUrls[key] = input.value;
  }

  onDefaultProviderChange(provider: string): void {
    this.defaultProvider = provider;
    this.apiService.updateAppConfig('default.llm.provider', provider).subscribe({
      next: () => {
        this.snackBar.open('Default provider updated', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to update default provider', 'Close', { duration: 3000 });
      }
    });
  }

  toggleKeyReveal(key: string): void {
    this.revealedKeys[key] = !this.revealedKeys[key];
  }

  onKeyInput(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingKeys[key] = input.value;
  }

  onModelInput(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingModels[key] = input.value;
  }

  saveAiConfig(provider: { name: string; apiKey: string; modelKey: string; defaultModel: string; baseUrlKey: string; hasBaseUrl: boolean }): void {
    const apiKeyKey = provider.apiKey;
    const modelKey = provider.modelKey;
    const keyValue = this.editingKeys[apiKeyKey];
    const modelValue = this.editingModels[modelKey];
    const baseUrlValue = provider.hasBaseUrl ? this.editingBaseUrls[provider.baseUrlKey] : undefined;

    const saves: Promise<any>[] = [];

    if (keyValue !== undefined && keyValue !== '') {
      saves.push(this.apiService.updateAppConfig(apiKeyKey, keyValue).toPromise()!.then(() => {
        delete this.editingKeys[apiKeyKey];
        this.revealedKeys[apiKeyKey] = false;
      }));
    }

    if (modelValue !== undefined && modelValue !== '') {
      saves.push(this.apiService.updateAppConfig(modelKey, modelValue).toPromise()!.then(() => {
        delete this.editingModels[modelKey];
      }));
    }

    if (provider.hasBaseUrl && baseUrlValue !== undefined) {
      saves.push(this.apiService.updateAppConfig(provider.baseUrlKey, baseUrlValue).toPromise()!.then(() => {
        delete this.editingBaseUrls[provider.baseUrlKey];
      }));
    }

    if (saves.length > 0) {
      Promise.all(saves).then(() => {
        this.snackBar.open('Configuration saved', 'Close', { duration: 3000 });
        this.loadAppConfigs();
      }).catch(() => {
        this.snackBar.open('Failed to save configuration', 'Close', { duration: 3000 });
      });
    }
  }

  testProvider(providerName: string): void {
    this.testingProvider = providerName;
    const p = this.providerList.find(pr => pr.name === providerName);
    const label = p ? p.label : providerName;
    this.apiService.testAppConfig(providerName).subscribe({
      next: (result: AppConfigTestResult) => {
        this.testingProvider = null;
        if (result.success) {
          this.snackBar.open(`${label}: Connection successful`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(`${label}: ${result.error || 'Connection failed'}`, 'Close', { duration: 5000 });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.testingProvider = null;
        this.snackBar.open(`${label}: Connection failed`, 'Close', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }
}
