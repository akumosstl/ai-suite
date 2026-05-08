package io.github.akumosstl.agentic.backend.recipe;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RecipeParameterResolver {

    private final Map<String, Object> parameters;
    private final Map<String, String> env;
    private final Map<String, Long> taskResults;

    private static final Pattern PARAM_PATTERN = Pattern.compile("\\{\\{param:([^}]+)\\}\\}");
    private static final Pattern ENV_PATTERN = Pattern.compile("\\{\\{env:([^}]+)\\}\\}");
    private static final Pattern FILE_PATTERN = Pattern.compile("\\{\\{file:([^}]+)\\}\\}");
    private static final Pattern TASK_PATTERN = Pattern.compile("\\{\\{task:([^:]+):result\\}\\}");

    public RecipeParameterResolver(Map<String, Object> parameters, Map<String, String> env, Map<String, Long> taskResults) {
        this.parameters = parameters != null ? parameters : new HashMap<>();
        this.env = env != null ? env : new HashMap<>();
        this.taskResults = taskResults != null ? taskResults : new HashMap<>();
    }

    public String resolve(String input) {
        if (input == null) return null;
        String result = input;
        result = resolveParams(result);
        result = resolveEnv(result);
        result = resolveFiles(result);
        result = resolveTasks(result);
        return result;
    }

    public RecipeYaml resolveAll(RecipeYaml recipe) {
        if (recipe == null) return null;

        if (recipe.getRecipe() != null) {
            recipe.getRecipe().setName(resolve(recipe.getRecipe().getName()));
            recipe.getRecipe().setVersion(resolve(recipe.getRecipe().getVersion()));
            recipe.getRecipe().setDescription(resolve(recipe.getRecipe().getDescription()));
        }

        if (recipe.getProjects() != null) {
            for (RecipeProject rp : recipe.getProjects()) {
                rp.setName(resolve(rp.getName()));
                rp.setDescription(resolve(rp.getDescription()));
                rp.setPath(resolve(rp.getPath()));
                rp.setTarget(resolve(rp.getTarget()));
                rp.setStatus(resolve(rp.getStatus()));
                rp.setReadme(resolve(rp.getReadme()));
            }
        }

        if (recipe.getAgents() != null) {
            for (RecipeAgent ra : recipe.getAgents()) {
                ra.setName(resolve(ra.getName()));
                ra.setNamespace(resolve(ra.getNamespace()));
                ra.setCategory(resolve(ra.getCategory()));
                ra.setDescription(resolve(ra.getDescription()));
                ra.setPrompt(resolve(ra.getPrompt()));
                ra.setPath(resolve(ra.getPath()));
            }
        }

        if (recipe.getScripts() != null) {
            for (RecipeScript rs : recipe.getScripts()) {
                rs.setName(resolve(rs.getName()));
                rs.setNamespace(resolve(rs.getNamespace()));
                rs.setCategory(resolve(rs.getCategory()));
                rs.setDescription(resolve(rs.getDescription()));
                rs.setContent(resolve(rs.getContent()));
                rs.setScope(resolve(rs.getScope()));
                rs.setPath(resolve(rs.getPath()));
            }
        }

        if (recipe.getTemplates() != null) {
            for (RecipeTemplate rt : recipe.getTemplates()) {
                rt.setName(resolve(rt.getName()));
                rt.setType(resolve(rt.getType()));
                rt.setDescription(resolve(rt.getDescription()));
                rt.setTemplate(resolve(rt.getTemplate()));
            }
        }

        if (recipe.getPipelines() != null) {
            for (RecipePipeline rpipe : recipe.getPipelines()) {
                rpipe.setName(resolve(rpipe.getName()));
                rpipe.setDescription(resolve(rpipe.getDescription()));
                rpipe.setType(resolve(rpipe.getType()));
                rpipe.setOutputExtension(resolve(rpipe.getOutputExtension()));
                if (rpipe.getSteps() != null) {
                    for (RecipeStep rstep : rpipe.getSteps()) {
                        rstep.setPrompt(resolve(rstep.getPrompt()));
                        rstep.setType(resolve(rstep.getType()));
                        rstep.setRuntime(resolve(rstep.getRuntime()));
                        rstep.setCli(resolve(rstep.getCli()));
                        rstep.setParameters(resolve(rstep.getParameters()));
                        rstep.setArguments(resolve(rstep.getArguments()));
                        if (rstep.getInput() != null) {
                            rstep.getInput().setContent(resolve(rstep.getInput().getContent()));
                            rstep.getInput().setType(resolve(rstep.getInput().getType()));
                        }
                        if (rstep.getOutput() != null) {
                            rstep.getOutput().setContent(resolve(rstep.getOutput().getContent()));
                            rstep.getOutput().setType(resolve(rstep.getOutput().getType()));
                        }
                    }
                }
            }
        }

        if (recipe.getTargets() != null) {
            for (RecipeTarget rt : recipe.getTargets()) {
                rt.setName(resolve(rt.getName()));
                rt.setAgentsPath(resolve(rt.getAgentsPath()));
                rt.setScriptsPath(resolve(rt.getScriptsPath()));
                rt.setCli(resolve(rt.getCli()));
            }
        }

        return recipe;
    }

    public void registerTaskResult(String taskId, Long entityId) {
        taskResults.put(taskId, entityId);
    }

    public Long getTaskResult(String taskId) {
        return taskResults.get(taskId);
    }

    private String resolveParams(String input) {
        if (input == null || parameters.isEmpty()) return input;
        Matcher matcher = PARAM_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = parameters.get(key);
            String replacement = value != null ? String.valueOf(value) : "{{param:" + key + "}} (not found)";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String resolveEnv(String input) {
        if (input == null) return input;
        Matcher matcher = ENV_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String varName = matcher.group(1);
            String value = env.get(varName);
            if (value == null) {
                value = System.getenv(varName);
            }
            String replacement = value != null ? value : "{{env:" + varName + "}} (not set)";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String resolveFiles(String input) {
        if (input == null) return input;
        Matcher matcher = FILE_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String filePath = matcher.group(1);
            String replacement;
            try {
                String content = Files.readString(Path.of(filePath));
                replacement = content;
            } catch (Exception e) {
                replacement = "{{file:" + filePath + "}} (error: " + e.getMessage() + ")";
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String resolveTasks(String input) {
        if (input == null || taskResults.isEmpty()) return input;
        Matcher matcher = TASK_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String taskId = matcher.group(1);
            Long entityId = taskResults.get(taskId);
            String replacement = entityId != null ? String.valueOf(entityId) : "{{task:" + taskId + ":result}} (not available)";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
