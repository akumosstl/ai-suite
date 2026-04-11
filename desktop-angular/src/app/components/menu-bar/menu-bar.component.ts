import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, RouterModule, NavigationEnd } from '@angular/router'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { CommonModule } from '@angular/common'
import { Subscription, filter } from 'rxjs'
import { OpenProjectDialogComponent } from '../open-project-dialog/open-project-dialog.component'
import { NewProjectDialogComponent } from '../new-project-dialog/new-project-dialog.component'
import { ExportDialogComponent } from '../export-dialog/export-dialog.component'
import { ImportDialogComponent, ImportResult } from '../import-dialog/import-dialog.component'
import { BackupDialogComponent } from '../backup-dialog/backup-dialog.component'
import { ProjectContextService } from '../../services/project-context.service'
import { ApiService } from '../../services/api.service'

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule, RouterModule, ExportDialogComponent, ImportDialogComponent, BackupDialogComponent],
  template: `
    <div class="menu-bar">
      <div class="logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradMenu" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6"/>
                <stop offset="50%" stop-color="#06b6d4"/>
                <stop offset="100%" stop-color="#22d3ee"/>
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="6" fill="url(#logoGradMenu)"/>
            <text x="18" y="24" text-anchor="middle" fill="#080809" font-family="monospace" font-weight="900" font-size="12">&lt;/&gt;</text>
          </svg>
        </div>
        <span class="logo-text">Agentic</span>
      </div>
      
      <div class="menu-items">
        <button class="menu-button back-button" *ngIf="showBackButton" (click)="goBack()">
          <mat-icon>reply</mat-icon>
          <span>Back</span>
        </button>

        <ng-container *ngIf="!isProjectPage() && showProjectMenu">
          <ng-container *ngIf="isMainPage(); else projectDirectNav">
            <button class="menu-button" [matMenuTriggerFor]="projectMenu">
              <mat-icon>folder</mat-icon>
              <span>Project</span>
              <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
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
          </ng-container>
          <ng-template #projectDirectNav>
            <button class="menu-button" (click)="goToProject()">
              <mat-icon>folder</mat-icon>
              <span>Project</span>
            </button>
          </ng-template>
        </ng-container>
        
        <ng-container *ngIf="!isMainPage()">
          <button class="menu-button" routerLink="/agents">
            <mat-icon>smart_toy</mat-icon>
            <span>Agents</span>
          </button>
          
          <button class="menu-button" routerLink="/skills">
            <mat-icon>psychology</mat-icon>
            <span>Skills</span>
          </button>

          <button class="menu-button" routerLink="/scripts">
            <mat-icon>code</mat-icon>
            <span>Scripts</span>
          </button>

          <button class="menu-button" routerLink="/commands">
            <mat-icon>terminal</mat-icon>
            <span>Commands</span>
          </button>
          
          <button class="menu-button" [matMenuTriggerFor]="managementMenu">
            <mat-icon>settings</mat-icon>
            <span>Management</span>
            <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #managementMenu="matMenu" class="custom-menu">
            <button mat-menu-item routerLink="/templates" class="menu-item">
              <mat-icon>description</mat-icon>
              <span>Templates</span>
            </button>
            <button mat-menu-item routerLink="/namespaces" class="menu-item">
              <mat-icon>dns</mat-icon>
              <span>Namespace</span>
            </button>
            <div class="menu-separator"></div>
            <button mat-menu-item (click)="openExport()" class="menu-item">
              <mat-icon>file_download</mat-icon>
              <span>Export</span>
            </button>
            <button mat-menu-item (click)="openImport()" class="menu-item">
              <mat-icon>file_upload</mat-icon>
              <span>Import</span>
            </button>
            <div class="menu-separator"></div>
            <button mat-menu-item (click)="openBackup()" class="menu-item">
              <mat-icon>backup</mat-icon>
              <span>Backup</span>
            </button>
          </mat-menu>
        </ng-container>
        
        <ng-container *ngIf="isMainPage(); else homeButton">
          <button class="menu-button exit-button" (click)="exit()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Exit</span>
          </button>
        </ng-container>
        <ng-template #homeButton>
          <button class="menu-button" (click)="goHome()">
            <mat-icon>home</mat-icon>
            <span>Home</span>
          </button>
        </ng-template>
      </div>
      
      <span class="spacer"></span>
      
      <div class="user-info">
        <mat-icon>account_circle</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    .menu-bar {
      display: flex;
      align-items: center;
      padding: 0 24px;
      height: 56px;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid #3a3a3a;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 48px;
    }
    
    .logo-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    
    .logo-icon {
      display: flex;
      align-items: center;
      filter: drop-shadow(0 2px 6px rgba(34, 211, 238, 0.3));
    }
    
    .logo-icon svg {
      display: block;
    }
    
    .menu-items {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .menu-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #b0b0b0;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: none;
    }
    
    .menu-button:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    .menu-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .back-button {
      background-color: #2a2a2a;
      border: 1px solid #3a3a3a;
      margin-right: 8px;
    }
    
    .back-button:hover {
      background-color: #1565c0;
      border-color: #1976d2;
      color: #ffffff;
    }
    
    .dropdown-icon {
      margin-left: 2px;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }
    
    .exit-button:hover {
      background-color: #5c2b2b;
      color: #ff8a80;
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px !important;
    }
    
    .menu-item mat-icon {
      color: #888;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .menu-separator {
      height: 1px;
      background: #3a3a3a;
      margin: 8px 0;
    }
    
    .spacer {
      flex: 1;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      color: #888;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .user-info:hover {
      background-color: #3a3a3a;
      color: #ffffff;
    }
    
    .user-info mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  `]
})
export class MenuBarComponent implements OnInit, OnDestroy {
  showBackButton = false;
  showProjectMenu = true;
  selectedProjectId: number | null = null;
  private routerSubscription: Subscription | null = null;

