# Project Management Guide

This guide explains how to manage projects and pipelines in Agentic.

## Accessing Projects

Go to **Project** menu option or navigate to `/project`.

## Overview

The Project screen is the central hub for managing:
- Project details
- Pipelines (sequences of steps)
- Steps (agents, scripts, instructions)
- Running pipelines

## Managing Pipelines

### Creating a Pipeline

1. Click **New Pipeline**
2. Fill details:
   - **Name** - Pipeline identifier
   - **Description** - What it does
3. Click **Create**

### Editing a Pipeline

1. Select a pipeline
2. Click **Edit**
3. Modify details
4. Click **Save**

### Deleting a Pipeline

1. Select a pipeline
2. Click **Delete**
3. Confirm deletion

## Managing Steps

Steps are the units in a pipeline. Each step can be:
- **Agent** - AI agent execution
- **Script** - Script execution
- **Instruction** - Instruction set

### Adding a Step

1. Click **Add Step**
2. Choose step type:
   - Agent
   - Script
   - Instruction
3. Select the specific entity
4. Click **Add**

### Step Settings

Each step can have:
- **Name** - Step identifier
- **Description** - Purpose
- **Input** - Input configuration
- **Output** - Output handling
- **Timeout** - Execution timeout

### Reordering Steps

Drag-and-drop to reorder steps, then save.

## Running Pipelines

### Start Execution

1. Select pipeline
2. Click **Run**

### Monitor Execution

View real-time progress and step output.

### Stop Execution

Click **Stop** to halt pipeline execution.

## Notes

- Steps execute in order
- Each step type has its own configuration
- Pipeline can be stopped mid-execution