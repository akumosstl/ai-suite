# Recipe Engine - Implementation Plan

## Summary

Implement a Recipe Engine that reads `.yml` files with declarative instructions and executes all system capabilities (create projects, agents, scripts, pipelines, steps, run/stop pipelines) without GUI interaction.

---

## Step 1: Add jackson-dataformat-yaml dependency to pom.xml

**File:** `backend/pom.xml`

Add after the gson dependency:
```xml
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-yaml</artifactId>
</dependency>
```

---

## Step 2: Create RecipeModel POJOs

**Directory:** `backend/src/main/java/io/github/akumosstl/agentic/backend/recipe/`

### 2.1 RecipeYaml.java - Top-level YAML model
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class RecipeYaml {
    private RecipeHeader recipe;
    private Map<String, Object> parameters;
    private Map<String, String> env;
    private List<RecipeTarget> targets;
    private List<RecipeProject> projects;
    private List<RecipeAgent> agents;
    private List<RecipeScript> scripts;
    private List<RecipeTemplate> templates;
    private List<RecipePipeline> pipelines;
    private List<RecipeTask> tasks;

    // getters and setters for all fields
}
```

### 2.2 RecipeHeader.java
```java
package io.github.akumosstl.agentic.backend.recipe;

public class RecipeHeader {
    private String name;
    private String version;
    private String description;
    // getters/setters
}
```

### 2.3 RecipeTarget.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecipeTarget {
    private String name;
    @JsonProperty("agents_path")
    private String agentsPath;
    @JsonProperty("scripts_path")
    private String scriptsPath;
    private String cli;
    // getters/setters
}
```

### 2.4 RecipeProject.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import java.util.List;

public class RecipeProject {
    private String id;
    private String name;
    private String description;
    private String path;
    private String target;
    private String status;
    private String readme;
    private List<String> agents;
    private List<String> scripts;
    // getters/setters
}
```

### 2.5 RecipeAgent.java
```java
package io.github.akumosstl.agentic.backend.recipe;

public class RecipeAgent {
    private String id;
    private String name;
    private String namespace;
    private String category;
    private String description;
    private String prompt;
    private String path;
    // getters/setters
}
```

### 2.6 RecipeScript.java
```java
package io.github.akumosstl.agentic.backend.recipe;

public class RecipeScript {
    private String id;
    private String name;
    private String namespace;
    private String category;
    private String description;
    private String content;
    private String scope;
    private String path;
    // getters/setters
}
```

### 2.7 RecipeTemplate.java
```java
package io.github.akumosstl.agentic.backend.recipe;

public class RecipeTemplate {
    private String id;
    private String name;
    private String type;
    private String description;
    private String template;
    // getters/setters
}
```

### 2.8 RecipePipeline.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class RecipePipeline {
    private String id;
    private String project;
    private String name;
    private String description;
    private String type;
    @JsonProperty("output_extension")
    private String outputExtension;
    private List<RecipeStep> steps;
    // getters/setters
}
```

### 2.9 RecipeStep.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecipeStep {
    private Integer order;
    private String agent;
    private String script;
    private String prompt;
    private String type;
    private String runtime;
    private String cli;
    private String parameters;
    private String arguments;
    private RecipeStepIO input;
    private RecipeStepIO output;
    // getters/setters
}
```

### 2.10 RecipeStepIO.java
```java
package io.github.akumosstl.agentic.backend.recipe;

public class RecipeStepIO {
    private String content;
    private String type;
    // getters/setters
}
```

### 2.11 RecipeTask.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class RecipeTask {
    private String id;
    private String type;          // create | run | stop | call
    private String resource;      // project | agent | script | pipeline | target | template
    private String ref;           // reference to declared item ID
    @JsonProperty("depends_on")
    private List<String> dependsOn;
    @JsonProperty("pipeline_ref")
    private String pipelineRef;
    @JsonProperty("pipeline_id")
    private Long pipelineId;
    @JsonProperty("pipeline_name")
    private String pipelineName;
    private String project;       // ref or project name
    private Integer repeat;
    private RecipeRetry retry;
    private RecipeLoop loop;
    private Boolean wait;
    @JsonProperty("stop_on_failure")
    private Boolean stopOnFailure;
    // getters/setters
}
```

