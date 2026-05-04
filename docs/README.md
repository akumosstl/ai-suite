# Agentic - User Guide

Welcome to **Agentic**, a pipeline execution system for building and managing AI agents. This guide helps you get started.

---

## Getting Started

### Starting the Application

1. Download the application package
2. Extract the ZIP file
3. Run `backend.exe`
4. Open your browser to `http://localhost:4200`

---

## Overview

Agentic allows you to:

- **Create AI Agents** - Build intelligent agents with custom prompts
- **Define Instructions** - Create reusable instruction sets with supporting files
- **Write Scripts** - Develop executable scripts for automation
- **Build Pipelines** - Orchestrate sequences of agents and scripts
- **Duplicate Pipelines** - Clone existing pipelines with all steps and configurations
- **Organize Projects** - Group everything by project with namespaces
- **Manage Targets** - Configure resource paths and CLI for your projects
- **Use MCP Server** - Connect AI tools to Agentic via Model Context Protocol
- **Backup & Restore** - Create and download database backups
- **Export & Import** - Move data in and out of the system

---

## Main Menu

The menu provides:

| Option | Description |
|--------|-------------|
| Project > New | Create a new project |
| Project > Open | Open an existing project |
| Config | Configure application settings and targets |
| Exit | Close the application |

---

## Stack Menu

The Stack menu contains your core entities:

| Option | Description |
|--------|-------------|
| Agents | AI agents with custom prompts |
| Instructions | Reusable instruction sets |
| Scripts | Executable scripts |
| Pipelines | View all pipelines |

---

## Management Menu

| Option | Description |
|--------|-------------|
| Templates | Reusable templates for agents, scripts, and instructions |
| Namespace | Organize entities by category |
| Export | Export project data |
| Import | Import project data |
| Backup | Create and download database backups |
| Update | Check for application updates |

---

## Keyboard Shortcuts

Press **Ctrl+Shift+Q** to open the shortcuts reference at any time.

### Navigation

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+A | Go to Agents |
| Ctrl+Shift+S | Go to Scripts |
| Ctrl+Shift+T | Go to Templates |
| Ctrl+Shift+N | Go to Namespaces |
| Ctrl+Shift+I | Go to Instructions |
| Ctrl+Shift+L | Go to Pipelines |
| Ctrl+Shift+P | Go to Project |
| Ctrl+B | Toggle side panel |
| Ctrl+Alt+H | Go to Home |

### Editor

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+E | Open in external editor |
| Ctrl+Shift+K | Copy content to clipboard |

### Pipeline Execution

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+R | Run pipeline |
| Ctrl+X | Stop running pipeline |
| Ctrl+Alt+P | Go back |
| Ctrl+Shift+U | Refresh status |

### Dialogs

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Confirm / Save |

---

## Quick Start

### 1. Create a Project

1. Click **Project > New**
2. Enter project name
3. Select a **Target** (defines resource paths and CLI)
4. Click **Create**

### 2. Create an Agent

1. Go to **Stack > Agents**
2. Click **Add**
3. Fill in:
   - **Name** - Agent identifier
   - **Namespace** - Category (optional)
   - **Prompt** - Instructions for the agent
4. Click **Create**

### 3. Create Instructions

1. Go to **Stack > Instructions**
2. Click **Add**
3. Fill in:
   - **Name** - Instruction set name
   - **Namespace** - Category (optional)
   - **Instructions** - The instruction text
4. Optionally add files for reference
5. Click **Create**

### 4. Write a Script

1. Go to **Stack > Scripts**
2. Click **Add**
3. Fill in:
   - **Name** - Script name
   - **Namespace** - Category (optional)
   - **Script** - Your executable code
4. Click **Create**

### 5. Build a Pipeline

1. Go to **Stack > Pipelines**
2. Click **Add**
3. Add steps:
   - Select entity type (Agent, Script, Instruction)
   - Select the specific entity
   - Configure step settings
4. Arrange order via drag-and-drop
5. Click **Save**

### 6. Run a Pipeline

1. Select your pipeline
2. Click **Run**
3. Monitor progress in real-time
4. View step outputs as they execute

### 7. Duplicate a Pipeline

1. In the project view, click the **duplicate** icon (copy) next to the pipeline
2. Enter a name for the new pipeline (a default name is suggested automatically)
3. Click **Create**

The duplicated pipeline copies all steps, configurations, inputs, outputs, and CLI settings. All step statuses are reset to **Pending**.

---

## Interface Layout

Most screens use a two-panel layout:

