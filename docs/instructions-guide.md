# Instructions Management Guide

This guide explains how to use the Instructions feature in AI Suite to create and manage instruction sets.

## Accessing Instructions

Navigate to `/instructions` in your browser to access the Instructions management screen.

## Overview

The Instructions screen allows you to create and manage **instruction sets** that define behavior or rules. Similar to Skills and Tools:

| Panel | Description |
|-------|-------------|
| Left Panel | Instruction list with search |
| Right Panel | Instruction details form |

### Unique Feature: Instruction Files

Instructions can include **files** - supporting documents or rules files.

## Instruction Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Instruction set identifier |
| Namespace | No | Category grouping |
| Path | No | Reference path |
| Description | No | Purpose description |
| Instructions | Yes | The instruction content |

## Creating an Instruction Set

### Step 1: Add New Instruction

Click the "Add" button to clear the form.

### Step 2: Fill Details

- **Name** - Unique identifier
- **Namespace** - Category
- **Path** - Reference path
- **Description** - What it defines
- **Instructions** - The actual instructions

### Step 3: Add Files (Optional)

Instructions can reference files:
1. Click **Add File** button
2. Enter file path
3. Enter file name
4. Provide file content
5. Click Add

### Step 4: Save

Click **Create Instruction** to save.

## Editing Instructions

1. Select instruction from list
2. Modify fields
3. Add/remove files
4. Click **Update Instruction**

## Deleting Instructions

### Method 1: Delete Button

1. Select instruction
2. Click delete icon in header

### Method 2: Inline Delete

1. Click delete icon next to instruction
2. Confirm deletion

## Searching Instructions

- Search by name
- Filter by namespace
- Clear search with X button
- Pagination for many results

## Using Instructions in Pipelines

Instructions are used in pipelines as **Instruction Steps**. When executed:
- Instructions are loaded as rules
- Files provide supporting data
- Define behavior for subsequent steps

## Template Support

Instructions support templates:
1. Select a template
2. Template populates instructions
3. Modify as needed

## Use Cases

### Define Rules

1. Create instruction set with rules
2. Use as first step in pipeline
3. Subsequent steps follow rules

### Configuration

1. Define configuration instructions
2. Reference in pipeline
3. Steps use configuration

## Notes

- Instructions define rules/guidelines
- Files provide supporting data
- Namespace organizes instruction sets
- Used in pipeline instruction steps