# Pipeline Execution Guide

This guide explains how to use the Pipeline Execution feature to run pipelines in real-time with live status updates.

## Accessing Pipeline Execution

Navigate to `/runpipelines` in your browser to access the Pipeline Execution screen. You can also access directly via URL parameters:
- `/runpipelines?pipelineId=123&projectId=456` - Run specific pipeline

## Overview

The Pipeline Execution screen provides **real-time pipeline monitoring** with:
- Live status updates via SSE (Server-Sent Events)
- Polling fallback for reliability
- Step-by-step execution visualization
- Console output for each step
- Interactive input handling

## Understanding the UI

### Main Components

| Component | Description |
|-----------|-------------|
| Pipeline Selector | Choose which pipeline to run |
| Step Cards | Visual representation of each step |
| Step Output | Console output from executed steps |
| Control Buttons | Start, Stop, Reset controls |

### Step Statuses

| Status | Color | Description |
|--------|-------|-------------|
| Pending | Gray | Waiting to execute |
| Ready | Blue | Ready to run |
| Running | Orange | Currently executing |
| Completed | Green | Step finished successfully |
| Failed | Red | Step failed |

## Running a Pipeline

### Step 1: Select Pipeline

If accessing via `/runpipelines`, select a pipeline from the dropdown or list.

### Step 2: Start Execution

Click the **Start** button to begin pipeline execution.

The system will:
1. Connect to SSE for real-time updates
2. Fall back to polling if SSE fails
3. Display live progress on each step

### Step 3: Monitor Progress

Watch the step cards update in real-time:
- Running steps show orange border
- Completed steps turn green
- Failed steps turn red

### Step 4: View Output

Click on any step to view its console output in the output panel.

## Real-Time Updates

### SSE Connection

The system uses Server-Sent Events (SSE) for live updates:
- **step-output** - Real-time console output
- **pipeline-complete** - Execution finished
- **step-error** - Step failed with error details

### Automatic Reconnection

If SSE connection fails, the system automatically:
1. Disconnects from SSE
2. Attempts reconnection after 3 seconds
3. Falls back to polling if reconnection fails

### Polling Fallback

If SSE is unavailable, the system polls every 3 seconds to check:
- Pipeline status
- Step statuses
- Output content

## Step Execution Order

Steps execute sequentially based on dependencies. A step can only run when:
- All previous steps are completed
- No previous step has failed

The system automatically marks:
- Previous step as completed when current step starts running
- Blocked steps as pending if previous step is still running

## Input Handling

If a pipeline step requires input, a dialog appears:
- Enter the required value
- Click Submit to continue

## Stopping Execution

### Stop Button
Click **Stop** to halt execution at the current step.
- The pipeline run is marked as "stopped"
- No further steps will execute

### After Stop
You can:
- Restart the same pipeline
- Select a different pipeline
- Return to project screen

## Console Output

### Viewing Output
Click on any step card to view its output in the output panel.

### Output Features
- Real-time streaming as steps execute
- Error messages highlighted in red
- Stack traces for failed steps
- Copy output to clipboard

### Output Types
| Type | Description |
|------|-------------|
| stdout | Standard output |
| stderr | Error output |
| mixed | Combined output |

## URL Parameters

You can access pipelines directly via URL:

| Parameter | Description | Example |
|-----------|-------------|---------|
| pipelineId | Specific pipeline ID | `/runpipelines?pipelineId=5` |
| projectId | Project context | `/runpipelines?pipelineId=5&projectId=1` |

## Troubleshooting

### SSE Connection Issues
If real-time updates don't appear:
- Network may be slow (3-second delay normal)
- System switches to polling automatically
- Check backend is running on port 8080

### Steps Not Executing
- Check dependencies between steps
- Previous step must complete before next starts
- Failed steps block downstream steps

### Output Not Showing
- Click on step to refresh output
- Check step is in "running" or "completed" status
- Try polling fallback

## Notes

- SSE requires backend on `http://localhost:8080`
- Polling provides reliability when SSE fails
- Step output is cumulative (appended as received)
- Input dialogs pause execution until resolved
- Stopped pipelines can be restarted