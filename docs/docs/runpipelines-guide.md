# Run Pipelines Guide

This guide explains how to run pipelines with real-time updates in Agentic.

## Accessing Pipeline Execution

Navigate to `/runpipelines` in your browser.

## Overview

The Pipeline Execution screen provides real-time monitoring:
- Live status updates
- Step-by-step visualization
- Console output for each step

## Running a Pipeline

### Step 1: Select Pipeline

Choose a pipeline from the dropdown.

### Step 2: Start Execution

Click **Start** to begin pipeline execution.

### Step 3: Monitor Progress

Watch step cards update in real-time:
- Running steps show orange border
- Completed steps turn green
- Failed steps turn red

### Step 4: View Output

Click on any step to view its console output.

## Stopping Execution

Click **Stop** to halt execution:
- No further steps will execute
- You can restart the same pipeline

## Step Statuses

| Status | Meaning |
|--------|---------|
| Pending | Waiting to execute |
| Running | Currently executing |
| Completed | Finished successfully |
| Failed | Execution failed |

## Console Output

- Real-time streaming as steps execute
- Error messages highlighted in red
- Copy output to clipboard

## Notes

- Step output is cumulative (appended as received)
- Stopped pipelines can be restarted