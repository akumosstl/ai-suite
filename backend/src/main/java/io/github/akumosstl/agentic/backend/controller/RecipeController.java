package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Recipe;
import io.github.akumosstl.agentic.backend.model.RecipeTaskResult;
import io.github.akumosstl.agentic.backend.recipe.RecipeExecutor;
import io.github.akumosstl.agentic.backend.recipe.RecipeParser;
import io.github.akumosstl.agentic.backend.recipe.RecipeYaml;
import io.github.akumosstl.agentic.backend.repository.RecipeRepository;
import io.github.akumosstl.agentic.backend.repository.RecipeTaskResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    @Autowired
    private RecipeExecutor recipeExecutor;

    @Autowired
    private RecipeParser recipeParser;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private RecipeTaskResultRepository taskResultRepository;

    @PostMapping("/execute")
    public ResponseEntity<?> executeRecipe(@RequestBody Map<String, Object> body) {
        try {
            String yamlContent = (String) body.get("yaml");
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) body.get("parameters");

            if (yamlContent == null || yamlContent.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Field 'yaml' is required"));
            }

            Recipe recipe = recipeExecutor.execute(yamlContent, params);
            return ResponseEntity.ok(recipe);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/execute-from-path")
    public ResponseEntity<?> executeFromPath(@RequestBody Map<String, Object> body) {
        try {
            String filePath = (String) body.get("path");
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) body.get("parameters");

            if (filePath == null || filePath.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Field 'path' is required"));
            }

            Recipe recipe = recipeExecutor.executeFromPath(filePath, params);
            return ResponseEntity.ok(recipe);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateRecipe(@RequestBody Map<String, Object> body) {
        try {
            String yamlContent = (String) body.get("yaml");

            if (yamlContent == null || yamlContent.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Field 'yaml' is required"));
            }

            RecipeYaml recipeYaml = recipeParser.parse(yamlContent);
            String validationError = recipeParser.validate(recipeYaml);

            Map<String, Object> response = new HashMap<>();
            if (validationError != null) {
                response.put("valid", false);
                response.put("error", validationError);
            } else {
                response.put("valid", true);
                response.put("name", recipeYaml.getRecipe().getName());
                response.put("version", recipeYaml.getRecipe().getVersion());
                response.put("taskCount", recipeYaml.getTasks() != null ? recipeYaml.getTasks().size() : 0);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", e.getMessage()));
        }
    }

    @GetMapping
    public List<Recipe> listRecipes() {
        return recipeRepository.findTop20ByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable Long id) {
        return recipeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<RecipeTaskResult>> getRecipeTasks(@PathVariable Long id) {
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(taskResultRepository.findByRecipe_IdOrderByTaskId(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRecipe(@PathVariable Long id) {
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recipeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Recipe deleted successfully"));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<Map<String, Object>> stopRecipe(@PathVariable Long id) {
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recipeExecutor.stopRecipe(id);
        return ResponseEntity.ok(Map.of("message", "Recipe stop requested", "recipeId", id));
    }
}
