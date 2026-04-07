import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Project {
  id?: number;
  name: string;
  description?: string;
  path?: string;
  target?: string;
  targetId?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  skills?: Skill[];
  commands?: Command[];
  scripts?: Script[];
}

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

export interface PipelineStep {
  id?: number;
  pipelineId?: number;
  agent?: Agent;
  agentId?: number;
  script?: Script;
  scriptId?: number;
  stepOrder?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  inputContent?: string;
  inputType?: string;
  outputContent?: string;
  outputType?: string;
  cli?: string;
  parameters?: string;
  arguments?: string;
}

export interface PipelineRun {
  id?: number;
  pipelineId?: number;
  pipelineName?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  steps?: PipelineRunStep[];
}

export interface PipelineRunStep {
  id?: number;
  stepOrder?: number;
  agentName?: string;
  agentCategory?: string;
  scriptName?: string;
  scriptCategory?: string;
  status?: string;
  inputContent?: string;
  inputType?: string;
  outputContent?: string;
  outputType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Agent {
  id?: number;
  name: string;
  category: string;
  description?: string;
  prompt?: string;
  scope: string;
}

export interface Script {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  content?: string;
  scope: string;
  path?: string;
}

export interface Command {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  command?: string;
  scope: string;
  path?: string;
}

export interface Skill {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

export interface SkillFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  skillId?: number;
}

export interface Target {
  id?: number;
  name: string;
  skillsPath?: string;
  commandsPath?: string;
  agentsPath?: string;
  globalPath?: string;
}

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

export interface EventChoice {
  text: string;
  outcome: {
    morale?: number;
    progress?: number;
    budget?: number;
  };
}

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

export interface GameState {
  id?: number;
  phase: string;
  currentSprint: number;
  currentDay: number;
  budget: number;
  qualityScore: number;
  status: string;
}

export interface Action {
  id?: number;
  gameId: number;
  type: string;
  target?: string;
  cost: number;
  effect?: any;
}

export interface SprintReview {
  id?: number;
  gameId: number;
  sprint: number;
  score: number;
  feedback?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api'; // proxy to backend

  constructor(private http: HttpClient) {}

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

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`).pipe(
      catchError(this.handleError('deleteProject', undefined))
    );
  }

  // Project Skills
  getProjectSkills(projectId: number): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.baseUrl}/projects/${projectId}/skills`).pipe(
      catchError(this.handleError('getProjectSkills', []))
    );
  }

  addSkillsToProject(projectId: number, skillIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/skills`, skillIds).pipe(
      catchError(this.handleError('addSkillsToProject', {} as Project))
    );
  }

  removeSkillFromProject(projectId: number, skillId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/skills/${skillId}`).pipe(
      catchError(this.handleError('removeSkillFromProject', {} as Project))
    );
  }

  // Project Commands
  getProjectCommands(projectId: number): Observable<Command[]> {
    return this.http.get<Command[]>(`${this.baseUrl}/projects/${projectId}/commands`).pipe(
      catchError(this.handleError('getProjectCommands', []))
    );
  }

  addCommandsToProject(projectId: number, commandIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/commands`, commandIds).pipe(
      catchError(this.handleError('addCommandsToProject', {} as Project))
    );
  }

  removeCommandFromProject(projectId: number, commandId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/commands/${commandId}`).pipe(
      catchError(this.handleError('removeCommandFromProject', {} as Project))
    );
  }

  // Project Scripts
  getProjectScripts(projectId: number): Observable<Script[]> {
    return this.http.get<Script[]>(`${this.baseUrl}/projects/${projectId}/scripts`).pipe(
      catchError(this.handleError('getProjectScripts', []))
    );
  }

  addScriptsToProject(projectId: number, scriptIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/scripts`, scriptIds).pipe(
      catchError(this.handleError('addScriptsToProject', {} as Project))
    );
  }

  removeScriptFromProject(projectId: number, scriptId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/scripts/${scriptId}`).pipe(
      catchError(this.handleError('removeScriptFromProject', {} as Project))
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

  continuePipeline(projectId: number, pipelineId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}/continue`, {}).pipe(
      catchError((error) => {
        console.error('continuePipeline error:', error);
        throw error;
      })
    );
  }

  isPipelinePaused(projectId: number, pipelineId: number): Observable<{paused: boolean, pendingStepOrder?: number}> {
    return this.http.get<{paused: boolean, pendingStepOrder?: number}>(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}/paused`).pipe(
      catchError((error) => {
        console.error('isPipelinePaused error:', error);
        return of({paused: false});
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

  saveStepCli(pipelineId: number, stepId: number, cli: string, parameters: string, arguments_: string): Observable<PipelineStep> {
    return this.http.put<PipelineStep>(`${this.baseUrl}/pipelines/${pipelineId}/steps/${stepId}/cli`, {
      cli,
      parameters,
      arguments: arguments_
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

  createAgent(agent: Agent): Observable<Agent> {
    return this.http.post<Agent>(`${this.baseUrl}/agents`, agent).pipe(
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

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}