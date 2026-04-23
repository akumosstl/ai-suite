# AI Suite - User Documentation

Welcome to **AI Suite**, a powerful pipeline execution system designed for creating, managing, and executing AI-powered workflows. This documentation provides everything you need to get started as an end user.

---

## What is AI Suite?

AI Suite is a **hybrid pipeline execution system** that allows you to:

- **Create and manage AI agents** - Build intelligent agents with custom prompts
- **Define pipelines** - Orchestrate sequences of steps (agents, scripts, skills, commands, etc.)
- **Execute pipelines in real-time** - Monitor progress with live status updates
- **Organize resources** - Use namespaces to categorize and manage your entities
- **Reuse templates** - Start quickly with predefined patterns

### Key Features

| Feature | Description |
|---------|-------------|
| Real-time Execution | Server-Sent Events (SSE) for live pipeline progress |
| Polling Fallback | Reliable status updates even when SSE is unavailable |
| Rich Entity Types | Supports agents, skills, commands, scripts, plugins, tools, and instructions |
| Namespace Organization | Group entities by category for better management |
| Template System | Quick-start with reusable patterns |
| Target Configuration | Define custom resource paths for different environments |

---

## Getting Started

### Accessing the Application

Open your browser and navigate to:

```
http://localhost:4200
```

### Navigation Menu

The main menu provides access to all features:

| Menu Item | Description |
|----------|-------------|
| Menu | Main navigation hub |
| Agents | Create and manage AI agents |
| Skills | Define AI skills |
| Commands | Manage CLI commands |
| Scripts | Create executable scripts |
| Instructions | Define instruction sets |
| Plugins | Manage plugins |
| Tools | Create utility tools |
| Templates | Manage reusable templates |
| Namespaces | View and organize entity namespaces |
| Projects | Manage projects and pipelines |
| Pipelines | View all pipeline executions |
| Config | Configure targets and paths |

---

## Quick Start Guide

### 1. Create Your First Agent

1. Navigate to **Agents** (`/agents`)
2. Click the **Add** button
3. Fill in the agent details:
   - **Name** - Agent identifier
   - **Namespace** - Category (optional)
   - **Prompt** - Instructions for the agent
4. Click **Create Agent**

### 2. Create a Pipeline

1. Navigate to **Projects** (`/project`)
2. Click **New Pipeline**
3. Add steps to your pipeline:
   - Select the entity type (Agent, Script, Skill, etc.)
   - Configure each step
4. Set the execution order via drag-and-drop

### 3. Run a Pipeline

1. Select your pipeline
2. Click **Run**
3. Monitor progress in real-time at `/runpipelines`
4. View step outputs as they execute

---

## Documentation Index

Each feature has its own detailed guide:

### Core Features

| Guide | Description | Link |
|-------|-------------|------|
| Agents | Create AI agents with custom prompts | [agents-guide.md](./agents-guide.md) |
| Projects | Manage projects and pipelines | [project-guide.md](./project-guide.md) |
| Pipeline Steps | Create and configure pipeline steps | [pipeline-steps.md](./pipeline-steps.md) |
| Pipelines | View executed pipelines | [pipelines-guide.md](./pipelines-guide.md) |
| Run Pipelines | Execute pipelines with real-time updates | [runpipelines-guide.md](./runpipelines-guide.md) |
| Pipeline History | View past executions | [pipeline-run-history-guide.md](./pipeline-run-history-guide.md) |

### Entity Types

| Guide | Description | Link |
|-------|-------------|------|
| Skills | AI skill definitions | [skills-guide.md](./skills-guide.md) |
| Commands | CLI commands | [commands-guide.md](./commands-guide.md) |
| Scripts | Executable scripts | [scripts-guide.md](./scripts-guide.md) |
| Instructions | Instruction sets | [instructions-guide.md](./instructions-guide.md) |
| Plugins | Plugin extensions | [plugins-guide.md](./plugins-guide.md) |
| Tools | Utility tools | [tools-guide.md](./tools-guide.md) |

### Organization & Configuration

| Guide | Description | Link |
|-------|-------------|------|
| Templates | Reusable templates | [templates-guide.md](./templates-guide.md) |
| Namespaces | Entity organization | [namespaces-guide.md](./namespaces-guide.md) |
| Config | Target configuration | [config-guide.md](./config-guide.md) |
| Agentic Folder | .agentic folder and agentic.json | [agentic-folder-guide.md](./agentic-folder-guide.md) |

---

## Understanding the Interface

### Common Layout

Most screens follow a two-panel layout:

```
+------------------+------------------------+
|                  |                        |
|   Left Panel     |    Right Panel         |
|                  |                        |
|  - List of      |  - Details           |
|    items        |  - Forms            |
|  - Search      |  - Actions          |
|  - Pagination |                     |
+------------------+------------------------+
```

### Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Completed | Green | Successfully finished |
| Running | Orange | Currently executing |
| Pending | Gray | Waiting to execute |
| Failed | Red | Error occurred |

### Entity Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Unique identifier |
| Namespace | No | Category grouping |
| Description | No | Purpose description |
| Path | No | File/resource location |
| Content | Varies | Main content (prompt, script, etc.) |

---

## Best Practices

### Organizing Entities

- **Use namespaces** to group related entities
- **Add descriptions** so others understand purpose
- **Use templates** for common patterns

### Pipeline Design

- **Start simple** - begin with sequential pipelines
- **Add error handling** - check outputs between steps
- **Use meaningful names** - for pipelines and steps

### Execution Monitoring

- **Watch real-time** - use `/runpipelines` for live updates
- **Check outputs** - review console output per step
- **Review history** - use pipeline-run-history for analysis

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Pipeline not running | Check backend is running on port 8080 |
| SSE not working | System falls back to polling automatically |
| Can't find entity | Check namespace filter |
| Delete failed | Entity may be in use by pipeline |

### Getting Help

- Review the specific guide for each feature
- Check API endpoints in backend documentation
- Examine browser console for errors

---

## Additional Resources

### System Requirements

- **Frontend**: Angular 16+ (runs on port 4200)
- **Backend**: Spring Boot (runs on port 8080)
- **Database**: H2 in-memory database

### Starting the Application

```bash
# Terminal 1: Start backend
cd backend && mvn spring-boot:run

# Terminal 2: Start frontend
cd desktop-angular && npm start
```

---

## Glossary

| Term | Definition |
|------|-----------|
| **Agent** | AI entity with a custom prompt that performs tasks |
| **Pipeline** | Sequence of steps executed in order |
| **Step** | Individual task in a pipeline (agent, script, skill, etc.) |
| **Namespace** | Category for grouping entities |
| **Template** | Reusable starting point for entities |
| **Target** | Configuration defining resource paths |
| **SSE** | Server-Sent Events for real-time updates |

---

## Support

For additional help:
- Check the detailed guide for your specific feature
- Review the troubleshooting section
- Examine the application logs

---

*AI Suite - Empowering your AI workflow automation*