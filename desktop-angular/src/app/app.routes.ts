import { Routes } from '@angular/router';
import { MenuComponent } from './screens/menu/menu.component';
import { AgentsComponent } from './screens/agents/agents.component';
import { ScriptsComponent } from './screens/scripts/scripts.component';
import { SkillsComponent } from './screens/skills/skills.component';
import { CommandsComponent } from './screens/commands/commands.component';
import { ConfigComponent } from './screens/config/config.component';

import { ProjectComponent } from './screens/project/project.component';
import { RunpipelinesComponent } from './screens/runpipelines/runpipelines.component';
import { RunStepByStepComponent } from './screens/run-step-by-step/run-step-by-step.component';
import { PipelineRunHistoryComponent } from './screens/pipeline-run-history/pipeline-run-history.component';

export const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  { path: 'menu', component: MenuComponent },
  { path: 'agents', component: AgentsComponent },
  { path: 'scripts', component: ScriptsComponent },
  { path: 'skills', component: SkillsComponent },
  { path: 'commands', component: CommandsComponent },
  { path: 'config', component: ConfigComponent },

  { path: 'project', component: ProjectComponent },
  { path: 'project/:id', component: ProjectComponent },
  { path: 'runpipelines', component: RunpipelinesComponent },
  { path: 'runpipelines/:pipelineId', component: RunpipelinesComponent },
  { path: 'run-step-by-step', component: RunStepByStepComponent },
  { path: 'run-step-by-step/:pipelineId', component: RunStepByStepComponent },
  { path: 'pipeline-run-history', component: PipelineRunHistoryComponent },
  { path: '**', redirectTo: '/menu' }
];
