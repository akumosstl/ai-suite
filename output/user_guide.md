# Pipeline User Guide

## What is a Pipeline?

A pipeline is a way to run multiple agents or scripts in sequence. Each step in the pipeline executes one after another, and the output of one step can be passed to the next step.

---

## Pipeline Types

### Sequential Pipeline

Runs all steps automatically from start to finish without pausing. Ideal for fully automated workflows.

### Step-by-Step Pipeline

Pauses after each step and waits for you to confirm before continuing. Use this when you want to review the output of each step before proceeding.

---

## Creating a Pipeline

1. Open your project in the application
2. Find the **Pipelines** section in the sidebar
3. Click the **+** button to create a new pipeline
4. Fill in the pipeline details:

| Field | Description |
|-------|-------------|
| Name | A descriptive name for your pipeline |
| Description | (Optional) What this pipeline does |
| Output Extension | File extension for output files (default: txt) |
| Type | Choose `Sequential` or `Step-by-Step` |

5. Click **Create**

---

## Adding Steps

After creating a pipeline:

1. Select the pipeline from the list
2. Click **Add Step**
3. Choose what the step should run:

   - **Agent**: Select an existing agent from your project
   - **Script**: Select a script from your project

4. Configure optional settings:

   - **Input**: Content to pass to the step
   - **CLI**: Override the default CLI (`opencode`, `copilot`, or custom)
   - **Parameters/Arguments**: Additional CLI options

5. Click **Add**

Repeat to add more steps. The steps will execute in order (1, 2, 3...).

### Reordering Steps

Drag and drop steps to change their order. The execution order updates automatically.

---

## Running a Pipeline

### Starting Execution

With your pipeline selected, click **Run Pipeline**.

The pipeline status will change to `running`, and you'll see real-time output for each step.

### Sequential Pipeline

All steps execute automatically. Watch the progress in the output panel.

### Step-by-Step Pipeline

1. First step executes
2. Pipeline pauses, waiting for confirmation
3. Review the step output
4. Click **Continue** to run the next step
5. Repeat until all steps complete

---

## Monitoring Pipeline Execution

### Real-Time Output

While a pipeline runs, you see live output from each step via Server-Sent Events (SSE). The output shows:

- Step starting
- Execution progress
- Step completion
- Any errors

### Pipeline Status

| Status | Meaning |
|--------|---------|
| `pending` | Pipeline created but not run |
| `running` | Pipeline is currently executing |
| `completed` | All steps finished successfully |
| `failed` | A step encountered an error |
| `stopped` | You manually stopped the pipeline |

---

## Controlling Pipeline Execution

### Stopping a Pipeline

Click the **Stop** button to halt execution at any time.

- The current step stops
- Remaining steps are marked as failed/skipped
- Pipeline status becomes `stopped`

### Step-by-Step: Continue

In step-by-step mode, after each step completes:

1. The pipeline enters a paused state
2. Review the output
3. Click **Continue** to proceed to the next step
4. Or click **Stop** to end the pipeline

---

## Viewing Past Runs

Each time you run a pipeline, a new run is created with a timestamp. Past runs are stored in the database and can be accessed through the API.

---

## Using Placeholders

Steps can reference the output of previous steps using placeholders in prompts or scripts:

### `{{previous-output-file}}`

Replaced with the file path of the previous step's output.

**Example**: An agent prompt:
```
Review the following code and provide feedback:
{{previous-output-file}}
```

When the step runs, `{{previous-output-file}}` is replaced with the actual path to the previous step's result file.

---

## Output Files

Each step that completes successfully writes its output to a file:

```
{projectPath}/.agentic/pipelines/{pipelineName}/{timestamp}/step{stepNumber}-result.{extension}
```

For example:
```
C:\Projects\MyProject\.agentic\pipelines\MyPipeline\20240415-143022/step1-result.txt
```

---

## Troubleshooting

### Pipeline won't start

- Ensure the pipeline has at least one step
- Check that agents/scripts exist in your project

### Step fails

- Check the error message in the output
- Verify the agent has a prompt configured
- Ensure scripts are valid

### Step-by-step won't continue

- Make sure you're clicking the Continue button
- Check the pipeline isn't stopped

### Process runs indefinitely

- Use the Stop button to halt execution
- Check for infinite loops in scripts
- Verify agent prompts don't cause excessive output

---

## API Reference

For developers integrating with pipelines:

| Action | Endpoint |
|--------|----------|
| List pipelines | `GET /api/projects/{projectId}/pipelines` |
| Create pipeline | `POST /api/projects/{projectId}/pipelines` |
| Run pipeline | `POST /api/projects/{projectId}/pipelines/{id}/run` |
| Stop pipeline | `POST /api/projects/{projectId}/pipelines/{id}/stop` |
| Continue pipeline | `POST /api/projects/{projectId}/pipelines/{id}/continue` |
| Check paused state | `GET /api/projects/{projectId}/pipelines/{id}/paused` |
| Add step | `POST /api/projects/{projectId}/pipelines/{pipelineId}/steps` |
| SSE stream | `GET /api/sse/pipelines/{pipelineId}` |

---

## Quick Reference

| Task | Action |
|------|--------|
| Create pipeline | Click + in Pipelines section |
| Add step | Select pipeline → Add Step |
| Run | Select pipeline → Run Pipeline |
| Stop | Click Stop button |
| Continue (step-by-step) | Click Continue button |
| Reorder | Drag and drop steps |
| Delete | Select pipeline → Delete |
