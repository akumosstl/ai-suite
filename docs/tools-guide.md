# Tools Management Guide

This guide explains how to use the Tools feature in AI Suite to create and manage utility tools.

## Accessing Tools

Navigate to `/tools` in your browser to access the Tools management screen.

## Overview

The Tools screen allows you to create and manage **utility tools** that can be used in pipelines. Similar to Skills:

| Panel | Description |
|-------|-------------|
| Left Panel | Tool list with search |
| Right Panel | Tool details form |

### Unique Feature: Tool Files

Tools can include **files** - supporting executables or libraries the tool uses.

## Tool Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Tool identifier |
| Namespace | No | Category grouping |
| Path | No | Tool path/location |
| Description | No | Tool purpose |
| Instructions | Yes | How to use the tool |

## Creating a Tool

### Step 1: Add New Tool

Click the "Add" button to clear the form.

### Step 2: Fill Details

- **Name** - Unique identifier
- **Namespace** - Category
- **Path** - Tool location
- **Description** - What it does
- **Instructions** - Usage instructions

### Step 3: Add Files (Optional)

Tools can reference files:
1. Click **Add File** button
2. Enter file path
3. Enter file name
4. Provide file content
5. Click Add

### Step 4: Save

Click **Create Tool** to save.

## Editing a Tool

1. Select tool from list
2. Modify fields
3. Add/remove files
4. Click **Update Tool**

## Deleting a Tool

### Method 1: Delete Button

1. Select tool
2. Click delete icon in header

### Method 2: Inline Delete

1. Click delete icon next to tool
2. Confirm deletion

## Searching Tools

- Search by name
- Filter by namespace
- Pagination for many results

## Using Tools in Pipelines

Tools are used in pipelines as **Tool Steps**. When executed:
- Instructions define how to use tool
- Files provide dependencies
- Tool performs its defined function

## Template Support

Tools support templates for quick starting:
1. Select a template
2. Template populates instructions
3. Modify as needed

## Notes

- Tools provide reusable utilities
- Files can include dependencies
- Instructions define usage
- Namespace organizes tools
- Used in pipeline tool steps