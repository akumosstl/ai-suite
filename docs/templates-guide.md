# Templates Management Guide

This guide explains how to use the Templates feature in AI Suite to create and manage reusable templates for different entity types.

## Accessing Templates

Navigate to `/templates` in your browser to access the Templates management screen.

## Overview

The Templates screen has two main panels:

| Panel | Description |
|-------|-------------|
| Left Panel | Template list with type filter and search |
| Right Panel | Template details form |

### Unique Feature: Type Selector

Templates are organized by entity type. Use the type buttons to filter:

| Type | Icon | Description |
|------|------|-------------|
| Agents | Robot | Prompt templates for agents |
| Skills | Brain | Skill instruction templates |
| Commands | Terminal | Command templates |
| Scripts | Code | Script templates |
| Instructions | List | Instruction templates |
| Plugins | Puzzle | Plugin templates |
| Tools | Wrench | Tool templates |

## Creating a Template

### Step 1: Select Template Type

Click one of the type buttons at the top to choose which type of template you're creating. This determines where the template can be used:

- **Agents** - Available when creating agents
- **Skills** - Available when creating skills
- **Commands** - Available when creating commands
- **Scripts** - Available when creating scripts
- **Instructions** - Available when creating instructions
- **Plugins** - Available when creating plugins
- **Tools** - Available when creating tools

### Step 2: Fill in Template Details

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Template identifier |
| Description | No | Brief description of the template |
| Template | Yes | The template content |

### Step 3: Save the Template

Click **Create Template** to save. The button will show "Update Template" when editing an existing template.

## Editing a Template

1. Select a template type from the type buttons
2. Click on a template in the list
3. Modify any fields in the right panel
4. Click **Update Template** to save changes

## Deleting a Template

### Method 1: Delete Button

1. Select a template from the list
2. Click the delete icon in the right panel header

### Method 2: Inline Delete

Click the delete icon next to the template in the list. A confirmation dialog will appear.

## Searching Templates

### Search by Name

Type in the search field and press Enter or click the search icon.

### Filter by Type

Click the type buttons to filter templates by entity type.

### Clear Search

Click the X button to clear the search and show all templates of the selected type.

## Template Form Fields

### Name Field

Enter a unique name for the template.

### Description Field

Provide a brief description explaining what this template is for.

### Template Field

Enter the template content. This can include:

- Placeholders for dynamic values
- Reusable instructions
- Default configurations
- Prompt patterns

Example templates might include:
- System prompts for agents
- Default skill instructions
- Command patterns
- Script boilerplates

## Pagination

Use the paginator at the bottom of the template list to navigate through pages of templates.

## Status Messages

Dialogs will appear confirming:

| Type | Indicates |
|------|-----------|
| Success | Template created/updated/deleted |
| Error | Operation failed |

## Notes

- Templates are type-specific - an agent template can only be used when creating agents
- Template content can include placeholder syntax for dynamic values
- The type selector must be selected before creating a template (required field)
- Both Name and Template fields are required to create a new template
- Templates provide starting points, not complete solutions
- Use descriptions to help users understand when to use each template