package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.service.PluginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Plugins.
 * 
 * Fornece endpoints para criar, listar, atualizar e excluir plugins.
 * Suporta paginação, busca e filtragem por categoria.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/plugins")
@CrossOrigin(origins = "*")
public class PluginController {
    
    @Autowired
    private PluginService pluginService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentPlugins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Plugin> plugins = pluginService.getRecentPlugins(page, size);
        long totalElements = pluginService.countAllPlugins();
        
        Map<String, Object> response = new HashMap<>();
        response.put("plugins", plugins);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Plugin> getTop10Plugins() {
        return pluginService.getTop10RecentPlugins();
    }
    
    @GetMapping("/{id}")
    public Plugin getPlugin(@PathVariable Long id) {
        return pluginService.getPluginById(id);
    }
    
    @PostMapping
    public Plugin createPlugin(@RequestBody Plugin plugin) {
        return pluginService.createPlugin(plugin);
    }
    
    @PutMapping("/{id}")
    public Plugin updatePlugin(@PathVariable Long id, @RequestBody Plugin pluginDetails) {
        return pluginService.updatePlugin(id, pluginDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePlugin(@PathVariable Long id) {
        try {
            pluginService.deletePlugin(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Plugin deleted successfully");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/category/{category}")
    public List<Plugin> getPluginsByCategory(@PathVariable String category) {
        return pluginService.getPluginsByCategory(category);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchPlugins(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Plugin> plugins = pluginService.searchPlugins(term, namespace, page, size);
        long totalElements = pluginService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("plugins", plugins);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctNamespaces() {
        return pluginService.getDistinctNamespaces();
    }
}