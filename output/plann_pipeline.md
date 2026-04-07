# Pipeline System Specification

## Overview

This document describes the pipeline execution system implemented in this project. It provides a comprehensive specification for AI agents to understand, re-implement, or extend the pipeline functionality.

## Technology Stack

- **Backend Framework**: Spring Boot 3.3.x (Java 21)
- **Database**: JPA/Hibernate with H2 in-memory database
- **Real-time Communication**: Server-Sent Events (SSE)
- **JSON Serialization**: Gson

---

## Core Concepts

### Pipeline

A pipeline is a container that groups multiple steps (agents or scripts) for sequential execution. A pipeline belongs to a project and has the following attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| id | Long | Unique identifier |
| name | String | Pipeline name |
| description | String | Optional description |
| status | String | `pending`, `running`, `completed`, `failed`, `stopped` |
| type | String | `sequential` (default) or `step_by_step` |
| outputExtension | String | File extension for output files (default: `txt`) |
| projectId | Long | Foreign key to the parent project |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### PipelineStep

A step represents a single unit of work within a pipeline. Each step can reference either an Agent or a Script.

| Attribute | Type | Description |
|-----------|------|-------------|
| id | Long | Unique identifier |
| pipelineId | Long | Foreign key to parent pipeline |
| stepOrder | Integer | Execution order (1-based) |
| type | String | `agent` or `script` |
| agentId | Long | Optional foreign key to Agent |
| scriptId | Long | Optional foreign key to Script |
| status | String | `pending`, `running`, `ready`, `completed`, `failed` |
| inputContent | String | Optional input content |
| inputType | String | Input content type |
| outputContent | String | Output content from execution |
| outputType | String | Output content type |
| cli | String | CLI command to use (`opencode`, `copilot`, etc.) |
| parameters | String | CLI parameters |
| arguments | String | CLI arguments |

### PipelineRun

A run represents a single execution instance of a pipeline. It tracks the execution state and timestamps.

| Attribute | Type | Description |
|-----------|------|-------------|
| id | Long | Unique identifier |
| pipelineId | Long | Foreign key to pipeline |
| status | String | `running`, `completed`, `failed`, `stopped` |
| startedAt | DateTime | When execution started |
| completedAt | DateTime | When execution finished |
| steps | List<PipelineRunStep> | Steps executed in this run |

### PipelineRunStep

Represents the state of a step during a specific run.

| Attribute | Type | Description |
|-----------|------|-------------|
| id | Long | Unique identifier |
| pipelineRunId | Long | Foreign key to PipelineRun |
| stepOrder | Integer | Step order |
| agentName | String | Name of the agent |
| agentCategory | String | Category of the agent |
| scriptName | String | Name of the script |
| scriptCategory | String | Category of the script |
| status | String | Step status in this run |
| inputContent | String | Input content |
| inputType | String | Input type |
| outputContent | String | Output content |
| outputType | String | Output type |

---

## Pipeline Execution Types

### 1. Sequential Pipeline (`sequential`)

**Behavior**: All steps execute one after another without pausing between them.

**Execution Flow**:
1. Pipeline starts in a background thread
2. For each step in order (by `stepOrder`):
   - Set step status to `running`
   - Execute the agent or script
   - If successful: save output, set status to `completed`, write result file
   - If failed: set status to `failed`, continue to next step
   - If stopped: mark remaining steps as `failed`, break execution
3. When all steps complete, update pipeline status to `completed`
4. Send SSE event `pipeline-complete`

**Result Files**: Each step writes its output to:
```
{runDir}/step{stepOrder}-result.{outputExtension}
```

### 2. Step-by-Step Pipeline (`step_by_step`)

**Behavior**: After each step completes, the pipeline pauses and waits for user confirmation to continue to the next step.

**Execution Flow**:
1. Pipeline starts in a background thread
2. For each step in order:
   - Set step status to `running`
   - Execute the agent or script
   - If successful:
     - Save output, set status to `completed`
     - Write result file
     - Send SSE event `pipeline-paused` with current and next step orders
     - Set pipeline state to paused
     - Wait for `continue` signal (polling every 500ms, max 7200 iterations = 1 hour)
   - If failed or stopped: break execution
3. Send SSE event `pipeline-complete` when all steps done