### 2.12 RecipeRetry.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class RecipeRetry {
    @JsonProperty("max_attempts")
    private Integer maxAttempts;
    @JsonProperty("delay_seconds")
    private Integer delaySeconds;
    @JsonProperty("on_status")
    private List<String> onStatus;
    // getters/setters
}
```

### 2.13 RecipeLoop.java
```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecipeLoop {
    private String condition;     // always | until_success | until_failure
    @JsonProperty("max_iterations")
    private Integer maxIterations;
    @JsonProperty("delay_seconds")
    private Integer delaySeconds;
    // getters/setters
}
```

---

## Step 3: Create RecipeParser

**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/recipe/RecipeParser.java`

```java
package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public class RecipeParser {

    private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    public RecipeYaml parse(String yamlContent) {
        return yamlMapper.readValue(yamlContent, RecipeYaml.class);
    }

    public RecipeYaml parse(java.io.File file) {
        return yamlMapper.readValue(file, RecipeYaml.class);
    }

    public RecipeYaml parse(java.io.InputStream inputStream) {
        return yamlMapper.readValue(inputStream, RecipeYaml.class);
    }

    public String validate(RecipeYaml recipe) {
        // Check for circular depends_on
        // Check required fields
        // Return null if valid, error message if invalid
    }
}
```

Key implementation details:
- Uses Jackson's `YAMLFactory` for YAML parsing
- Snake_case in YAML auto-maps to camelCase in Java via `@JsonProperty`
- Validation checks for:
  - Required `recipe.name`
  - At least one task in `tasks`
  - All `depends_on` references exist as task IDs
  - No circular dependencies in `depends_on` DAG
  - All `ref` and `pipeline_ref` references point to declared items
  - Valid `type` values (create, run, stop, call)
  - Valid `resource` values for create tasks

---

## Step 4: Create RecipeParameterResolver

**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/recipe/RecipeParameterResolver.java`

Resolves placeholders in all string values:

| Placeholder | Resolution |
|---|---|
| `{{param:X}}` | From `parameters` map in recipe |
| `{{env:VAR}}` | System environment variable |
| `{{file:path}}` | File contents from disk |
| `{{step:N:output}}` | Output of step N from pipeline run |
| `{{task:TASK_ID:result}}` | Result entity ID from a completed task |

```java
package io.github.akumosstl.agentic.backend.recipe;

import java.util.Map;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class RecipeParameterResolver {

    private final Map<String, Object> parameters;
    private final Map<String, String> env;
    private final Map<String, Long> taskResults;  // taskId -> resultEntityId

    private static final Pattern PARAM_PATTERN = Pattern.compile("\\{\\{param:([^}]+)\\}\\}");
    private static final Pattern ENV_PATTERN = Pattern.compile("\\{\\{env:([^}]+)\\}\\}");
    private static final Pattern FILE_PATTERN = Pattern.compile("\\{\\{file:([^}]+)\\}\\}");
    private static final Pattern TASK_PATTERN = Pattern.compile("\\{\\{task:([^:]+):result\\}\\}");

    public String resolve(String input) {
        if (input == null) return null;
        String result = input;
        result = resolveParams(result);
        result = resolveEnv(result);
        result = resolveFiles(result);
        result = resolveTasks(result);
        return result;
    }

    // Resolves all placeholders recursively in the entire RecipeYaml object
    public RecipeYaml resolveAll(RecipeYaml recipe) {
        // Walk through all string fields and resolve placeholders
    }

    // Register task result for later resolution
    public void registerTaskResult(String taskId, Long entityId) {
        taskResults.put(taskId, entityId);
    }
}
```

---

## Step 5: Create Recipe and RecipeTaskResult JPA Entities + Repositories

### 5.1 Recipe.java (JPA Entity)
**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/model/Recipe.java`

