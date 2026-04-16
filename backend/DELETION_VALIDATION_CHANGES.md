# Deletion Validation and File Cleanup Implementation

## Overview
This document summarizes the implementation of deletion validation and associated file cleanup for various entities in the system. The system now prevents deletion of items that have:
1. Project associations
2. Pipeline relationships (for Agents and Scripts)

Associated files are properly deleted when items are removed.

## Changes Made

### 1. Service Layer Modifications

#### AgentService
- **Changes**: 
  - Modified `deleteAgent()` method to validate project associations before deletion
  - Added check for pipeline relationships via PipelineStep
  - Injected `PipelineStepRepository`
- **Behavior**: 
  - Throws `RuntimeException` if agent is associated with any project
  - Throws `RuntimeException` if agent is used in any pipeline step
- **Error Messages**: 
  - "Cannot delete agent because it is associated with project: {projectName}"
  - "Cannot delete agent because it is associated with pipeline: {pipelineName}"

#### SkillService
- **Changes**: 
  - Added validation for project associations
  - Added call to `SkillFileService.deleteFilesBySkillId()` when deletion is allowed
  - Injected `SkillFileService`
- **Behavior**: Throws error if associated with projects; otherwise deletes skill and all related files

#### PluginService
- **Changes**:
  - Added validation for project associations
  - Added call to `PluginFileService.deleteFilesByPluginId()` when deletion is allowed
  - Injected `PluginFileService` and `ProjectRepository`
- **Behavior**: Throws error if associated with projects; otherwise deletes plugin and all related files

#### CommandService
- **Change**: Added validation for project associations
- **Behavior**: Throws error if associated with projects
- **Injected**: `ProjectRepository`

#### ToolService
- **Changes**:
  - Added validation for project associations
  - Added call to `ToolFileService.deleteFilesByToolId()` when deletion is allowed
  - Injected `ToolFileService` and `ProjectRepository`
- **Behavior**: Throws error if associated with projects; otherwise deletes tool and all related files

#### InstructionService
- **Changes**:
  - Added validation for project associations
  - Added call to `InstructionFileService.deleteFilesByInstructionId()` when deletion is allowed
  - Injected `InstructionFileService` and `ProjectRepository`
- **Behavior**: Throws error if associated with projects; otherwise deletes instruction and all related files

#### ScriptService
- **Changes**:
  - Added validation for project associations
  - Added check for pipeline relationships via PipelineStep
  - Injected `ProjectRepository` and `PipelineStepRepository`
- **Behavior**: 
  - Throws error if associated with projects
  - Throws error if used in any pipeline step
- **Error Messages**:
  - "Cannot delete script because it is associated with project: {projectName}"
  - "Cannot delete script because it is associated with pipeline: {pipelineName}"

### 2. Controller Layer Modifications

All delete endpoints have been updated with try-catch blocks to handle deletion errors gracefully:

#### AgentController
- Modified `deleteAgent()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

#### SkillController
- Modified `deleteSkill()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

#### PluginController
- Modified `deletePlugin()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

#### CommandController
- Modified `deleteCommand()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

#### ToolController
- Modified `deleteTool()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

#### InstructionController
- Modified `deleteInstruction()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

#### ScriptController
- Modified `deleteScript()` DELETE endpoint
- Returns error response with HTTP 400 status if deletion validation fails

## Response Format

### Success Response (HTTP 200)
```json
{
  "message": "{Entity} deleted successfully"
}
```

### Error Response (HTTP 400)
```json
{
  "error": "Cannot delete {entity} because it is associated with project: {projectName}"
}
```

## Project Associations Checked

The following project relationships are now validated before deletion:

| Entity | Relationship Table | Field in Project |
|--------|-------------------|------------------|
| Agent | project_agents | agents |
| Skill | project_skills | skills |
| Plugin | project_plugins | plugins |
| Command | project_commands | commands |
| Tool | project_tools | tools |
| Instruction | project_instructions | instructions |
| Script | project_scripts | scripts |

## Pipeline Associations Checked

The following pipeline relationships are now validated before deletion:

| Entity | Relationship | Via | Query Method |
|--------|-------------|-----|--------------|
| Agent | PipelineStep.agent_id | PipelineStep | `findByAgent_Id()` |
| Script | PipelineStep.script_id | PipelineStep | `findByScript_Id()` |

## File Cleanup

The following entities now have their associated files deleted when the entity is deleted (if no project relations exist):

| Entity | File Service | Repository Method |
|--------|-------------|------------------|
| Skill | SkillFileService | deleteFilesBySkillId() |
| Plugin | PluginFileService | deleteFilesByPluginId() |
| Tool | ToolFileService | deleteFilesByToolId() |
| Instruction | InstructionFileService | deleteFilesByInstructionId() |

## Implementation Details

### Deletion Process Flow

1. **Check Project Associations**
   - Query all projects from database
   - Check if entity is contained in relevant project collection
   - If found, throw exception with project name

2. **Check Pipeline Associations (for Agent and Script only)**
   - Query PipelineStep table for relations
   - If Agent: check `findByAgent_Id()`
   - If Script: check `findByScript_Id()`
   - If found, throw exception with pipeline name

3. **If No Associations Found**
   - For Skill, Plugin, Tool, Instruction: Delete associated files first
   - Delete the entity itself from database
   - Return HTTP 200 with success message

### Error Handling

All delete operations are wrapped in try-catch blocks that:
- Catch RuntimeException thrown by service layer
- Extract error message
- Return HTTP 400 Bad Request response
- Provide clear error message to client

## Testing Recommendations

1. **Test Project Associations**
   - Create entity
   - Associate with project
   - Attempt deletion (should fail)

2. **Test File Cleanup**
   - Create entity with files
   - Don't associate with any project
   - Delete entity (should succeed and clean up files)

3. **Test Error Messages**
   - Verify error messages are clear and actionable
   - Verify HTTP status codes are correct

## Backward Compatibility

- All existing endpoints maintain same URL structure
- Only internal behavior changed (validation logic added)
- Successful deletions return same response format
- Error handling is additive (no existing success cases broken)

## Database Considerations

- No schema changes required
- Existing project-entity relationships are used as-is
- Lazy loading configuration on relationships preserved

