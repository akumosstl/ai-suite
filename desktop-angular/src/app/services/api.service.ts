import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * Interface que representa um Projeto no sistema.
 * Um projeto é a entidade principal que contém configurações e executa pipelines.
 * 
 * @interface Project
 */
export interface Project {
  id?: number;
  name: string;
  description?: string;
  path?: string;
  target?: string;
  targetId?: number;
  status?: string;
  readme?: string;
  createdAt?: string;
  updatedAt?: string;
  skills?: Skill[];
  commands?: Command[];
  scripts?: Script[];
  agents?: Agent[];
  plugins?: Plugin[];
  tools?: Tool[];
}

/**
 * Interface que representa um Pipeline de execução.
 * Um pipeline é uma sequência de passos que podem ser executados por agentes.
 * 
 * @interface Pipeline
 */
export interface Pipeline {
  id?: number;
  name: string;
  description?: string;
  status?: string;
  projectId?: number;
  createdAt?: string;
  updatedAt?: string;
  outputExtension?: string;
  type?: string;
}

/**
 * Interface que representa um passo (step) dentro de um pipeline.
 * Cada step pode ser executado por um agente ou script específico.
 * 
 * @interface PipelineStep
 */
export interface PipelineStep {
  id?: number;
  pipelineId?: number;
  agent?: Agent;
  agentId?: number;
  script?: Script;
  scriptId?: number;
  scriptNamespace?: string;
  agentNamespace?: string;
  stepOrder?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  inputContent?: string;
  inputType?: string;
  outputContent?: string;
  outputType?: string;
  stepOutput?: string;
  stepOutputType?: string;
  cli?: string;
  parameters?: string;
  arguments?: string;
  type?: string;
  runtime?: string;
  loadedFromServer?: boolean;
}

/**
 * Interface que representa uma execução de pipeline.
 * Armazena o histórico de execução de um pipeline.
 * 
 * @interface PipelineRun
 */
export interface PipelineRun {
  id?: number;
  pipelineId?: number;
  pipelineName?: string;
  projectId?: number;
  projectName?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  steps?: PipelineRunStep[];
  runDir?: string;
}

/**
 * Interface que representa um passo executado durante uma execução de pipeline.
 * 
 * @interface PipelineRunStep
 */
