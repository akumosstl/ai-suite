# Pipeline Executions Guide

This guide explains how to use the Pipeline Executions feature to view and manage all pipeline runs across projects.

## Accessing Pipeline Executions

Navigate to `/pipelines` in your browser to access the Pipeline Executions screen.

## Overview

The Pipeline Executions screen has two main panels:

| Panel | Description |
|-------|-------------|
| Left Panel | List of all pipeline runs with search |
| Right Panel | Pipeline flow visualization and step details |

## Navigation

### Back Button

Click the **Back** button to return to the previous project screen.

### Refresh Button

Click the **Refresh** button to reload the pipeline runs list.

## Viewing Pipeline Runs

### Run List (Left Panel)

Each run item shows:

| Field | Description |
|-------|-------------|
| Status Icon | Check (completed), Error (failed), Play (running), Schedule (pending) |
| Pipeline Name | Name of the pipeline |
| Project Name | Associated project |
| Date | When the run was started |
| Status Badge | Status indicator (completed/failed/running/pending) |

### Selecting a Run

Click on any run in the list to view its details in the right panel. The selected run is highlighted.

### View Running Pipeline

For running pipelines, click the **eye** icon to open the live execution in a new tab.

## Pipeline Flow Visualization

When a run is selected, the right panel shows the pipeline flow:

### Step Cards

Each step is displayed as a card showing:

| Element | Description |
|---------|-------------|
| Step Number | Circle with step order |
| Step Icon | Robot icon (agent) or Code icon (script) |
| Step Name | Agent or script name |
| Category | Namespace |

### Step Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| Completed | Green | Step finished successfully |
| Running | Orange | Currently executing |
| Pending | Gray | Waiting to run |
| Failed | Red | Step failed |

### Connectors

Steps are connected by arrow icons showing execution flow.

## Step Details

Click on any step in the pipeline visualization to view its details:

### Step Badge

Shows the current status of the selected step.

### Output Button

Click the **Output** button to open a modal with the step's console output.

### View Running Pipeline

Click the **eye** icon on a running pipeline to view live execution.

## Searching Runs

### Search by Project Name

Type in the search box to filter runs by project name. Press Enter to search.

### Clear Search

Click the X button to clear the search and show all runs.

## Pagination

Use the page controls at the bottom to navigate through multiple pages of runs:

- Click **<** to go to previous page
- Click **>** to go to next page
- Click a page number to jump to that page

## Cleanup History

### Cleanup Button

Click **Cleanup history** to delete all completed and failed pipeline runs while keeping running pipelines.

A confirmation dialog will appear to confirm the action.

## Notes

- The Pipeline Executions screen shows all runs across all projects
- Running pipelines can be viewed in real-time by clicking the eye icon
- The cleanup feature only removes non-running pipelines
- Step output is available in the modal after clicking Output
- Each run displays its pipeline name, project name, and execution date
- Pipeline flow shows the order and status of each step