**Pause/Resume Mechanism**:
- Backend uses `AtomicBoolean` to track paused state per pipeline
- Frontend calls `POST /api/projects/{projectId}/pipelines/{id}/continue` to resume
- Backend checks `/api/projects/{projectId}/pipelines/{id}/paused` to get current state

---

## Data Flow

### 1. Creating a Pipeline

```
POST /api/projects/{projectId}/pipelines
Body: { name, description, type, outputExtension }

Response: Pipeline object
```

### 2. Adding Steps

```
POST /api/projects/{projectId}/pipelines/{pipelineId}/steps
Body: { agentId, scriptId }

Response: PipelineStep object
```

### 3. Running a Pipeline

```
POST /api/projects/{projectId}/pipelines/{pipelineId}/run

Response: { message, pipelineId }

Backend:
1. Create PipelineRun record
2. Create run directory: .agentic/pipelines/{pipelineName}/{timestamp}/
3. Start background thread to execute steps
4. Update pipeline status to "running"
```

### 4. Stopping a Pipeline

```
POST /api/projects/{projectId}/pipelines/{pipelineId}/stop

Backend:
1. Add pipeline ID to stopped set
2. Kill running process (if any)
3. Update pipeline and run status to "stopped"
4. Mark remaining steps as failed/skipped
```

### 5. Continuing a Step-by-Step Pipeline

```
POST /api/projects/{projectId}/pipelines/{pipelineId}/continue

Backend:
1. Set paused state to false
2. Resume execution from pending step
```

---

## Server-Sent Events (SSE) Specification

The system uses SSE for real-time updates to the frontend.

### Connecting to SSE

```
GET /api/sse/pipelines/{pipelineId}
```

Returns `text/event-stream` with unlimited timeout.

### Event Types

| Event Name | Data | Description |
|------------|------|-------------|
| `step-output` | `{ stepId, stepOrder, output, status }` | Step execution output |
| `pipeline-complete` | `{ status }` | Pipeline finished |
| `pipeline-paused` | `{ completedStepOrder, nextStepOrder }` | Step-by-step paused |
| `step-error` | `{ stepId, error, stackTrace }` | Step execution error |

### SSE Implementation Notes

- Use Spring's `SseEmitter` class
- Store emitters in a `Map<Long, List<SseEmitter>>` keyed by pipelineId
- Handle emitter lifecycle: `onCompletion`, `onTimeout`, `onError`
- Escape JSON strings properly (newlines, quotes, special characters)

---

## Step Execution Details

### Agent Step Execution

1. Retrieve agent's prompt template
2. Replace placeholders:
   - `{{previous-output-file}}` - Path to previous step's output file
   - `{{agentic-input:file}}` - Step's input content
   - `{{agentic-output:file}}` - Step's output content
3. Build CLI command based on step's `cli` field:
   - `opencode`: Use `opencode run` with prompt
   - `copilot`: Use `copilot --allow-all-paths --allow-all-tools -p "{prompt}"`
   - Custom CLI: Execute with parameters/arguments
4. Execute via `ProcessBuilder` in working directory
5. Capture stdout/stderr to temporary files
6. Read output, check exit code
7. Return output or throw exception

### Script Step Execution

1. Retrieve script content from database
2. Replace `{{previous-output-file}}` placeholder if present
3. Write script to temporary file (.bat for Windows, .sh for Unix)
4. Execute via `ProcessBuilder`
5. Capture output
6. Return output or throw exception

### Result File Writing

After each step completes successfully:
```
File: {runDir}/step{stepOrder}-result.{outputExtension}
Content: {fullOutput}
```

---

## Concurrency Control

The system handles concurrent pipeline executions:

