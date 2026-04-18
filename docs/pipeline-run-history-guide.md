# Pipeline Run History Guide

This guide explains how to use the Pipeline Run History feature to view past pipeline executions and their results.

## Accessing Pipeline Run History

Navigate to `/pipeline-run-history` in your browser to access the Pipeline Run History screen.

## Overview

The Pipeline Run History screen shows **past executions** of a pipeline with:
- Run list with status indicators
- Pipeline flow visualization
- Step details and output
- Pagination for multiple runs

## Understanding the UI

### Two Main Panels

| Panel | Description |
|-------|-------------|
| Left Panel | List of past runs |
| Right Panel | Pipeline flow and step details |

### Run Status Icons

| Icon | Status | Color |
|------|--------|-------|
| ✓ Check | Completed | Green |
| ✗ Error | Failed | Red |
| ▶ Play | Running | Orange |
| � Schedule | Pending | Gray |

## Viewing Run History

### Run List (Left Panel)

Each run item shows:
- **Status Icon** - Visual status indicator
- **Run #** - Run number (newest first)
- **Date** - When the run occurred
- **Status Badge** - Text status (completed/failed/running/pending)

### Selecting a Run

Click any run in the list to view its details.

### Run Order

Runs are displayed newest-first (Run #1 is the most recent).

## Pipeline Flow Visualization

When a run is selected, the right panel shows:

### Step Cards

Each step displays:
| Element | Description |
|---------|-------------|
| Step Number | Circle with order (1, 2, 3...) |
| Step Icon | Robot (agent) or Code (script) |
| Step Name | Agent or script name |
| Category | Namespace |

### Step Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| Completed | Green | Step finished successfully |
| Running | Orange | Currently executing |
| Pending | Gray | Waiting to run |
| Failed | Red | Step failed |

### Step Connectors

Arrows between step cards show execution order.

## Step Details

### Selecting a Step

Click any step card to view its details.

### Step Badge

Shows the current status of the selected step.

### Output Button

Click **Output** to open a modal with:
- Full console output
- Error messages
- Stack traces (if any)

## Pagination

Navigate through multiple runs using pagination controls:

| Control | Action |
|---------|--------|
| < | Previous page |
| > | Next page |
| Page numbers | Jump to page |

## Filtering Runs

The run list automatically shows runs for the current pipeline/project context.

## Navigating Back

Click **Back** to return to the project screen.

## Use Cases

### Review Past Execution

1. Navigate to run history
2. Click on a past run
3. Review the pipeline flow
4. Click on any step to see output

### Analyze Failures

1. Find failed runs (red indicator)
2. Select the run
3. Identify failed steps (red)
4. Click step → Output to see error

### Compare Runs

1. Browse multiple runs
2. Check status differences
3. View step outputs
4. Identify patterns

## Notes

- Runs are sorted newest-first
- Each run shows complete flow visualization
- Step output available via Output button
- Pagination when many runs exist
- Select a run to see step details