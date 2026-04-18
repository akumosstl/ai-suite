# Agent Management Guide

This guide explains how to use the Agents feature in AI Suite to create, manage, and organize AI agents.

## Accessing Agents

Navigate to `/agents` in your browser to access the Agents management screen.

## Overview

The Agents screen has two main panels:

| Panel | Description |
|-------|-------------|
| Left Panel | Agent list with search and pagination |
| Right Panel | Agent details form for create/edit |

## Creating an Agent

### Step 1: Click Add New Agent

Click the "Add" button (person icon) in the top-left corner of the left panel to reset the form for a new agent.

### Step 2: Fill in Agent Details

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Agent identifier |
| Namespace | No | Category/organization grouping |
| Path | No | Optional path reference |
| Description | No | Agent purpose description |
| Prompt | No | System prompt/instructions |

### Step 3: Add a Template (Optional)

Select a template from the dropdown to populate the prompt field with predefined instructions.

### Step 4: Edit the Prompt

Click the "Open in Editor" button to open the prompt editor in a modal for easier editing with syntax highlighting.

### Step 5: Save the Agent

Click **Create Agent** to save the new agent to the system.

## Searching Agents

### Search by Name

Type in the "Search by name..." field and press Enter or click the search icon.

### Filter by Namespace

Select or type a namespace in the Namespace field to filter agents by category.

### Clear Search

Click the X button to clear all filters and show all agents.

## Editing an Agent

1. Click on an agent in the left panel list
2. Modify any fields in the right panel
3. Click **Update Agent** to save changes

## Deleting an Agent

### Method 1: Delete Button

1. Select an agent from the list
2. Click the delete icon in the right panel header

### Method 2: Inline Delete

Click the delete icon next to the agent in the list. A confirmation dialog will appear.

## Copying Prompt to Clipboard

Click the "Copy to clipboard" button next to the prompt textarea to copy the agent's prompt to your clipboard.

## Pagination

Use the paginator at the bottom of the agent list to navigate through pages of agents. You can change the page size and jump to first/last pages.

## Status Messages

The system displays status messages at the bottom of the form:

| Type | Indicates |
|------|-----------|
| Success (green) | Agent created/updated/deleted successfully |
| Error (red) | Operation failed |
| Info (blue) | General information |

## Notes

- Agent names must be unique
- Namespaces help organize agents into categories
- The prompt field supports full text editing in the modal editor
- Templates can be applied to quickly get started with common agent patterns