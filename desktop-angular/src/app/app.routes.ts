import { Routes } from '@angular/router';
import { LoaderComponent } from './screens/loader/loader.component';
import { MenuComponent } from './screens/menu/menu.component';
import { AgentsComponent } from './screens/agents/agents.component';
import { ScriptsComponent } from './screens/scripts/scripts.component';
import { ConfigComponent } from './screens/config/config.component';
import { TemplatesComponent } from './screens/templates/templates.component';
import { NamespacesComponent } from './screens/namespaces/namespaces.component';

import { ProjectComponent } from './screens/project/project.component';
import { RunpipelinesComponent } from './screens/runpipelines/runpipelines.component';
import { PipelineRunHistoryComponent } from './screens/pipeline-run-history/pipeline-run-history.component';
import { PipelinesComponent } from './screens/pipelines/pipelines.component';
import { RecipeComponent } from './screens/recipe/recipe.component';
import { DiagramComponent } from './screens/diagram/diagram.component';

/**
 * Definição de rotas da aplicação AI Suite.
 * 
 * @description
 * Mapeamento de URLs para componentes da aplicação:
 * - /: Loader que opens new window and redirects to menu
 * - /menu: Tela inicial com menu de navegação
 * - /agents: Gerenciamento de agentes
 * - /scripts: Gerenciamento de scripts
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
  { path: 'config', component: ConfigComponent },
  { path: 'templates', component: TemplatesComponent },
  { path: 'namespaces', component: NamespacesComponent },

  { path: 'project', component: ProjectComponent },
  { path: 'project/:id', component: ProjectComponent },
  { path: 'runpipelines', component: RunpipelinesComponent },
  { path: 'runpipelines/:pipelineId', component: RunpipelinesComponent },
  { path: 'pipeline-run-history', component: PipelineRunHistoryComponent },
  { path: 'pipelines', component: PipelinesComponent },
  { path: 'recipe', component: RecipeComponent },
  { path: 'diagram', component: DiagramComponent },
  { path: '**', redirectTo: '/menu' }
];