export interface PipelineRunStep {
  id?: number;
  stepOrder?: number;
  agentName?: string;
  agentNamespace?: string;
  scriptName?: string;
  scriptNamespace?: string;
  status?: string;
  inputContent?: string;
  inputType?: string;
  outputContent?: string;
  outputType?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface que representa um Agente no sistema.
 * Um agente é uma entidade que pode executar passos de pipeline.
 * 
 * @interface Agent
 */
export interface Agent {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  prompt?: string;
  scope: string;
  path?: string;
}

/**
 * Interface que representa um Script no sistema.
 * Scripts são utilizadas por agentes para executar tarefas específicas.
 * 
 * @interface Script
 */
export interface Script {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  content?: string;
  scope: string;
  path?: string;
}

/**
 * Interface que representa um Comando no sistema.
 * Comandos são instruções que podem ser executadas por agentes.
 * 
 * @interface Command
 */
export interface Command {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  command?: string;
  scope: string;
  path?: string;
}

/**
 * Interface que representa uma Skill no sistema.
 * Skills são habilidades que podem ser atribuídas a agentes.
 * 
 * @interface Skill
 */
export interface Skill {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

/**
 * Interface que representa um Template no sistema.
 * Templates são modelos pré-definidos para criar entidades.
 * 
 * @interface Template
 */
export interface Template {
  id?: number;
  name: string;
  description?: string;
  template?: string;
  type: string; // "agents", "scripts"
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface que representa um arquivo associado a uma skill.
 * 
 * @interface SkillFile
 */
export interface SkillFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  skillId?: number;
  isDeleted?: boolean;
}

/**
 * Interface que representa um Plugin no sistema.
 * Plugins são extensões que adicionam funcionalidades aos agentes.
 * 
 * @interface Plugin
 */
export interface Plugin {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

/**
 * Interface que representa um arquivo associado a um plugin.
 * 
 * @interface PluginFile
 */
export interface PluginFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  pluginId?: number;
  isDeleted?: boolean;
}

/**
 * Interface que representa uma Ferramenta (Tool) no sistema.
 * Ferramentas são recursos que podem ser utilizados por agentes.
 * 
 * @interface Tool
 */
export interface Tool {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

/**
 * Interface que representa um arquivo associado a uma ferramenta.
 * 
 * @interface ToolFile
 */
export interface ToolFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  toolId?: number;
  isDeleted?: boolean;
}

/**
 * Interface que representa um Alvo (Target) no sistema.
 * Alvos definem os caminhos para arquivos de configuração do projeto.
 * 
 * @interface Target
 */
export interface Target {
  id?: number;
  name: string;
  skillsPath?: string;
  commandsPath?: string;
  scriptsPath?: string;
  agentsPath?: string;
  pluginsPath?: string;
  toolsPath?: string;
}

export interface ProjectFile {
  id?: number;
  path?: string;
  fileName: string;
  content: string;
  projectId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface que representa um membro de equipe.
 * Usado no sistema de gestão de projetos.
 * 
 * @interface TeamMember
 */
export interface TeamMember {
  id?: number;
  gameId: number;
  name: string;
  role: string;
  skills?: string;
  salary: number;
  morale: number;
  experience: number;
}

/**
 * Interface que representa uma escolha de evento.
 * 
 * @interface EventChoice
 */
export interface EventChoice {
  text: string;
  outcome: {
    morale?: number;
    progress?: number;
    budget?: number;
  };
}

/**
 * Interface que representa um evento no sistema de gestão.
 * 
 * @interface GameEvent
 */
export interface GameEvent {
  id: number;
  description: string;
  phase: string;
  impact: {
    morale?: number;
    progress?: number;
    budget?: number;
  };
  choices: EventChoice[];
}

/**
 * Interface que representa o estado do jogo/gestão.
 * 
 * @interface GameState
 */
export interface GameState {
  id?: number;
  phase: string;
  currentSprint: number;
  currentDay: number;
  budget: number;
  qualityScore: number;
  status: string;
}

/**
 * Interface que representa uma ação no sistema de gestão.
 * 
 * @interface Action
 */
export interface Action {
  id?: number;
  gameId: number;
  type: string;
  target?: string;
  cost: number;
  effect?: any;
}

/**
 * Interface que representa uma revisão de sprint.
 * 
 * @interface SprintReview
 */
export interface RecipeFile {
  id?: number;
  name: string;
  version?: string;
  description?: string;
  yamlContent: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SprintReview {
  id?: number;
  gameId: number;
  sprint: number;
  score: number;
  feedback?: string;
}

/**
 * Serviço de comunicação com a API backend.
 * 
 * @description
 * Fornece métodos para todas as operações CRUD e consultas à API REST.
 * Utiliza HttpClient para realizar requisições HTTP ao backend.

 * @service ApiService
 * @injectable providedIn: 'root'
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';
  
  constructor(private http: HttpClient) {}
  
  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async getVersion(): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.get<{ version: string }>(`${this.baseUrl}/version`))
      return response.version
    } catch {
      return '1.0.0'
    }
  }

  // Projects
  getProjects(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getProjects', [])));
  }

  searchProjects(term: string, page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/search`, {
      params: new HttpParams()
        .set('term', term)
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('searchProjects', [])));
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, project).pipe(
      catchError(this.handleError('createProject', project))
    );
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`).pipe(
      catchError(this.handleError('getProject', {} as Project))
    );
  }

  updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, project).pipe(
      catchError(this.handleError('updateProject', project))
    );
  }

  updateProjectReadme(projectId: number, content: string): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${projectId}/readme`, { content }).pipe(
      catchError(this.handleError('updateProjectReadme', {} as Project))
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`).pipe(
      catchError(this.handleError('deleteProject', undefined))
    );
  }

  // Project Agents
  getProjectAgents(projectId: number): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.baseUrl}/projects/${projectId}/agents`).pipe(
      catchError(this.handleError('getProjectAgents', []))
    );
  }

  addAgentsToProject(projectId: number, agentIds: number[], force: boolean = false): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/agents`, { agentIds, force }).pipe(
      catchError(this.handleError('addAgentsToProject', {} as Project))
    );
  }

  removeAgentFromProject(projectId: number, agentId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/agents/${agentId}`).pipe(
      catchError(this.handleError('removeAgentFromProject', {} as Project))
    );
  }

  createProjectFile(projectId: number, fileName: string, content: string): Observable<ProjectFile> {
    console.log('API createProjectFile called:', { projectId, fileName, contentLength: content?.length });
    return this.http.post<ProjectFile>(`${this.baseUrl}/projects/${projectId}/files`, { fileName, content }).pipe(
      tap(response => console.log('API createProjectFile success:', response)),
      catchError((error) => {
        console.error('createProjectFile error:', error);
        throw error;
      })
    );
  }

  getProjectFiles(projectId: number): Observable<ProjectFile[]> {
    console.log('API getProjectFiles called for project:', projectId);
    return this.http.get<ProjectFile[]>(`${this.baseUrl}/projects/${projectId}/files`).pipe(
      tap(files => console.log('API getProjectFiles success:', files)),
      catchError((error) => {
        console.error('getProjectFiles error:', error);
        throw error;
      })
    );
  }

  getProjectFile(projectId: number, fileId: number): Observable<ProjectFile> {
    return this.http.get<ProjectFile>(`${this.baseUrl}/projects/${projectId}/files/${fileId}`).pipe(
      catchError((error) => {
        console.error('getProjectFile error:', error);
        throw error;
      })
    );
  }

  getProjectFileByName(projectId: number, fileName: string): Observable<ProjectFile> {
    return this.http.get<ProjectFile>(`${this.baseUrl}/projects/${projectId}/files/by-name/${encodeURIComponent(fileName)}`).pipe(
      catchError((error) => {
        console.error('getProjectFileByName error:', error);
        throw error;
      })
    );
  }

  updateProjectFile(projectId: number, fileId: number, content: string): Observable<ProjectFile> {
    return this.http.put<ProjectFile>(`${this.baseUrl}/projects/${projectId}/files/${fileId}`, { content }).pipe(
      catchError((error) => {
        console.error('updateProjectFile error:', error);
        throw error;
      })
    );
  }

  updateProjectFileByName(projectId: number, fileName: string, content: string): Observable<ProjectFile> {
    return this.http.put<ProjectFile>(`${this.baseUrl}/projects/${projectId}/files/by-name/${encodeURIComponent(fileName)}`, { content }).pipe(
      catchError((error) => {
        console.error('updateProjectFileByName error:', error);
        throw error;
      })
    );
  }

  deleteProjectFile(projectId: number, fileId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/projects/${projectId}/files/${fileId}`).pipe(
      catchError((error) => {
        console.error('deleteProjectFile error:', error);
        throw error;
      })
    );
  }

  deleteProjectFileByName(projectId: number, fileName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/projects/${projectId}/files/by-name/${encodeURIComponent(fileName)}`).pipe(
      catchError((error) => {
        console.error('deleteProjectFileByName error:', error);
        throw error;
      })
    );
  }
  
  // Pipelines for a project
  getPipelinesByProject(projectId: number, page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/${projectId}/pipelines`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getPipelinesByProject', [])));
  }

  getTop10PipelinesByProject(projectId: number): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(`${this.baseUrl}/projects/${projectId}/pipelines/top10`).pipe(
      catchError(this.handleError('getTop10PipelinesByProject', []))
    );
  }

  createPipeline(projectId: number, pipeline: Pipeline): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.baseUrl}/projects/${projectId}/pipelines`, pipeline).pipe(
      catchError(this.handleError('createPipeline', pipeline))
    );
  }

  updatePipeline(projectId: number, pipelineId: number, pipeline: Pipeline): Observable<Pipeline> {
    return this.http.put<Pipeline>(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}`, pipeline).pipe(
      catchError(this.handleError('updatePipeline', pipeline))
    );
  }

  deletePipeline(projectId: number, pipelineId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}`).pipe(
      catchError(this.handleError('deletePipeline', null))
    );
  }

  runPipeline(projectId: number, pipelineId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}/run`, {}).pipe(
      catchError((error) => {
        console.error('runPipeline error:', error);
        throw error;
      })
    );
  }

  stopPipeline(projectId: number, pipelineId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}/stop`, {}).pipe(
      catchError((error) => {
        console.error('stopPipeline error:', error);
        throw error;
      })
    );
  }

  duplicatePipeline(projectId: number, pipelineId: number, name: string): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}/duplicate`, { name }).pipe(
      catchError(this.handleError('duplicatePipeline', {} as Pipeline))
    );
  }

  // Pipeline Steps
  getPipelineSteps(pipelineId: number): Observable<PipelineStep[]> {
    return this.http.get<PipelineStep[]>(`${this.baseUrl}/pipelines/${pipelineId}/steps`).pipe(
      catchError(this.handleError('getPipelineSteps', []))
    );
  }

  addPipelineStep(pipelineId: number, agentId?: number, scriptId?: number): Observable<PipelineStep> {
    let params = new HttpParams();
    if (agentId) {
      params = params.set('agentId', agentId.toString());
    }
    if (scriptId) {
      params = params.set('scriptId', scriptId.toString());
    }
    return this.http.post<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps`, null, {
      params
    }).pipe(
      catchError(this.handleError('addPipelineStep', {} as PipelineStep))
    );
  }

  updatePipelineStep(pipelineId: number, stepId: number, agentId: number): Observable<PipelineStep> {
    return this.http.put<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}`, null, {
      params: new HttpParams().set('agentId', agentId.toString())
    }).pipe(
      catchError(this.handleError('updatePipelineStep', {} as PipelineStep))
    );
  }

  removePipelineStep(pipelineId: number, stepId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}`).pipe(
      catchError(this.handleError('removePipelineStep', null))
    );
  }

  reorderPipelineSteps(pipelineId: number, stepIdsInOrder: number[]): Observable<PipelineStep[]> {
    return this.http.put<PipelineStep[]>(`${this.baseUrl}/pipelines/${pipelineId}/steps/reorder`, stepIdsInOrder).pipe(
      catchError(this.handleError('reorderPipelineSteps', []))
    );
  }
  
  saveStepInput(pipelineId: number, stepId: number, content: string, type: string): Observable<PipelineStep> {
    return this.http.put<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}/input`, {
      content,
      type
    }).pipe(
      catchError(this.handleError('saveStepInput', {} as PipelineStep))
    );
  }

  saveStepOutput(pipelineId: number, stepId: number, content: string, type: string): Observable<PipelineStep> {
    return this.http.put<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}/output`, {
      content,
      type
    }).pipe(
      catchError(this.handleError('saveStepOutput', {} as PipelineStep))
    );
  }

  saveStepConfigOutput(pipelineId: number, stepId: number, content: string, type: string): Observable<PipelineStep> {
    return this.http.put<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}/step-output`, {
      content,
      type
    }).pipe(
      catchError(this.handleError('saveStepConfigOutput', {} as PipelineStep))
    );
  }

  saveStepCli(pipelineId: number, stepId: number, cli: string, parameters: string, arguments_: string, runtime?: string): Observable<PipelineStep> {
    return this.http.put<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}/cli`, {
      cli,
      parameters,
      arguments: arguments_,
      runtime
    }).pipe(
      catchError(this.handleError('saveStepCli', {} as PipelineStep))
    );
  }

  // Pipeline Runs
  getPipelineRunsByProject(projectId: number, page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/${projectId}/pipeline-runs`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getPipelineRunsByProject', [])));
  }

  getTop20PipelineRunsByProject(projectId: number): Observable<PipelineRun[]> {
    return this.http.get<PipelineRun[]>(`${this.baseUrl}/projects/${projectId}/pipeline-runs/top20`).pipe(
      catchError(this.handleError('getTop20PipelineRunsByProject', []))
    );
  }

  getPipelineRunsByPipeline(pipelineId: number, page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/pipelines/${pipelineId}/runs`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getPipelineRunsByPipeline', [])));
  }

  getTop20PipelineRunsByPipeline(pipelineId: number): Observable<PipelineRun[]> {
    return this.http.get<PipelineRun[]>(`${this.baseUrl}/pipelines/${pipelineId}/runs/top20`).pipe(
      catchError(this.handleError('getTop20PipelineRunsByPipeline', []))
    );
  }

  getPipelineRunById(runId: number): Observable<PipelineRun> {
    return this.http.get<PipelineRun>(`${this.baseUrl}/pipeline-runs/${runId}`).pipe(
      catchError(this.handleError('getPipelineRunById', {} as PipelineRun))
    );
  }

  getStepFileOutput(runId: number, stepOrder: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pipeline-runs/${runId}/steps/${stepOrder}/file-output`).pipe(
      catchError(this.handleError('getStepFileOutput', { fileExists: false, message: 'Error fetching file output' }))
    );
  }

  getAllPipelineRuns(page = 0, size = 10, projectName?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (projectName) {
      params = params.set('projectName', projectName);
    }
    return this.http.get(`${this.baseUrl}/all-pipeline-runs`, {
      params
    }).pipe(catchError(this.handleError('getAllPipelineRuns', { runs: [], totalElements: 0, totalPages: 0 })));
  }

  getTop20AllPipelineRuns(): Observable<PipelineRun[]> {
    return this.http.get<PipelineRun[]>(`${this.baseUrl}/all-pipeline-runs/top20`).pipe(
      catchError(this.handleError('getTop20AllPipelineRuns', []))
    );
  }

  cleanupAllPipelineRuns(): Observable<{ deletedCount: number; message: string }> {
    return this.http.delete<{ deletedCount: number; message: string }>(`${this.baseUrl}/all-pipeline-runs/cleanup`).pipe(
      catchError(this.handleError('cleanupAllPipelineRuns', { deletedCount: 0, message: 'Error' }))
    );
  }

  createPipelineRun(pipelineId: number): Observable<PipelineRun> {
    return this.http.post<PipelineRun>(`${this.baseUrl}/pipelines/${pipelineId}/runs`, {}).pipe(
      catchError(this.handleError('createPipelineRun', {} as PipelineRun))
    );
  }

  getLatestPipelineRun(pipelineId: number): Observable<PipelineRun | null> {
    return this.http.get<PipelineRun[]>(`${this.baseUrl}/pipelines/${pipelineId}/runs/top20`).pipe(
      catchError(this.handleError('getLatestPipelineRun', [])),
      map(runs => runs && runs.length > 0 ? runs[0] : null)
    );
  }

  updatePipelineRunStep(runId: number, stepOrder: number, status: string, outputContent?: string, outputType?: string): Observable<PipelineRun> {
    const body: any = { status };
    if (outputContent !== undefined) body.outputContent = outputContent;
    if (outputType !== undefined) body.outputType = outputType;
    return this.http.put<PipelineRun>(`${this.baseUrl}/pipeline-runs/${runId}/steps/${stepOrder}`, body).pipe(
      catchError(this.handleError('updatePipelineRunStep', {} as PipelineRun))
    );
  }

  completePipelineRun(runId: number, status: string): Observable<PipelineRun> {
    return this.http.put<PipelineRun>(`${this.baseUrl}/pipeline-runs/${runId}/complete`, { status }).pipe(
      catchError(this.handleError('completePipelineRun', {} as PipelineRun))
    );
  }

  deletePipelineRun(runId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pipeline-runs/${runId}`).pipe(
      catchError(this.handleError('deletePipelineRun', null))
    );
  }

  // Agents
  getAgents(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/agents`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getAgents', [])));
  }

  searchAgents(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/agents/search`, { params }).pipe(
      catchError(this.handleError('searchAgents', []))
    );
  }

  createAgent(agent: Agent, projectId?: number): Observable<Agent> {
    let url = `${this.baseUrl}/agents`;
    if (projectId) {
      url += `?projectId=${projectId}`;
    }
    return this.http.post<Agent>(url, agent).pipe(
      catchError(this.handleError('createAgent', agent))
    );
  }

  updateAgent(id: number, agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.baseUrl}/agents/${id}`, agent).pipe(
      catchError(this.handleError('updateAgent', agent))
    );
  }

  deleteAgent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/agents/${id}`).pipe(
      catchError(this.handleError('deleteAgent', null))
    );
  }

  // Scripts
  getScripts(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/scripts`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getScripts', [])));
  }

  createScript(script: Script): Observable<Script> {
    return this.http.post<Script>(`${this.baseUrl}/scripts`, script).pipe(
      catchError(this.handleError('createScript', script))
    );
  }

  updateScript(id: number, script: Script): Observable<Script> {
    return this.http.put<Script>(`${this.baseUrl}/scripts/${id}`, script).pipe(
      catchError(this.handleError('updateScript', script))
    );
  }

  deleteScript(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/scripts/${id}`).pipe(
      catchError(this.handleError('deleteScript', null))
    );
  }

  searchScripts(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/scripts/search`, { params }).pipe(
      catchError(this.handleError('searchScripts', []))
    );
  }

  // Events
  getDailyEvents(sprintId: number, day: number): Observable<GameEvent[]> {
    return this.http.get<GameEvent[]>(`${this.baseUrl}/events`, {
      params: new HttpParams()
        .set('sprint', sprintId.toString())
        .set('day', day.toString())
    }).pipe(catchError(this.handleError('getDailyEvents', [])));
  }

  // Teams
  getTeams(gameId: number): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/teams`, {
      params: new HttpParams().set('gameId', gameId.toString())
    }).pipe(catchError(this.handleError('getTeams', [])));
  }

  updateTeamMember(id: number, member: TeamMember): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${this.baseUrl}/teams/${id}`, member).pipe(
      catchError(this.handleError('updateTeamMember', member))
    );
  }

  // Actions
  performAction(action: Action): Observable<Action> {
    return this.http.post<Action>(`${this.baseUrl}/actions`, action).pipe(
      catchError(this.handleError('performAction', action))
    );
  }

  // Sprint Review
  submitSprintReview(review: SprintReview): Observable<SprintReview> {
    return this.http.post<SprintReview>(`${this.baseUrl}/reviews`, review).pipe(
      catchError(this.handleError('submitSprintReview', review))
    );
  }

  // Commands
  getCommands(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/commands`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getCommands', [])));
  }

  searchCommands(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/commands/search`, { params }).pipe(
      catchError(this.handleError('searchCommands', []))
    );
  }

  createCommand(command: Command): Observable<Command> {
    return this.http.post<Command>(`${this.baseUrl}/commands`, command).pipe(
      catchError(this.handleError('createCommand', command))
    );
  }

  updateCommand(id: number, command: Command): Observable<Command> {
    return this.http.put<Command>(`${this.baseUrl}/commands/${id}`, command).pipe(
      catchError(this.handleError('updateCommand', command))
    );
  }

  deleteCommand(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/commands/${id}`).pipe(
      catchError(this.handleError('deleteCommand', null))
    );
  }

  // Skills
  getSkills(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/skills`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getSkills', [])));
  }

  searchSkills(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/skills/search`, { params }).pipe(
      catchError(this.handleError('searchSkills', []))
    );
  }

  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(`${this.baseUrl}/skills`, skill).pipe(
      catchError(this.handleError('createSkill', skill))
    );
  }

  updateSkill(id: number, skill: Skill): Observable<Skill> {
    return this.http.put<Skill>(`${this.baseUrl}/skills/${id}`, skill).pipe(
      catchError(this.handleError('updateSkill', skill))
    );
  }

  deleteSkill(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/skills/${id}`).pipe(
      catchError(this.handleError('deleteSkill', null))
    );
  }

  // Skill Files
  getSkillFiles(skillId: number): Observable<SkillFile[]> {
    return this.http.get<SkillFile[]>(`${this.baseUrl}/skill-files/skill/${skillId}`).pipe(
      catchError(this.handleError('getSkillFiles', []))
    );
  }

  addSkillFile(skillId: number, path: string, fileName: string, content: string): Observable<SkillFile> {
    return this.http.post<SkillFile>(`${this.baseUrl}/skill-files`, {
      skillId,
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<SkillFile>('addSkillFile', {} as SkillFile)));
  }

  deleteSkillFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/skill-files/${id}`).pipe(
      catchError(this.handleError('deleteSkillFile', null))
    );
  }

  updateSkillFile(id: number, path: string, fileName: string, content: string): Observable<SkillFile> {
    return this.http.put<SkillFile>(`${this.baseUrl}/skill-files/${id}`, {
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<SkillFile>('updateSkillFile', {} as SkillFile)));
  }

  // Plugins
  getPlugins(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/plugins`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getPlugins', [])));
  }

  searchPlugins(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/plugins/search`, { params }).pipe(
      catchError(this.handleError('searchPlugins', []))
    );
  }

  createPlugin(plugin: Plugin): Observable<Plugin> {
    return this.http.post<Plugin>(`${this.baseUrl}/plugins`, plugin).pipe(
      catchError(this.handleError('createPlugin', plugin))
    );
  }

  updatePlugin(id: number, plugin: Plugin): Observable<Plugin> {
    return this.http.put<Plugin>(`${this.baseUrl}/plugins/${id}`, plugin).pipe(
      catchError(this.handleError('updatePlugin', plugin))
    );
  }

  deletePlugin(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/plugins/${id}`).pipe(
      catchError(this.handleError('deletePlugin', null))
    );
  }

  // Plugin Files
  getPluginFiles(pluginId: number): Observable<PluginFile[]> {
    return this.http.get<PluginFile[]>(`${this.baseUrl}/plugin-files/plugin/${pluginId}`).pipe(
      catchError(this.handleError('getPluginFiles', []))
    );
  }

  addPluginFile(pluginId: number, path: string, fileName: string, content: string): Observable<PluginFile> {
    return this.http.post<PluginFile>(`${this.baseUrl}/plugin-files`, {
      pluginId,
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<PluginFile>('addPluginFile', {} as PluginFile)));
  }

  deletePluginFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/plugin-files/${id}`).pipe(
      catchError(this.handleError('deletePluginFile', null))
    );
  }

  updatePluginFile(id: number, path: string, fileName: string, content: string): Observable<PluginFile> {
    return this.http.put<PluginFile>(`${this.baseUrl}/plugin-files/${id}`, {
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<PluginFile>('updatePluginFile', {} as PluginFile)));
  }

  // Tools
  getTools(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/tools`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getTools', [])));
  }

  searchTools(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/tools/search`, { params }).pipe(
      catchError(this.handleError('searchTools', []))
    );
  }

  createTool(tool: Tool): Observable<Tool> {
    return this.http.post<Tool>(`${this.baseUrl}/tools`, tool).pipe(
      catchError(this.handleError('createTool', tool))
    );
  }

  updateTool(id: number, tool: Tool): Observable<Tool> {
    return this.http.put<Tool>(`${this.baseUrl}/tools/${id}`, tool).pipe(
      catchError(this.handleError('updateTool', tool))
    );
  }

  deleteTool(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/tools/${id}`).pipe(
      catchError(this.handleError('deleteTool', null))
    );
  }

  // Tool Files
  getToolFiles(toolId: number): Observable<ToolFile[]> {
    return this.http.get<ToolFile[]>(`${this.baseUrl}/tool-files/tool/${toolId}`).pipe(
      catchError(this.handleError('getToolFiles', []))
    );
  }

  addToolFile(toolId: number, path: string, fileName: string, content: string): Observable<ToolFile> {
    return this.http.post<ToolFile>(`${this.baseUrl}/tool-files`, {
      toolId,
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<ToolFile>('addToolFile', {} as ToolFile)));
  }

  deleteToolFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/tool-files/${id}`).pipe(
      catchError(this.handleError('deleteToolFile', null))
    );
  }

  updateToolFile(id: number, path: string, fileName: string, content: string): Observable<ToolFile> {
    return this.http.put<ToolFile>(`${this.baseUrl}/tool-files/${id}`, {
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<ToolFile>('updateToolFile', {} as ToolFile)));
  }

  // Targets
  getTargets(): Observable<Target[]> {
    return this.http.get<Target[]>(`${this.baseUrl}/targets`).pipe(
      catchError(this.handleError('getTargets', []))
    );
  }

  createTarget(target: Target): Observable<Target> {
    return this.http.post<Target>(`${this.baseUrl}/targets`, target).pipe(
      catchError(this.handleError('createTarget', target))
    );
  }

  updateTarget(id: number, target: Target): Observable<Target> {
    return this.http.put<Target>(`${this.baseUrl}/targets/${id}`, target).pipe(
      catchError(this.handleError('updateTarget', target))
    );
  }

  deleteTarget(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/targets/${id}`).pipe(
      catchError(this.handleError('deleteTarget', null))
    );
  }

  getSkillNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/skills/namespaces`).pipe(
      catchError(this.handleError('getSkillNamespaces', []))
    );
  }

  getPluginNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/plugins/namespaces`).pipe(
      catchError(this.handleError('getPluginNamespaces', []))
    );
  }

  getToolNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/tools/namespaces`).pipe(
      catchError(this.handleError('getToolNamespaces', []))
    );
  }

  getAgentNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/agents/namespaces`).pipe(
      catchError(this.handleError('getAgentNamespaces', []))
    );
  }

  getCommandNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/commands/namespaces`).pipe(
      catchError(this.handleError('getCommandNamespaces', []))
    );
  }

  getScriptNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/scripts/namespaces`).pipe(
      catchError(this.handleError('getScriptNamespaces', []))
    );
  }

  // Templates
  getTemplates(type?: string, page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get(`${this.baseUrl}/templates`, { params }).pipe(
      catchError(this.handleError('getTemplates', []))
    );
  }

  getTemplatesByType(type: string): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.baseUrl}/templates/type/${type}`).pipe(
      catchError(this.handleError('getTemplatesByType', []))
    );
  }

  createTemplate(template: Template): Observable<Template> {
    return this.http.post<Template>(`${this.baseUrl}/templates`, template).pipe(
      catchError(this.handleError('createTemplate', template))
    );
  }

  updateTemplate(id: number, template: Template): Observable<Template> {
    return this.http.put<Template>(`${this.baseUrl}/templates/${id}`, template).pipe(
      catchError(this.handleError('updateTemplate', template))
    );
  }

  deleteTemplate(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/templates/${id}`).pipe(
      catchError(this.handleError('deleteTemplate', null))
    );
  }

  searchTemplates(type: string, term: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('type', type);
    if (term) {
      params = params.set('term', term);
    }
    return this.http.get(`${this.baseUrl}/templates/search`, { params }).pipe(
      catchError(this.handleError('searchTemplates', []))
    );
  }

  // Recipe Files
  getRecipeFiles(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/recipe-files`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getRecipeFiles', [])));
  }

  searchRecipeFiles(term: string, page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/recipe-files/search`, {
      params: new HttpParams()
        .set('term', term)
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('searchRecipeFiles', [])));
  }

  getRecipeFile(id: number): Observable<RecipeFile> {
    return this.http.get<RecipeFile>(`${this.baseUrl}/recipe-files/${id}`).pipe(
      catchError(this.handleError('getRecipeFile', {} as RecipeFile))
    );
  }

  createRecipeFile(recipeFile: RecipeFile): Observable<RecipeFile> {
    return this.http.post<RecipeFile>(`${this.baseUrl}/recipe-files`, recipeFile).pipe(
      catchError(this.handleError('createRecipeFile', recipeFile))
    );
  }

  updateRecipeFile(id: number, recipeFile: RecipeFile): Observable<RecipeFile> {
    return this.http.put<RecipeFile>(`${this.baseUrl}/recipe-files/${id}`, recipeFile).pipe(
      catchError(this.handleError('updateRecipeFile', recipeFile))
    );
  }

  deleteRecipeFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/recipe-files/${id}`).pipe(
      catchError(this.handleError('deleteRecipeFile', null))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      const errorMessage = error.error?.error || error.error?.message || error.message || 'Unknown error';
      const customError = new Error(errorMessage);
      (customError as any).status = error.status;
      (customError as any).error = errorMessage;
      return throwError(() => customError);
    };
}

exitApplication(): Observable<any> {
     return this.http.post(`${this.baseUrl}/exit`, {}).pipe(
       catchError(this.handleError('exitApplication', {}))
     );
   }

   // Namespaces
getNamespacesByType(type: string): Observable<string[]> {
      return this.http.get<string[]>(`${this.baseUrl}/namespaces/namespaces/${type}`).pipe(
        catchError(this.handleError('getNamespacesByType', []))
      );
    }

   getNamespaceItems(type: string, namespace: string): Observable<any> {
     return this.http.get(`${this.baseUrl}/namespaces/${type}/${namespace}`).pipe(
       catchError(this.handleError('getNamespaceItems', { type, namespace, items: [], totalCount: 0 }))
     );
   }

   getPipelinesUsingNamespace(type: string, namespace: string): Observable<Pipeline[]> {
     return this.http.get<Pipeline[]>(`${this.baseUrl}/namespaces/${type}/${namespace}/pipelines`).pipe(
       catchError(this.handleError('getPipelinesUsingNamespace', []))
     );
   }

   getProjectsUsingNamespace(type: string, namespace: string): Observable<Project[]> {
     return this.http.get<Project[]>(`${this.baseUrl}/namespaces/${type}/${namespace}/projects`).pipe(
       catchError(this.handleError('getProjectsUsingNamespace', []))
     );
   }

  clearNamespace(type: string, namespace: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/namespaces/${type}/${namespace}`).pipe(
      catchError(this.handleError('clearNamespace', { success: false, deletedCount: 0, message: 'Error' }))
    );
  }

  getPluginRegistry(): Observable<any> {
    return this.http.get(`${this.baseUrl}/plugins/registry`).pipe(
      catchError(this.handleError('getPluginRegistry', { plugins: [] }))
    );
  }
}