# Recipe Engine - User Guide

A Recipe is a declarative YAML file that automates the creation and execution of resources in Agentic. With a single `.yml` file you can create projects, agents, scripts, pipelines, targets, and templates, then run, stop, or call pipelines in a coordinated workflow.

---

## Table of Contents

- [What is a Recipe?](#what-is-a-recipe)
- [How to Use a Recipe](#how-to-use-a-recipe)
- [How to Write a recipe.yml](#how-to-write-a-recipeyml)
  - [Recipe Header](#recipe-header)
  - [Parameters](#parameters)
  - [Environment Variables](#environment-variables)
  - [Project Path](#project-path)
  - [Declarable Resources](#declarable-resources)
  - [Tasks](#tasks)
  - [Dependencies](#dependencies-depends_on)
  - [Retry](#retry)
  - [Loop](#loop)
  - [Placeholder Resolution](#placeholder-resolution)
- [Full Template Example](#full-template-example)
- [Minimal Example](#minimal-example)
- [MCP Tools Reference](#mcp-tools-reference)
- [REST API Reference](#rest-api-reference)
- [Validation Rules](#validation-rules)
- [Execution Behavior](#execution-behavior)
- [Troubleshooting](#troubleshooting)

---

## What is a Recipe?

A recipe is a `.yml` (or `.yaml`) file that describes:

1. **Resources** to create (projects, agents, scripts, pipelines, targets, templates)
2. **Tasks** to execute (create, run, stop, call) in a specific order
3. **Dependencies** between tasks so they run in the right sequence

Recipes are idempotent. If an agent or project already exists with the same name and namespace, the engine reuses it instead of creating a duplicate.

---

## How to Use a Recipe

There are three ways to execute a recipe:

### 1. MCP Tools (AI Assistant)

If you have an AI assistant connected via MCP (opencode, Cursor, Claude Desktop, etc.):

```
@execute_recipe_from_path path="C:/projects/my-recipe.yml"
```

```
@execute_recipe yaml="recipe:\n  name: My Recipe\n  version: '1.0'\ntasks:\n  ..."
```

### 2. REST API (curl / HTTP client)

**From YAML content:**

```bash
curl -X POST http://localhost:1488/api/recipes/execute \
  -H "Content-Type: application/json" \
  -d '{"yaml": "recipe:\n  name: Test\n  version: \"1.0\"\ntasks:\n  - id: t1\n    type: create\n    resource: agent\n    ref: agent1", "parameters": {"agent_name": "my-agent"}}'
```

**From file path:**

```bash
curl -X POST http://localhost:1488/api/recipes/execute-from-path \
  -H "Content-Type: application/json" \
  -d '{"path": "C:/projects/my-recipe.yml"}'
```

**Raw YAML body:**

```bash
curl -X POST "http://localhost:1488/api/recipes/execute-raw" \
  -H "Content-Type: text/yaml" \
  --data-binary @my-recipe.yml
```

### 3. Angular UI

Navigate to the Recipe screen in the Agentic desktop application.

---

## How to Write a recipe.yml

### Recipe Header

Required. Every recipe starts with a `recipe` block.

```yaml
recipe:
  name: "My Automation Recipe"
  version: "1.0"
  description: "Creates an agent and runs a pipeline"
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | **Yes** | Recipe name (must not be empty) |
| `version` | No | Version string |
| `description` | No | Human-readable description |

---

### Parameters

Optional. Define default values that can be overridden at execution time. Use `{{param:KEY}}` placeholders anywhere in the recipe.

```yaml
parameters:
  project_name: "default-project"
  agent_name: "default-agent"
  namespace: "production"
```

Override at execution:

```bash
# Via REST API
{"yaml": "...", "parameters": {"project_name": "custom-project"}}

# Via MCP
@execute_recipe_from_path path="recipe.yml" parameters={"project_name": "custom-project"}
```

---

### Environment Variables

Optional. Define environment-specific values. Resolved via `{{env:VAR}}` placeholders.

```yaml
env:
  API_KEY: "my-api-key"
  DEPLOY_ENV: "staging"
```

If a variable is not in the `env` block, the resolver falls back to the system environment variable (`System.getenv`).

---

### Project Path

Optional. Sets a base directory for the recipe. All relative project paths resolve against this.

```yaml
project_path: "/opt/agentic/workspace"
```

If the directory does not exist, it will be created automatically.

---

### Declarable Resources

Resources are declared in top-level sections and referenced by `id` in tasks.

#### Targets

Define execution targets (CLI and resource paths).

```yaml
targets:
  - name: "local"
    agents_path: "./agents"
    scripts_path: "./scripts"
    cli: "bash"
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | **Yes** | Unique target name (used as reference) |
| `agents_path` | No | Path to agents directory |
| `scripts_path` | No | Path to scripts directory |
| `cli` | No | Default CLI command (`bash`, `opencode`, `copilot`, `custom`) |

#### Agents

```yaml
agents:
  - id: "my-agent"
    name: "{{param:agent_name}}"
    namespace: "{{param:namespace}}"
    category: "general"
    description: "A helpful assistant"
    prompt: "You are a helpful assistant. Process the input and respond."
    path: "./agents/my-agent"
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **Yes** | Unique reference ID within the recipe |
| `name` | **Yes** | Agent display name |
| `namespace` | No | Agent namespace |
| `category` | No | Agent category |
| `description` | No | Agent description |
| `prompt` | No | System prompt for the agent |
| `path` | No | Agent file path |

#### Scripts

```yaml
scripts:
  - id: "my-script"
    name: "{{param:script_name}}"
    namespace: "{{param:namespace}}"
    category: "utility"
    description: "A build script"
    content: |
      #!/bin/bash
      echo "Building project..."
    scope: "global"
    path: "./scripts/build.sh"
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **Yes** | Unique reference ID within the recipe |
| `name` | **Yes** | Script display name |
| `namespace` | No | Script namespace |
| `category` | No | Script category |
| `description` | No | Script description |
| `content` | No | Script content (inline) |
| `scope` | No | `global` or `project` |
| `path` | No | Script file path |

#### Projects

```yaml
projects:
  - id: "my-project"
    name: "{{param:project_name}}"
    description: "My automated project"
    path: "/tmp/{{param:project_name}}"
    target: "local"
    status: "active"
    readme: "# My Project"
    agents:
      - "my-agent"
    scripts:
      - "my-script"
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **Yes** | Unique reference ID within the recipe |
| `name` | **Yes** | Project display name |
| `description` | No | Project description |
| `path` | No | Project directory path (falls back to `project_path`) |
| `target` | No | Target name to link |
| `status` | No | `active` (default), `completed`, `archived` |
| `readme` | No | README content |
| `agents` | No | List of agent IDs or refs to associate |
| `scripts` | No | List of script IDs or refs to associate |

#### Pipelines

```yaml
pipelines:
  - id: "my-pipeline"
    name: "Build Pipeline"
    project: "my-project"
    description: "Build and test"
    type: "sequential"
    output_extension: ".txt"
    steps:
      - order: 1
        agent: "my-agent"
        prompt: "Review the code and provide feedback."
        type: "agent"
      - order: 2
        script: "my-script"
        type: "script"
        runtime: "bash"
      - order: 3
        prompt: "Generate a summary report."
        type: "agent"
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **Yes** | Unique reference ID within the recipe |
| `project` | **Yes** | Reference to a project ID declared above |
| `name` | **Yes** | Pipeline display name |
| `description` | No | Pipeline description |
| `type` | No | `sequential` (default) |
| `output_extension` | No | File extension for output |
| `steps` | No | List of pipeline steps |

**Step fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `order` | No | Step execution order (1, 2, 3...) |
| `agent` | No* | Agent ID or ref (for agent steps) |
| `script` | No* | Script ID or ref (for script steps) |
| `prompt` | No | Override prompt (takes precedence over agent's default prompt) |
| `type` | No | `agent` or `script` |
| `runtime` | No | `bash`, `cmd`, `node`, `java`, `py`, `custom` |
| `cli` | No | `opencode`, `copilot`, `custom` |
| `parameters` | No | Step parameters |
| `arguments` | No | Step arguments |
| `input` | No | Input block (`content`, `type`) |
| `output` | No | Output block (`content`, `type`) |

\* At least one of `agent` or `script` should be specified, unless using `prompt` as a standalone step.

#### Templates

```yaml
templates:
  - id: "my-template"
    name: "Code Review Template"
    type: "agents"
    description: "Template for code review agents"
    template: "You are a code reviewer. Analyze the following code..."
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **Yes** | Unique reference ID within the recipe |
| `name` | **Yes** | Template display name |
| `type` | No | `agents`, `skills`, `commands`, `scripts` |
| `description` | No | Template description |
| `template` | No | Template content |

---

### Tasks

Tasks are the execution instructions. They are the only **required** section besides the recipe header.

```yaml
tasks:
  - id: "create-agent"
    type: "create"
    resource: "agent"
    ref: "my-agent"

  - id: "create-pipeline"
    type: "create"
    resource: "pipeline"
    ref: "my-pipeline"
    depends_on:
      - "create-agent"

  - id: "run-pipeline"
    type: "run"
    pipeline_ref: "my-pipeline"
    wait: true
    depends_on:
      - "create-pipeline"
```

#### Task Types

| Type | Description | Key Fields |
|------|-------------|------------|
| `create` | Creates a resource declared above | `resource`, `ref` |
| `run` | Runs a pipeline | `pipeline_ref`, `pipeline_id`, or `pipeline_name`, `wait`, `repeat`, `loop` |
| `stop` | Stops a running pipeline | `pipeline_ref`, `pipeline_id`, or `pipeline_name` |
| `call` | Calls (runs) an existing pipeline by name | `pipeline_ref`, `pipeline_name`, `wait` |

#### Task Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **Yes** | Unique task identifier (used for `depends_on` and result tracking) |
| `type` | **Yes** | `create`, `run`, `stop`, or `call` |
| `resource` | Yes for `create` | `project`, `agent`, `script`, `pipeline`, `target`, `template` |
| `ref` | Yes for `create` | ID of the declared resource to create |
| `depends_on` | No | List of task IDs that must complete before this task runs |
| `pipeline_ref` | For `run`/`stop`/`call` | Reference to a pipeline ID declared in `pipelines` |
| `pipeline_id` | No | Direct database ID of an existing pipeline |
| `pipeline_name` | No | Name of an existing pipeline to find by name |
| `wait` | No | `true` = wait for pipeline to finish before proceeding (default: `false`) |
| `repeat` | No | Run the pipeline N times sequentially (default: `1`) |
| `retry` | No | Retry configuration block |
| `loop` | No | Loop configuration block |
| `stop_on_failure` | No | `true` = abort all remaining tasks if this one fails |

---

### Dependencies (`depends_on`)

Tasks run in topological order based on `depends_on`. The engine:

1. Builds a directed acyclic graph (DAG) from dependencies
2. Performs topological sort to determine execution order
3. Runs tasks sequentially respecting the order
4. If a dependency **failed**, the dependent task is **skipped**
5. If a dependency **did not complete**, the dependent task is **skipped**

```yaml
tasks:
  - id: "step-1"
    type: "create"
    resource: "agent"
    ref: "my-agent"

  - id: "step-2"
    type: "create"
    resource: "project"
    ref: "my-project"
    depends_on:
      - "step-1"

  - id: "step-3"
    type: "run"
    pipeline_ref: "my-pipeline"
    wait: true
    depends_on:
      - "step-2"
```

---

### Retry

Retry a failed task automatically.

```yaml
tasks:
  - id: "run-with-retry"
    type: "run"
    pipeline_ref: "my-pipeline"
    retry:
      max_attempts: 3
      delay_seconds: 5
```

| Field | Default | Description |
|-------|---------|-------------|
| `max_attempts` | `1` (no retry) | Maximum number of attempts (including the first) |
| `delay_seconds` | `0` | Seconds to wait between attempts |
| `on_status` | _(unused in current impl)_ | Reserved for future: statuses that trigger retry |

---

### Loop

Run a pipeline repeatedly with a condition.

```yaml
tasks:
  - id: "retry-until-success"
    type: "run"
    pipeline_ref: "my-pipeline"
    loop:
      condition: "until_success"
      max_iterations: 5
      delay_seconds: 10
```

| Field | Default | Description |
|-------|---------|-------------|
| `condition` | `always` | `always` (run all iterations), `until_success` (stop on first completed), `until_failure` (stop on first failed) |
| `max_iterations` | `10` | Maximum number of loop iterations |
| `delay_seconds` | `0` | Seconds to wait between iterations |

**Loop behavior:**

- `always`: runs `max_iterations` times regardless of outcome
- `until_success`: stops as soon as the pipeline completes successfully
- `until_failure`: stops as soon as the pipeline fails

When `loop` is defined, it takes precedence over `repeat`.

---

### Placeholder Resolution

Placeholders are resolved in all string values across the entire recipe before execution.

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{param:KEY}}` | From `parameters` map or override params | `{{param:agent_name}}` → `"my-agent"` |
| `{{env:VAR}}` | From `env` block, then system environment | `{{env:HOME}}` → `"/home/user"` |
| `{{file:PATH}}` | Reads file contents from disk | `{{file:/tmp/prompt.txt}}` → file contents |
| `{{task:TASK_ID:result}}` | DB entity ID from a completed task | `{{task:create-agent:result}}` → `42` |

**Resolution order:** `param` → `env` → `file` → `task`

If a placeholder cannot be resolved, it is replaced with a marker like `{{param:X}} (not found)`.

**Example with `{{file:...}}`:**

```yaml
agents:
  - id: "reviewer"
    name: "Code Reviewer"
    prompt: "{{file:/prompts/code-review.txt}}"
```

---

## Full Template Example

This example uses every available feature:

```yaml
recipe:
  name: "full-example"
  version: "1.0"
  description: "Complete recipe demonstrating all features"

parameters:
  project_name: "demo-project"
  agent_name: "demo-agent"
  script_name: "demo-script"
  pipeline_name: "demo-pipeline"
  namespace: "default"

project_path: "/opt/agentic/workspace"

targets:
  - name: "local"
    agents_path: "./agents"
    scripts_path: "./scripts"
    cli: "bash"

agents:
  - id: "demo-agent"
    name: "{{param:agent_name}}"
    namespace: "{{param:namespace}}"
    category: "general"
    description: "Demo agent created by recipe"
    prompt: "You are a helpful assistant. Process the input and provide a response."

scripts:
  - id: "demo-script"
    name: "{{param:script_name}}"
    namespace: "{{param:namespace}}"
    category: "utility"
    description: "Demo script created by recipe"
    content: |
      #!/bin/bash
      echo "Hello from recipe script"
    scope: "global"

projects:
  - id: "demo-project"
    name: "{{param:project_name}}"
    description: "Demo project created by recipe"
    path: "/tmp/{{param:project_name}}"
    target: "local"
    agents:
      - "demo-agent"
    scripts:
      - "demo-script"

pipelines:
  - id: "demo-pipeline"
    name: "{{param:pipeline_name}}"
    project: "demo-project"
    description: "Demo pipeline created by recipe"
    type: "sequential"
    steps:
      - order: 1
        agent: "demo-agent"
        prompt: "Process the following input and provide a summary."
        type: "agent"
      - order: 2
        script: "demo-script"
        type: "script"
        runtime: "bash"

templates:
  - id: "demo-template"
    name: "Demo Template"
    type: "agents"
    description: "A demo template"
    template: "You are a demo agent."

tasks:
  - id: "create-target"
    type: "create"
    resource: "target"
    ref: "local"

  - id: "create-agent"
    type: "create"
    resource: "agent"
    ref: "demo-agent"
    depends_on:
      - "create-target"

  - id: "create-script"
    type: "create"
    resource: "script"
    ref: "demo-script"

  - id: "create-project"
    type: "create"
    resource: "project"
    ref: "demo-project"
    depends_on:
      - "create-agent"
      - "create-script"

  - id: "create-pipeline"
    type: "create"
    resource: "pipeline"
    ref: "demo-pipeline"
    depends_on:
      - "create-project"

  - id: "run-pipeline"
    type: "run"
    pipeline_ref: "demo-pipeline"
    wait: true
    retry:
      max_attempts: 3
      delay_seconds: 5
    depends_on:
      - "create-pipeline"

  - id: "loop-pipeline"
    type: "run"
    pipeline_ref: "demo-pipeline"
    loop:
      condition: "until_success"
      max_iterations: 5
      delay_seconds: 10
    depends_on:
      - "run-pipeline"
```

---

## Minimal Example

The smallest valid recipe:

```yaml
recipe:
  name: "Minimal Recipe"
  version: "1.0"

agents:
  - id: "agent1"
    name: "Test Agent"
    prompt: "You are a test agent."

tasks:
  - id: "t1"
    type: "create"
    resource: "agent"
    ref: "agent1"
```

---

## MCP Tools Reference

The Recipe MCP tools are available when the MCP server is enabled (`mcp.enabled=true`, default).

| Tool | Description | Parameters |
|------|-------------|------------|
| `execute_recipe` | Execute a recipe from inline YAML content | **yaml** (string), parameters (object, optional) |
| `execute_recipe_from_path` | Execute a recipe from a file path | **path** (string), parameters (object, optional) |
| `validate_recipe` | Validate recipe YAML without executing | **yaml** (string) |
| `list_recipes` | List the 20 most recent recipe executions | _(none)_ |
| `get_recipe` | Get details of a recipe execution with task results | **id** (integer) |
| `stop_recipe` | Stop a running recipe execution | **id** (integer) |

### MCP Usage Examples

**Execute from file:**

```
@execute_recipe_from_path path="C:/projects/recipes/deploy.yml" parameters={"namespace": "staging"}
```

**Execute inline YAML:**

```
@execute_recipe yaml="recipe:\n  name: Quick Setup\n  version: '1.0'\nagents:\n  - id: a1\n    name: Setup Agent\n    prompt: Setup the environment\ntasks:\n  - id: t1\n    type: create\n    resource: agent\n    ref: a1"
```

**Validate before executing:**

```
@validate_recipe yaml="recipe:\n  name: Test\n  version: '1.0'\ntasks:\n  - id: t1\n    type: create\n    resource: agent\n    ref: missing-agent"
```

Returns: `Validation failed: Task 't1' ref 'missing-agent' not found in declared agents`

**Check execution status:**

```
@list_recipes
```

```
@get_recipe id=1
```

**Stop a running recipe:**

```
@stop_recipe id=3
```

---

## REST API Reference

All endpoints are under `/api/recipes`.

| Method | Endpoint | Description | Body / Params |
|--------|----------|-------------|---------------|
| `POST` | `/api/recipes/execute` | Execute from YAML content | `{ "yaml": "...", "parameters": {...} }` |
| `POST` | `/api/recipes/execute-from-path` | Execute from file path | `{ "path": "/path/to/recipe.yml", "parameters": {...} }` |
| `POST` | `/api/recipes/execute-raw` | Execute from raw YAML body | Raw YAML body, `?parameters={...}` (query param) |
| `POST` | `/api/recipes/validate` | Validate without executing | `{ "yaml": "..." }` |
| `GET` | `/api/recipes` | List 20 most recent recipes | _(none)_ |
| `GET` | `/api/recipes/{id}` | Get recipe by ID | _(none)_ |
| `GET` | `/api/recipes/{id}/tasks` | Get task results for a recipe | _(none)_ |
| `DELETE` | `/api/recipes/{id}` | Delete a recipe | _(none)_ |
| `POST` | `/api/recipes/{id}/stop` | Stop a running recipe | _(none)_ |

---

## Validation Rules

The engine validates the recipe before execution. A recipe is **invalid** if:

| Rule | Error Message |
|------|---------------|
| `recipe.name` is missing or empty | `Required field 'recipe.name' is missing` |
| No tasks defined | `At least one task is required in 'tasks'` |
| Task has no `id` | `Each task must have an 'id' field` |
| Duplicate task `id` | `Duplicate task id: X` |
| Invalid task `type` | `Task 'X' has invalid type 'Y'. Valid types: [create, run, stop, call]` |
| Invalid `resource` for create task | `Task 'X' has invalid resource 'Y'. Valid resources: [project, agent, script, pipeline, target, template]` |
| `depends_on` references non-existent task | `Task 'X' depends_on non-existent task: Y` |
| Circular dependency detected | `Circular dependency detected involving task: X` |
| `ref` points to undeclared resource | `Task 'X' ref 'Y' not found in declared Zs` |
| `pipeline_ref` points to undeclared pipeline | `Task 'X' pipeline_ref 'Y' not found in declared pipelines` |

Use `validate_recipe` (MCP) or `POST /api/recipes/validate` (REST) to check a recipe before executing.

---

## Execution Behavior

### Idempotency

If a resource already exists (same name + namespace for agents/scripts, same name for projects/pipelines), the engine **reuses** the existing entity instead of creating a duplicate.

### Task Status Lifecycle

```
pending → running → completed
                  → failed (with retry attempts if configured)
                  → skipped (dependency failed / recipe stopped)
```

### Recipe Status

| Status | Meaning |
|--------|---------|
| `running` | Recipe is executing tasks |
| `completed` | All tasks finished successfully |
| `failed` | At least one task failed |
| `stopped` | Recipe was manually stopped |

### Background Execution

Recipes execute in a background thread. The API/MCP call returns immediately with the recipe entity (status = `running`). Use `get_recipe` or `GET /api/recipes/{id}` to check progress.

### Wait Behavior

For `run` and `call` tasks with `wait: true`, the engine polls the pipeline status every 2 seconds until it reaches a terminal state (`completed`, `failed`, `stopped`) or times out after 600 seconds.

### Stop on Failure

When a task has `stop_on_failure: true` and it fails:

1. The failed task is marked as `failed`
2. All remaining `pending` tasks are marked as `skipped`
3. No further tasks execute

### No Rollback

Failed tasks do not roll back previously created resources. If a recipe creates 3 agents and fails on the 4th task, the 3 agents remain in the database.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Required field 'recipe.name' is missing` | Add the `recipe` block with a `name` field |
| `Circular dependency detected` | Remove the cycle in your `depends_on` chains |
| `ref 'X' not found in declared agents` | Make sure the agent `id` in the `agents` section matches the task `ref` |
| `Cannot resolve project for pipeline` | Ensure the pipeline's `project` field references a declared project ID |
| `{{param:X}} (not found)` | Add the parameter to the `parameters` section or pass it as an override |
| `{{env:VAR}} (not set)` | Set the variable in the `env` block or as a system environment variable |
| `{{file:PATH}} (error: ...)` | Check that the file path exists and is readable |
| Recipe stays `running` forever | Check if a pipeline is stuck. Use `stop_recipe` to abort |
| Pipeline not found by `pipeline_name` | The pipeline must exist in the database. Create it first or use `pipeline_ref` |