```java
@Entity
@Table(name = "recipe")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Recipe {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String version;
    
    @Column(length = 2000)
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String source;          // Original YAML content
    
    @Column(name = "source_path")
    private String sourcePath;      // File path if loaded from file
    
    @Column(nullable = false)
    private String status;          // running | completed | failed | stopped
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(columnDefinition = "TEXT")
    private String parameters;      // JSON of parameters used
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("taskId ASC")
    private List<RecipeTaskResult> taskResults = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "running";
        if (startedAt == null) startedAt = LocalDateTime.now();
    }
    
    // getters/setters
}
```

### 5.2 RecipeTaskResult.java (JPA Entity)
**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/model/RecipeTaskResult.java`

```java
@Entity
@Table(name = "recipe_task_result")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecipeTaskResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;
    
    @Column(name = "task_id", nullable = false)
    private String taskId;
    
    @Column(name = "task_type")
    private String taskType;        // create | run | stop | call
    
    private String resource;        // project | agent | script | pipeline | target | template
    
    private String ref;             // Reference ID from recipe
    
    @Column(nullable = false)
    private String status;          // pending | running | completed | failed | skipped
    
    @Column(name = "result_entity_id")
    private Long resultEntityId;    // DB ID of created/executed entity
    
    @Column(name = "result_details", columnDefinition = "TEXT")
    private String resultDetails;   // JSON with details
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "attempt_count")
    private Integer attemptCount = 1;
    
    @Column(name = "iteration_count")
    private Integer iterationCount = 1;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @PrePersist
    protected void onCreate() {
        if (status == null) status = "pending";
        if (attemptCount == null) attemptCount = 1;
        if (iterationCount == null) iterationCount = 1;
    }
    
    // getters/setters + computed properties (recipeId, etc.)
}
```

### 5.3 RecipeRepository.java
**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/repository/RecipeRepository.java`

```java
@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findTop20ByOrderByCreatedAtDesc();
    List<Recipe> findByStatus(String status);
}
```

### 5.4 RecipeTaskResultRepository.java
**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/repository/RecipeTaskResultRepository.java`

```java
@Repository
public interface RecipeTaskResultRepository extends JpaRepository<RecipeTaskResult, Long> {
    List<RecipeTaskResult> findByRecipeIdOrderByTaskId(Long recipeId);
    List<RecipeTaskResult> findByRecipeIdAndStatus(Long recipeId, String status);
}
```

---

## Step 6: Create RecipeExecutor

**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/recipe/RecipeExecutor.java`

This is the core engine. Key responsibilities:

### 6.1 DAG Resolution
- Parse `depends_on` to build a directed acyclic graph
- Topological sort to determine execution order
- Detect circular dependencies → throw error
- Tasks without dependencies run in parallel via `CompletableFuture`

### 6.2 Resource Creation (type=create)
For each `resource` type, call the corresponding service:
- **project** → `ProjectService.createProject()`, then add agents/scripts
- **agent** → `AgentService.createAgent()`
- **script** → `ScriptService.createScript()`
- **pipeline** → `PipelineService.createPipeline()`, then add steps via `PipelineStepService`
- **target** → `TargetService.createTarget()`
- **template** → `TemplateService.createTemplate()`

After creation, register the generated DB ID in `RecipeParameterResolver.taskResults` so later tasks can reference it.

### 6.3 Pipeline Execution (type=run)
- Resolve `pipeline_ref` to DB pipeline ID
- If `repeat` > 1: run pipeline N times sequentially
- If `loop` configured: run in loop with condition check
- If `retry` configured: retry on failure up to max_attempts
- If `wait=true`: poll pipeline status until completed/failed/stopped
- Call `PipelineService.runPipeline(pipelineId)` for each execution

### 6.4 Pipeline Stop (type=stop)
- Call `PipelineStepService.stopPipelineExecution(pipelineId)`

