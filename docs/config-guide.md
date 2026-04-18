# Configuration Guide

This guide explains how to use the Configuration feature in AI Suite to manage targets and resource paths.

## Accessing Configuration

Navigate to `/config` in your browser to access the Configuration screen.

## Overview

The Configuration screen manages **Targets** - configurations that define file paths for different resource types. Targets tell the system where to find:

- Skills
- Commands
- Scripts
- Agents
- Instructions
- Plugins
- Tools

## Understanding the UI

### Two Views

| View | Description |
|------|-------------|
| List | Table showing all targets |
| Form | Create/Edit target form |

### Layout

| Section | Description |
|---------|-------------|
| Top Bar | Logo and Home button |
| Left Panel | Navigation menu |
| Right Panel | Target list or form |

## Managing Targets

### Viewing Targets

The target table shows:
| Column | Description |
|--------|-------------|
| Name | Target identifier |
| Skills Path | Location of skills files |
| Commands Path | Location of commands files |
| Scripts Path | Location of scripts files |
| Agents Path | Location of agents files |
| Instructions Path | Location of instructions files |
| Plugins Path | Location of plugins files |
| Tools Path | Location of tools files |
| Actions | Delete button |

### Selecting a Target

Click any row to edit that target.

### Creating a Target

#### Step 1: Add New Target

Click the **+** button to open the form.

#### Step 2: Fill in Paths

| Field | Description | Example |
|-------|-------------|---------|
| Name | Target identifier | opencode |
| Skills Path | Skills location | .opencode/skills |
| Commands Path | Commands location | .opencode/commands |
| Scripts Path | Scripts location | .opencode/scripts |
| Agents Path | Agents location | .opencode/agents |
| Instructions Path | Instructions location | .opencode/instructions |
| Plugins Path | Plugins location | .opencode/plugins |
| Tools Path | Tools location | .opencode/tools |

#### Step 3: Save

Click **Create** to save the new target.

### Editing a Target

1. Click on a target row
2. Modify any path fields
3. Click **Update** to save changes

### Deleting a Target

1. Click the delete icon on the target row
2. Confirm deletion in the dialog

**Note:** Deletion cannot be undone.

## Default Target

When no targets exist, a default target is created:

```
Name: opencode
Skills Path: .opencode\skills
Commands Path: .opencode\commands
Scripts Path: .opencode\scripts
Agents Path: .opencode\agents
Instructions Path: .opencode\instructions
Plugins Path: .opencode\plugins
Tools Path: .opencode\tools
```

## Target Form Fields

### Name Field

Enter a unique name for the target (required).

### Path Fields

Each path field specifies where the corresponding resource type is located:

| Path Field | Resource Type | Default |
|------------|---------------|---------|
| Skills Path | Skills | .opencode/skills |
| Commands Path | Commands | .opencode/commands |
| Scripts Path | Scripts | .opencode/scripts |
| Agents Path | Agents | .opencode/agents |
| Instructions Path | Instructions | .opencode/instructions |
| Plugins Path | Plugins | .opencode/plugins |
| Tools Path | Tools | .opencode/tools |

## Use Cases

### Multiple Project Contexts

Create different targets for different project structures:
- Local development
- Production server
- CI/CD pipeline

### Organization

Use targets to organize resources:
- Group by feature
- Group by team
- Group by environment

### Migration

Change resource locations:
1. Create new target
2. Update path fields
3. Existing resources remain intact

## Navigation

### Home Button

Click **Home** to return to the main menu.

## Form Actions

| Button | Description |
|--------|-------------|
| Delete | Delete the target (when editing) |
| Cancel | Close the form |
| Create/Update | Save the target |

## Status Messages

The system shows snackbar notifications:

| Message | Meaning |
|---------|---------|
| Target created successfully | New target saved |
| Target updated successfully | Changes saved |
| Target deleted successfully | Target removed |
| Failed to create/update/delete | Operation failed |

## Notes

- Targets define where resources are stored
- Each target can have unique paths for all 7 resource types
- The default target is created automatically if none exist
- Targets are independent - deleting one doesn't affect others
- Path changes take effect on next resource load