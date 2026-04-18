# Commands Management Guide

This guide explains how to use the Commands feature in AI Suite to create and manage CLI commands.

## Accessing Commands

Navigate to `/commands` in your browser to access the Commands management screen.

## Overview

The Commands screen allows you to create and manage **CLI commands** that can be executed in pipelines. It follows the standard two-panel layout:

| Panel | Description |
|-------|-------------|
| Left Panel | Command list with search |
| Right Panel | Command details form |

### Command Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Command identifier |
| Namespace | No | Category grouping |
| Path | No | Command path |
| Command | Yes | The CLI command to execute |
| Description | No | Command purpose |

## Creating a Command

### Step 1: Add New Command

Click the "Add" button to clear the form.

### Step 2: Fill Details

- **Name** - Unique identifier
- **Namespace** - Category (optional)
- **Path** - File path (optional)
- **Command** - The actual command to run
- **Description** - What it does

### Step 3: Save

Click **Create Command** to save.

## Editing a Command

1. Select command from list
2. Modify fields
3. Click **Update Command**

## Deleting a Command

### Method 1: Delete Button

Select and click delete icon in header.

### Method 2: Inline Delete

Click delete icon next to command in list.

## Searching Commands

- Search by name
- Filter by namespace
- Use pagination for many commands

## Command Execution

Commands are used in pipelines as **Command Steps**. When executed:
- The command runs in the configured environment
- Output is captured and displayed
- Exit code determines success/failure

## Use Cases

### CLI Tool Integration

1. Create command for CLI tool
2. Add as step in pipeline
3. Execute via pipeline run

### Script Execution

1. Define command wrapping script
2. Use in pipeline
3. Capture output for next step

## Notes

- Commands wrap CLI executable calls
- Support via path for tool location
- Namespace organizes commands into groups
- Can be used in any pipeline step type