### 6.5 Pipeline Call (type=call)
- Find existing pipeline by name in project
- Execute same as `run` type

### 6.6 Execution Flow
```
1. Parse YAML → RecipeYaml
2. Validate recipe
3. Create Recipe entity (status=running)
4. Create RecipeTaskResult entities (status=pending)
5. Build dependency DAG from depends_on
6. Execute tasks in topological order:
   a. Check depends_on - all completed successfully?
      - YES: execute task
      - NO (dependency failed): mark task as skipped
   b. Execute task action (create/run/stop/call)
   c. Handle retry if configured
   d. Handle repeat/loop if configured
   e. Update RecipeTaskResult status
   f. If stopOnFailure and task failed: abort remaining tasks
7. Update Recipe status (completed/failed/stopped)
8. Send SSE event with recipe completion
```

### 6.7 RecipeExecutor skeleton
```java
@Component
public class RecipeExecutor {

    @Autowired private ProjectService projectService;
    @Autowired private AgentService agentService;
    @Autowired private ScriptService scriptService;
    @Autowired private PipelineService pipelineService;
    @Autowired private PipelineStepService pipelineStepService;
    @Autowired private PipelineRunService pipelineRunService;
    @Autowired private TargetService targetService;
    @Autowired private TemplateService templateService;
    @Autowired private RecipeRepository recipeRepository;
    @Autowired private RecipeTaskResultRepository taskResultRepository;
    @Autowired private SseService sseService;
    @Autowired private RecipeParser recipeParser;

    private final Set<Long> stoppedRecipes = ConcurrentHashMap.newKeySet();

    public Recipe execute(String yamlContent, Map<String, Object> overrideParams) {
        RecipeYaml recipeYaml = recipeParser.parse(yamlContent);
        // Merge override parameters
        RecipeParameterResolver resolver = new RecipeParameterResolver(
            recipeYaml.getParameters(), recipeYaml.getEnv(), new HashMap<>());
        recipeYaml = resolver.resolveAll(recipeYaml);
        String validationError = recipeParser.validate(recipeYaml);
        if (validationError != null) throw new IllegalArgumentException(validationError);
        
        // Persist recipe entity
        Recipe recipe = new Recipe();
        recipe.setName(recipeYaml.getRecipe().getName());
        recipe.setVersion(recipeYaml.getRecipe().getVersion());
        recipe.setDescription(recipeYaml.getRecipe().getDescription());
        recipe.setSource(yamlContent);
        recipe.setStatus("running");
        recipe = recipeRepository.save(recipe);
        
        // Create task result entities
        Map<String, RecipeTaskResult> taskResultMap = new LinkedHashMap<>();
        if (recipeYaml.getTasks() != null) {
            for (RecipeTask task : recipeYaml.getTasks()) {
                RecipeTaskResult result = new RecipeTaskResult();
                result.setRecipe(recipe);
                result.setTaskId(task.getId());
                result.setTaskType(task.getType());
                result.setResource(task.getResource());
                result.setRef(task.getRef());
                result.setStatus("pending");
                result = taskResultRepository.save(result);
                taskResultMap.put(task.getId(), result);
            }
        }
        
        final Long recipeId = recipe.getId();
        
        // Execute in background thread
        new Thread(() -> {
            try {
                executeTasks(recipeId, recipeYaml, resolver, taskResultMap);
                Recipe r = recipeRepository.findById(recipeId).orElse(null);
                if (r != null && !stoppedRecipes.contains(recipeId)) {
                    r.setStatus("completed");
                    r.setCompletedAt(LocalDateTime.now());
                    recipeRepository.save(r);
                }
            } catch (Exception e) {
                Recipe r = recipeRepository.findById(recipeId).orElse(null);
                if (r != null) {
                    r.setStatus("failed");
                    r.setCompletedAt(LocalDateTime.now());
                    recipeRepository.save(r);
                }
            }
        }).start();
        
        return recipe;
    }

    public void stopRecipe(Long recipeId) {
        stoppedRecipes.add(recipeId);
    }

    private void executeTasks(Long recipeId, RecipeYaml recipeYaml, 
                              RecipeParameterResolver resolver, 
                              Map<String, RecipeTaskResult> taskResultMap) {
        // 1. Build DAG from depends_on
        // 2. Topological sort
        // 3. Execute each task:
        //    - Check dependencies completed
        //    - executeCreateTask / executeRunTask / executeStopTask / executeCallTask
        //    - Handle retry, repeat, loop
        //    - Update task result
    }

    private Long executeCreateTask(RecipeYaml recipeYaml, RecipeTask task, 
                                    RecipeParameterResolver resolver) {
        String resource = task.getResource();
        String ref = task.getRef();
        
        switch (resource) {
            case "project": return createProject(recipeYaml, ref, resolver);
            case "agent": return createAgent(recipeYaml, ref, resolver);
            case "script": return createScript(recipeYaml, ref, resolver);
            case "pipeline": return createPipeline(recipeYaml, ref, resolver);
            case "target": return createTarget(recipeYaml, ref, resolver);
            case "template": return createTemplate(recipeYaml, ref, resolver);
            default: throw new IllegalArgumentException("Unknown resource: " + resource);
        }
    }

    private Long createProject(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipeProject rp = findById(recipeYaml.getProjects(), ref);
        Project project = new Project();
        project.setName(resolver.resolve(rp.getName()));
        project.setDescription(resolver.resolve(rp.getDescription()));
        project.setPath(resolver.resolve(rp.getPath()));
        project.setTarget(resolver.resolve(rp.getTarget()));
        project.setStatus(resolver.resolve(rp.getStatus()));
        project.setReadme(resolver.resolve(rp.getReadme()));
        project = projectService.createProject(project);
        
        // Associate agents and scripts
        if (rp.getAgents() != null) {
            for (String agentRef : rp.getAgents()) {
                Long agentId = resolver.getTaskResult(agentRef);
                if (agentId == null) {
                    // Try to find agent by ref ID in agents list
                    // If agent was created in this recipe, use its DB ID
                }
                if (agentId != null) {
                    projectService.addAgentsToProject(project.getId(), List.of(agentId), true);
                }
            }
        }
        // Similar for scripts
        
        return project.getId();
    }

    private Long createPipeline(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipePipeline rpipe = findById(recipeYaml.getPipelines(), ref);
        Long projectId = resolver.getTaskResult(rpipe.getProject());
        if (projectId == null) {
            // Try to find project by name
            // projectService.getProjectById or search
        }
        
        Pipeline pipeline = new Pipeline();
        pipeline.setName(resolver.resolve(rpipe.getName()));
        pipeline.setDescription(resolver.resolve(rpipe.getDescription()));
        pipeline.setType(resolver.resolve(rpipe.getType()));
        pipeline.setOutputExtension(resolver.resolve(rpipe.getOutputExtension()));
        pipeline = pipelineService.createPipeline(projectId, pipeline);
        
        // Add steps
        if (rpipe.getSteps() != null) {
            for (RecipeStep rstep : rpipe.getSteps()) {
                Long agentId = null;
                Long scriptId = null;
                
                if (rstep.getAgent() != null) {
                    agentId = resolver.getTaskResult(rstep.getAgent());
                    // Fallback: find by name+namespace
                }
                if (rstep.getScript() != null) {
                    scriptId = resolver.getTaskResult(rstep.getScript());
                    // Fallback: find by name+namespace
                }
                
                PipelineStep step = pipelineStepService.addStepToPipeline(pipeline.getId(), agentId, scriptId);
                step.setStepOrder(rstep.getOrder());
                step.setType(resolver.resolve(rstep.getType()));
                step.setRuntime(resolver.resolve(rstep.getRuntime()));
                step.setCli(resolver.resolve(rstep.getCli()));
                step.setParameters(resolver.resolve(rstep.getParameters()));
                step.setArguments(resolver.resolve(rstep.getArguments()));
                
                // Handle prompt override
                if (rstep.getPrompt() != null) {
                    // If agent exists, update agent's prompt for this step
                    // Or set up as a standalone prompt step
                    if (step.getAgent() != null) {
                        Agent agent = step.getAgent();
                        // Store the override prompt in the step's inputContent
                        // The executor will pick it up during pipeline execution
                    }
                    step.setInputContent(resolver.resolve(rstep.getPrompt()));
                    step.setInputType("text");
                }
                
                // Handle input/output
                if (rstep.getInput() != null) {
                    step.setInputContent(resolver.resolve(rstep.getInput().getContent()));
                    step.setInputType(resolver.resolve(rstep.getInput().getType()));
                }
                if (rstep.getOutput() != null) {
                    step.setOutputContent(resolver.resolve(rstep.getOutput().getContent()));
                    step.setOutputType(resolver.resolve(rstep.getOutput().getType()));
                }
                
                pipelineStepRepository.save(step);
            }
        }
        
        return pipeline.getId();
    }

    // Similar methods for createAgent, createScript, createTarget, createTemplate
    // executeRunTask handles repeat, retry, loop
    // executeStopTask calls pipelineStepService.stopPipelineExecution
    // executeCallTask finds existing pipeline and runs it
}
```

