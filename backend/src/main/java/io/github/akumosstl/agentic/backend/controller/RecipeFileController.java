package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.RecipeFile;
import io.github.akumosstl.agentic.backend.repository.RecipeFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipe-files")
@CrossOrigin(origins = "*")
public class RecipeFileController {

    @Autowired
    private RecipeFileRepository recipeFileRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listRecipeFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<RecipeFile> result = recipeFileRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        return ResponseEntity.ok(Map.of(
                "recipeFiles", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchRecipeFiles(
            @RequestParam(required = false, defaultValue = "") String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<RecipeFile> result;
        if (term == null || term.isBlank()) {
            result = recipeFileRepository.findAll(
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        } else {
            result = recipeFileRepository.findByNameContainingIgnoreCase(term,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        }
        return ResponseEntity.ok(Map.of(
                "recipeFiles", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeFile> getRecipeFile(@PathVariable Long id) {
        return recipeFileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createRecipeFile(@RequestBody RecipeFile recipeFile) {
        if (recipeFile.getName() == null || recipeFile.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        }
        if (recipeFile.getYamlContent() == null || recipeFile.getYamlContent().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "YAML content is required"));
        }
        RecipeFile saved = recipeFileRepository.save(recipeFile);
        return ResponseEntity.ok(saved);
    }

  @PutMapping("/{id}")
  public ResponseEntity<?> updateRecipeFile(@PathVariable Long id, @RequestBody RecipeFile recipeFile) {
    return recipeFileRepository.findById(id).map(existing -> {
      existing.setName(recipeFile.getName());
      existing.setVersion(recipeFile.getVersion());
      existing.setDescription(recipeFile.getDescription());
      existing.setYamlContent(recipeFile.getYamlContent());
      RecipeFile saved = recipeFileRepository.save(existing);
      return ResponseEntity.ok(saved);
    }).orElse(ResponseEntity.notFound().build());
  }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRecipeFile(@PathVariable Long id) {
        if (!recipeFileRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recipeFileRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Recipe file deleted successfully"));
    }
}