| Mechanism | Purpose |
|-----------|---------|
| `ReentrantLock` per pipelineId | Prevent same pipeline from running twice simultaneously |
| `AtomicBoolean` paused state | Track pause/resume for step-by-step |
| `Set<Long>` stoppedPipelines | Track stopped pipelines |
| `Map<Long, Process>` runningProcesses | Track running processes for force-stop |
| `ConcurrentHashMap` | Thread-safe collections |

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{projectId}/pipelines` | List pipelines (paginated) |
| GET | `/api/projects/{projectId}/pipelines/top10` | Get top 10 pipelines |
| GET | `/api/projects/{projectId}/pipelines/{id}` | Get pipeline details |
| POST | `/api/projects/{projectId}/pipelines` | Create pipeline |
| PUT | `/api/projects/{projectId}/pipelines/{id}` | Update pipeline |
| DELETE | `/api/projects/{projectId}/pipelines/{id}` | Delete pipeline |
| POST | `/api/projects/{projectId}/pipelines/{id}/run` | Start pipeline execution |
| POST | `/api/projects/{projectId}/pipelines/{id}/stop` | Stop pipeline execution |
| POST | `/api/projects/{projectId}/pipelines/{id}/continue` | Continue step-by-step pipeline |
| GET | `/api/projects/{projectId}/pipelines/{id}/paused` | Check if pipeline is paused |
| GET | `/api/projects/{projectId}/pipelines/{pipelineId}/steps` | Get pipeline steps |
| POST | `/api/projects/{projectId}/pipelines/{pipelineId}/steps` | Add step to pipeline |
| PUT | `/api/projects/{projectId}/steps/{stepId}` | Update step |
| DELETE | `/api/projects/{projectId}/steps/{stepId}` | Delete step |
| POST | `/api/projects/{projectId}/steps/{stepId}/input` | Save step input |
| POST | `/api/projects/{projectId}/steps/{stepId}/output` | Save step output |
| POST | `/api/projects/{projectId}/steps/{stepId}/cli` | Save step CLI config |
| PUT | `/api/projects/{projectId}/pipelines/{pipelineId}/steps/reorder` | Reorder steps |
| GET | `/api/sse/pipelines/{pipelineId}` | SSE stream for pipeline |

---

## Frontend Integration

The Angular frontend consumes this API:

1. **Pipeline List**: Fetch and display pipelines for a project
2. **Step Management**: Add, remove, reorder steps via drag-drop
3. **Execution**: Start/stop/continue pipelines
4. **Real-time Updates**: Connect to SSE endpoint, parse events, update UI
5. **State Polling**: For step-by-step mode, poll paused endpoint while waiting

---

## Key Implementation Patterns

### 1. Background Execution
```java
new Thread(() -> {
    try {
        pipelineStepService.executePipeline(...);
    } catch (Exception e) {
        // Handle error
    }
}).start();
```

### 2. Placeholder Replacement
```java
String placeholder = "{{previous-output-file}}";
if (prompt.contains(placeholder)) {
    prompt = prompt.replace(placeholder, normalizedPath);
}
```

### 3. Process Execution
```java
ProcessBuilder pb = new ProcessBuilder(command);
pb.directory(new File(workingDir));
pb.redirectOutput(Redirect.to(outputFile));
pb.redirectError(Redirect.to(errorFile));
Process process = pb.start();
int exitCode = process.waitFor();
```

### 4. SSE Sending
```java
emitter.send(SseEmitter.event()
    .name("step-output")
    .data("{\"stepId\":" + stepId + ",\"output\":\"" + escapeJson(output) + "\"}"));
```

---

## Error Handling

| Scenario | Behavior |
|----------|-----------|
| Agent/Script not found | Step fails with error message |
| Process exits non-zero | Step fails with exit code and output |
| Pipeline stopped mid-execution | Remaining steps marked as failed/skipped |
| Step-by-step timeout (1 hour) | Pipeline stops, remaining steps marked failed |
| SSE client disconnects | Emitter auto-removed on completion/timeout/error |

---

## File Structure

```
/.api/
  /pipelines/
    /{pipelineName}/
      /{timestamp}/
        step1-result.txt
        step2-result.txt
        ...
```

Output files are written to `{projectPath}/.agentic/pipelines/{pipelineName}/{timestamp}/`

---

## Re-implementation Checklist

To re-implement this pipeline system:

1. **Database Models**: Create JPA entities for Pipeline, PipelineStep, PipelineRun, PipelineRunStep
2. **Repositories**: Create Spring Data JPA repositories
3. **Services**: Implement PipelineService, PipelineStepService, PipelineRunService, SseService
4. **Controllers**: Expose REST endpoints and SSE endpoint
5. **Concurrency**: Use locks and thread-safe collections for pause/stop/resume
6. **Execution**: Use ProcessBuilder for agent/script execution
7. **Real-time**: Use SseEmitter for streaming updates
8. **Frontend**: Connect to SSE, handle events, provide controls
