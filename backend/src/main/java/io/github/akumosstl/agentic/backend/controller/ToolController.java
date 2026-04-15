package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.service.ToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Ferramentas (Tools).
 * 
 * Fornece endpoints para criar, listar, atualizar e excluir tools.
 * Suporta paginação, busca e filtragem por categoria.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "*")
public class ToolController {
    
    @Autowired
    private ToolService toolService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentTools(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Tool> tools = toolService.getRecentTools(page, size);
        long totalElements = toolService.countAllTools();
        
        Map<String, Object> response = new HashMap<>();
        response.put("tools", tools);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Tool> getTop10Tools() {
        return toolService.getTop10RecentTools();
    }
    
    @GetMapping("/{id}")
    public Tool getTool(@PathVariable Long id) {
        return toolService.getToolById(id);
    }
    
    @PostMapping
    public Tool createTool(@RequestBody Tool tool) {
        return toolService.createTool(tool);
    }
    
    @PutMapping("/{id}")
    public Tool updateTool(@PathVariable Long id, @RequestBody Tool toolDetails) {
        return toolService.updateTool(id, toolDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTool(@PathVariable Long id) {
        toolService.deleteTool(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Tool deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/category/{category}")
    public List<Tool> getToolsByCategory(@PathVariable String category) {
        return toolService.getToolsByCategory(category);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchTools(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Tool> tools = toolService.searchTools(term, namespace, page, size);
        long totalElements = toolService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("tools", tools);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctNamespaces() {
        return toolService.getDistinctNamespaces();
    }
}