### 6.8 Prompt Override Logic

When a step has a `prompt` field:
1. If the step has an agent → The prompt overrides the agent's prompt during this pipeline run
2. If the step has a script → The prompt is stored in `inputContent` and passed as input to the script
3. If the step has NO agent and NO script → Create a "prompt-only" step:
   - Set `type = "agent"` (so executor uses agent-style execution)
   - Set `inputContent = prompt` 
   - The step will execute the prompt using the default CLI (project target CLI or "opencode")

To implement prompt override properly, we need a way to pass the override prompt to the pipeline executor. The cleanest approach:
- Store the override prompt in `PipelineStep.inputContent` (which is already read by the executor)
- Modify `PipelineStepService.executeAgentStep()` to check: if `step.getInputContent()` is not null and looks like a prompt override, use it instead of `agent.getPrompt()`

**Modification to PipelineStepService.executeAgentStep():**
```java
// Current: String prompt = agent.getPrompt();
// New: 
String prompt;
if (step.getInputContent() != null && !step.getInputContent().isEmpty()) {
    prompt = resolveInputContent(step.getInputContent(), pipelineId, step.getStepOrder(), runDir);
} else {
    prompt = agent.getPrompt();
}
```

This is a minimal change that enables prompt override via the recipe system.

---

## Step 7: Create RecipeController