  constructor(
    private router: Router, 
    private dialog: MatDialog,
    private projectContext: ProjectContextService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    const nav = this.router.getCurrentNavigation()
    if (nav && nav.extras && nav.extras.state && nav.extras.state['project']) {
      this.selectedProjectId = nav.extras.state['project'].id || null
      this.projectContext.setProjectId(this.selectedProjectId)
    }
  }

  ngOnInit(): void {
    this.selectedProjectId = this.projectContext.getProjectId();
    
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navEnd = event as NavigationEnd;
      this.updateNavigationState(navEnd.url);
    });
    
    this.updateNavigationState(this.router.url);
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateNavigationState(currentUrl: string): void {
    const internalPages = ['/agents', '/skills', '/scripts', '/commands', '/templates', '/namespaces'];
    
    if (internalPages.includes(currentUrl)) {
      const hasProjectId = this.projectContext.getProjectId() !== null;
      this.showBackButton = hasProjectId;
      this.showProjectMenu = false;
    } else {
      this.showBackButton = false;
      if (currentUrl === '/menu') {
        this.showProjectMenu = true;
      }
    }
  }

  isProjectPage(): boolean {
    return /^\/project(\/\d+)?$/.test(this.router.url)
  }

  isMainPage(): boolean {
    return this.router.url === '/menu'
  }

  goBack(): void {
    const projectId = this.projectContext.getProjectId();
    if (projectId) {
      this.router.navigate(['/project', projectId]);
    } else {
      this.router.navigate(['/project']);
    }
  }

  newProject() {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '500px',
      data: {}
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.projectContext.setFromProject(false);
        this.router.navigate(['/project'])
      }
    })
  }

  openProject() {
    const dialogRef = this.dialog.open(OpenProjectDialogComponent, {
      width: '600px',
      data: {}
    })
    dialogRef.afterClosed().subscribe((selectedProject: any) => {
      if (selectedProject && selectedProject.id) {
        this.selectedProjectId = selectedProject.id
        this.projectContext.setProjectId(selectedProject.id)
        this.projectContext.setFromProject(true);
        this.router.navigate(['/project', selectedProject.id])
      }
    })
  }

  goToProject() {
    this.projectContext.setFromProject(true);
    if (this.selectedProjectId) {
      this.router.navigate(['/project', this.selectedProjectId])
    } else {
      this.router.navigate(['/project'])
    }
  }

  exit() {
    this.router.navigate(['/menu'])
  }

  goHome() {
    this.router.navigate(['/menu'])
  }

  openExport(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '450px',
      data: { loading: false }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.snackBar.open('Export completed successfully!', 'Close', { duration: 3000 });
      }
    });
  }

  openImport(): void {
    const dialogRef = this.dialog.open(ImportDialogComponent, {
      width: '550px',
      data: { loading: false, result: null }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.formData) {
        const importDialogRef = this.dialog.open(ImportDialogComponent, {
          width: '550px',
          data: { loading: true, result: null }
        });

        this.apiService.importData(result.formData).subscribe({
          next: (response: any) => {
            importDialogRef.close();
            const finalDialogRef = this.dialog.open(ImportDialogComponent, {
              width: '550px',
              data: { loading: false, result: response as ImportResult }
            });
            finalDialogRef.afterClosed().subscribe(() => {
              window.location.reload();
            });
          },
          error: (err) => {
            console.error('Import error:', err);
            importDialogRef.close();
            this.snackBar.open('Import failed: ' + (err.error?.message || err.message), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  openBackup(): void {
    const dialogRef = this.dialog.open(BackupDialogComponent, {
      width: '500px',
      data: { loading: false, result: null }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.success) {
        this.snackBar.open('Backup created successfully!', 'Close', { duration: 3000 });
      }
    });
  }
}
