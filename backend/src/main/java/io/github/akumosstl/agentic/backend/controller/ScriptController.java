package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.service.ScriptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Scripts.
 * <p>
 * Fornece endpoints para criar, listar, atualizar e excluir scripts.
 * Suporta paginação, busca e filtragem por namespace.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/scripts")
@CrossOrigin(origins = "*")
public class ScriptController {

    @Autowired
    private ScriptService scriptService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentScripts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Script> scripts = scriptService.getRecentScripts(page, size);
        long totalElements = scriptService.countAllScripts();

        Map<String, Object> response = new HashMap<>();
        response.put("scripts", scripts);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public Script getScript(@PathVariable Long id) {
        return scriptService.getScriptById(id);
    }

    @PostMapping
    public ResponseEntity<?> createScript(@RequestBody Script script) {
        try {
            return ResponseEntity.ok(scriptService.createScript(script));
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateScript(@PathVariable Long id, @RequestBody Script scriptDetails) {
        try {
            return ResponseEntity.ok(scriptService.updateScript(id, scriptDetails));
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteScript(@PathVariable Long id) {
        try {
            scriptService.deleteScript(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Script deleted successfully");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchScripts(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Script> scripts = scriptService.searchScripts(term, namespace, page, size);
        long totalElements = scriptService.countSearchResults(term, namespace);

        Map<String, Object> response = new HashMap<>();
        response.put("scripts", scripts);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctNamespaces() {
        return scriptService.getDistinctNamespaces();
    }
}