**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/controller/RecipeController.java`

```java
@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    @Autowired private RecipeExecutor recipeExecutor;
    @Autowired private RecipeRepository recipeRepository;
    @Autowired private RecipeTaskResultRepository taskResultRepository;
    @Autowired private RecipeParser recipeParser;

    // POST /api/recipes/execute - Execute recipe from YAML content
    // Body: { "content": "...yaml...", "parameters": { "key": "value" } }
    // Returns: Recipe entity with status

    // POST /api/recipes/execute-from-path - Execute recipe from file path
    // Body: { "path": "/path/to/recipe.yml", "parameters": { "key": "value" } }

    // POST /api/recipes/validate - Validate recipe without executing
    // Body: { "content": "...yaml..." }

    // GET /api/recipes - List all recipes
    // GET /api/recipes/{id} - Get recipe by ID with task results
    // GET /api/recipes/{id}/tasks - Get task results for a recipe
    // DELETE /api/recipes/{id} - Delete recipe
    // POST /api/recipes/{id}/stop - Stop running recipe
}
```

---

## Step 8: Create RecipeTools (MCP)

**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/mcp/tools/RecipeTools.java`

### Tools:
1. **execute_recipe** - Execute recipe from YAML file path or inline content
   - Parameters: `path` (string, optional) OR `content` (string, optional), `parameters` (object, optional)
   - Required: either `path` or `content`

