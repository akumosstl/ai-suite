# Testing Guide - Deletion Validation

## Overview
This guide explains how to test the deletion validation feature to ensure agents, scripts, and other entities cannot be deleted if they have project or pipeline relationships.

## Test Scenarios

### Test 1: Delete Agent Associated with Project

**Setup:**
1. Create a new Agent: `POST /api/agents` with name "TestAgent"
2. Create a Project: `POST /api/projects` with name "TestProject"
3. Associate the agent with the project (via project management UI or API)

**Action:**
```
DELETE /api/agents/{agentId}
```

**Expected Result:**
- HTTP Status: **400 Bad Request**
- Response Body:
```json
{
  "error": "Cannot delete agent because it is associated with project: TestProject"
}
```

---

### Test 2: Delete Agent Used in Pipeline

**Setup:**
1. Create a new Agent: `POST /api/agents` with name "PipelineAgent"
2. Create a Pipeline: `POST /api/pipelines` with name "TestPipeline"
3. Create a Pipeline Step using the Agent:
   - `POST /api/pipelines/{pipelineId}/steps` with agent_id set to the agent

**Action:**
```
DELETE /api/agents/{agentId}
```

**Expected Result:**
- HTTP Status: **400 Bad Request**
- Response Body:
```json
{
  "error": "Cannot delete agent because it is associated with pipeline: TestPipeline"
}
```

---

### Test 3: Delete Agent with NO Relations (Should Succeed)

**Setup:**
1. Create a new Agent: `POST /api/agents` with name "OrphanAgent"
2. Do NOT associate it with any project or pipeline

**Action:**
```
DELETE /api/agents/{agentId}
```

**Expected Result:**
- HTTP Status: **200 OK**
- Response Body:
```json
{
  "message": "Agent deleted successfully"
}
```

---

### Test 4: Delete Script Associated with Project

**Setup:**
1. Create a new Script: `POST /api/scripts` with name "TestScript"
2. Create a Project: `POST /api/projects` with name "TestProject"
3. Associate the script with the project (via project management)

**Action:**
```
DELETE /api/scripts/{scriptId}
```

**Expected Result:**
- HTTP Status: **400 Bad Request**
- Response Body:
```json
{
  "error": "Cannot delete script because it is associated with project: TestProject"
}
```

---

### Test 5: Delete Script Used in Pipeline

**Setup:**
1. Create a new Script: `POST /api/scripts` with name "PipelineScript"
2. Create a Pipeline: `POST /api/pipelines` with name "TestPipeline"
3. Create a Pipeline Step using the Script:
   - `POST /api/pipelines/{pipelineId}/steps` with script_id set to the script

**Action:**
```
DELETE /api/scripts/{scriptId}
```

**Expected Result:**
- HTTP Status: **400 Bad Request**
- Response Body:
```json
{
  "error": "Cannot delete script because it is associated with pipeline: TestPipeline"
}
```

---

### Test 6: Delete Skill with File Cleanup

**Setup:**
1. Create a new Skill: `POST /api/skills` with name "TestSkill"
2. Add files to the skill (if applicable via SkillFileController)
3. Do NOT associate it with any project

**Action:**
```
DELETE /api/skills/{skillId}
```

**Expected Result:**
- HTTP Status: **200 OK**
- Response Body:
```json
{
  "message": "Skill deleted successfully"
}
```
- All associated skill files should be deleted from database

---

### Test 7: Delete Command Associated with Project

**Setup:**
1. Create a new Command: `POST /api/commands` with name "TestCommand"
2. Create a Project: `POST /api/projects` with name "TestProject"
3. Associate the command with the project

**Action:**
```
DELETE /api/commands/{commandId}
```

**Expected Result:**
- HTTP Status: **400 Bad Request**
- Response Body:
```json
{
  "error": "Cannot delete command because it is associated with project: TestProject"
}
```

---

### Test 8: Delete Tool with File Cleanup

