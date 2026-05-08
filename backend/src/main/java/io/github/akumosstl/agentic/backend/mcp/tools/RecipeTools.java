package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Recipe;
import io.github.akumosstl.agentic.backend.model.RecipeTaskResult;
import io.github.akumosstl.agentic.backend.recipe.RecipeExecutor;
import io.github.akumosstl.agentic.backend.recipe.RecipeParser;
import io.github.akumosstl.agentic.backend.recipe.RecipeYaml;
import io.github.akumosstl.agentic.backend.repository.RecipeRepository;
import io.github.akumosstl.agentic.backend.repository.RecipeTaskResultRepository;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class RecipeTools {

    private final RecipeExecutor recipeExecutor;
    private final RecipeParser recipeParser;
    private final RecipeRepository recipeRepository;
    private final RecipeTaskResultRepository taskResultRepository;

    @Autowired
    public RecipeTools(RecipeExecutor recipeExecutor, RecipeParser recipeParser,
                       RecipeRepository recipeRepository, RecipeTaskResultRepository taskResultRepository) {
        this.recipeExecutor = recipeExecutor;
        this.recipeParser = recipeParser;
        this.recipeRepository = recipeRepository;
        this.taskResultRepository = taskResultRepository;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(executeRecipe());
        tools.add(executeRecipeFromPath());
        tools.add(validateRecipe());
        tools.add(listRecipes());
        tools.add(getRecipe());
        tools.add(stopRecipe());
        return tools;
    }

    private SyncToolSpecification executeRecipe() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("execute_recipe")
                        .description("Execute a recipe from YAML content. The recipe will create resources (projects, agents, scripts, pipelines, targets, templates) and run/stop/call pipelines as defined in the tasks.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "yaml", Map.of("type", "string", "description", "Recipe YAML content (required)"),
                                "parameters", Map.of("type", "object", "description", "Override parameters for {{param:X}} placeholders (optional)")
                        ), List.of("yaml")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String yaml = (String) request.arguments().get("yaml");
                        @SuppressWarnings("unchecked")
                        Map<String, Object> params = (Map<String, Object>) request.arguments().get("parameters");
                        Recipe recipe = recipeExecutor.execute(yaml, params);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Recipe execution started.\n\n" + formatRecipe(recipe))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error executing recipe: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification executeRecipeFromPath() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("execute_recipe_from_path")
                        .description("Execute a recipe from a YAML file path.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "path", Map.of("type", "string", "description", "Path to the recipe YAML file (required)"),
                                "parameters", Map.of("type", "object", "description", "Override parameters for {{param:X}} placeholders (optional)")
                        ), List.of("path")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String path = (String) request.arguments().get("path");
                        @SuppressWarnings("unchecked")
                        Map<String, Object> params = (Map<String, Object>) request.arguments().get("parameters");
                        Recipe recipe = recipeExecutor.executeFromPath(path, params);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Recipe execution started from file.\n\n" + formatRecipe(recipe))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error executing recipe from path: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification validateRecipe() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("validate_recipe")
                        .description("Validate a recipe YAML without executing it. Returns validation errors if any.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "yaml", Map.of("type", "string", "description", "Recipe YAML content to validate (required)")
                        ), List.of("yaml")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String yaml = (String) request.arguments().get("yaml");
                        RecipeYaml recipeYaml = recipeParser.parse(yaml);
                        String error = recipeParser.validate(recipeYaml);
                        if (error != null) {
                            return McpSchema.CallToolResult.builder()
                                    .content(List.of(McpResponseFormatter.text("Validation failed: " + error)))
                                    .isError(true)
                                    .build();
                        }
                        StringBuilder sb = new StringBuilder();
                        sb.append("Recipe validation passed.\n\n");
                        sb.append("- **Name**: ").append(recipeYaml.getRecipe().getName()).append("\n");
                        sb.append("- **Version**: ").append(recipeYaml.getRecipe().getVersion()).append("\n");
                        sb.append("- **Tasks**: ").append(recipeYaml.getTasks() != null ? recipeYaml.getTasks().size() : 0).append("\n");
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(sb.toString())))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Validation error: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification listRecipes() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_recipes")
                        .description("List the 20 most recent recipe executions.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        List<Recipe> recipes = recipeRepository.findTop20ByOrderByCreatedAtDesc();
                        if (recipes.isEmpty()) {
                            return McpSchema.CallToolResult.builder()
                                    .content(List.of(McpResponseFormatter.text("No recipes found.")))
                                    .build();
                        }
                        StringBuilder sb = new StringBuilder();
                        sb.append("## Recipes (").append(recipes.size()).append(")\n\n");
                        sb.append("| # | ID | Name | Status | Started | Completed |\n");
                        sb.append("|---|----|------|--------|---------|------------|\n");
                        for (int i = 0; i < recipes.size(); i++) {
                            Recipe r = recipes.get(i);
                            sb.append("| ").append(i + 1).append(" | ")
                                    .append(r.getId()).append(" | ")
                                    .append(r.getName()).append(" | ")
                                    .append(r.getStatus()).append(" | ")
                                    .append(r.getStartedAt()).append(" | ")
                                    .append(r.getCompletedAt() != null ? r.getCompletedAt().toString() : "-").append(" |\n");
                        }
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(sb.toString())))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error listing recipes: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification getRecipe() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_recipe")
                        .description("Get detailed information about a recipe execution, including task results.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Recipe ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Recipe recipe = recipeRepository.findById(id).orElse(null);
                        if (recipe == null) {
                            return McpSchema.CallToolResult.builder()
                                    .content(List.of(McpResponseFormatter.text("Recipe not found: " + id)))
                                    .isError(true)
                                    .build();
                        }
                        List<RecipeTaskResult> tasks = taskResultRepository.findByRecipe_IdOrderByTaskId(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(formatRecipeWithTasks(recipe, tasks))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error getting recipe: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification stopRecipe() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("stop_recipe")
                        .description("Stop a running recipe execution.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Recipe ID to stop (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        recipeExecutor.stopRecipe(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Recipe " + id + " stop requested.")))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error stopping recipe: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private String formatRecipe(Recipe r) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Recipe: ").append(r.getName()).append("\n");
        sb.append("- **ID**: ").append(r.getId()).append("\n");
        sb.append("- **Status**: ").append(r.getStatus()).append("\n");
        if (r.getVersion() != null) sb.append("- **Version**: ").append(r.getVersion()).append("\n");
        if (r.getDescription() != null) sb.append("- **Description**: ").append(r.getDescription()).append("\n");
        if (r.getSourcePath() != null) sb.append("- **Source Path**: ").append(r.getSourcePath()).append("\n");
        sb.append("- **Started**: ").append(r.getStartedAt()).append("\n");
        if (r.getCompletedAt() != null) sb.append("- **Completed**: ").append(r.getCompletedAt()).append("\n");
        return sb.toString();
    }

    private String formatRecipeWithTasks(Recipe r, List<RecipeTaskResult> tasks) {
        StringBuilder sb = new StringBuilder(formatRecipe(r));
        if (tasks != null && !tasks.isEmpty()) {
            sb.append("\n### Task Results (").append(tasks.size()).append(")\n\n");
            sb.append("| Task ID | Type | Resource | Ref | Status | Entity ID | Error |\n");
            sb.append("|---------|------|----------|-----|--------|-----------|-------|\n");
            for (RecipeTaskResult t : tasks) {
                sb.append("| ").append(t.getTaskId()).append(" | ")
                        .append(t.getTaskType() != null ? t.getTaskType() : "-").append(" | ")
                        .append(t.getResource() != null ? t.getResource() : "-").append(" | ")
                        .append(t.getRef() != null ? t.getRef() : "-").append(" | ")
                        .append(t.getStatus()).append(" | ")
                        .append(t.getResultEntityId() != null ? t.getResultEntityId() : "-").append(" | ")
                        .append(t.getErrorMessage() != null ? t.getErrorMessage() : "-").append(" |\n");
            }
        }
        return sb.toString();
    }
}
