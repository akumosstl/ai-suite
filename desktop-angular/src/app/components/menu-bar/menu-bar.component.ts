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
import { ProjectContextService } from '../../services/project-context.service'
import { ApiService } from '../../services/api.service'
import { UpdateService } from '../../services/update.service'
import { UpdateDialogComponent } from '../update-dialog/update-dialog.component'
import { PluginsModalComponent } from '../plugins-modal/plugins-modal.component'
import { ShortcutsDialogComponent } from '../shortcuts-dialog/shortcuts-dialog.component'

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule, RouterModule, UpdateDialogComponent, PluginsModalComponent, ShortcutsDialogComponent],
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
          <mat-icon>folder</mat-icon>
          <span>Project</span>
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
          <button class="menu-button" [matMenuTriggerFor]="stackMenu">
            <mat-icon>app_registration</mat-icon>
            <span>Stack</span>
            <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #stackMenu="matMenu" class="custom-menu">
            <button mat-menu-item routerLink="/agents" class="menu-item">
              <mat-icon>smart_toy</mat-icon>
              <span>Agents</span>
            </button>
      <button mat-menu-item routerLink="/scripts" class="menu-item">
              <mat-icon>code</mat-icon>
              <span>Scripts</span>
            </button>
          <div class="menu-separator"></div>
          <button mat-menu-item routerLink="/pipelines" class="menu-item">
            <mat-icon>alt_route</mat-icon>
            <span>Pipelines</span>
          </button>
          <button mat-menu-item routerLink="/recipe" class="menu-item">
            <mat-icon>restaurant</mat-icon>
            <span>Recipe</span>
          </button>
        </mat-menu>

          <button class="menu-button" (click)="openPluginsModal()">
            <mat-icon>extension</mat-icon>
            <span>Tools</span>
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
        <button mat-menu-item (click)="checkUpdate()" class="menu-item">
          <mat-icon>system_update</mat-icon>
          <span>Update</span>
        </button>
      </mat-menu>

      <button class="menu-button" (click)="openShortcuts()">
        <mat-icon>info</mat-icon>
        <span>Info</span>
      </button>
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
      
      <div class="user-info" (click)="openDocumentation()" title="Documentation">
        <mat-icon>my_library_books</mat-icon>
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
      margin-left: auto;
    }
    
    .user-info:hover {
      background-color: #3a3a3a;
      color: #4fc3f7;
    }
    
    .user-info mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  `]
})
/**
 * Componente responsável pela barra de menu superior.
 * Gerencia navegação, exibição de menus e ações de projeto.
 *
 * @author Seu Nome
 * @since 2024
 * @component
 * @description Barra de navegação principal da aplicação, com menus de projeto, stack e gerenciamento.
 *
 * Métodos principais:
 * - goBack: Navega para o projeto anterior
 * - newProject: Abre diálogo para criar novo projeto
 * - openProject: Abre diálogo para selecionar projeto existente
 * - goToProject: Navega para a página do projeto selecionado
 * - exit: Retorna ao menu principal
 * - openExport/openImport: Exporta ou importa dados do projeto
 */
export class MenuBarComponent implements OnInit, OnDestroy {
  /**
   * Exibe o botão de voltar quando está em páginas internas.
   */
  showBackButton = false;
  /**
   * Exibe o menu de projetos quando está no menu principal.
   */
  showProjectMenu = true;
  /**
 * ID do projeto selecionado atualmente.
 */
selectedProjectId: number | null = null;
  /**
 * Subscription para eventos de navegação do Angular Router.
 */
private routerSubscription: Subscription | null = null;
  private keydownHandler!: (event: KeyboardEvent) => void;

  /**
 * Injeta dependências necessárias para navegação, diálogos, contexto de projeto, API e notificações.
 */
constructor(
    private router: Router, 
    private dialog: MatDialog,
    private projectContext: ProjectContextService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private updateService: UpdateService
  ) {
    const nav = this.router.getCurrentNavigation()
    if (nav && nav.extras && nav.extras.state && nav.extras.state['project']) {
      this.selectedProjectId = nav.extras.state['project'].id || null
      this.projectContext.setProjectId(this.selectedProjectId)
    }
  }

  /**
 * Inicializa o componente e configura a escuta de eventos de navegação.
 */
ngOnInit(): void {
    this.selectedProjectId = this.projectContext.getProjectId();
    
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navEnd = event as NavigationEnd;
      this.updateNavigationState(navEnd.url);
    });
    
    this.updateNavigationState(this.router.url);

    this.keydownHandler = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey) return;
      
      const key = event.key.toLowerCase();
      
      switch (key) {
        case 'a':
          event.preventDefault();
          this.router.navigate(['/agents']);
          break;
        case 's':
          event.preventDefault();
          this.router.navigate(['/scripts']);
          break;
        case 't':
          event.preventDefault();
          this.router.navigate(['/templates']);
          break;
        case 'n':
          event.preventDefault();
          this.router.navigate(['/namespaces']);
          break;
        case 'l':
          event.preventDefault();
          this.router.navigate(['/pipelines']);
          break;
        case 'y':
          event.preventDefault();
          this.router.navigate(['/recipe']);
          break;
        case 'p':
          event.preventDefault();
          if (!this.isMainPage() && !this.isProjectPage()) {
            this.goToProject();
          }
          break;
        case 'q':
          event.preventDefault();
          this.openShortcuts();
          break;
        case 'x':
          event.preventDefault();
          this.openPluginsModal();
          break;
        case 'h':
          if (event.altKey && event.ctrlKey) {
            event.preventDefault();
            this.goHome();
          }
          break;
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
 * Limpa subscriptions ao destruir o componente.
 */
ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
  }

  private updateNavigationState(currentUrl: string): void {
    const internalPages = ['/agents', '/scripts', '/templates', '/namespaces', '/pipelines', '/recipe'];
    
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

  openDocumentation(): void {
    window.open('https://github.com/akumosstl/agentic-ai-suite/blob/main/README.md', '_blank');
  }

  async checkUpdate(): Promise<void> {
    const currentVersion = await this.apiService.getVersion()
    const updateInfo = await this.updateService.checkForUpdate(currentVersion)

    if (updateInfo) {
      this.dialog.open(UpdateDialogComponent, {
        width: '400px',
        data: {
          currentVersion: currentVersion,
          newVersion: updateInfo.version
        }
      })
    } else {
      this.snackBar.open('You are using the latest version', 'Close', { duration: 3000 })
    }
  }

  openPluginsModal(): void {
    this.dialog.open(PluginsModalComponent, {
      width: '80vw',
      maxWidth: '1600px',
      height: '80vh',
      maxHeight: '1000px',
      panelClass: 'plugins-modal'
    })
  }

  openShortcuts(): void {
    this.dialog.open(ShortcutsDialogComponent);
  }
}