2. **validate_recipe** - Validate recipe without executing
   - Parameters: `content` (string, required)
   - Returns: validation result with any errors

3. **list_recipes** - List executed recipes
   - Parameters: none

4. **get_recipe** - Get recipe details with task results
   - Parameters: `id` (integer, required)

5. **stop_recipe** - Stop a running recipe
   - Parameters: `id` (integer, required)

### Register in McpConfig:
Add `RecipeTools recipeTools` parameter to `mcpServer()` bean method and:
```java
allTools.addAll(recipeTools.getToolSpecifications());
```

---

## Step 9: Create Recipe Template YAML

**File:** `backend/recipes/recipe-template.yml`

Complete template with all possible values (as designed in the plan above).

---

## Step 10: Update McpConfig.java

Add RecipeTools import and inject it in the mcpServer bean:
```java
import io.github.akumosstl.agentic.backend.mcp.tools.RecipeTools;

// In mcpServer method signature, add:
RecipeTools recipeTools,

// In allTools assembly:
allTools.addAll(recipeTools.getToolSpecifications());
```

---

## Step 11: Modify PipelineStepService for Prompt Override

**File:** `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineStepService.java`

In `executeAgentStep()`, change prompt resolution:
```java
// Before:
String prompt = agent.getPrompt();
if (prompt == null || prompt.trim().isEmpty()) {
    prompt = "Hello, please respond.";
}

// After:
String prompt;
if (step.getInputContent() != null && !step.getInputContent().isEmpty()) {
    prompt = resolveInputContent(step.getInputContent(), pipelineId, stepOrder, runDir);
} else {
    prompt = agent.getPrompt();
    if (prompt == null || prompt.trim().isEmpty()) {
        prompt = "Hello, please respond.";
    }
}
```

This enables the recipe `prompt` field to override agent prompts at the step level.

---

## Step 12: Update NativeImageReflectionConfig (if needed)

Add Recipe and RecipeTaskResult classes to the reflection config for native builds.

---

## Step 13: Update .opencode-context

Add Recipe Engine section to document the new feature.

---

## Step 14: Build and Test

```bash
cd backend
mvn clean install
mvn test
```

---

## Implementation Order

1. **pom.xml** - Add jackson-dataformat-yaml dependency
2. **recipe/RecipeYaml.java + all POJOs** - 13 small model classes
3. **recipe/RecipeParser.java** - YAML parser with validation
4. **recipe/RecipeParameterResolver.java** - Placeholder resolution
5. **model/Recipe.java** - JPA entity
6. **model/RecipeTaskResult.java** - JPA entity
7. **repository/RecipeRepository.java** - JPA repository
8. **repository/RecipeTaskResultRepository.java** - JPA repository
9. **recipe/RecipeExecutor.java** - Core execution engine (largest file)
10. **controller/RecipeController.java** - REST API
11. **mcp/tools/RecipeTools.java** - MCP tools
12. **mcp/McpConfig.java** - Register RecipeTools
13. **service/PipelineStepService.java** - Prompt override modification
14. **recipes/recipe-template.yml** - Template file
15. **.opencode-context** - Documentation update
16. **Build and test**

---

## Key Design Decisions

1. **No rollback on V1** - Tasks that fail leave created artifacts in the DB (consistent with current system behavior)
2. **Background thread execution** - Recipe runs in a separate thread, just like pipelines
3. **Prompt override via inputContent** - Reuses existing field, minimal change to PipelineStepService
4. **Parameter resolution is recursive** - `{{param:X}}` values can themselves contain placeholders
5. **Task results tracked by DB ID** - `taskResults` map stores `taskId → entityId` for cross-referencing
6. **Reference resolution** - Recipe refs (like `pipeline_ref: "pipe1"`) resolve to DB IDs after creation, or find existing entities by name
7. **Loop conditions** - `always` repeats indefinitely (bounded by max_iterations), `until_success` stops on first success, `until_failure` stops on first failure
8. **SSE integration** - Recipe execution emits SSE events for task status changes