**Setup:**
1. Create a new Tool: `POST /api/tools` with name "TestTool"
2. Add files to the tool (if applicable via ToolFileController)
3. Do NOT associate it with any project

**Action:**
```
DELETE /api/tools/{toolId}
```

**Expected Result:**
- HTTP Status: **200 OK**
- Response Body:
```json
{
  "message": "Tool deleted successfully"
}
```
- All associated tool files should be deleted from database

---

### Test 9: Delete Instruction with File Cleanup

**Setup:**
1. Create a new Instruction: `POST /api/instructions` with name "TestInstruction"
2. Add files to the instruction (if applicable)
3. Do NOT associate it with any project

**Action:**
```
DELETE /api/instructions/{instructionId}
```

**Expected Result:**
- HTTP Status: **200 OK**
- Response Body:
```json
{
  "message": "Instruction deleted successfully"
}
```
- All associated instruction files should be deleted from database

---

### Test 10: Delete Plugin with File Cleanup

**Setup:**
1. Create a new Plugin: `POST /api/plugins` with name "TestPlugin"
2. Add files to the plugin (if applicable)
3. Do NOT associate it with any project

**Action:**
```
DELETE /api/plugins/{pluginId}
```

**Expected Result:**
- HTTP Status: **200 OK**
- Response Body:
```json
{
  "message": "Plugin deleted successfully"
}
```
- All associated plugin files should be deleted from database

---

## Validation Checklist

- [ ] Agent deletion blocked when in project
- [ ] Agent deletion blocked when in pipeline
- [ ] Agent deletion succeeds when orphaned
- [ ] Script deletion blocked when in project
- [ ] Script deletion blocked when in pipeline
- [ ] Script deletion succeeds when orphaned
- [ ] Skill deletion blocked when in project
- [ ] Skill files deleted when skill is deleted
- [ ] Command deletion blocked when in project
- [ ] Tool deletion blocked when in project
- [ ] Tool files deleted when tool is deleted
- [ ] Instruction deletion blocked when in project
- [ ] Instruction files deleted when instruction is deleted
- [ ] Plugin deletion blocked when in project
- [ ] Plugin files deleted when plugin is deleted

## Error Message Verification

- [ ] Error messages clearly indicate the project name
- [ ] Error messages clearly indicate the pipeline name
- [ ] HTTP status codes are correct (400 for errors, 200 for success)
- [ ] Response format is consistent across all entities

## Edge Cases to Test

1. **Multiple Project Associations**
   - Agent associated with Project A and Project B
   - When attempting to delete, should show the first project found

2. **Multiple Pipeline Associations**
   - Agent used in PipelineStep 1 and PipelineStep 2 of the same pipeline
   - When attempting to delete, should show the pipeline name

3. **Orphaned Relationships**
   - Agent that was previously in a project but has been removed
   - Should delete successfully if no longer in any project/pipeline

4. **Null Pipeline Name**
   - Pipeline Step with null pipeline reference (data inconsistency)
   - Error message should show "Unknown" instead of crashing

## Database Verification

After successful deletions, verify:

```sql
-- Verify agent is deleted
SELECT * FROM agent WHERE id = {agentId};

-- Verify skill files are deleted
SELECT * FROM skill_file WHERE skill_id = {skillId};

-- Verify tool files are deleted  
SELECT * FROM tool_file WHERE tool_id = {toolId};

-- Verify instruction files are deleted
SELECT * FROM instruction_file WHERE instruction_id = {instructionId};

-- Verify plugin files are deleted
SELECT * FROM plugin_file WHERE plugin_id = {pluginId};
```

All should return empty result sets.

## Performance Notes

- All validation checks are done with lazy loading to avoid large data loads
- Project checks iterate through all projects (consider indexing if large dataset)
- Pipeline checks are targeted queries by ID
- File cleanup is done via repository delete methods (efficient)

## Regression Testing

After each deployment, verify:
1. Existing delete functionality still works for orphaned entities
2. Error messages display correctly in frontend
3. No unexpected database state after failed deletions

