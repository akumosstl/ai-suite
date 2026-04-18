# Skills Management Guide

This guide explains how to use the Skills feature in AI Suite to create and manage AI skills.

## Accessing Skills

Navigate to `/skills` in your browser to access the Skills management screen.

## Overview

The Skills screen allows you to create and manage **AI skills** that can be invoked in pipelines. Similar structure to Agents:

| Panel | Description |
|-------|-------------|
| Left Panel | Skill list with search |
| Right Panel | Skill details form |

### Unique Feature: Skill Files

Skills can include **files** - supporting documents or data that the skill uses.

## Skill Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Skill identifier |
| Namespace | No | Category grouping |
| Path | No | File path reference |
| Description | No | Skill purpose |
| Instructions | Yes | Skill execution instructions |

## Creating a Skill

### Step 1: Add New Skill

Click the "Add" button to clear the form.

### Step 2: Fill Details

- **Name** - Unique identifier
- **Namespace** - Category
- **Path** - Path reference
- **Description** - What it does
- **Instructions** - How the skill executes

### Step 3: Add Files (Optional)

Skills can reference files:
1. Click **Add File** button
2. Enter file path
3. Enter file name
4. Provide file content
5. Click Add

Files are displayed in a table with path, name, and delete options.

### Step 4: Save

Click **Create Skill** to save.

## Editing a Skill

1. Select skill from list
2. Modify fields
3. Add/remove files
4. Click **Update Skill**

## Deleting a Skill

### Method 1: Delete Button

1. Select skill
2. Click delete icon in header

### Method 2: Inline Delete

1. Click delete icon next to skill
2. Confirm deletion

## Searching Skills

- Search by name
- Filter by namespace
- Clear search with X button
- Pagination for many results

## Using Skills in Pipelines

Skills are used in pipelines as **Skill Steps**. When executed:
- Instructions are loaded
- Files are available
- Skill performs its defined task

## Template Support

Skills support templates for quick starting:
1. Select a template from dropdown
2. Template content populates instructions
3. Modify as needed
4. Save skill

## Notes

- Skills define reusable capabilities
- Files provide supporting data
- Instructions tell the skill how to operate
- Namespace organizes skills into categories
- Can be used in pipeline skill steps