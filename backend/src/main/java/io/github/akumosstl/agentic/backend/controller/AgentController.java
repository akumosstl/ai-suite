package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.service.AgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*")
public class AgentController {
    
    @Autowired
    private AgentService agentService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Agent> agents = agentService.getRecentAgents(page, size);
        long totalElements = agentService.countAllAgents();
        
        Map<String, Object> response = new HashMap<>();
        response.put("agents", agents);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Agent> getTop10Agents() {
        return agentService.getTop10RecentAgents();
    }
    
    @GetMapping("/{id}")
    public Agent getAgent(@PathVariable Long id) {
        return agentService.getAgentById(id);
    }
    
    @PostMapping
    public Agent createAgent(@RequestBody Agent agent, @RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            return agentService.createAgent(agent, projectId);
        }
        return agentService.createAgent(agent);
    }
    
    @PutMapping("/{id}")
    public Agent updateAgent(@PathVariable Long id, @RequestBody Agent agentDetails) {
        return agentService.updateAgent(id, agentDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Agent deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/category/{category}")
    public List<Agent> getAgentsByCategory(@PathVariable String category) {
        return agentService.getAgentsByCategory(category);
    }
    
    @GetMapping("/scope/{scope}")
    public List<Agent> getAgentsByScope(@PathVariable String scope) {
        return agentService.getAgentsByScope(scope);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchAgents(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Agent> agents = agentService.searchAgents(term, namespace, page, size);
        long totalElements = agentService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("agents", agents);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctCategories() {
        return agentService.getDistinctCategories();
    }
}