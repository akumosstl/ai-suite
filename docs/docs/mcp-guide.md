# MCP Server - User Guide

The **Model Context Protocol (MCP)** server allows external AI tools and assistants to interact with Agentic programmatically. Through MCP, an AI assistant can manage your projects, pipelines, agents, scripts, and more.

---

## What is MCP?

MCP is a standard protocol that lets AI applications (like opencode, Cursor, Claude Desktop, and others) connect to external services. Agentic's MCP server exposes all system capabilities as **tools** that AI assistants can call directly.

This means you can ask your AI assistant to:
- Create and manage projects and pipelines
- Run pipelines and monitor results
- Search for agents, scripts, and instructions
- Duplicate pipelines
- Back up your data
- And much more

---

## Enabling the MCP Server

The MCP server is **enabled by default**. It can be toggled in the application properties:

| Property | Default | Description |
|----------|---------|-------------|
| `mcp.enabled` | `true` | Enable or disable the MCP server |
| `mcp.endpoint` | `/mcp` | URL path for the MCP endpoint |

The server runs at: `http://localhost:1488/mcp`

---

## Connecting an AI Tool

### opencode

Add the following to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "agentic-mcp": {
      "type": "remote",
      "url": "http://localhost:1488/mcp",
      "enabled": true
    }
  }
}
```

Once connected, all Agentic tools become available in your AI assistant using the `@` prefix (e.g., `@list_projects`).

### Other MCP Clients

Any application that supports the MCP Streamable HTTP transport can connect to `http://localhost:1488/mcp`. Refer to your client's documentation for how to add a remote MCP server.

---

## Available Tools

The MCP server provides **68 tools** organized into 10 categories.

---

### Project Tools

Manage your projects.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_projects` | List all projects | _(none)_ |
| `list_projects_with_pipelines` | List all projects with their pipelines | _(none)_ |
| `get_project` | Get details of a specific project | **id** (integer) |
| `create_project` | Create a new project | **name** (string), description, path, target, targetId |
| `update_project` | Update an existing project | **id** (integer), name, description, path, status |
| `delete_project` | Delete a project | **id** (integer) |
| `get_project_agents` | List agents in a project | **projectId** (integer) |
| `get_project_scripts` | List scripts in a project | **projectId** (integer) |
| `get_project_instructions` | List instructions in a project | **projectId** (integer) |
| `add_agent_to_project` | Add an agent to a project | **projectId** (integer), **agentId** (integer) |
| `add_script_to_project` | Add a script to a project | **projectId** (integer), **scriptId** (integer) |
| `add_instruction_to_project` | Add an instruction to a project | **projectId** (integer), **instructionId** (integer) |
| `remove_agent_from_project` | Remove an agent from a project | **projectId** (integer), **agentId** (integer) |
| `remove_script_from_project` | Remove a script from a project | **projectId** (integer), **scriptId** (integer) |
| `remove_instruction_from_project` | Remove an instruction from a project | **projectId** (integer), **instructionId** (integer) |

---

### Pipeline Tools

Manage pipelines within projects.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_pipelines` | List pipelines (optionally filtered by project) | projectId (optional) |
| `get_pipeline` | Get details of a specific pipeline | **id** (integer) |
| `create_pipeline` | Create a new pipeline | **projectId** (integer), **name** (string), description, type, outputExtension |
| `update_pipeline` | Update an existing pipeline | **id** (integer), name, description, status |
| `delete_pipeline` | Delete a pipeline | **id** (integer) |
| `run_pipeline` | Execute a pipeline | **id** (integer) |
| `duplicate_pipeline` | Duplicate a pipeline with all steps | **id** (integer), name (optional) |
| `stop_pipeline` | Stop a running pipeline | **id** (integer) |

---

### Pipeline Run Tools

View and manage pipeline execution history.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_pipeline_runs` | List runs for a specific pipeline | **pipelineId** (integer) |
| `list_all_pipeline_runs` | List all runs across all projects | _(none)_ |
| `get_pipeline_run` | Get details of a specific run, including step results | **id** (integer) |
| `delete_pipeline_run` | Delete a single pipeline run | **id** (integer) |
| `delete_non_running_runs` | Delete all completed, failed, or stopped runs | _(none)_ |

---

### Pipeline Step Tools

Manage steps within a pipeline.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_pipeline_steps` | List all steps in a pipeline | **pipelineId** (integer) |
| `get_pipeline_step` | Get details of a specific step | **id** (integer) |
| `add_step_to_pipeline` | Add a new step (agent or script) | **pipelineId** (integer), agentId or scriptId |
| `remove_step` | Remove a step from a pipeline | **id** (integer) |
| `save_step_input` | Set input content for a step | **stepId** (integer), **content** (string), type |
| `save_step_output` | Set output content for a step | **stepId** (integer), **content** (string), type |
| `save_step_cli` | Configure CLI settings for a step | **stepId** (integer), **cli** (string), parameters, arguments, runtime |

---

### Agent Tools

