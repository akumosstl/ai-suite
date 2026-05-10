package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Projetos.
 * 
 * Fornece endpoints para gerenciar projetos e suas associa��es
 * (agentes, scripts).
 * Suporta manipula��o de arquivos de projeto.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProjectController.class);
    
    @Autowired
    private ProjectService projectService;
    
    // Scripts endpoints
    @GetMapping("/{id}/scripts")
    public List<Script> getProjectScripts(@PathVariable Long id) {
        return projectService.getProjectScripts(id);
    }
    
@PostMapping("/{id}/scripts")
    public Project addScriptsToProject(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        List<Long> scriptIds = (List<Long>) request.get("scriptIds");
        Boolean force = request.get("force") != null ? (Boolean) request.get("force") : false;
        return projectService.addScriptsToProject(id, scriptIds, force);
    }
    
    @PostMapping("/{id}/agents")
    public Project addAgentsToProject(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        List<Long> agentIds = ((List<Number>) request.get("agentIds")).stream()
            .map(Number::longValue)
            .collect(java.util.stream.Collectors.toList());
        Boolean force = request.get("force") != null ? (Boolean) request.get("force") : false;
        return projectService.addAgentsToProject(id, agentIds, force);
    }
    
  @DeleteMapping("/{projectId}/scripts/{scriptId}")
    public Project removeScriptFromProject(@PathVariable Long projectId, @PathVariable Long scriptId) {
        return projectService.removeScriptFromProject(projectId, scriptId);
    }
    
    // Agents endpoints
    @GetMapping("/{id}/agents")
    public List<Agent> getProjectAgents(@PathVariable Long id) {
        return projectService.getProjectAgents(id);
    }
    
    @DeleteMapping("/{projectId}/agents/{agentId}")
    public Project removeAgentFromProject(@PathVariable Long projectId, @PathVariable Long agentId) {
        return projectService.removeAgentFromProject(projectId, agentId);
    }
    
  @GetMapping("/{id}/files")
  public List<Object> getProjectFiles(@PathVariable Long id) {
    return new ArrayList<>();
  }

  @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Project> projectPage = projectService.findAllPaginated(page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("projects", projectPage.getContent());
        response.put("currentPage", page);
        response.put("totalElements", projectPage.getTotalElements());
        response.put("totalPages", projectPage.getTotalPages());
        response.put("pageSize", size);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Project> getTop10Projects() {
        return projectService.getTop10RecentProjects();
    }
    
    @GetMapping("/{id}")
    public Project getProject(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }
    
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        try {
            return ResponseEntity.ok(projectService.createProject(project));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                Map<String, String> error = new HashMap<>();
                error.put("message", e.getMessage());
                return ResponseEntity.badRequest().body(error);
            }
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        return projectService.updateProject(id, projectDetails);
    }
    
    @PutMapping("/{id}/readme")
    public Project updateProjectReadme(@PathVariable Long id, @RequestBody Map<String, String> readmeData) {
        String readmeContent = readmeData.get("content");
        return projectService.updateProjectReadme(id, readmeContent);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Project deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/status/{status}")
    public List<Project> getProjectsByStatus(@PathVariable String status) {
        return projectService.getProjectsByStatus(status);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProjects(
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Project> projects = projectService.searchProjects(term, page, size);
        long totalElements = projectService.countSearchResults(term);
        
        Map<String, Object> response = new HashMap<>();
        response.put("projects", projects);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        
    return ResponseEntity.ok(response);
  }

  public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
    Map<String, String> error = new HashMap<>();
    error.put("message", ex.getMessage());
    return ResponseEntity.badRequest().body(error);
  }
}