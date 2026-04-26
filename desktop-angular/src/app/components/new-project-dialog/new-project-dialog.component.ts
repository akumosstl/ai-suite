import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ApiService, Project, Target } from '../../services/api.service';
import { PathInfoDialogComponent } from '../path-info-dialog/path-info-dialog.component';

/**
 * Componente de diálogo para criação de um novo projeto.
 * Permite ao usuário definir nome, descrição, localização e target do projeto.
 * 
 * @componentName NewProjectDialogComponent
 * @selector app-new-project-dialog
 */
@Component({
  selector: 'app-new-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">create_new_folder</mat-icon>
      <h2 class="dialog-title">New Project</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="form-section">
        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Project Name</mat-label>
          <input matInput [(ngModel)]="project.name" required maxlength="64" autocomplete="off" placeholder="Enter project name">
          <mat-icon matPrefix>badge</mat-icon>
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="project.description" rows="3" maxlength="256" placeholder="Describe your project (optional)"></textarea>
          <mat-icon matPrefix>description</mat-icon>
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Project Location</mat-label>
          <input matInput [(ngModel)]="project.path" placeholder="Enter full path (e.g., C:\Projects\MyApp)" autocomplete="off">
          <mat-icon matPrefix>folder</mat-icon>
          <button mat-icon-button matSuffix (click)="showPathInfo()" type="button" aria-label="Path info" class="folder-button" title="Why can't I browse?">
            <mat-icon>info_outline</mat-icon>
          </button>
          <mat-hint>Type or paste the full path manually</mat-hint>
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Target</mat-label>
          <mat-select [(ngModel)]="project.targetId">
            <mat-option *ngFor="let target of targets" [value]="target.id">
              {{ target.name }}
            </mat-option>
          </mat-select>
          <mat-icon matPrefix>flag</mat-icon>
        </mat-form-field>
      </div>
      
      <div class="info-card" *ngIf="project.path">
        <mat-icon>info</mat-icon>
        <span>Path: {{ project.path }}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!project.name" class="save-btn">
        <mat-icon>save</mat-icon>
        Create Project
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
      padding: 24px !important;
      min-width: 420px;
      max-width: 480px;
      background: #1e1e1e !important;
    }
    
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-form-field {
      margin-bottom: 4px;
    }
    
    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px !important;
      color: #888;
    }
    
    ::ng-deep .mat-mdc-form-field.mat-form-field-appearance-outline .mat-mdc-text-field-wrapper {
      background-color: #2a2a2a;
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
    
    ::ng-deep input[matInput],
    ::ng-deep textarea[matInput] {
      color: #ffffff !important;
    }
    
    ::ng-deep input[matInput]::placeholder,
    ::ng-deep textarea[matInput]::placeholder {
      color: #666;
    }
    
    .folder-button {
      color: #4fc3f7;
    }
    
    .folder-button:hover {
      background-color: rgba(79, 195, 247, 0.1);
    }
    
    .info-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-top: 16px;
      background: #2a2a2a;
      border-radius: 8px;
      border: 1px solid #3a3a3a;
      color: #b0b0b0;
      font-size: 0.875rem;
    }
    
    .info-card mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4fc3f7;
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
  `]
})
export class NewProjectDialogComponent implements OnInit {
  project: Partial<Project> = {
    name: '',
    description: '',
    path: '',
    targetId: undefined
  };

  targets: Target[] = [];

  constructor(
    public dialogRef: MatDialogRef<NewProjectDialogComponent>,
    private router: Router,
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTargets();
  }

  /**
   * Carrega a lista de targets disponíveis do servidor.
   * Define o primeiro target como padrão ao carregar.
   */
  loadTargets(): void {
    this.apiService.getTargets().subscribe({
      next: (targets) => {
        this.targets = targets;
        if (this.targets.length > 0) {
          this.project.targetId = this.targets[0].id;
        }
      },
      error: () => {
        this.targets = [];
      }
    });
  }

  /**
   * Abre o diálogo de informações sobre caminhos de arquivo.
   * Explica a limitação de segurança dos navegadores quanto ao acesso ao sistema de arquivos.
   */
  showPathInfo(): void {
    this.dialog.open(PathInfoDialogComponent, {
      data: {
        title: 'Browser Security Restriction',
        message: 'Modern web browsers do not allow web applications to access the full file system path for security and privacy reasons.\n\nWhen you select a folder using the browser\'s file picker, the browser only provides the folder name - not the complete path (like C:\\Users\\YourName\\Projects\\MyProject).\n\nTo work around this:\n\n1. Navigate to your desired folder in Windows Explorer\n2. Click on the address bar to see the full path\n3. Copy the path (Ctrl+C)\n4. Paste it here (Ctrl+V) in the Project Location field\n\nThis is a browser limitation, not a bug - it helps protect your privacy and system security.'
      },
      width: '450px'
    });
  }

  /**
   * Cancela a operação e fecha o diálogo sem criar o projeto.
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Salva o novo projeto e navega para a página do projeto.
   * Requer que o nome do projeto esteja preenchido.
   */
  onSave(): void {
    if (this.project.name) {
      this.dialogRef.close(this.project);
      this.router.navigate(['/project']);
    }
  }

  @HostListener('document:keydown.control.enter')
  onCtrlEnter(): void {
    this.onSave();
  }
}
