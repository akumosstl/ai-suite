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
- **Organize Projects** - Group everything by project with namespaces

---

## Main Menu

The menu provides:

| Option | Description |
|--------|-------------|
| Project > New | Create a new project |
| Project > Open | Open an existing project |
| Config | Configure application settings |
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
| Templates | Reusable templates |
| Namespace | Organize entities by category |
| Export | Export project data |
| Import | Import project data |
| Backup | Backup your data |
| Update | Check for updates |

---

## Quick Start

### 1. Create a Project

1. Click **Project > New**
2. Enter project name
3. Click **Create**

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

---

## Interface Layout

Most screens use a two-panel layout:

```
+------------------+------------------------+
|   Left Panel     |    Right Panel         |
|  - List        |  - Details         |
|  - Search      |  - Forms          |
|  - Pagination  |  - Actions        |
+------------------+------------------------+
```

---

## Status Indicators

| Status | Color | Meaning |
|--------|-------|--------|
| Completed | Green | Successfully finished |
| Running | Orange | Currently executing |
| Pending | Gray | Waiting to execute |
| Failed | Red | Error occurred |

---

## Common Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Unique identifier |
| Namespace | No | Category grouping |
| Description | No | Purpose explanation |
| Content | Varies | Main content |

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
| [Config](docs/config-guide.md) | Application configuration |
| [Plugins](docs/plugins-guide.md) | Tool extensions |

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| App not loading | Ensure `backend.exe` is running |
| Pipeline fails | Check step configuration |
| Entity not found | Check namespace filter |
| Can't delete | Entity may be in use |

---

## Version

**2.0.0** - Release Date: 2026-04-24