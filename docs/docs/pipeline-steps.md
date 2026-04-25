# Pipeline Steps Guide

This guide explains how to create and configure pipeline steps in Agentic.

## Understanding Pipeline Steps

A pipeline step is a single unit of execution within a pipeline.

### Step Types

| Type | Description |
|------|-------------|
| Agent | Executes an AI agent |
| Script | Runs a script |
| Instruction | Loads an instruction set |

## Adding Steps

1. Select a pipeline
2. Click **Add Step**
3. Choose step type (Agent, Script, or Instruction)
4. Select the specific entity
5. Click **Add**

## Step Settings

Each step has configuration options:

| Setting | Description |
|---------|-------------|
| Input | Data the step receives |
| Output | Data the step produces |
| Timeout | Maximum execution time |

## Using Placeholders

Steps can use placeholders to pass data:

| Placeholder | Description |
|------------|-------------|
| `{{step:1:output}}` | Output from step 1 |
| `{{previous-output}}` | Output from previous step |
| `{{file:path}}` | Read from file |
| `{{env:VAR}}` | Environment variable |

### Example

```
Step 1: Generate data
Step 2: Process {{step:1:output}}
```

## Reordering Steps

Drag-and-drop steps to reorder, then save.

## Removing Steps

1. Select the step
2. Click delete icon
3. Confirm deletion

## Step Status

| Status | Meaning |
|--------|---------|
| Pending | Waiting to execute |
| Running | Currently executing |
| Completed | Finished successfully |
| Failed | Execution failed |