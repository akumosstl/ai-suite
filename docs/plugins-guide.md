# Plugin Management Guide

This guide explains how to use the Plugins feature in AI Suite to create, manage, and organize plugin extensions.

## Accessing Plugins

Navigate to `/plugins` in your browser to access the Plugins management screen.

## Overview

The Plugins screen has two main panels:

| Panel | Description |
|-------|-------------|
| Left Panel | Plugin list with search and pagination |
| Right Panel | Plugin details form for create/edit |

## Creating a Plugin

### Step 1: Click Add New Plugin

Click the "Add" button (plus circle icon) in the top-left corner of the left panel to reset the form for a new plugin.

### Step 2: Fill in Plugin Details

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Plugin identifier |
| Namespace | No | Category/organization grouping |
| Path | No | Optional path reference |
| Description | No | Plugin purpose description |
| Instructions | No | Plugin execution instructions |

### Step 3: Add a Template (Optional)

Select a template from the dropdown to populate the instructions field with predefined content.

### Step 4: Edit the Instructions

Click the "Open in Editor" button to open the instructions editor in a modal for easier editing with syntax highlighting.

### Step 5: Add Files (Optional)

Plugins can reference external files. Click **Add File** to attach files:

1. Click "Add File" button in the Files section
2. Enter the file path
3. Enter the file name
4. Provide file content (optional)
5. Click Add to attach the file

Files are displayed in a table with:
- Path - Location of the file
- File Name - Name of the file
- Actions - Delete button

### Step 6: Save the Plugin

Click **Create Plugin** to save the new plugin to the system.

## Searching Plugins

### Search by Name

Type in the "Search by name..." field and press Enter or click the search icon.

### Filter by Namespace

Select or type a namespace in the Namespace field to filter plugins by category.

### Clear Search

Click the X button to clear all filters and show all plugins.

## Editing a Plugin

1. Click on a plugin in the left panel list
2. Modify any fields in the right panel
3. Add or remove files as needed
4. Click **Update Plugin** to save changes

## Deleting a Plugin

### Method 1: Delete Button

1. Select a plugin from the list
2. Click the delete icon in the right panel header

### Method 2: Inline Delete

Click the delete icon next to the plugin in the list. A confirmation dialog will appear.

## Copying Instructions to Clipboard

Click the "Copy to clipboard" button next to the instructions textarea to copy the plugin's instructions to your clipboard.

## Pagination

Use the paginator at the bottom of the plugin list to navigate through pages of plugins. You can change the page size and jump to first/last pages.

## Status Messages

The system displays status messages at the bottom of the form:

| Type | Indicates |
|------|-----------|
| Success (green) | Plugin created/updated/deleted successfully |
| Error (red) | Operation failed |
| Info (blue) | General information |

## Notes

- Plugin names must be unique
- Namespaces help organize plugins into categories
- The instructions field supports full text editing in the modal editor
- Templates can be applied to quickly get started with common plugin patterns
- Files are synced when updating plugins - new files are added, removed files are deleted
- Plugins extend system capabilities through configurable instructions and file references