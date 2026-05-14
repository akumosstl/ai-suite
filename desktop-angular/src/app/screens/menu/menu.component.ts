import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService, Project } from '../../services/api.service';
import { NewProjectDialogComponent } from '../../components/new-project-dialog/new-project-dialog.component';
import { OpenProjectDialogComponent } from '../../components/open-project-dialog/open-project-dialog.component';

/**
 * Componente da tela de menu principal.
 * 
 * @description
 * Tela inicial da aplicação que apresenta o menu de navegação.
 * Permite criar novos projetos, abrir projetos existentes,
 * navegar para agentes, configurações ou sair da aplicação.
 * 
 * @component MenuComponent
 * @selector app-menu
 * @standalone true
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatMenuModule, MatIconModule, MatDialogModule, MatSnackBarModule, NewProjectDialogComponent, OpenProjectDialogComponent],
  template: `
    <div class="menu-container">
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6"/>
                <stop offset="50%" stop-color="#06b6d4"/>
                <stop offset="100%" stop-color="#22d3ee"/>
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="8" fill="url(#logoGrad)"/>
            <text x="18" y="24" text-anchor="middle" fill="#080809" font-family="monospace" font-weight="900" font-size="14">&lt;/&gt;</text>
          </svg>
        </div>
        <h1>Mangaba</h1>
      </div>
      <p class="subtitle">Build and manage AI agents for code flow</p>
      
      <div class="buttons">
        <div class="menu-wrapper">
          <button class="menu-button" [matMenuTriggerFor]="projectMenu">
            <mat-icon>folder</mat-icon>
            <span>Project</span>
            <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #projectMenu="matMenu" class="custom-menu">
            <button mat-menu-item (click)="newProject()" class="menu-item">
              <mat-icon>create_new_folder</mat-icon>
              <span>New Project</span>
            </button>
            <button mat-menu-item (click)="openProject()" class="menu-item">
              <mat-icon>folder_open</mat-icon>
              <span>Open Project</span>
            </button>
          </mat-menu>
        </div>
        
        <button class="action-button config-button" (click)="goToConfig()">
          <mat-icon>build</mat-icon>
          <span>Config</span>
        </button>
        
        <button class="exit-button" (click)="exit()">
          <mat-icon>exit_to_app</mat-icon>
          <span>Exit</span>
        </button>
      </div>
      
      <div class="footer">
        <p class="version">Version 4.9.1</p>
        <div class="footer-links">
          <span class="link">Documentation</span>
          <span class="separator">·</span>
          <span class="link">Help</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%);
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .menu-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 50% 50%, rgba(79, 195, 247, 0.05) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 12px;
    }
    
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 4px 12px rgba(34, 211, 238, 0.3));
    }
    
    h1 {
      font-size: 2.8rem;
      font-weight: 600;
      margin: 0;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      font-size: 1.1rem;
      color: #888;
      margin-bottom: 48px;
      letter-spacing: 0.5px;
    }
    
    .buttons {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 320px;
      margin-bottom: 64px;
      position: relative;
      z-index: 1;
    }
    
    .menu-wrapper {
      position: relative;
    }
    
    .menu-button,
    .action-button,
    .exit-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      height: 56px;
      font-size: 1rem;
      font-weight: 500;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: none;
      letter-spacing: 0.3px;
    }
    
    .menu-button {
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      color: #e0e0e0;
      border: 1px solid #3a3a3a;
    }
    
    .menu-button:hover {
      background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%);
      border-color: #4fc3f7;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(79, 195, 247, 0.15);
    }
    
    .action-button {
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
      color: #ffffff;
    }
    
    .action-button:hover {
      background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(25, 118, 210, 0.3);
    }
    
    .exit-button {
      background: #2a2a2a;
      color: #b0b0b0;
      border: 1px solid #3a3a3a;
    }

    .config-button {
      background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
    }
    
    .config-button:hover {
      background: linear-gradient(135deg, #388e3c 0%, #43a047 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(56, 142, 60, 0.3);
    }
    
    .exit-button:hover {
      background: #3a3a3a;
      color: #ff8a80;
      border-color: #ff8a80;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 138, 128, 0.15);
    }
    
    .menu-button mat-icon,
    .action-button mat-icon,
    .exit-button mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    
    .dropdown-arrow {
      margin-left: auto;
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
    }
    
    ::ng-deep .custom-menu .mat-mdc-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px !important;
    }
    
    ::ng-deep .custom-menu .mat-mdc-menu-item mat-icon {
      color: #4fc3f7;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .footer {
      position: absolute;
      bottom: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    
    .version {
      font-size: 0.85rem;
      color: #555;
      margin: 0;
    }
    
    .footer-links {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
    }
    
    .link {
      color: #666;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    
    .link:hover {
      color: #4fc3f7;
    }
    
    .separator {
      color: #444;
    }
  `]
})
export class MenuComponent implements OnInit {
    fromHome = true;
    goToAgents(): void {
      this.router.navigate(['/agents'], { state: { fromHome: true } });
    }

    goToConfig(): void {
      this.router.navigate(['/config']);
    }
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  newProject(): void {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '500px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result: Partial<Project>) => {
      if (result && result.name) {
        this.apiService.createProject(result as Project).subscribe({
          next: (created) => {
            this.router.navigate(['/project', created.id]);
          },
          error: (err) => {
            console.error('Error creating project:', err);
            const errorMsg = err.error?.message || err.message || 'Failed to create project';
            this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
            this.router.navigate(['/project']);
          }
        });
      }
    });
  }

  openProject(): void {
    const dialogRef = this.dialog.open(OpenProjectDialogComponent, {
      width: '600px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((selectedProject: any) => {
      if (selectedProject && selectedProject.id) {
        this.router.navigate(['/project', selectedProject.id]);
      }
    });
  }

   exit(): void {
     this.apiService.exitApplication().subscribe({
       next: () => {
         // Close the browser window after API call
         window.close();
       },
       error: (err) => {
         console.error('Exit error:', err);
         // Still try to close window even if API call fails
         window.close();
       }
     });
   }
}
