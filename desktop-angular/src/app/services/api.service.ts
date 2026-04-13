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
  agents?: Agent[];
  instructions?: Instruction[];
  plugins?: Plugin[];
  tools?: Tool[];
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
  type?: string;
  runtime?: string;
  loadedFromServer?: boolean;
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
  path?: string;
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

export interface Template {
  id?: number;
  name: string;
  description?: string;
  template?: string;
  type: string; // "agents", "skills", "commands", "scripts"
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  skillId?: number;
}

export interface Instruction {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

export interface InstructionFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  instructionId?: number;
}

export interface Plugin {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

export interface PluginFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  pluginId?: number;
}

export interface Tool {
  id?: number;
  name: string;
  namespace: string;
  description?: string;
  instructions?: string;
  path?: string;
}

export interface ToolFile {
  id?: number;
  path: string;
  fileName: string;
  content: string;
  toolId?: number;
}

export interface Target {
  id?: number;
  name: string;
  skillsPath?: string;
  commandsPath?: string;
  scriptsPath?: string;
  agentsPath?: string;
  instructionsPath?: string;
  pluginsPath?: string;
  toolsPath?: string;
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

  // Project Agents
  getProjectAgents(projectId: number): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.baseUrl}/projects/${projectId}/agents`).pipe(
      catchError(this.handleError('getProjectAgents', []))
    );
  }

  addAgentsToProject(projectId: number, agentIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/agents`, agentIds).pipe(
      catchError(this.handleError('addAgentsToProject', {} as Project))
    );
  }

  removeAgentFromProject(projectId: number, agentId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/agents/${agentId}`).pipe(
      catchError(this.handleError('removeAgentFromProject', {} as Project))
    );
  }

  // Project Instructions
  getProjectInstructions(projectId: number): Observable<Instruction[]> {
    return this.http.get<Instruction[]>(`${this.baseUrl}/projects/${projectId}/instructions`).pipe(
      catchError(this.handleError('getProjectInstructions', []))
    );
  }

  addInstructionsToProject(projectId: number, instructionIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/instructions`, instructionIds).pipe(
      catchError(this.handleError('addInstructionsToProject', {} as Project))
    );
  }

  removeInstructionFromProject(projectId: number, instructionId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/instructions/${instructionId}`).pipe(
      catchError(this.handleError('removeInstructionFromProject', {} as Project))
    );
  }

  // Project Plugins
  getProjectPlugins(projectId: number): Observable<Plugin[]> {
    return this.http.get<Plugin[]>(`${this.baseUrl}/projects/${projectId}/plugins`).pipe(
      catchError(this.handleError('getProjectPlugins', []))
    );
  }

  addPluginsToProject(projectId: number, pluginIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/plugins`, pluginIds).pipe(
      catchError(this.handleError('addPluginsToProject', {} as Project))
    );
  }

  removePluginFromProject(projectId: number, pluginId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/plugins/${pluginId}`).pipe(
      catchError(this.handleError('removePluginFromProject', {} as Project))
    );
  }

  // Project Tools
  getProjectTools(projectId: number): Observable<Tool[]> {
    return this.http.get<Tool[]>(`${this.baseUrl}/projects/${projectId}/tools`).pipe(
      catchError(this.handleError('getProjectTools', []))
    );
  }

  addToolsToProject(projectId: number, toolIds: number[]): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/${projectId}/tools`, toolIds).pipe(
      catchError(this.handleError('addToolsToProject', {} as Project))
    );
  }

removeToolFromProject(projectId: number, toolId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/projects/${projectId}/tools/${toolId}`).pipe(
      catchError(this.handleError('removeToolFromProject', {} as Project))
    );
  }
  
  createProjectFile(projectId: number, fileName: string, content: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/${projectId}/files`, { fileName, content }).pipe(
      catchError((error) => {
        console.error('createProjectFile error:', error);
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

  pausePipeline(projectId: number, pipelineId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/${projectId}/pipelines/${pipelineId}/pause`, {}).pipe(
      catchError((error) => {
        console.error('pausePipeline error:', error);
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

  // Instructions
  getInstructions(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/instructions`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(catchError(this.handleError('getInstructions', [])));
  }

  searchInstructions(term: string, namespace: string = '', page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (term) {
      params = params.set('term', term);
    }
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.baseUrl}/instructions/search`, { params }).pipe(
      catchError(this.handleError('searchInstructions', []))
    );
  }

  createInstruction(instruction: Instruction): Observable<Instruction> {
    return this.http.post<Instruction>(`${this.baseUrl}/instructions`, instruction).pipe(
      catchError(this.handleError('createInstruction', instruction))
    );
  }

  updateInstruction(id: number, instruction: Instruction): Observable<Instruction> {
    return this.http.put<Instruction>(`${this.baseUrl}/instructions/${id}`, instruction).pipe(
      catchError(this.handleError('updateInstruction', instruction))
    );
  }

  deleteInstruction(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/instructions/${id}`).pipe(
      catchError(this.handleError('deleteInstruction', null))
    );
  }

  // Instruction Files
  getInstructionFiles(instructionId: number): Observable<InstructionFile[]> {
    return this.http.get<InstructionFile[]>(`${this.baseUrl}/instruction-files/instruction/${instructionId}`).pipe(
      catchError(this.handleError('getInstructionFiles', []))
    );
  }

  addInstructionFile(instructionId: number, path: string, fileName: string, content: string): Observable<InstructionFile> {
    return this.http.post<InstructionFile>(`${this.baseUrl}/instruction-files`, {
      instructionId,
      path,
      fileName,
      content
    }).pipe(catchError(this.handleError<InstructionFile>('addInstructionFile', {} as InstructionFile)));
  }

  deleteInstructionFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/instruction-files/${id}`).pipe(
      catchError(this.handleError('deleteInstructionFile', null))
    );
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

  getInstructionNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/instructions/namespaces`).pipe(
      catchError(this.handleError('getInstructionNamespaces', []))
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

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  exportData(types: string[]): Observable<Blob> {
    const params = types.map(t => `types=${t}`).join('&');
    return this.http.get(`${this.baseUrl}/export-import/export?${params}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError('exportData', new Blob()))
    );
  }

  importData(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/export-import/import`, formData).pipe(
      catchError(this.handleError('importData', { success: false, message: 'Import failed' }))
    );
  }

   backupDatabase(directory: string, fileName: string): Observable<any> {
     return this.http.post(`${this.baseUrl}/backup`, { directory, fileName }).pipe(
       catchError(this.handleError('backupDatabase', { success: false, message: 'Backup failed' }))
     );
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
}