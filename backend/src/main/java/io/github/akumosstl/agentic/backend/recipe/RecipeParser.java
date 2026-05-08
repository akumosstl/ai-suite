package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class RecipeParser {

    private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    private static final Set<String> VALID_TASK_TYPES = Set.of("create", "run", "stop", "call");
    private static final Set<String> VALID_RESOURCES = Set.of("project", "agent", "script", "pipeline", "target", "template");

    public RecipeYaml parse(String yamlContent) throws Exception {
        return yamlMapper.readValue(yamlContent, RecipeYaml.class);
    }

    public RecipeYaml parse(File file) throws Exception {
        return yamlMapper.readValue(file, RecipeYaml.class);
    }

    public RecipeYaml parse(InputStream inputStream) throws Exception {
        return yamlMapper.readValue(inputStream, RecipeYaml.class);
    }

    public String validate(RecipeYaml recipe) {
        if (recipe == null) {
            return "Recipe is null";
        }

        if (recipe.getRecipe() == null || recipe.getRecipe().getName() == null || recipe.getRecipe().getName().isBlank()) {
            return "Required field 'recipe.name' is missing";
        }

        if (recipe.getTasks() == null || recipe.getTasks().isEmpty()) {
            return "At least one task is required in 'tasks'";
        }

        Set<String> taskIds = new HashSet<>();
        for (RecipeTask task : recipe.getTasks()) {
            if (task.getId() == null || task.getId().isBlank()) {
                return "Each task must have an 'id' field";
            }
            if (taskIds.contains(task.getId())) {
                return "Duplicate task id: " + task.getId();
            }
            taskIds.add(task.getId());

            if (task.getType() == null || !VALID_TASK_TYPES.contains(task.getType())) {
                return "Task '" + task.getId() + "' has invalid type '" + task.getType() + "'. Valid types: " + VALID_TASK_TYPES;
            }

            if ("create".equals(task.getType())) {
                if (task.getResource() == null || !VALID_RESOURCES.contains(task.getResource())) {
                    return "Task '" + task.getId() + "' has invalid resource '" + task.getResource() + "'. Valid resources: " + VALID_RESOURCES;
                }
            }
        }

        if (recipe.getTasks() != null) {
            for (RecipeTask task : recipe.getTasks()) {
                if (task.getDependsOn() != null) {
                    for (String dep : task.getDependsOn()) {
                        if (!taskIds.contains(dep)) {
                            return "Task '" + task.getId() + "' depends_on non-existent task: " + dep;
                        }
                    }
                }
            }
        }

        String circularError = checkCircularDependencies(recipe.getTasks());
        if (circularError != null) {
            return circularError;
        }

        Set<String> declaredIds = new HashSet<>();
        if (recipe.getProjects() != null) declaredIds.addAll(recipe.getProjects().stream().map(RecipeProject::getId).filter(Objects::nonNull).collect(Collectors.toSet()));
        if (recipe.getAgents() != null) declaredIds.addAll(recipe.getAgents().stream().map(RecipeAgent::getId).filter(Objects::nonNull).collect(Collectors.toSet()));
        if (recipe.getScripts() != null) declaredIds.addAll(recipe.getScripts().stream().map(RecipeScript::getId).filter(Objects::nonNull).collect(Collectors.toSet()));
        if (recipe.getPipelines() != null) declaredIds.addAll(recipe.getPipelines().stream().map(RecipePipeline::getId).filter(Objects::nonNull).collect(Collectors.toSet()));
        if (recipe.getTargets() != null) declaredIds.addAll(recipe.getTargets().stream().map(RecipeTarget::getName).filter(Objects::nonNull).collect(Collectors.toSet()));
        if (recipe.getTemplates() != null) declaredIds.addAll(recipe.getTemplates().stream().map(RecipeTemplate::getId).filter(Objects::nonNull).collect(Collectors.toSet()));

        if (recipe.getTasks() != null) {
            for (RecipeTask task : recipe.getTasks()) {
                if (task.getRef() != null && !task.getRef().isEmpty() && "create".equals(task.getType())) {
                    if (!declaredIds.contains(task.getRef())) {
                        return "Task '" + task.getId() + "' ref '" + task.getRef() + "' not found in declared " + task.getResource() + "s";
                    }
                }
                if (task.getPipelineRef() != null && !task.getPipelineRef().isEmpty()) {
                    if (!declaredIds.contains(task.getPipelineRef())) {
                        return "Task '" + task.getId() + "' pipeline_ref '" + task.getPipelineRef() + "' not found in declared pipelines";
                    }
                }
            }
        }

        return null;
    }

    private String checkCircularDependencies(List<RecipeTask> tasks) {
        if (tasks == null) return null;

        Map<String, List<String>> graph = new HashMap<>();
        for (RecipeTask task : tasks) {
            graph.put(task.getId(), task.getDependsOn() != null ? task.getDependsOn() : List.of());
        }

        Set<String> visited = new HashSet<>();
        Set<String> inStack = new HashSet<>();

        for (String taskId : graph.keySet()) {
            if (hasCycle(taskId, graph, visited, inStack)) {
                return "Circular dependency detected involving task: " + taskId;
            }
        }

        return null;
    }

    private boolean hasCycle(String nodeId, Map<String, List<String>> graph, Set<String> visited, Set<String> inStack) {
        if (inStack.contains(nodeId)) return true;
        if (visited.contains(nodeId)) return false;

        visited.add(nodeId);
        inStack.add(nodeId);

        List<String> deps = graph.getOrDefault(nodeId, List.of());
        for (String dep : deps) {
            if (hasCycle(dep, graph, visited, inStack)) {
                return true;
            }
        }

        inStack.remove(nodeId);
        return false;
    }
}
