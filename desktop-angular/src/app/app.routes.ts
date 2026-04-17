import { Routes } from '@angular/router';
import { LoaderComponent } from './screens/loader/loader.component';
import { MenuComponent } from './screens/menu/menu.component';
import { AgentsComponent } from './screens/agents/agents.component';
import { ScriptsComponent } from './screens/scripts/scripts.component';
import { SkillsComponent } from './screens/skills/skills.component';
import { CommandsComponent } from './screens/commands/commands.component';
import { InstructionsComponent } from './screens/instructions/instructions.component';
import { PluginsComponent } from './screens/plugins/plugins.component';
import { ToolsComponent } from './screens/tools/tools.component';
import { ConfigComponent } from './screens/config/config.component';
import { TemplatesComponent } from './screens/templates/templates.component';
import { NamespacesComponent } from './screens/namespaces/namespaces.component';

import { ProjectComponent } from './screens/project/project.component';
import { RunpipelinesComponent } from './screens/runpipelines/runpipelines.component';
import { PipelineRunHistoryComponent } from './screens/pipeline-run-history/pipeline-run-history.component';
import { PipelinesComponent } from './screens/pipelines/pipelines.component';

/**
 * Definição de rotas da aplicação AI Suite.
 * 
 * @description
 * Mapeamento de URLs para componentes da aplicação:
 * - /: Loader que opens new window and redirects to menu
 * - /menu: Tela inicial com menu de navegação
 * - /agents: Gerenciamento de agentes
 * - /scripts: Gerenciamento de scripts
 * - /skills: Gerenciamento de skills
 * - /commands: Gerenciamento de comandos
 * - /instructions: Gerenciamento de instruções
 * - /plugins: Gerenciamento de plugins
 * - /tools: Gerenciamento de ferramentas
 * - /config: Configurações do sistema
 * - /templates: Gerenciamento de templates
 * - /namespaces: Gerenciamento de namespaces
 * - /project: Gerenciamento de projetos
 * - /runpipelines: Execução de pipelines
 * - /run-step-by-step: Execução passo a passo
 * - /pipeline-run-history: Histórico de execuções
 * 
 * @constant routes
 * @type {Routes}
 */
export const routes: Routes = [
  { path: '', component: LoaderComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'agents', component: AgentsComponent },
  { path: 'scripts', component: ScriptsComponent },
  { path: 'skills', component: SkillsComponent },
  { path: 'commands', component: CommandsComponent },
  { path: 'instructions', component: InstructionsComponent },
  { path: 'plugins', component: PluginsComponent },
  { path: 'tools', component: ToolsComponent },
  { path: 'config', component: ConfigComponent },
  { path: 'templates', component: TemplatesComponent },
  { path: 'namespaces', component: NamespacesComponent },

  { path: 'project', component: ProjectComponent },
  { path: 'project/:id', component: ProjectComponent },
  { path: 'runpipelines', component: RunpipelinesComponent },
  { path: 'runpipelines/:pipelineId', component: RunpipelinesComponent },
  { path: 'pipeline-run-history', component: PipelineRunHistoryComponent },
  { path: 'pipelines', component: PipelinesComponent },
  { path: '**', redirectTo: '/menu' }
];
