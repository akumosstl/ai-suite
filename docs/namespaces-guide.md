# Namespaces Management Guide

This guide explains how to use the Namespaces feature in AI Suite to view and manage namespaces across different entity types.

## Accessing Namespaces

Navigate to `/namespaces` in your browser to access the Namespaces management screen.

## Overview

The Namespaces screen provides a **dashboard view** for organizing and managing entities by namespace. It has two main panels:

| Panel | Description |
|-------|-------------|
| Left Panel | Namespace list with type filter and search |
| Right Panel | Namespace dashboard with details and references |

### Type Selector

Namespaces are organized by entity type. Use the type buttons to filter:

| Type | Icon | Description |
|------|------|-------------|
| Agents | Robot | Agent namespaces |
| Skills | Brain | Skill namespaces |
| Commands | Terminal | Command namespaces |
| Scripts | Code | Script namespaces |
| Instructions | List | Instruction namespaces |
| Plugins | Puzzle | Plugin namespaces |
| Tools | Wrench | Tool namespaces |

## Viewing Namespaces

### Namespace List (Left Panel)

Click on any namespace in the list to view its dashboard. Each namespace shows:
- Namespace icon
- Namespace name

### Selecting a Namespace

After selecting a namespace, the right panel shows the **Namespace Dashboard** with three sections.

## Namespace Dashboard

### 1. Header

The top of the dashboard shows:
- **Namespace:** (selected namespace name)
- **Item count:** Total number of items in this namespace

### 2. Items in Namespace

A table displaying all entities in the selected namespace:

| Column | Description |
|--------|-------------|
| Name | Entity name |
| Description | Entity description |
| Scope | Entity scope (global/project) |

### 3. Pipelines Using This Namespace

Lists all pipelines that reference entities from this namespace. Shows pipeline name and icon.

### 4. Projects Using This Namespace

Lists all projects that use entities from this namespace. Shows project name and folder icon.

## Searching Namespaces

### Search by Namespace Name

Type in the search field and press Enter or click the search icon.

### Filter by Type

Click the type buttons to filter namespaces by entity type.

### Clear Search

Click the X button to clear the search and show all namespaces.

## Clearing a Namespace

The **Clear** button removes items from the selected namespace.

### Important Constraints

- Only deletes items **not used** by any pipeline or project
- Items actively referenced by pipelines are protected
- Items actively referenced by projects are protected
- A confirmation dialog appears before clearing

### Confirmation Dialog

The dialog shows:
```
Are you sure you want to clear all [type] in namespace "[name]"? 
This will only delete items not used by any pipeline or project.
```

Click **Clear** to proceed or **Cancel** to abort.

### Success/Failure Message

After clearing, a dialog shows:
- **Success:** Number of items deleted
- **Failure:** Reason why clearing didn't work (e.g., all items are in use)

## Understanding Namespace Relationships

Namespaces help organize entities into logical groups. The dashboard shows:

| Relationship | Description |
|-------------|-------------|
| Items | Entities belonging to this namespace |
| Pipelines | Pipelines using these entities |
| Projects | Projects using these entities |

This helps you understand:
- Which entities belong together
- What would break if you delete a namespace
- Dependencies between components

## Use Cases

### Finding Unused Entities

1. Select a type (e.g., Agents)
2. Find a namespace with 0 items
3. This namespace has no entities

### Checking Dependencies

1. Select a namespace
2. Check "Pipelines Using This Namespace"
3. Check "Projects Using This Namespace"
4. If empty, the namespace is not in active use

### Cleaning Up

1. Find a namespace with unused items
2. Click Clear to safely remove unused entities
3. Only items not in use will be deleted

## Notes

- Namespaces are automatically created when entities are assigned
- The dashboard shows real-time item counts
- Protected items cannot be cleared (they're in use)
- Type selection persists when switching between screens
- Empty namespaces show 0 items in the header