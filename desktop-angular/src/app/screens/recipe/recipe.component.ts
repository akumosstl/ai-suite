import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Router } from '@angular/router'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { MatSelectModule } from '@angular/material/select'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatTableModule } from '@angular/material/table'
import { ApiService, RecipeFile } from '../../services/api.service'
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component'
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component'
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component'

export interface KeyValue {
  key: string
  value: string
}

export interface RecipeTarget {
  name: string
  agents_path: string
  scripts_path: string
  cli: string
}

export interface RecipeProject {
  id: string
  name: string
  description: string
  path: string
  target: string
  status: string
  readme: string
  agents: string[]
  scripts: string[]
}

export interface RecipeAgent {
  id: string
  name: string
  namespace: string
  category: string
  description: string
  prompt: string
  path: string
}

export interface RecipeScript {
  id: string
  name: string
  namespace: string
  category: string
  description: string
  content: string
  scope: string
  path: string
}

export interface RecipeTemplate {
  id: string
  name: string
  type: string
  description: string
  template: string
}

export interface RecipeStepIO {
  content: string
  type: string
}

export interface RecipeStep {
  order: number
  agent: string
  script: string
  prompt: string
  type: string
  runtime: string
  cli: string
  parameters: string
  arguments: string
  input: RecipeStepIO
  output: RecipeStepIO
}

export interface RecipePipeline {
  id: string
  project: string
  name: string
  description: string
  type: string
  output_extension: string
  steps: RecipeStep[]
}

export interface RecipeRetry {
  max_attempts: string
  delay_seconds: string
  on_status: string[]
}

export interface RecipeLoop {
  condition: string
  max_iterations: string
  delay_seconds: string
}

export interface RecipeTask {
  id: string
  type: string
  resource: string
  ref: string
  depends_on: string[]
  pipeline_ref: string
  pipeline_id: string
  pipeline_name: string
  project: string
  repeat: string
  retry: RecipeRetry
  loop: RecipeLoop
  wait: boolean
  stop_on_failure: boolean
}

interface ParsedSection {
  [key: string]: any
}

@Component({
  selector: 'app-recipe',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatPaginatorModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatDialogModule,
    MatIconModule, MatTabsModule, MatSelectModule, MatExpansionModule, MatTableModule,
    MenuBarComponent, PipelineResultDialogComponent, PanelToggleComponent
  ],
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.css']
})
export class RecipeComponent implements OnInit, OnDestroy {
  recipeFiles: RecipeFile[] = []
  selectedRecipeFile: RecipeFile | null = null
  formRecipeFile: RecipeFile = this.getEmptyRecipeFile()
  searchTerm = ''
  loading = false
  currentPage = 0
  pageSize = 10
  totalElements = 0
  totalPages = 0
  statusMessage = ''
  leftPanelCollapsed = false
  viewMode: 'visual' | 'raw' = 'visual'
  rawYaml = ''

  recipeName = ''
  recipeVersion = '1.0'
  recipeDescription = ''
  parameters: KeyValue[] = []
  envVars: KeyValue[] = []
  targets: RecipeTarget[] = []
  projects: RecipeProject[] = []
  agents: RecipeAgent[] = []
  scripts: RecipeScript[] = []
  templates: RecipeTemplate[] = []
  pipelines: RecipePipeline[] = []
  tasks: RecipeTask[] = []

  expandedSections: { [key: string]: boolean } = {
    metadata: true,
    parameters: false,
    env: false,
    targets: false,
    projects: false,
    agents: false,
    scripts: false,
    templates: false,
    pipelines: false,
    tasks: false
  }

  expandedPipelines: Set<number> = new Set()
  expandedTasks: Set<number> = new Set()

  readonly cliOptions = ['opencode', 'copilot', 'claude', 'custom']
  readonly scopeOptions = ['global', 'project']
  readonly templateTypeOptions = ['agents', 'skills', 'commands', 'scripts']
  readonly pipelineTypeOptions = ['sequential', 'step_by_step']
  readonly stepTypeOptions = ['agent', 'script']
  readonly runtimeOptions = ['cmd', 'node', 'java', 'py', 'custom']
  readonly taskTypeOptions = ['create', 'run', 'stop', 'call']
  readonly resourceTypeOptions = ['project', 'agent', 'script', 'pipeline', 'target', 'template']
  readonly loopConditionOptions = ['always', 'until_success', 'until_failure', 'custom']
  readonly retryStatusOptions = ['failed', 'timeout', 'error']
  readonly stepIOTypeOptions = ['text', 'json', 'file']

