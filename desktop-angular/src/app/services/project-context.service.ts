import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Serviço de gerenciamento de contexto do projeto atual.
 * 
 * @description
 * Mantém o estado do projeto selecionado e navegação entre telas.
 * Utiliza localStorage para persistência de dados entre sessões.
 * 
 * @service ProjectContextService
 * @injectable providedIn: 'root'
 */
@Injectable({
  providedIn: 'root'
})
/**
 * Serviço de contexto do projeto.
 * Gerencia o estado do projeto selecionado e informações compartilhadas entre componentes.
 *
 * @author Seu Nome
 * @since 2024
 * @service
 * @description Serviço singleton para controle de contexto do projeto.
 */
export class ProjectContextService {
  /** Observable do ID do projeto atual */
  private projectIdSource = new BehaviorSubject<number | null>(this.getStoredProjectId());
  currentProjectId$ = this.projectIdSource.asObservable();

  /** Observable da URL anterior navegada */
  private previousUrlSource = new BehaviorSubject<string | null>(null);
  previousUrl$ = this.previousUrlSource.asObservable();

  /** Observable indicando se veio da tela de projeto */
  private fromProjectSource = new BehaviorSubject<boolean>(false);
  fromProject$ = this.fromProjectSource.asObservable();

  /** Observable do pipeline selecionado */
  private selectedPipelineIdSource = new BehaviorSubject<number | null>(null);
  selectedPipelineId$ = this.selectedPipelineIdSource.asObservable();

  /** Chave para storage do ID do projeto */
  private readonly PROJECT_ID_KEY = 'lastProjectId';
  /** Chave para storage do pipeline selecionado */
  private readonly SELECTED_PIPELINE_KEY = 'selectedPipelineId';

  constructor() {}

  private getStoredProjectId(): number | null {
    const stored = localStorage.getItem(this.PROJECT_ID_KEY);
    return stored ? parseInt(stored, 10) : null;
  }

  setProjectId(id: number | null): void {
    this.projectIdSource.next(id);
    if (id) {
      localStorage.setItem(this.PROJECT_ID_KEY, id.toString());
    } else {
      localStorage.removeItem(this.PROJECT_ID_KEY);
    }
  }

  getProjectId(): number | null {
    return this.projectIdSource.getValue();
  }

  setPreviousUrl(url: string | null): void {
    this.previousUrlSource.next(url);
  }

  getPreviousUrl(): string | null {
    return this.previousUrlSource.getValue();
  }

  setFromProject(fromProject: boolean): void {
    this.fromProjectSource.next(fromProject);
  }

  isFromProject(): boolean {
    return this.fromProjectSource.getValue();
  }

  setSelectedPipelineId(id: number | null): void {
    this.selectedPipelineIdSource.next(id);
    if (id) {
      localStorage.setItem(this.SELECTED_PIPELINE_KEY, id.toString());
    } else {
      localStorage.removeItem(this.SELECTED_PIPELINE_KEY);
    }
  }

  getSelectedPipelineId(): number | null {
    const stored = localStorage.getItem(this.SELECTED_PIPELINE_KEY);
    return stored ? parseInt(stored, 10) : null;
  }

  clearContext(): void {
    this.previousUrlSource.next(null);
    this.fromProjectSource.next(false);
    this.selectedPipelineIdSource.next(null);
    localStorage.removeItem(this.SELECTED_PIPELINE_KEY);
  }
}
