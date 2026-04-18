# Scripts Management Guide

This guide explains how to use the Scripts feature in AI Suite to create and manage executable scripts.

## Accessing Scripts

Navigate to `/scripts` in your browser to access the Scripts management screen.

## Overview

The Scripts screen allows you to create and manage **executable scripts** that can be run in pipelines. It follows the standard two-panel layout:

| Panel | Description |
|-------|-------------|
| Left Panel | Script list with search |
| Right Panel | Script details form |

### Note: Scripts vs Other Entities

Unlike Skills, Tools, and Instructions, Scripts do **not** have a files section - they contain the script content directly.

## Script Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Script identifier |
| Namespace | No | Category grouping |
| Path | No | Script path reference |
| Description | No | Script purpose |
| Script | Yes | The actual script code |

## Creating a Script

### Step 1: Add New Script

Click the "Add" button to clear the form.

### Step 2: Fill Details

- **Name** - Unique identifier
- **Namespace** - Category
- **Path** - File path (optional)
- **Description** - What it does
- **Script** - The script code to execute

### Step 3: Edit Script (Optional)

Click "Open in Editor" to use the modal editor for better editing experience.

### Step 4: Save

Click **Create Script** to save.

## Editing a Script

1. Select script from list
2. Modify fields
3. Click **Update Script**

## Deleting a Script

### Method 1: Delete Button

1. Select script
2. Click delete icon in header

### Method 2: Inline Delete

1. Click delete icon next to script
2. Confirm deletion

## Searching Scripts

- Search by name
- Filter by namespace
- Clear search with X button
- Pagination for many results

## Using Scripts in Pipelines

Scripts are used in pipelines as **Script Steps**. When executed:
- Script code runs in the configured environment
- Output is captured
- Exit code determines success/failure

## Template Support

Scripts support templates for quick starting:
1. Select a template from dropdown
2. Template populates script content
3. Modify as needed

## Copy Script to Clipboard

Click the copy button next to the script textarea to copy the script code to your clipboard.

## Use Cases

### Custom Processing

1. Create script for data processing
2. Add as step in pipeline
3. Use output in subsequent steps

### File Operations

1. Create script for file handling
2. Add to pipeline
3. Process files during execution

### API Integration

1. Create script for API calls
2. Use in pipeline
3. Pass data between steps

## Notes

- Scripts contain executable code directly
- No files section (unlike Skills/Tools/Instructions)
- Script content can be copied to clipboard
- Templates available for common patterns
- Used in pipeline script steps