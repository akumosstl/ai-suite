# Target Plan: Dynamic CLI Based on Project Target

## Problem Analysis

Currently in `PipelineStepService.java` (lines 736-776), the CLI is hardcoded:

```java
String cli = step.getCli();
if (cli != null && !cli.isEmpty()) {
    if (cli.equals("copilot")) {
        fullCommand.append("copilot --allow-all-paths --allow-all-tools -p ");  // Uses copilot
    } else if (!cli.equals("opencode")) {
        fullCommand.append(cli);  // Uses custom CLI directly
    } else {
        fullCommand.append("opencode run");  // Defaults to opencode
    }
}
```

**Bug**: Even when project target is "copilot", the backend runs "opencode" as default.

## Root Cause

1. The `PipelineStep` doesn't know about the project's target
2. No logic uses `project.getTargetId()` to determine the CLI
3. The step uses `step.getCli()` directly without checking the project target

## Solution Architecture

### 1. Add `cli` field to Target model (if not exists)

The Target entity should have a CLI command:
```java
@Column(name = "cli")
private String cli;  // e.g., "copilot", "opencode", "xxxxx"
```

### 2. Modify TargetSeedLoader to include CLI

```java
seedTargetIfNotExists("opencode", ".opencode/skills/", ".opencode/commands/", "", ".opencode/agents/", "opencode");
seedTargetIfNotExists("copilot", ".claude/skills/", ".claude/commands/", "", ".claude/agents/", "copilot");
seedTargetIfNotExists("claude", ".claude/skills/", ".claude/commands/", "", ".claude/agents/", "claude");
// Custom targets can have their own CLI
```

### 3. Get CLI from project target in PipelineStepService

Find the project and its target, then use target's CLI:

```java
// In executeAgentStep method
Project project = // get from pipeline or step
Target target = targetRepository.findById(project.getTargetId()).orElse(null);
String targetCli = target != null ? target.getCli() : "opencode";
```

### 4. Update PipelineStepService logic

Replace hardcoded logic with:

```java
String cli = step.getCli();
if (cli == null || cli.isEmpty()) {
    // Use project target's CLI as default
    cli = projectCli;
}

String baseCommand;
switch (cli) {
    case "copilot":
        baseCommand = "copilot --allow-all-paths --allow-all-tools -p ";
        break;
    case "opencode":
        baseCommand = "opencode run";
        break;
    case "claude":
        baseCommand = "claude -p ";
        break;
    default:
        baseCommand = cli;  // Custom CLI
}
```

## Implementation Steps

### Step 1: Modify Target.java
Add `cli` field with getter/setter

### Step 2: Modify TargetSeedLoader.java
Add CLI parameter to constructor and seed calls

### Step 3: Create TargetRepository injection in PipelineStepService
Add: `private TargetRepository targetRepository;`

### Step 4: Modify PipelineStepService.executeAgentStep
- Add project lookup logic
- Update CLI determination logic to use target

### Step 5: Also update script execution (executeScriptStep)
Apply same logic for script runtime selection

## Files to Modify

1. `backend/src/main/java/io/github/akumosstl/agentic/backend/model/Target.java`
2. `backend/src/main/java/io/github/akumosstl/agentic/backend/config/TargetSeedLoader.java`
3. `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineStepService.java`
4. `backend/src/main/java/io/github/akumosstl/agentic/backend/repository/TargetRepository.java` (if needed)

## Expected Behavior

| Project Target | Step CLI | Backend Command |
|--------------|---------|----------------|
| opencode | (empty) | `opencode run` |
| copilot | (empty) | `copilot --allow-all-paths --allow-all-tools -p` |
| xxxxx | (empty) | `xxxxx run` |
| any | opencode | `opencode run` |
| any | copilot | `copilot --allow-all-paths --allow-all-tools -p` |
| any | xxxxx | `xxxxx run` |

## Priority

- High: Fix agent step CLI selection to use target
- Medium: Also fix script step runtime selection
- Low: Add CLI field to Target for configuration