```
+------------------+------------------------+
| Left Panel       | Right Panel            |
| - List           | - Details              |
| - Search         | - Forms                |
| - Pagination     | - Actions              |
+------------------+------------------------+
```

---

## Status Indicators

| Status    | Color  | Meaning               |
|-----------|--------|-----------------------|
| Completed | Green  | Successfully finished |
| Running   | Orange | Currently executing   |
| Pending   | Gray   | Waiting to execute    |
| Failed    | Red    | Error occurred        |
| Stopped   | Red    | Manually stopped      |

---

## Common Fields

| Field       | Required | Description           |
|-------------|----------|-----------------------|
| Name        | Yes      | Unique identifier     |
| Namespace   | No       | Category grouping     |
| Description | No       | Purpose explanation   |
| Content     | Varies   | Main content          |

---

## Targets

A **Target** defines where your resources live and which CLI to use. Targets are managed in **Config**.

Each target contains:

| Field             | Description                                      |
|-------------------|--------------------------------------------------|
| Name              | Unique target name                               |
| Agents Path       | Directory path for agent files                   |
| Scripts Path      | Directory path for script files                  |
| Instructions Path | Directory path for instruction files             |
| CLI               | Command-line interface to use (e.g., opencode)   |

When you create a project, you assign a target. This determines the file paths and CLI for pipeline execution.

---

## Project Features

### Project README

Each project has a built-in **README** editor. Click the README button to write or edit a Markdown description for your project.

### Managing Project Agents

Use the **Agents** button on the project page to:
- View agents assigned to the project
- Add new agents (with search and bulk selection)
- Remove agents from the project

### Syncing Instruction Files

On the Instructions page, click **Sync** to write selected instruction files to a directory on your filesystem. This is useful for making instruction files available to external tools.

---

## Pipeline Features

### Step Configuration

Each pipeline step can be configured with:

| Tab     | Settings                                                    |
|---------|-------------------------------------------------------------|
| Input   | File type (YML/JSON/CMD/TXT) and input content             |
| Output  | File type and output content                                |
| CLI     | CLI selection (opencode/copilot/custom), parameters, arguments, runtime |

### Console Output

Click the **eye** icon on a running step to open the console output viewer. It shows real-time output with auto-scroll and auto-refresh every 2 seconds.

### Duplicate Pipeline

Use the duplicate button to create a copy of a pipeline. The system automatically suggests a unique name (e.g., `MyPipelinecopy`, `MyPipelinecopy(1)`). All steps and their configurations are copied.

### Pipeline Run Cleanup

Remove old pipeline runs in bulk. Only non-running runs (completed, failed, stopped) are deleted.

---

## Backup & Restore

### Creating a Backup

1. Go to **Management > Backup**
2. Choose a destination directory, or
3. Click **Download** to save the backup as a `.sql` file to your browser

### Exporting Data

1. Go to **Management > Export**
2. Select which entity types to include
3. The system generates a `.sql` file with your data

---

## Plugin Registry

1. Click **Tools** in the menu bar
2. Browse available plugins from the registry
3. Search or filter by category
4. Install plugins to extend system capabilities

---

## Documentation Index

Detailed guides for each feature:

### Core Guides

| Guide | Description |
|-------|-------------|
| [Agents](docs/agents-guide.md) | Create AI agents with custom prompts |
| [Instructions](docs/instructions-guide.md) | Reusable instruction sets |
| [Scripts](docs/scripts-guide.md) | Executable scripts |
| [Pipelines](docs/pipelines-guide.md) | View executed pipelines |
| [Pipeline Steps](docs/pipeline-steps.md) | Create and configure pipeline steps |
| [Run Pipelines](docs/runpipelines-guide.md) | Execute pipelines with real-time updates |
| [Pipeline History](docs/pipeline-run-history-guide.md) | View past executions |
| [Project](docs/project-guide.md) | Manage projects |
| [Templates](docs/templates-guide.md) | Reusable templates |
| [Namespaces](docs/namespaces-guide.md) | Organize entities by category |
| [Config](docs/config-guide.md) | Application configuration and targets |
| [Plugins](docs/plugins-guide.md) | Tool extensions |

### Integration Guides

| Guide | Description |
|-------|-------------|
| [MCP Server](docs/mcp-guide.md) | Connect AI tools via Model Context Protocol |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App not loading | Ensure `backend.exe` is running |
| Pipeline fails | Check step configuration and target paths |
| Entity not found | Check namespace filter |
| Can't delete | Entity may be in use by a pipeline or project |
| MCP tools not available | Ensure `mcp.enabled=true` in application properties |
| Target delete fails | Remove project associations first |

---

## Version

**2.10.10** - Release Date: 2026-05-04