  constructor(
    private router: Router,
    private apiService: ApiService,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  private getEmptyRecipeFile(): RecipeFile {
    return { name: '', version: '', description: '', yamlContent: '' }
  }

  ngOnInit(): void {
    this.loadRecipeFiles()
  }

  ngOnDestroy(): void {}

  @HostListener('document:keydown.control.b')
  onToggleLeftPanel(): void {
    this.toggleLeftPanel()
  }

  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section]
  }

  togglePipelineSteps(index: number): void {
    if (this.expandedPipelines.has(index)) {
      this.expandedPipelines.delete(index)
    } else {
      this.expandedPipelines.add(index)
    }
  }

  toggleTaskDetails(index: number): void {
    if (this.expandedTasks.has(index)) {
      this.expandedTasks.delete(index)
    } else {
      this.expandedTasks.add(index)
    }
  }

  loadRecipeFiles(): void {
    this.loading = true
    this.apiService.getRecipeFiles(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.recipeFiles = response?.recipeFiles ?? []
          this.totalElements = response?.totalElements ?? 0
          this.totalPages = response?.totalPages ?? 0
          this.loading = false
          this.cdr.detectChanges()
        })
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.statusMessage = 'Error loading recipes: ' + err.message
          this.loading = false
          this.cdr.detectChanges()
        })
      }
    })
  }

  search(): void {
    if (this.searchTerm.trim()) {
      this.currentPage = 0
      this.loading = true
      this.apiService.searchRecipeFiles(this.searchTerm, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.recipeFiles = response?.recipeFiles ?? []
            this.totalElements = response?.totalElements ?? 0
            this.totalPages = response?.totalPages ?? 0
            this.loading = false
            this.cdr.detectChanges()
          })
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching recipes: ' + err.message
            this.loading = false
            this.cdr.detectChanges()
          })
        }
      })
    } else {
      this.clearSearch()
    }
  }

  clearSearch(): void {
    this.searchTerm = ''
    this.currentPage = 0
    this.loadRecipeFiles()
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex
    this.pageSize = event.pageSize
    if (this.searchTerm.trim()) {
      this.search()
    } else {
      this.loadRecipeFiles()
    }
  }

  selectRecipeFile(recipeFile: RecipeFile): void {
    this.cdr.markForCheck()
    this.selectedRecipeFile = { ...recipeFile }
    this.formRecipeFile = { ...recipeFile }
    this.yamlContentToForm(recipeFile.yamlContent)
    if (recipeFile.name) this.recipeName = recipeFile.name
    if (recipeFile.version) this.recipeVersion = recipeFile.version
    if (recipeFile.description) this.recipeDescription = recipeFile.description ?? ''
    this.viewMode = 'visual'
    this.statusMessage = `Recipe selected: ${recipeFile.name}`
  }

  yamlContentToForm(yaml: string): void {
    if (!yaml) {
      this.resetFormData()
      return
    }
    try {
      const parsed = this.parseYamlSimple(yaml)
      let recipe = parsed['recipe'] || {}
      if (!recipe || Object.keys(recipe).length === 0) {
        recipe = parsed
      }

      this.recipeName = this.extractStr(recipe['name'], '')
      this.recipeVersion = this.extractStr(recipe['version'], '1.0')
      this.recipeDescription = this.extractStr(recipe['description'], '')

      this.parameters = this.parseKeyValueSection(recipe['parameters'])
      this.envVars = this.parseKeyValueSection(recipe['env'])

      this.targets = this.parseArraySection(recipe['targets'], (t: ParsedSection) => ({
        name: this.extractStr(t['name'], ''),
        agents_path: this.extractStr(t['agents_path'], ''),
        scripts_path: this.extractStr(t['scripts_path'], ''),
        cli: this.extractStr(t['cli'], 'opencode')
      }))

      this.projects = this.parseArraySection(recipe['projects'], (p: ParsedSection) => ({
        id: this.extractStr(p['id'], ''),
        name: this.extractStr(p['name'], ''),
        description: this.extractStr(p['description'], ''),
        path: this.extractStr(p['path'], ''),
        target: this.extractStr(p['target'], ''),
        status: this.extractStr(p['status'], 'active'),
        readme: this.extractStr(p['readme'], ''),
        agents: this.extractStrArray(p['agents']),
        scripts: this.extractStrArray(p['scripts'])
      }))

      this.agents = this.parseArraySection(recipe['agents'], (a: ParsedSection) => ({
        id: this.extractStr(a['id'], ''),
        name: this.extractStr(a['name'], ''),
        namespace: this.extractStr(a['namespace'], ''),
        category: this.extractStr(a['category'], ''),
        description: this.extractStr(a['description'], ''),
        prompt: this.extractStr(a['prompt'], ''),
        path: this.extractStr(a['path'], '')
      }))

      this.scripts = this.parseArraySection(recipe['scripts'], (s: ParsedSection) => ({
        id: this.extractStr(s['id'], ''),
        name: this.extractStr(s['name'], ''),
        namespace: this.extractStr(s['namespace'], ''),
        category: this.extractStr(s['category'], ''),
        description: this.extractStr(s['description'], ''),
        content: this.extractStr(s['content'], ''),
        scope: this.extractStr(s['scope'], 'global'),
        path: this.extractStr(s['path'], '')
      }))

      this.templates = this.parseArraySection(recipe['templates'], (t: ParsedSection) => ({
        id: this.extractStr(t['id'], ''),
        name: this.extractStr(t['name'], ''),
        type: this.extractStr(t['type'], 'agents'),
        description: this.extractStr(t['description'], ''),
        template: this.extractStr(t['template'], '')
      }))

      this.pipelines = this.parseArraySection(recipe['pipelines'], (p: ParsedSection) => ({
        id: this.extractStr(p['id'], ''),
        project: this.extractStr(p['project'], ''),
        name: this.extractStr(p['name'], ''),
        description: this.extractStr(p['description'], ''),
        type: this.extractStr(p['type'], 'sequential'),
        output_extension: this.extractStr(p['output_extension'], ''),
        steps: this.parseArraySection(p['steps'], (s: ParsedSection) => ({
          order: this.extractNum(s['order'], 0),
          agent: this.extractStr(s['agent'], ''),
          script: this.extractStr(s['script'], ''),
          prompt: this.extractStr(s['prompt'], ''),
          type: this.extractStr(s['type'], ''),
          runtime: this.extractStr(s['runtime'], ''),
          cli: this.extractStr(s['cli'], ''),
          parameters: this.extractStr(s['parameters'], ''),
          arguments: this.extractStr(s['arguments'], ''),
          input: {
            content: this.extractStr(s['input']?.['content'] ?? '', ''),
            type: this.extractStr(s['input']?.['type'] ?? 'text', 'text')
          },
          output: {
            content: this.extractStr(s['output']?.['content'] ?? '', ''),
            type: this.extractStr(s['output']?.['type'] ?? 'text', 'text')
          }
        }))
      }))

      this.tasks = this.parseArraySection(recipe['tasks'], (t: ParsedSection) => ({
        id: this.extractStr(t['id'], ''),
        type: this.extractStr(t['type'], 'create'),
        resource: this.extractStr(t['resource'], ''),
        ref: this.extractStr(t['ref'], ''),
        depends_on: this.extractStrArray(t['depends_on']),
        pipeline_ref: this.extractStr(t['pipeline_ref'], ''),
        pipeline_id: this.extractStr(t['pipeline_id'], ''),
        pipeline_name: this.extractStr(t['pipeline_name'], ''),
        project: this.extractStr(t['project'], ''),
        repeat: this.extractStr(t['repeat'], ''),
        retry: {
          max_attempts: this.extractStr(t['retry']?.['max_attempts'] ?? '', '0'),
          delay_seconds: this.extractStr(t['retry']?.['delay_seconds'] ?? '', '5'),
          on_status: this.extractStrArray(t['retry']?.['on_status'])
        },
        loop: {
          condition: this.extractStr(t['loop']?.['condition'] ?? '', 'always'),
          max_iterations: this.extractStr(t['loop']?.['max_iterations'] ?? '', ''),
          delay_seconds: this.extractStr(t['loop']?.['delay_seconds'] ?? '', '')
        },
        wait: t['wait'] === true || t['wait'] === 'true',
        stop_on_failure: t['stop_on_failure'] !== false && t['stop_on_failure'] !== 'false'
      }))

      this.expandedPipelines.clear()
      this.expandedTasks.clear()
    } catch {
      this.resetFormData()
    }
  }

  private parseYamlSimple(yaml: string): ParsedSection {
    const result: ParsedSection = {}
    const stack: { indent: number; obj: any; key: string }[] = []
    let currentObj = result
    let currentKey = ''
    let currentIndent = -1
    let isArray = false
    let arrayKey = ''

    const lines = yaml.split('\n')
    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue

      const indent = line.search(/\S/)
      const trimmed = line.trim()

      while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
        stack.pop()
      }

      if (stack.length > 0) {
        currentObj = stack[stack.length - 1].obj
        currentKey = stack[stack.length - 1].key
      } else {
        currentObj = result
      }

      if (trimmed.startsWith('- ')) {
        const value = trimmed.substring(2).trim()
        if (stack.length > 0) {
          const parentObj = stack[stack.length - 1].obj
          const parentKey = stack[stack.length - 1].key
          if (!Array.isArray(parentObj[parentKey])) {
            parentObj[parentKey] = []
          }
          if (value.includes(': ')) {
            const inlineObj = this.parseInlineObject(value)
            parentObj[parentKey].push(inlineObj)
            stack.push({ indent: indent + 2, obj: inlineObj, key: '' })
          } else if (value.includes(':')) {
            const colonIdx = value.indexOf(':')
            const k = value.substring(0, colonIdx).trim()
            const inlineObj: ParsedSection = {}
            parentObj[parentKey].push(inlineObj)
            stack.push({ indent: indent + 2, obj: inlineObj, key: k })
            isArray = true
            arrayKey = parentKey
          } else {
            const strVal = this.unquote(value)
            parentObj[parentKey].push(strVal)
          }
        }
        continue
      }

      const colonIdx = trimmed.indexOf(':')
      if (colonIdx === -1) continue

      const key = trimmed.substring(0, colonIdx).trim()
      const valuePart = trimmed.substring(colonIdx + 1).trim()

      if (valuePart === '' || valuePart === '|' || valuePart === '>') {
        if (!currentObj[key]) {
          currentObj[key] = {}
        }
        stack.push({ indent: indent, obj: currentObj, key: key })
        currentObj = currentObj[key] as ParsedSection
        currentKey = key
        isArray = false
      } else {
        currentObj[key] = this.unquote(valuePart)
      }
    }

    return result
  }

  private parseInlineObject(str: string): ParsedSection {
    const obj: ParsedSection = {}
    const parts = str.split(', ')
    for (const part of parts) {
      const colonIdx = part.indexOf(':')
      if (colonIdx > 0) {
        const k = part.substring(0, colonIdx).trim()
        const v = part.substring(colonIdx + 1).trim()
        obj[k] = this.unquote(v)
      }
    }
    if (Object.keys(obj).length === 0) {
      const colonIdx = str.indexOf(':')
      if (colonIdx > 0) {
        const k = str.substring(0, colonIdx).trim()
        const v = str.substring(colonIdx + 1).trim()
        obj[k] = this.unquote(v)
      }
    }
    return obj
  }

  private unquote(val: string): any {
    if (!val) return val
    const trimmed = val.trim()
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.substring(1, trimmed.length - 1)
    }
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    if (trimmed === 'null' || trimmed === '~') return null
    return trimmed
  }

  private extractStr(val: any, def: string): string {
    if (val === null || val === undefined) return def
    return String(val)
  }

  private extractNum(val: any, def: number): number {
    if (val === null || val === undefined) return def
    const n = Number(val)
    return isNaN(n) ? def : n
  }

  private extractStrArray(val: any): string[] {
    if (!val) return []
    if (Array.isArray(val)) return val.map((v: any) => this.unquote(String(v)))
    return []
  }

  private parseKeyValueSection(section: any): KeyValue[] {
    if (!section || typeof section !== 'object' || Array.isArray(section)) return []
    return Object.entries(section).map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? '' : String(value)
    }))
  }

  private parseArraySection<T>(section: any, mapper: (item: ParsedSection) => T): T[] {
    if (!section || !Array.isArray(section)) return []
    return section.map((item: any) => mapper(item as ParsedSection))
  }

  formToYaml(): string {
    let yaml = 'recipe:\n'
    yaml += `  name: "${this.recipeName}"\n`
    if (this.recipeVersion) yaml += `  version: "${this.recipeVersion}"\n`
    if (this.recipeDescription) yaml += `  description: "${this.recipeDescription}"\n`

    if (this.parameters.length > 0) {
      yaml += '\nparameters:\n'
      for (const param of this.parameters) {
        if (param.key.trim()) {
          yaml += `  ${param.key}: ${this.yamlValue(param.value)}\n`
        }
      }
    }

    if (this.envVars.length > 0) {
      yaml += '\nenv:\n'
      for (const env of this.envVars) {
        if (env.key.trim()) {
          yaml += `  ${env.key}: ${this.yamlValue(env.value)}\n`
        }
      }
    }

    if (this.targets.length > 0) {
      yaml += '\ntargets:\n'
      for (const t of this.targets) {
        if (!t.name.trim()) continue
        yaml += `  - name: "${t.name}"\n`
        if (t.agents_path) yaml += `    agents_path: "${t.agents_path}"\n`
        if (t.scripts_path) yaml += `    scripts_path: "${t.scripts_path}"\n`
        if (t.cli) yaml += `    cli: "${t.cli}"\n`
      }
    }

    if (this.agents.length > 0) {
      yaml += '\nagents:\n'
      for (const a of this.agents) {
        if (!a.id.trim()) continue
        yaml += `  - id: "${a.id}"\n`
        if (a.name) yaml += `    name: "${a.name}"\n`
        if (a.namespace) yaml += `    namespace: "${a.namespace}"\n`
        if (a.category) yaml += `    category: "${a.category}"\n`
        if (a.description) yaml += `    description: "${a.description}"\n`
        if (a.prompt) yaml += `    prompt: "${a.prompt}"\n`
        if (a.path) yaml += `    path: "${a.path}"\n`
      }
    }

    if (this.scripts.length > 0) {
      yaml += '\nscripts:\n'
      for (const s of this.scripts) {
        if (!s.id.trim()) continue
        yaml += `  - id: "${s.id}"\n`
        if (s.name) yaml += `    name: "${s.name}"\n`
        if (s.namespace) yaml += `    namespace: "${s.namespace}"\n`
        if (s.category) yaml += `    category: "${s.category}"\n`
        if (s.description) yaml += `    description: "${s.description}"\n`
        if (s.content) yaml += `    content: "${s.content}"\n`
        if (s.scope) yaml += `    scope: "${s.scope}"\n`
        if (s.path) yaml += `    path: "${s.path}"\n`
      }
    }

    if (this.projects.length > 0) {
      yaml += '\nprojects:\n'
      for (const p of this.projects) {
        if (!p.id.trim()) continue
        yaml += `  - id: "${p.id}"\n`
        if (p.name) yaml += `    name: "${p.name}"\n`
        if (p.description) yaml += `    description: "${p.description}"\n`
        if (p.path) yaml += `    path: "${p.path}"\n`
        if (p.target) yaml += `    target: "${p.target}"\n`
        if (p.status) yaml += `    status: "${p.status}"\n`
        if (p.readme) yaml += `    readme: "${p.readme}"\n`
        if (p.agents.length > 0) {
          yaml += '    agents:\n'
          for (const a of p.agents) yaml += `      - "${a}"\n`
        }
        if (p.scripts.length > 0) {
          yaml += '    scripts:\n'
          for (const s of p.scripts) yaml += `      - "${s}"\n`
        }
      }
    }

    if (this.templates.length > 0) {
      yaml += '\ntemplates:\n'
      for (const t of this.templates) {
        if (!t.id.trim()) continue
        yaml += `  - id: "${t.id}"\n`
        if (t.name) yaml += `    name: "${t.name}"\n`
        if (t.type) yaml += `    type: "${t.type}"\n`
        if (t.description) yaml += `    description: "${t.description}"\n`
        if (t.template) yaml += `    template: "${t.template}"\n`
      }
    }

    if (this.pipelines.length > 0) {
      yaml += '\npipelines:\n'
      for (const p of this.pipelines) {
        if (!p.id.trim()) continue
        yaml += `  - id: "${p.id}"\n`
        if (p.project) yaml += `    project: "${p.project}"\n`
        if (p.name) yaml += `    name: "${p.name}"\n`
        if (p.description) yaml += `    description: "${p.description}"\n`
        if (p.type) yaml += `    type: "${p.type}"\n`
        if (p.output_extension) yaml += `    output_extension: "${p.output_extension}"\n`
        if (p.steps.length > 0) {
          yaml += '    steps:\n'
          for (const s of p.steps) {
            yaml += `      - order: ${s.order}\n`
            if (s.agent) yaml += `        agent: "${s.agent}"\n`
            if (s.script) yaml += `        script: "${s.script}"\n`
            if (s.prompt) yaml += `        prompt: "${s.prompt}"\n`
            if (s.type) yaml += `        type: "${s.type}"\n`
            if (s.runtime) yaml += `        runtime: "${s.runtime}"\n`
            if (s.cli) yaml += `        cli: "${s.cli}"\n`
            if (s.parameters) yaml += `        parameters: "${s.parameters}"\n`
            if (s.arguments) yaml += `        arguments: "${s.arguments}"\n`
            if (s.input.content || s.input.type !== 'text') {
              yaml += `        input:\n`
              yaml += `          content: "${s.input.content}"\n`
              yaml += `          type: "${s.input.type}"\n`
            }
            if (s.output.content || s.output.type !== 'text') {
              yaml += `        output:\n`
              yaml += `          content: "${s.output.content}"\n`
              yaml += `          type: "${s.output.type}"\n`
            }
          }
        }
      }
    }

    if (this.tasks.length > 0) {
      yaml += '\ntasks:\n'
      for (const t of this.tasks) {
        if (!t.id.trim()) continue
        yaml += `  - id: "${t.id}"\n`
        if (t.type) yaml += `    type: "${t.type}"\n`
        if (t.resource) yaml += `    resource: "${t.resource}"\n`
        if (t.ref) yaml += `    ref: "${t.ref}"\n`
        if (t.depends_on.length > 0) {
          yaml += '    depends_on:\n'
          for (const d of t.depends_on) yaml += `      - "${d}"\n`
        }
        if (t.pipeline_ref) yaml += `    pipeline_ref: "${t.pipeline_ref}"\n`
        if (t.pipeline_id) yaml += `    pipeline_id: "${t.pipeline_id}"\n`
        if (t.pipeline_name) yaml += `    pipeline_name: "${t.pipeline_name}"\n`
        if (t.project) yaml += `    project: "${t.project}"\n`
        if (t.repeat) yaml += `    repeat: ${this.yamlValue(t.repeat)}\n`
        if (t.retry && (t.retry.max_attempts !== '0' || t.retry.delay_seconds !== '5' || t.retry.on_status.length > 0)) {
          yaml += '    retry:\n'
          yaml += `      max_attempts: ${this.yamlValue(t.retry.max_attempts)}\n`
          yaml += `      delay_seconds: ${this.yamlValue(t.retry.delay_seconds)}\n`
          if (t.retry.on_status.length > 0) {
            yaml += '      on_status:\n'
            for (const s of t.retry.on_status) yaml += `        - "${s}"\n`
          }
        }
        if (t.loop && (t.loop.condition || t.loop.max_iterations || t.loop.delay_seconds)) {
          yaml += '    loop:\n'
          if (t.loop.condition) yaml += `      condition: "${t.loop.condition}"\n`
          if (t.loop.max_iterations) yaml += `      max_iterations: ${this.yamlValue(t.loop.max_iterations)}\n`
          if (t.loop.delay_seconds) yaml += `      delay_seconds: ${this.yamlValue(t.loop.delay_seconds)}\n`
        }
        yaml += `    wait: ${t.wait}\n`
        yaml += `    stop_on_failure: ${t.stop_on_failure}\n`
      }
    }

    return yaml
  }

  private yamlValue(val: string): string {
    if (val === '' || val === null || val === undefined) return '""'
    const needsQuotes = isNaN(Number(val)) && val !== 'true' && val !== 'false'
    return needsQuotes ? `"${val}"` : val
  }

  resetFormData(): void {
    this.recipeName = ''
    this.recipeVersion = '1.0'
    this.recipeDescription = ''
    this.parameters = []
    this.envVars = []
    this.targets = []
    this.projects = []
    this.agents = []
    this.scripts = []
    this.templates = []
    this.pipelines = []
    this.tasks = []
  }

  addParameter(): void {
    this.parameters.push({ key: '', value: '' })
  }

  removeParameter(index: number): void {
    this.parameters.splice(index, 1)
  }

  addEnvVar(): void {
    this.envVars.push({ key: '', value: '' })
  }

  removeEnvVar(index: number): void {
    this.envVars.splice(index, 1)
  }

  addTarget(): void {
    this.targets.push({ name: '', agents_path: '', scripts_path: '', cli: 'opencode' })
  }

  removeTarget(index: number): void {
    this.targets.splice(index, 1)
  }

  addProject(): void {
    this.projects.push({
      id: '', name: '', description: '', path: '', target: '',
      status: 'active', readme: '', agents: [], scripts: []
    })
  }

  removeProject(index: number): void {
    this.projects.splice(index, 1)
  }

  addProjectAgent(projIndex: number): void {
    this.projects[projIndex].agents.push('')
  }

  removeProjectAgent(projIndex: number, agentIndex: number): void {
    this.projects[projIndex].agents.splice(agentIndex, 1)
  }

  addProjectScript(projIndex: number): void {
    this.projects[projIndex].scripts.push('')
  }

  removeProjectScript(projIndex: number, scriptIndex: number): void {
    this.projects[projIndex].scripts.splice(scriptIndex, 1)
  }

  addAgent(): void {
    this.agents.push({ id: '', name: '', namespace: '', category: '', description: '', prompt: '', path: '' })
  }

  removeAgent(index: number): void {
    this.agents.splice(index, 1)
  }

  addScript(): void {
    this.scripts.push({ id: '', name: '', namespace: '', category: '', description: '', content: '', scope: 'global', path: '' })
  }

  removeScript(index: number): void {
    this.scripts.splice(index, 1)
  }

  addTemplate(): void {
    this.templates.push({ id: '', name: '', type: 'agents', description: '', template: '' })
  }

  removeTemplate(index: number): void {
    this.templates.splice(index, 1)
  }

  addPipeline(): void {
    this.pipelines.push({
      id: '', project: '', name: '', description: '', type: 'sequential',
      output_extension: '', steps: []
    })
  }

  removePipeline(index: number): void {
    this.pipelines.splice(index, 1)
    this.expandedPipelines.delete(index)
  }

  addStep(pipelineIndex: number): void {
    const steps = this.pipelines[pipelineIndex].steps
    const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order)) + 1 : 1
    steps.push({
      order: nextOrder, agent: '', script: '', prompt: '', type: '',
      runtime: '', cli: '', parameters: '', arguments: '',
      input: { content: '', type: 'text' },
      output: { content: '', type: 'text' }
    })
    this.expandedPipelines.add(pipelineIndex)
  }

  removeStep(pipelineIndex: number, stepIndex: number): void {
    this.pipelines[pipelineIndex].steps.splice(stepIndex, 1)
  }

  addTask(): void {
    this.tasks.push({
      id: '', type: 'create', resource: '', ref: '',
      depends_on: [], pipeline_ref: '', pipeline_id: '', pipeline_name: '',
      project: '', repeat: '',
      retry: { max_attempts: '0', delay_seconds: '5', on_status: [] },
      loop: { condition: '', max_iterations: '', delay_seconds: '' },
      wait: false, stop_on_failure: true
    })
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1)
    this.expandedTasks.delete(index)
  }

  addTaskDependsOn(taskIndex: number): void {
    this.tasks[taskIndex].depends_on.push('')
  }

  removeTaskDependsOn(taskIndex: number, depIndex: number): void {
    this.tasks[taskIndex].depends_on.splice(depIndex, 1)
  }

  addRetryOnStatus(taskIndex: number): void {
    this.tasks[taskIndex].retry.on_status.push('failed')
  }

  removeRetryOnStatus(taskIndex: number, statusIndex: number): void {
    this.tasks[taskIndex].retry.on_status.splice(statusIndex, 1)
  }

  switchToRaw(): void {
    this.rawYaml = this.formToYaml()
    this.viewMode = 'raw'
  }

  switchToVisual(): void {
    this.yamlContentToForm(this.rawYaml)
    if (this.formRecipeFile.name) this.recipeName = this.formRecipeFile.name
    if (this.formRecipeFile.version) this.recipeVersion = this.formRecipeFile.version
    if (this.formRecipeFile.description) this.recipeDescription = this.formRecipeFile.description ?? ''
    this.viewMode = 'visual'
  }

  saveRecipeFile(): void {
    if (this.viewMode === 'visual') {
      if (!this.recipeName) {
        this.statusMessage = 'Error: Recipe name is required'
        return
      }
      this.rawYaml = this.formToYaml()
    } else {
      if (!this.rawYaml.trim()) {
        this.statusMessage = 'Error: YAML content is required'
        return
      }
      this.yamlContentToForm(this.rawYaml)
    }

    const recipeFileData: RecipeFile = {
      name: this.recipeName,
      version: this.recipeVersion,
      description: this.recipeDescription,
      yamlContent: this.viewMode === 'visual' ? this.rawYaml : this.rawYaml
    }

    if (this.formRecipeFile.id) {
      recipeFileData.id = this.formRecipeFile.id
      this.apiService.updateRecipeFile(recipeFileData.id, recipeFileData).subscribe({
        next: (updated) => {
          this.ngZone.run(() => {
            this.statusMessage = `Recipe '${updated.name}' updated successfully`
            this.selectedRecipeFile = { ...updated }
            this.formRecipeFile = { ...updated }
            this.yamlContentToForm(updated.yamlContent)
            if (updated.name) this.recipeName = updated.name
            if (updated.version) this.recipeVersion = updated.version
            if (updated.description) this.recipeDescription = updated.description ?? ''
            this.loadRecipeFiles()
            this.cdr.detectChanges()
          })
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error: ' + (err.error?.error || err.message)
            this.cdr.detectChanges()
          })
        }
      })
    } else {
      this.currentPage = 0
      this.apiService.createRecipeFile(recipeFileData).subscribe({
        next: (created) => {
          this.ngZone.run(() => {
            this.statusMessage = `Recipe '${created.name}' created successfully`
            this.selectedRecipeFile = { ...created }
            this.formRecipeFile = { ...created }
            this.yamlContentToForm(created.yamlContent)
            if (created.name) this.recipeName = created.name
            if (created.version) this.recipeVersion = created.version
            if (created.description) this.recipeDescription = created.description ?? ''
            this.loadRecipeFiles()
            this.cdr.detectChanges()
          })
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error: ' + (err.error?.error || err.message)
            this.cdr.detectChanges()
          })
        }
      })
    }
  }

  deleteRecipeFileInline(recipeFile: RecipeFile, event: Event): void {
    event.stopPropagation()
    if (!recipeFile.id) return

    const recipeName = recipeFile.name
    const recipeId = recipeFile.id

    this.dialog.open(PipelineResultDialogComponent, {
      data: {
        success: false,
        message: `Do you really want to delete the recipe "${recipeName}"?`,
        showConfirm: true,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.deleteRecipeFile(recipeId).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: { success: true, message: `Recipe "${recipeName}" deleted successfully!` }
              }).afterClosed().subscribe(() => {
                setTimeout(() => {
                  if (this.selectedRecipeFile?.id === recipeId) {
                    this.clearForm()
                  }
                  this.loadRecipeFiles()
                }, 0)
              })
            })
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.dialog.open(PipelineResultDialogComponent, {
                data: { success: false, message: err.error?.message || err.message || 'Failed to delete recipe.' }
              })
            })
          }
        })
      }
    })
  }

  clearForm(): void {
    this.selectedRecipeFile = null
    this.formRecipeFile = this.getEmptyRecipeFile()
    this.resetFormData()
    this.rawYaml = ''
    this.viewMode = 'visual'
    this.expandedPipelines.clear()
    this.expandedTasks.clear()
    this.statusMessage = 'Form cleared - ready for new recipe'
  }

  async copyToClipboard(text: string): Promise<void> {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      this.statusMessage = 'YAML copied to clipboard'
      setTimeout(() => this.statusMessage = '', 3000)
    } catch {
      this.statusMessage = 'Failed to copy to clipboard'
    }
  }

  async copyYamlAsJson(): Promise<void> {
    let yamlContent = ''
    if (this.viewMode === 'visual') {
      yamlContent = this.formToYaml()
    } else {
      yamlContent = this.rawYaml
    }

    if (!yamlContent) return

    try {
      const parsed = this.parseYamlSimple(yamlContent)
      let recipe = parsed['recipe'] || {}
      if (!recipe || Object.keys(recipe).length === 0) {
        recipe = parsed
      }

      const jsonPayload = {
        name: this.recipeName || recipe['name'] || '',
        version: this.recipeVersion || recipe['version'] || '1.0',
        description: this.recipeDescription || recipe['description'] || '',
        yamlContent: yamlContent
      }

      await navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2))
      this.statusMessage = 'JSON (API format) copied to clipboard'
      setTimeout(() => this.statusMessage = '', 3000)
    } catch {
      this.statusMessage = 'Failed to convert to JSON'
    }
  }

  getStatusClass(): string {
    if (!this.statusMessage) return ''
    if (this.statusMessage.includes('Error')) return 'error'
    if (this.statusMessage.includes('success') || this.statusMessage.includes('updated') ||
      this.statusMessage.includes('created') || this.statusMessage.includes('deleted') ||
      this.statusMessage.includes('copied')) return 'success'
    return 'info'
  }

  getSectionCount(section: string): number {
    switch (section) {
      case 'parameters': return this.parameters.length
      case 'env': return this.envVars.length
      case 'targets': return this.targets.length
      case 'projects': return this.projects.length
      case 'agents': return this.agents.length
      case 'scripts': return this.scripts.length
      case 'templates': return this.templates.length
      case 'pipelines': return this.pipelines.length
      case 'tasks': return this.tasks.length
      default: return 0
    }
  }

  private extractNameFromYaml(yaml: string): string {
    const match = yaml.match(/name:\s*["']?(.*?)["']?\s*\n/)
    return match ? match[1] : 'unnamed-recipe'
  }

  private extractVersionFromYaml(yaml: string): string {
    const match = yaml.match(/version:\s*["']?(.*?)["']?\s*\n/)
    return match ? match[1] : '1.0'
  }

  private extractDescriptionFromYaml(yaml: string): string {
    const match = yaml.match(/description:\s*["']?(.*?)["']?\s*\n/)
    return match ? match[1] : ''
  }
}
