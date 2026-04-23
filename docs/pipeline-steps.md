# Pipeline Steps Guide

This guide explains how to create and configure pipeline steps in AI Suite. Pipeline steps are the individual components that make up a pipeline, each executing an agent or script in sequence.

## Understanding Pipeline Steps

### What is a Pipeline Step?

A pipeline step is a single unit of execution within a pipeline. Each step can:

- Execute an AI agent
- Run a script
- Receive input from previous steps
- Produce output for subsequent steps

### Step Types

| Type | Icon | Description |
|------|------|-------------|
| Agent | Robot | Executes an AI agent with a prompt |
| Script | Code | Runs a script with a specified runtime |

## Adding Steps to a Pipeline

### Step 1: Select a Pipeline

Navigate to your project and select a pipeline from the pipeline list. The pipeline must contain at least one step to execute.

### Step 2: Add a New Step

Click the **Add Step** button in the pipeline panel. A dialog will appear asking you to choose the step type:

| Option | Description |
|--------|-------------|
| Select Agent | Choose an existing agent to execute |
| Select Script | Choose an existing script to run |

### Step 3: Select Agent or Script

Choose an existing agent or script from the dropdown list. Only agents or scripts in the current project namespace are shown.

### Step 4: Save the Step

Click **Add** to add the step to the pipeline. The step appears in the pipeline flow.

## Configuring Step Settings

Each step has multiple configuration options accessible through the step context menu.

### Accessing Step Settings

Click on a step in the pipeline to select it, then use the action buttons:

| Button | Action |
|--------|--------|
| Input | Configure input content |
| Output | Configure output content |
| CLI | Configure CLI or runtime |
| Settings | Open full settings dialog |

## Using Placeholders

Steps support dynamic placeholders that reference data from previous steps, files, and environment variables.

### Placeholder Syntax

Placeholders use double curly braces: `{{placeholder}}`

### Available Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `{{step:N:output}}` | Get output from step N | `{{step:1:output}}` |
| `{{previous-output-file}}` | Get output from previous step | `{{previous-output-file}}` |
| `{{agentic-input:file}}` | Get input from agentic.json | `{{agentic-input:config.json}}` |
| `{{agentic-output:file}}` | Set output to agentic.json | `{{agentic-output:result.json}}` |
| `{{file:path}}` | Read content from file | `{{file:config.json}}` |
| `{{env:VARIABLE}}` | Get environment variable | `{{env:PATH}}` |

### Using Input Placeholders

In the input tab, you can reference outputs from previous steps:

```
{{step:1:output}}
```

This passes the output from step 1 as input to the current step.

### Dynamic File References

Read configuration from files in your project:

```
{{file:project/config.yml}}
```

### Environment Variables

Access system environment variables:

```
{{env:USER}}
{{env:HOME}}
```

### Previous Output File

Reference the output file from the previous step:

```
{{previous-output-file}}
```

This is a shortcut for `{{step:N:output}}` where N is the previous step number.

### Agentic Input Files

Read input files defined in the agentic.json configuration:

```
{{agentic-input:config.json}}
{{agentic-input:data/input.yml}}
```

This reads files from the input section of your agentic.json.

### Agentic Output Files

Write output to files in the agentic.json output section:

```
{{agentic-output:result.json}}
{{agentic-output:data/output.json}}
```

The output will be stored in the output section of agentic.json for use in subsequent steps or after pipeline completion.

## Input Tab

The Input tab configures what data the step receives.

### Input Field

| Field | Description |
|-------|-------------|
| File Type | Format of input (YML, JSON, CMD, TXT) |
| Content | Input data or placeholders |

### Setting Input Content

1. Select the step in the pipeline
2. Click the **Input** button
3. Choose the file type from the dropdown
4. Enter content or placeholders in the editor
5. Click **Save**

### Input Types

| Type | Use Case |
|------|---------|
| YML | Configuration files |
| JSON | Structured data |
| CMD | Command input |
| TXT | Plain text |

## Output Tab

The Output tab configures what data the step produces.

### Output Field

| Field | Description |
|-------|-------------|
| File Type | Format of output (YML, JSON, CMD, TXT) |
| Content | Output template or placeholders |

### Setting Output Content

1. Select the step in the pipeline
2. Click the **Output** button
3. Choose the file type
4. Enter output template (can include placeholders)
5. Click **Save**

### Using Output in Subsequent Steps

The output from one step becomes available to the next step using:

```
{{step:N:output}}
```

Where N is the step number.

## CLI Tab

The CLI tab configures the command-line interface for agent steps.

### For Agent Steps

| Field | Description |
|-------|-------------|
| CLI | Command to use (opencode, copilot, or custom) |
| Parameters | CLI parameters |
| Arguments | CLI arguments |

### Selecting CLI

1. Click **CLI** on a step
2. Select from available CLIs:
   - **opencode** - OpenCode CLI
   - **copilot** - Copilot CLI
   - **Custom** - Enter custom CLI name
3. Enter parameters and arguments
4. Click **Save**

### For Script Steps

| Field | Description |
|-------|-------------|
| Runtime | Script runtime (cmd, node, java, py, custom) |
| Parameters | Script parameters |
| Arguments | Script arguments |

### Runtime Options

| Runtime | Description |
|--------|-------------|
| cmd | Windows command Prompt |
| node | Node.js |
| java | Java |
| py | Python |
| custom | Custom runtime command |

## Using the Settings Dialog

The Settings dialog provides a unified interface to configure all step options.

### Opening Settings

1. Select a step in the pipeline
2. Click the **Settings** button (gear icon)

### Tabs in Settings Dialog

The Settings dialog has four tabs:

| Tab | Description |
|-----|-------------|
| Input | Configure input content and type |
| Output | Configure output content and type |
| CLI | Configure CLI/runtime, parameters, arguments |
| Prompt | View agent prompt or script content |

### Configuring Multiple Options

1. Open the Settings dialog
2. Navigate between tabs
3. Configure each section
4. Click **Save All** to save all changes at once

## Reordering Steps

### Drag and Drop

Click and drag a step to reorder it within the pipeline.

### Manual Reorder

Steps execute in order from top to bottom. The step number indicates execution order.

## Removing Steps

### Delete a Step

1. Select the step
2. Click the delete icon
3. Confirm deletion

### Notes

- Removing a step shifts subsequent steps up in order
- Deletion cannot be undone

## Step Status

During pipeline execution, steps show their status:

| Status | Color | Description |
|--------|-------|-------------|
| Pending | Gray | Waiting to execute |
| Running | Orange | Currently executing |
| Completed | Green | Finished successfully |
| Failed | Red | Execution failed |

## Pipeline Flow Visualization

The pipeline shows steps as connected cards:

- **Step Number** - Circle showing order
- **Step Icon** - Robot (agent) or Code (script)
- **Step Name** - Agent or script name
- **Category** - Namespace
- **Connector** - Arrow showing flow direction

## Tips

### Chaining Steps

Use output placeholders to pass data between steps:

```
Step 1: Generate data
Step 2: Process {{step:1:output}}
```

### File References

Keep configuration in files and reference them:

```
{{file:config/settings.json}}
```

### Environment Variables

Use environment variables for sensitive data:

```
{{env:API_KEY}}
```

### Testing Configurations

Run the pipeline to test step configurations. Check the output tab after execution.

## Notes

- Steps execute in order from step 1 onward
- Each step can access outputs from all previous steps
- Placeholders are resolved before execution
- Input/output types must match expected formats
- CLI settings apply to agent steps only
- Runtime settings apply to script steps only