# Plan: Fix Project Deletion - Foreign Key Constraint Violations

## Problem Analysis

Deleting a project fails with foreign key constraint violations in this order:
1. **PipelineRun** - "FK2LSD1S3VPYLU2OPV2C5DFDDCO" - PipelineRun references Pipeline
2. **PipelineStep** - "FK55VFPDSE9XEPOTVUIQ1CBUCW7" - PipelineStep references Pipeline

The cascade from Project → Pipeline → PipelineRun is working (after previous fix), but:
- **PipelineStep** has no cascade relationship from Pipeline
- Pipeline → PipelineRun → PipelineRunStep relationship also missing

## Current Entity Relationships

```
Project (1) ──────► (N) Pipeline
                         │
                         ├─────► (N) PipelineStep  ❌ NO CASCADE
                         │
                         └─────► (N) PipelineRun
                                      │
                                      └─────► (N) PipelineRunStep  ❌ NO CASCADE
```

## Tasks

### Task 1: Add Pipeline → PipelineStep cascade relationship
- **File**: `backend/src/main/java/io/github/akumosstl/agentic/backend/model/Pipeline.java`
- **Action**: Add `@OneToMany` relationship for PipelineStep with `cascade = CascadeType.ALL, orphanRemoval = true`
- **Import needed**: `import io.github.akumosstl.agentic.backend.model.PipelineStep;`

### Task 2: Add PipelineRun → PipelineRunStep cascade relationship
- **File**: `backend/src/main/java/io/github/akumosstl/agentic/backend/model/PipelineRun.java`
- **Action**: Add `@OneToMany` relationship for PipelineRunStep with `cascade = CascadeType.ALL, orphanRemoval = true`
- **Import needed**: `import io.github.akumosstl.agentic.backend.model.PipelineRunStep;`

### Task 3: Verify compilation
- Run `mvn compile` to ensure changes are correct

### Task 4: Test deletion
- Restart backend and test project deletion from frontend

## Expected Result

After fix, the cascade chain should be:
```
Project ──cascade──► Pipeline ──cascade──► PipelineStep
                    │                    (orphanRemoval)
                    ├─cascade──► PipelineRun ──cascade──► PipelineRunStep
                                   (orphanRemoval)
```

When deleting a Project, Hibernate will:
1. Delete all PipelineSteps (via cascade)
2. Delete all PipelineRuns (via cascade)
3. Delete all PipelineRunSteps (via cascade)
4. Delete all Pipelines (via cascade)
5. Delete the Project

## Alternative Approach (Not Recommended)

Instead of cascade, could implement manual deletion in `ProjectService.deleteProject()`:
- Query and delete PipelineRunSteps
- Query and delete PipelineRuns
- Query and delete PipelineSteps
- Then delete Project

This is more error-prone and not needed - JPA cascade is the correct solution.