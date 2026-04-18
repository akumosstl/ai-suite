# Project Management Guide

This guide explains how to use the Project feature to manage projects, pipelines, and their steps in AI Suite.

## Accessing Projects

Navigate to `/project` or `/project/:id` in your browser to access the Project screen.

## Overview

The Project screen is the **central hub** for managing:
- Project details and configuration
- Pipelines (sequences of steps)
- Steps (agents, scripts, skills, commands, etc.)
- Running pipelines

## Understanding the UI

### Main Panels

| Panel | Description |
|-------|-------------|
| Left Panel | Pipeline list and management |
| Right Panel | Selected pipeline/step details |
| Bottom/Modal | Dialogs for selecting entities |

### Project Actions

| Action | Description |
|--------|-------------|
| Run Pipeline | Execute selected pipeline |
| Stop Pipeline | Halt running pipeline |
| Edit Pipeline | Modify pipeline settings |
| Add Step | Add new step to pipeline |
| Reorder Steps | Drag-and-drop step order |

## Managing Pipelines

### Creating a Pipeline

1. Click **New Pipeline** button
2. Fill in pipeline details:
   - **Name** - Pipeline identifier
   - **Description** - What it does
   - **Output Extension** - json/yml/text
   - **Type** - sequential or parallel
3. Click **Create**

### Editing a Pipeline

1. Select a pipeline
2. Click **Edit** button
3. Modify details
4. Click **Save**

### Deleting a Pipeline

1. Select a pipeline
2. Click **Delete** button
3. Confirm deletion

## Managing Steps

Steps are the individual units in a pipeline. Each step can be:
- **Agent** - AI agent execution
- **Script** - Script execution
- **Skill** - Skill invocation
- **Command** - Command execution
- **Instruction** - Instruction set
- **Plugin** - Plugin execution
- **Tool** - Tool execution

### Adding a Step

1. Click **Add Step** in pipeline
2. Choose step type from dialog:
   - Select Agent
   - Select Script
   - Select Skill
   - Select Command
   - Select Instruction
   - Select Plugin
   - Select Tool
3. Configure step settings
4. Click **Add**

### Step Types and Icons

| Type | Icon | Description |
|------|------|-------------|
| Agent | Robot | AI agent execution |
| Script | Code | Script execution |
| Skill | Brain | Skill invocation |
| Command | Terminal | CLI command |
| Instruction | List | Instruction set |
| Plugin | Puzzle | Plugin execution |
| Tool | Wrench | Tool execution |

### Reordering Steps

Steps can be reordered via drag-and-drop:
1. Enable reorder mode
2. Drag steps to new positions
3. Save order

### Step Settings

Each step can have:
- **Name** - Step identifier
- **Description** - Purpose
- **Input** - Input configuration
- **Output** - Output handling
- **CLI** - Command-line arguments
- **Retry** - Retry configuration
- **Timeout** - Execution timeout

## Running Pipelines

### Start Execution

1. Select pipeline
2. Click **Run** button

The system navigates to `/runpipelines` with:
- Pipeline ID
- Project ID

### Monitor Execution

In `/runpipelines`, you can:
- View real-time progress
- See step output
- Stop execution if needed

### Stop Execution

Click **Stop** to halt pipeline execution.

## Project Configuration

### Endpoint

Each project has an API endpoint:
- Copy endpoint to clipboard
- Use for external integrations

### Project Info

Edit project details:
- **Name** - Project name
- **Description** - Purpose
- **Path** - File location
- **Target** - Deployment target

## Dialogs

### Select Agent Dialog

Choose an agent for a step:
- Search by name
- Filter by namespace
- View agent details
- Select to add

### Select Script Dialog

Choose a script for a step:
- Browse available scripts
- Select to add

### Select Skill Dialog

Choose a skill for a step:
- Browse available skills
- Select to add

### Select Command Dialog

Choose a command for a step:
- Browse commands
- Configure command
- Select to add

### Step Settings Dialog

Configure step behavior:
- Input handling
- Output format
- CLI arguments
- Retry settings
- Timeout values

## Pipeline Types

| Type | Description |
|------|-------------|
| Sequential | Steps run one after another |
| Parallel | Steps run simultaneously |

## Output Extensions

| Extension | Use Case |
|----------|----------|
| json | Structured data |
| yml | Configuration |
| text | Plain text |

## Use Cases

### Create New Pipeline

1. Navigate to project
2. Click New Pipeline
3. Fill details
4. Add steps
5. Run pipeline

### Edit Pipeline Steps

1. Select pipeline
2. Add/remove/reorder steps
3. Configure each step
4. Save changes

### Run and Monitor

1. Select pipeline
2. Click Run
3. Monitor in runpipelines
4. View output per step

## Notes

- Steps execute in order (sequential) or parallel
- Each step type has its own dialog
- Step settings control execution behavior
- Pipeline can be stopped mid-execution
- Output format affects downstream steps