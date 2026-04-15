package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Command;
import io.github.akumosstl.agentic.backend.service.CommandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Comandos.
 * 
 * Fornece endpoints para criar, listar, atualizar e excluir comandos.
 * Suporta paginação, busca e filtragem por categoria e escopo.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/commands")
@CrossOrigin(origins = "*")
public class CommandController {
    
    @Autowired
    private CommandService commandService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentCommands(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Command> commands = commandService.getRecentCommands(page, size);
        long totalElements = commandService.countAllCommands();
        
        Map<String, Object> response = new HashMap<>();
        response.put("commands", commands);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Command> getTop10Commands() {
        return commandService.getTop10RecentCommands();
    }
    
    @GetMapping("/{id}")
    public Command getCommand(@PathVariable Long id) {
        return commandService.getCommandById(id);
    }
    
    @PostMapping
    public Command createCommand(@RequestBody Command command) {
        return commandService.createCommand(command);
    }
    
    @PutMapping("/{id}")
    public Command updateCommand(@PathVariable Long id, @RequestBody Command commandDetails) {
        return commandService.updateCommand(id, commandDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCommand(@PathVariable Long id) {
        commandService.deleteCommand(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Command deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/category/{category}")
    public List<Command> getCommandsByCategory(@PathVariable String category) {
        return commandService.getCommandsByCategory(category);
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchCommands(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Command> commands = commandService.searchCommands(term, namespace, page, size);
        long totalElements = commandService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("commands", commands);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctNamespaces() {
        return commandService.getDistinctNamespaces();
    }
}