Manage AI agents.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_agents` | List all agents | _(none)_ |
| `get_agent` | Get details of a specific agent, including its prompt | **id** (integer) |
| `create_agent` | Create a new agent | **name** (string), namespace, category, description, prompt, path |
| `update_agent` | Update an existing agent | **id** (integer), name, namespace, category, description, prompt, path |
| `delete_agent` | Delete an agent | **id** (integer) |
| `search_agents` | Search agents by name or namespace | **searchTerm** (string), namespace (optional) |
| `get_agent_namespaces` | List all distinct agent namespaces | _(none)_ |

---

### Script Tools

Manage scripts.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_scripts` | List all scripts | _(none)_ |
| `get_script` | Get details of a specific script, including its content | **id** (integer) |
| `create_script` | Create a new script | **name** (string), namespace, category, description, content, scope, path |
| `update_script` | Update an existing script | **id** (integer), name, namespace, category, description, content, scope |
| `delete_script` | Delete a script | **id** (integer) |
| `search_scripts` | Search scripts by name or namespace | **searchTerm** (string), namespace (optional) |
| `get_script_namespaces` | List all distinct script namespaces | _(none)_ |

---

### Instruction Tools

Manage instruction sets.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_instructions` | List all instructions | _(none)_ |
| `get_instruction` | Get details of a specific instruction | **id** (integer) |
| `create_instruction` | Create a new instruction | **name** (string), **namespace** (string), category, description, instructions, path |
| `update_instruction` | Update an existing instruction | **id** (integer), name, namespace, category, description, instructions |
| `delete_instruction` | Delete an instruction | **id** (integer) |
| `search_instructions` | Search instructions by name or namespace | **searchTerm** (string), namespace (optional) |

---

### Target Tools

Manage target configurations (resource paths and CLI settings).

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_targets` | List all targets | _(none)_ |
| `get_target` | Get details of a target by ID or name | id (integer) or name (string) |
| `create_target` | Create a new target | **name** (string, must be unique), agentsPath, scriptsPath, instructionsPath, cli |
| `update_target` | Update an existing target | **id** (integer), name, agentsPath, scriptsPath, instructionsPath, cli |
| `delete_target` | Delete a target (fails if linked to projects) | **id** (integer) |

---

### Template Tools

Manage reusable templates.

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_templates` | List all templates, optionally filtered by type | type (optional: agents, skills, commands, scripts) |
| `get_template` | Get details of a specific template | **id** (integer) |
| `create_template` | Create a new template | **name** (string), **type** (string), description, template |
| `update_template` | Update an existing template | **id** (integer), name, type, description, template |
| `delete_template` | Delete a template | **id** (integer) |

---

### System Tools

System-level operations.

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_version` | Get the current Agentic version | _(none)_ |
| `export_data` | Export system data as SQL | types (array, e.g. `["projects", "pipelines", "agents"]`) |
| `create_backup` | Create a full database backup | _(none)_ |

---

## Usage Examples

### Listing and Running Pipelines

```
@list_projects
@list_pipelines  projectId=1
@run_pipeline  id=5
@list_pipeline_runs  pipelineId=5
```

### Creating an Agent

```
@create_agent  name="Code Reviewer"  namespace="quality"  prompt="Review code for bugs and style issues"
```

### Duplicating a Pipeline

```
@duplicate_pipeline  id=3  name="My Pipeline v2"
```

If you omit the name, the system auto-generates one (e.g., `My Pipelinecopy`).

### Cleaning Up Old Runs

```
@delete_non_running_runs
```

### Exporting Data

```
@export_data  types=["projects", "pipelines", "agents"]
```

If no types are specified, all data is exported.

### Creating a Backup

```
@create_backup
```

---

## Parameter Reference

### Required vs. Optional

Parameters shown in **bold** in the tables above are required. All others are optional.

### Common Parameter Types

| Type | Description |
|------|-------------|
| integer | Numeric ID of an entity |
| string | Text value |
| array | List of values (e.g., `["projects", "pipelines"]`) |

### Status Values

| Entity | Valid Statuses |
|--------|----------------|
| Project | active, completed, archived |
| Pipeline | pending, running, completed, failed, stopped |
| Script Scope | global, project |

### CLI Options for Steps

| CLI | Description |
|-----|-------------|
| opencode | Uses opencode as the CLI |
| copilot | Uses GitHub Copilot as the CLI |
| custom | Uses a custom CLI command |

### Runtime Options for Steps

| Runtime | Description |
|---------|-------------|
| cmd | Windows command prompt |
| node | Node.js runtime |
| java | Java runtime |
| py | Python runtime |
| custom | Custom runtime |

---

## Response Format

All tool responses are returned as **Markdown-formatted text**, making them easy to read in any AI assistant. Error responses include an `isError` flag and a descriptive error message.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP tools not appearing | Ensure `mcp.enabled=true` and the backend is running |
| Connection refused | Verify the backend is running on port 1488 |
| Tool returns an error | Check that the entity ID exists and parameters are valid |
| Cannot delete a target | Remove all project associations first |
| Cannot delete a project | Ensure no running pipelines exist |
