package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Template;
import io.github.akumosstl.agentic.backend.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@CrossOrigin(origins = "*")
public class TemplateController {

    @Autowired
    private TemplateService templateService;

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type) {
        List<Template> templates;
        if (type != null && !type.isEmpty()) {
            templates = templateService.getTemplatesByType(type, page, size);
        } else {
            templates = templateService.getRecentTemplates(page, size);
        }
        long totalElements = templateService.countTemplatesByType(type);

        Map<String, Object> response = new HashMap<>();
        response.put("templates", templates);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public Template getTemplate(@PathVariable Long id) {
        return templateService.getTemplateById(id);
    }

    @PostMapping
    public Template createTemplate(@RequestBody Template template) {
        return templateService.createTemplate(template);
    }

    @PutMapping("/{id}")
    public Template updateTemplate(@PathVariable Long id, @RequestBody Template templateDetails) {
        return templateService.updateTemplate(id, templateDetails);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Template deleted successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{type}")
    public List<Template> getTemplatesByType(@PathVariable String type) {
        return templateService.getTemplatesByType(type);
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchTemplates(
            @RequestParam String type,
            @RequestParam(required = false) String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Template> templates = templateService.searchTemplatesByType(type, term != null ? term : "");

        Map<String, Object> response = new HashMap<>();
        response.put("templates", templates);
        response.put("currentPage", page);
        response.put("totalElements", templates.size());
        response.put("totalPages", (int) Math.ceil((double) templates.size() / size));

        return ResponseEntity.ok(response);
    }
}
