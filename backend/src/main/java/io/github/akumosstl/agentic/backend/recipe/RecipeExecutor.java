package io.github.akumosstl.agentic.backend.recipe;

import io.github.akumosstl.agentic.backend.model.*;
import io.github.akumosstl.agentic.backend.repository.RecipeRepository;
import io.github.akumosstl.agentic.backend.repository.RecipeTaskResultRepository;
import io.github.akumosstl.agentic.backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class RecipeExecutor {

    private static final Logger logger = LoggerFactory.getLogger(RecipeExecutor.class);

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
        try {
            RecipeYaml recipeYaml = recipeParser.parse(yamlContent);

            if (overrideParams != null && !overrideParams.isEmpty()) {
                Map<String, Object> mergedParams = new HashMap<>();
                if (recipeYaml.getParameters() != null) {
                    mergedParams.putAll(recipeYaml.getParameters());
                }
                mergedParams.putAll(overrideParams);
                recipeYaml.setParameters(mergedParams);
            }

            RecipeParameterResolver resolver = new RecipeParameterResolver(
                recipeYaml.getParameters(), recipeYaml.getEnv(), new HashMap<>());
            recipeYaml = resolver.resolveAll(recipeYaml);

            String validationError = recipeParser.validate(recipeYaml);
            if (validationError != null) {
                throw new IllegalArgumentException(validationError);
            }

            Recipe recipe = new Recipe();
            recipe.setName(recipeYaml.getRecipe().getName());
            recipe.setVersion(recipeYaml.getRecipe().getVersion());
            recipe.setDescription(recipeYaml.getRecipe().getDescription());
            recipe.setSource(yamlContent);
            recipe.setStatus("running");

            if (recipeYaml.getParameters() != null && !recipeYaml.getParameters().isEmpty()) {
                recipe.setParameters(new com.google.gson.Gson().toJson(recipeYaml.getParameters()));
            }

            recipe = recipeRepository.save(recipe);

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
            final RecipeYaml finalRecipeYaml = recipeYaml;

            new Thread(() -> {
                try {
                    executeTasks(recipeId, finalRecipeYaml, resolver, taskResultMap);
                    Recipe r = recipeRepository.findById(recipeId).orElse(null);
                    if (r != null && !stoppedRecipes.contains(recipeId)) {
                        boolean hasFailed = r.getTaskResults().stream()
                            .anyMatch(tr -> "failed".equals(tr.getStatus()));
                        r.setStatus(hasFailed ? "failed" : "completed");
                        r.setCompletedAt(LocalDateTime.now());
                        recipeRepository.save(r);
                    }
                } catch (Exception e) {
                    logger.error("Recipe execution failed", e);
                    Recipe r = recipeRepository.findById(recipeId).orElse(null);
                    if (r != null) {
                        r.setStatus("failed");
                        r.setCompletedAt(LocalDateTime.now());
                        recipeRepository.save(r);
                    }
                }
            }, "recipe-" + recipeId).start();

            return recipe;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse recipe YAML: " + e.getMessage(), e);
        }
    }

    public Recipe executeFromPath(String filePath, Map<String, Object> overrideParams) {
        try {
            String content = Files.readString(Path.of(filePath));
            Recipe recipe = execute(content, overrideParams);
            recipe.setSourcePath(filePath);
            return recipeRepository.save(recipe);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read recipe file: " + e.getMessage(), e);
        }
    }

    public void stopRecipe(Long recipeId) {
        stoppedRecipes.add(recipeId);
    }

    private void executeTasks(Long recipeId, RecipeYaml recipeYaml,
                              RecipeParameterResolver resolver,
                              Map<String, RecipeTaskResult> taskResultMap) {
        List<RecipeTask> tasks = recipeYaml.getTasks();
        if (tasks == null || tasks.isEmpty()) return;

        List<String> sortedTaskIds = topologicalSort(tasks);
        Set<String> completedTaskIds = new HashSet<>();
        Set<String> failedTaskIds = new HashSet<>();

        for (String taskId : sortedTaskIds) {
            if (stoppedRecipes.contains(recipeId)) {
                RecipeTaskResult tr = taskResultMap.get(taskId);
                if (tr != null && !"completed".equals(tr.getStatus()) && !"failed".equals(tr.getStatus())) {
                    tr.setStatus("skipped");
                    tr.setErrorMessage("Recipe was stopped");
                    taskResultRepository.save(tr);
                }
                continue;
            }

            RecipeTask task = tasks.stream().filter(t -> t.getId().equals(taskId)).findFirst().orElse(null);
            if (task == null) continue;

            RecipeTaskResult taskResult = taskResultMap.get(taskId);

            if (task.getDependsOn() != null && !task.getDependsOn().isEmpty()) {
                boolean allDepsCompleted = task.getDependsOn().stream().allMatch(completedTaskIds::contains);
                boolean anyDepFailed = task.getDependsOn().stream().anyMatch(failedTaskIds::contains);

                if (anyDepFailed) {
                    taskResult.setStatus("skipped");
                    taskResult.setErrorMessage("Dependency failed");
                    taskResultRepository.save(taskResult);
                    failedTaskIds.add(taskId);
                    continue;
                }

                if (!allDepsCompleted) {
                    taskResult.setStatus("skipped");
                    taskResult.setErrorMessage("Dependency not completed");
                    taskResultRepository.save(taskResult);
                    failedTaskIds.add(taskId);
                    continue;
                }
            }

            taskResult.setStatus("running");
            taskResult.setStartedAt(LocalDateTime.now());
            taskResultRepository.save(taskResult);

            try {
                Long entityId = executeTask(recipeYaml, task, resolver, recipeId);
                taskResult.setResultEntityId(entityId);
                taskResult.setStatus("completed");
                taskResult.setCompletedAt(LocalDateTime.now());

                if (entityId != null) {
                    resolver.registerTaskResult(taskId, entityId);
                    if ("create".equals(task.getType())) {
                        resolver.registerTaskResult(task.getRef(), entityId);
                    }
                }

                completedTaskIds.add(taskId);

            } catch (Exception e) {
                logger.error("Task '{}' failed: {}", taskId, e.getMessage(), e);

                RecipeRetry retry = task.getRetry();
                int maxAttempts = (retry != null && retry.getMaxAttempts() != null) ? retry.getMaxAttempts() : 1;
                int attempt = 1;
                boolean succeeded = false;

                while (attempt < maxAttempts) {
                    attempt++;
                    try {
                        if (retry.getDelaySeconds() != null && retry.getDelaySeconds() > 0) {
                            Thread.sleep(retry.getDelaySeconds() * 1000L);
                        }
                        Long entityId = executeTask(recipeYaml, task, resolver, recipeId);
                        taskResult.setResultEntityId(entityId);
                        taskResult.setStatus("completed");
                        taskResult.setAttemptCount(attempt);
                        taskResult.setCompletedAt(LocalDateTime.now());
                        succeeded = true;

                        if (entityId != null) {
                            resolver.registerTaskResult(taskId, entityId);
                        }
                        completedTaskIds.add(taskId);
                        break;
                    } catch (Exception retryEx) {
                        logger.warn("Task '{}' retry {} failed: {}", taskId, attempt, retryEx.getMessage());
                    }
                }

                if (!succeeded) {
                    taskResult.setStatus("failed");
                    taskResult.setErrorMessage(e.getMessage());
                    taskResult.setAttemptCount(attempt);
                    taskResult.setCompletedAt(LocalDateTime.now());
                    failedTaskIds.add(taskId);

                    if (task.getStopOnFailure() != null && task.getStopOnFailure()) {
                        logger.info("Task '{}' has stop_on_failure=true, aborting remaining tasks", taskId);
                        for (String remainingId : sortedTaskIds) {
                            if (!completedTaskIds.contains(remainingId) && !failedTaskIds.contains(remainingId)) {
                                RecipeTaskResult remainingResult = taskResultMap.get(remainingId);
                                if (remainingResult != null && "pending".equals(remainingResult.getStatus())) {
                                    remainingResult.setStatus("skipped");
                                    remainingResult.setErrorMessage("Stopped due to task " + taskId + " failure");
                                    taskResultRepository.save(remainingResult);
                                    failedTaskIds.add(remainingId);
                                }
                            }
                        }
                        break;
                    }
                }
            }

            taskResultRepository.save(taskResult);
        }
    }

    private Long executeTask(RecipeYaml recipeYaml, RecipeTask task,
                             RecipeParameterResolver resolver, Long recipeId) throws Exception {
        String type = task.getType();

        switch (type) {
            case "create":
                return executeCreateTask(recipeYaml, task, resolver);
            case "run":
                return executeRunTask(recipeYaml, task, resolver);
            case "stop":
                return executeStopTask(recipeYaml, task, resolver);
            case "call":
                return executeCallTask(recipeYaml, task, resolver);
            default:
                throw new IllegalArgumentException("Unknown task type: " + type);
        }
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
            default: throw new IllegalArgumentException("Unknown resource type: " + resource);
        }
    }

    private Long createProject(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipeProject rp = findById(recipeYaml.getProjects(), ref);
        if (rp == null) throw new RuntimeException("Project not found in recipe: " + ref);

        Project project = new Project();
        project.setName(resolver.resolve(rp.getName()));
        project.setDescription(resolver.resolve(rp.getDescription()));
        project.setPath(resolver.resolve(rp.getPath()));
        project.setTarget(resolver.resolve(rp.getTarget()));
        project.setStatus(resolver.resolve(rp.getStatus()) != null ? resolver.resolve(rp.getStatus()) : "active");
        project.setReadme(resolver.resolve(rp.getReadme()));

        if (rp.getTarget() != null && !rp.getTarget().isEmpty()) {
            try {
                Target target = targetService.getTargetByName(resolver.resolve(rp.getTarget()));
                project.setTargetId(target.getId());
            } catch (Exception e) {
                logger.warn("Target '{}' not found for project '{}'", rp.getTarget(), rp.getName());
            }
        }

        project = projectService.createProject(project);

        if (rp.getAgents() != null) {
            List<Long> agentIds = new ArrayList<>();
            for (String agentRef : rp.getAgents()) {
                Long agentId = resolver.getTaskResult(agentRef);
                if (agentId == null) {
                    agentId = findAgentIdByName(recipeYaml, agentRef, resolver);
                }
                if (agentId != null) {
                    agentIds.add(agentId);
                }
            }
            if (!agentIds.isEmpty()) {
                projectService.addAgentsToProject(project.getId(), agentIds, true);
            }
        }

        if (rp.getScripts() != null) {
            List<Long> scriptIds = new ArrayList<>();
            for (String scriptRef : rp.getScripts()) {
                Long scriptId = resolver.getTaskResult(scriptRef);
                if (scriptId == null) {
                    scriptId = findScriptIdByName(recipeYaml, scriptRef, resolver);
                }
                if (scriptId != null) {
                    scriptIds.add(scriptId);
                }
            }
            if (!scriptIds.isEmpty()) {
                projectService.addScriptsToProject(project.getId(), scriptIds, true);
            }
        }

        resolver.registerTaskResult("_project:" + rp.getId(), project.getId());
        return project.getId();
    }

    private Long createAgent(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipeAgent ra = findById(recipeYaml.getAgents(), ref);
        if (ra == null) throw new RuntimeException("Agent not found in recipe: " + ref);

        Agent agent = agentService.findOrCreateAgent(
                resolver.resolve(ra.getName()),
                ra.getNamespace() != null ? resolver.resolve(ra.getNamespace()) : null,
                ra.getCategory() != null ? resolver.resolve(ra.getCategory()) : null,
                ra.getDescription() != null ? resolver.resolve(ra.getDescription()) : null,
                ra.getPrompt() != null ? resolver.resolve(ra.getPrompt()) : null,
                ra.getPath() != null ? resolver.resolve(ra.getPath()) : null
        );
        resolver.registerTaskResult("_agent:" + ra.getId(), agent.getId());
        return agent.getId();
    }

    private Long createScript(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipeScript rs = findById(recipeYaml.getScripts(), ref);
        if (rs == null) throw new RuntimeException("Script not found in recipe: " + ref);

        Script script = scriptService.findOrCreateScript(
                resolver.resolve(rs.getName()),
                rs.getNamespace() != null ? resolver.resolve(rs.getNamespace()) : null,
                rs.getCategory() != null ? resolver.resolve(rs.getCategory()) : null,
                rs.getDescription() != null ? resolver.resolve(rs.getDescription()) : null,
                rs.getContent() != null ? resolver.resolve(rs.getContent()) : null,
                rs.getScope() != null ? resolver.resolve(rs.getScope()) : null,
                rs.getPath() != null ? resolver.resolve(rs.getPath()) : null
        );
        resolver.registerTaskResult("_script:" + rs.getId(), script.getId());
        return script.getId();
    }

    private Long createPipeline(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipePipeline rpipe = findById(recipeYaml.getPipelines(), ref);
        if (rpipe == null) throw new RuntimeException("Pipeline not found in recipe: " + ref);

        Long projectId = resolveProjectId(recipeYaml, rpipe.getProject(), resolver);
        if (projectId == null) {
            throw new RuntimeException("Cannot resolve project for pipeline: " + rpipe.getName());
        }

        List<Pipeline> existingPipelines = pipelineService.getPipelineRepository().findByProject_IdAndName(projectId, resolver.resolve(rpipe.getName()));
        Pipeline pipeline;
        boolean isNewPipeline;

        if (!existingPipelines.isEmpty()) {
            pipeline = existingPipelines.get(0);
            isNewPipeline = false;
        } else {
            pipeline = pipelineService.findOrCreatePipeline(projectId,
                    resolver.resolve(rpipe.getName()),
                    rpipe.getDescription() != null ? resolver.resolve(rpipe.getDescription()) : null,
                    rpipe.getType() != null ? resolver.resolve(rpipe.getType()) : null,
                    rpipe.getOutputExtension() != null ? resolver.resolve(rpipe.getOutputExtension()) : null
            );
            isNewPipeline = true;
        }

        if (isNewPipeline && rpipe.getSteps() != null) {
            for (RecipeStep rstep : rpipe.getSteps()) {
                Long agentId = null;
                Long scriptId = null;

                if (rstep.getAgent() != null) {
                    agentId = resolver.getTaskResult(rstep.getAgent());
                    if (agentId == null) {
                        agentId = findAgentIdByName(recipeYaml, rstep.getAgent(), resolver);
                    }
                }

                if (rstep.getScript() != null) {
                    scriptId = resolver.getTaskResult(rstep.getScript());
                    if (scriptId == null) {
                        scriptId = findScriptIdByName(recipeYaml, rstep.getScript(), resolver);
                    }
                }

                PipelineStep step = pipelineStepService.addStepToPipeline(pipeline.getId(), agentId, scriptId);

                if (rstep.getOrder() != null) {
                    step.setStepOrder(rstep.getOrder());
                }
                if (rstep.getType() != null) {
                    step.setType(resolver.resolve(rstep.getType()));
                }
                if (rstep.getRuntime() != null) {
                    step.setRuntime(resolver.resolve(rstep.getRuntime()));
                }
                if (rstep.getCli() != null) {
                    step.setCli(resolver.resolve(rstep.getCli()));
                }
                if (rstep.getParameters() != null) {
                    step.setParameters(resolver.resolve(rstep.getParameters()));
                }
                if (rstep.getArguments() != null) {
                    step.setArguments(resolver.resolve(rstep.getArguments()));
                }

                if (rstep.getPrompt() != null) {
                    step.setInputContent(resolver.resolve(rstep.getPrompt()));
                    step.setInputType("text");
                    if (step.getType() == null || step.getType().isEmpty()) {
                        step.setType("agent");
                    }
                }

                if (rstep.getInput() != null) {
                    step.setInputContent(resolver.resolve(rstep.getInput().getContent()));
                    step.setInputType(resolver.resolve(rstep.getInput().getType()));
                }
                if (rstep.getOutput() != null) {
                    step.setOutputContent(resolver.resolve(rstep.getOutput().getContent()));
                    step.setOutputType(resolver.resolve(rstep.getOutput().getType()));
                }

                pipelineStepService.saveStep(step);
            }
        }

        resolver.registerTaskResult("_pipeline:" + ref, pipeline.getId());
        return pipeline.getId();
    }

    private Long createTarget(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipeTarget rt = findById(recipeYaml.getTargets(), ref);
        if (rt == null) throw new RuntimeException("Target not found in recipe: " + ref);

        Target target = targetService.findOrCreateTarget(
                resolver.resolve(rt.getName()),
                resolver.resolve(rt.getAgentsPath()),
                resolver.resolve(rt.getScriptsPath()),
                resolver.resolve(rt.getCli())
        );
        return target.getId();
    }

    private Long createTemplate(RecipeYaml recipeYaml, String ref, RecipeParameterResolver resolver) {
        RecipeTemplate rt = findById(recipeYaml.getTemplates(), ref);
        if (rt == null) throw new RuntimeException("Template not found in recipe: " + ref);

        Template template = templateService.findOrCreateTemplate(
                resolver.resolve(rt.getName()),
                rt.getType() != null ? resolver.resolve(rt.getType()) : null,
                rt.getDescription() != null ? resolver.resolve(rt.getDescription()) : null,
                rt.getTemplate() != null ? resolver.resolve(rt.getTemplate()) : null
        );
        return template.getId();
    }

    private Long executeRunTask(RecipeYaml recipeYaml, RecipeTask task,
                                RecipeParameterResolver resolver) {
        Long pipelineId = resolvePipelineId(recipeYaml, task, resolver);
        if (pipelineId == null) {
            throw new RuntimeException("Cannot resolve pipeline for run task: " + task.getId());
        }

        RecipeLoop loop = task.getLoop();
        int repeatCount = task.getRepeat() != null ? task.getRepeat() : 1;

        if (loop != null) {
            return executeWithLoop(pipelineId, loop);
        }

        for (int i = 0; i < repeatCount; i++) {
            pipelineService.runPipeline(pipelineId);

            if (task.getWait() != null && task.getWait()) {
                waitForPipelineCompletion(pipelineId);
            }
        }

        return pipelineId;
    }

    private Long executeWithLoop(Long pipelineId, RecipeLoop loop) {
        String condition = loop.getCondition() != null ? loop.getCondition() : "always";
        int maxIterations = loop.getMaxIterations() != null ? loop.getMaxIterations() : 10;
        int delaySeconds = loop.getDelaySeconds() != null ? loop.getDelaySeconds() : 0;
        int iteration = 0;

        while (iteration < maxIterations) {
            iteration++;
            pipelineService.runPipeline(pipelineId);
            waitForPipelineCompletion(pipelineId);

            Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
            String pipelineStatus = pipeline.getStatus();

            if ("until_success".equals(condition) && "completed".equals(pipelineStatus)) {
                break;
            }
            if ("until_failure".equals(condition) && "failed".equals(pipelineStatus)) {
                break;
            }

            if (delaySeconds > 0 && iteration < maxIterations) {
                try { Thread.sleep(delaySeconds * 1000L); } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            }
        }

        return pipelineId;
    }

    private Long executeStopTask(RecipeYaml recipeYaml, RecipeTask task,
                                 RecipeParameterResolver resolver) {
        Long pipelineId = resolvePipelineId(recipeYaml, task, resolver);
        if (pipelineId == null) {
            throw new RuntimeException("Cannot resolve pipeline for stop task: " + task.getId());
        }
        pipelineStepService.stopPipelineExecution(pipelineId);
        return pipelineId;
    }

    private Long executeCallTask(RecipeYaml recipeYaml, RecipeTask task,
                                 RecipeParameterResolver resolver) {
        Long pipelineId = resolvePipelineId(recipeYaml, task, resolver);
        if (pipelineId == null) {
            throw new RuntimeException("Cannot resolve pipeline for call task: " + task.getId());
        }

        pipelineService.runPipeline(pipelineId);

        if (task.getWait() != null && task.getWait()) {
            waitForPipelineCompletion(pipelineId);
        }

        return pipelineId;
    }

    private Long resolvePipelineId(RecipeYaml recipeYaml, RecipeTask task,
                                   RecipeParameterResolver resolver) {
        if (task.getPipelineId() != null) {
            return task.getPipelineId();
        }

        if (task.getPipelineRef() != null) {
            Long id = resolver.getTaskResult(task.getPipelineRef());
            if (id != null) return id;
            id = resolver.getTaskResult("_pipeline:" + task.getPipelineRef());
            if (id != null) return id;
        }

        if (task.getPipelineName() != null) {
            String pipelineName = resolver.resolve(task.getPipelineName());
            List<Pipeline> allPipelines = pipelineService.getAllPipelines();
            for (Pipeline p : allPipelines) {
                if (pipelineName.equals(p.getName())) {
                    return p.getId();
                }
            }
        }

        return null;
    }

    private Long resolveProjectId(RecipeYaml recipeYaml, String projectRef,
                                  RecipeParameterResolver resolver) {
        if (projectRef == null || projectRef.isEmpty()) return null;

        Long id = resolver.getTaskResult(projectRef);
        if (id != null) return id;
        id = resolver.getTaskResult("_project:" + projectRef);
        if (id != null) return id;

        if (recipeYaml.getProjects() != null) {
            for (RecipeProject rp : recipeYaml.getProjects()) {
                if (projectRef.equals(rp.getId()) || projectRef.equals(rp.getName())) {
                    String name = resolver.resolve(rp.getName());
                    try {
                        List<Project> projects = projectService.getTop10RecentProjects();
                        for (Project p : projects) {
                            if (name.equals(p.getName())) return p.getId();
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
        }

        return null;
    }

    private Long findAgentIdByName(RecipeYaml recipeYaml, String agentRef,
                                   RecipeParameterResolver resolver) {
        if (agentRef == null) return null;

        Long cachedId = resolver.getTaskResult("_agent:" + agentRef);
        if (cachedId != null) return cachedId;

        if (recipeYaml.getAgents() != null) {
            for (RecipeAgent ra : recipeYaml.getAgents()) {
                if (agentRef.equals(ra.getId()) || agentRef.equals(ra.getName())) {
                    String name = resolver.resolve(ra.getName());
                    String namespace = ra.getNamespace() != null ? resolver.resolve(ra.getNamespace()) : "";
                    try {
                        List<Agent> agents = agentService.searchAgents(name, namespace, 0, 10);
                        for (Agent a : agents) {
                            if (name.equals(a.getName()) && namespace.equals(a.getNamespace())) {
                                return a.getId();
                            }
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
        }

        try {
            Agent agent = agentService.getAgentById(Long.parseLong(agentRef));
            return agent.getId();
        } catch (Exception e) {
            // not a numeric ID
        }

        return null;
    }

    private Long findScriptIdByName(RecipeYaml recipeYaml, String scriptRef,
                                    RecipeParameterResolver resolver) {
        if (scriptRef == null) return null;

        Long cachedId = resolver.getTaskResult("_script:" + scriptRef);
        if (cachedId != null) return cachedId;

        if (recipeYaml.getScripts() != null) {
            for (RecipeScript rs : recipeYaml.getScripts()) {
                if (scriptRef.equals(rs.getId()) || scriptRef.equals(rs.getName())) {
                    String name = resolver.resolve(rs.getName());
                    String namespace = rs.getNamespace() != null ? resolver.resolve(rs.getNamespace()) : "";
                    try {
                        List<Script> scripts = scriptService.searchScripts(name, namespace, 0, 10);
                        for (Script s : scripts) {
                            if (name.equals(s.getName()) && namespace.equals(s.getNamespace())) {
                                return s.getId();
                            }
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
        }

        try {
            Script script = scriptService.getScriptById(Long.parseLong(scriptRef));
            return script.getId();
        } catch (Exception e) {
            // not a numeric ID
        }

        return null;
    }

    private void waitForPipelineCompletion(Long pipelineId) {
        int maxWaitSeconds = 600;
        int waited = 0;
        while (waited < maxWaitSeconds) {
            try {
                Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
                String status = pipeline.getStatus();
                if ("completed".equals(status) || "failed".equals(status) || "stopped".equals(status)) {
                    return;
                }
                Thread.sleep(2000);
                waited += 2;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception e) {
                logger.warn("Error polling pipeline status: {}", e.getMessage());
                try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
                waited += 2;
            }
        }
        logger.warn("Timed out waiting for pipeline {} completion after {}s", pipelineId, maxWaitSeconds);
    }

    private List<String> topologicalSort(List<RecipeTask> tasks) {
        Map<String, List<String>> graph = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();
        List<String> result = new ArrayList<>();

        for (RecipeTask task : tasks) {
            graph.putIfAbsent(task.getId(), new ArrayList<>());
            inDegree.putIfAbsent(task.getId(), 0);
        }

        for (RecipeTask task : tasks) {
            if (task.getDependsOn() != null) {
                for (String dep : task.getDependsOn()) {
                    graph.computeIfAbsent(dep, k -> new ArrayList<>()).add(task.getId());
                    inDegree.merge(task.getId(), 1, Integer::sum);
                }
            }
        }

        Queue<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
            }
        }

        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(current);
            for (String neighbor : graph.getOrDefault(current, List.of())) {
                int newDegree = inDegree.get(neighbor) - 1;
                inDegree.put(neighbor, newDegree);
                if (newDegree == 0) {
                    queue.add(neighbor);
                }
            }
        }

        return result;
    }

    private <T> T findById(List<T> items, String id) {
        if (items == null || id == null) return null;
        for (T item : items) {
            try {
                java.lang.reflect.Method getIdMethod = item.getClass().getMethod("getId");
                String itemId = (String) getIdMethod.invoke(item);
                if (id.equals(itemId)) return item;
            } catch (Exception e) {
                // try getName
                try {
                    java.lang.reflect.Method getNameMethod = item.getClass().getMethod("getName");
                    String itemName = (String) getNameMethod.invoke(item);
                    if (id.equals(itemName)) return item;
                } catch (Exception ex) {
                    // ignore
                }
            }
        }
        return null;
    }
}
