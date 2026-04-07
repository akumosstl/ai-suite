package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.model.Command;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;
    
    // Skills endpoints
    @GetMapping("/{id}/skills")
    public List<Skill> getProjectSkills(@PathVariable Long id) {
        return projectService.getProjectSkills(id);
    }
    
    @PostMapping("/{id}/skills")
    public Project addSkillsToProject(@PathVariable Long id, @RequestBody List<Long> skillIds) {
        return projectService.addSkillsToProject(id, skillIds);
    }
    
    @DeleteMapping("/{projectId}/skills/{skillId}")
    public Project removeSkillFromProject(@PathVariable Long projectId, @PathVariable Long skillId) {
        return projectService.removeSkillFromProject(projectId, skillId);
    }
    
    // Commands endpoints
    @GetMapping("/{id}/commands")
    public List<Command> getProjectCommands(@PathVariable Long id) {
        return projectService.getProjectCommands(id);
    }
    
    @PostMapping("/{id}/commands")
    public Project addCommandsToProject(@PathVariable Long id, @RequestBody List<Long> commandIds) {
        return projectService.addCommandsToProject(id, commandIds);
    }
    
    @DeleteMapping("/{projectId}/commands/{commandId}")
    public Project removeCommandFromProject(@PathVariable Long projectId, @PathVariable Long commandId) {
        return projectService.removeCommandFromProject(projectId, commandId);
    }
    
    // Scripts endpoints
    @GetMapping("/{id}/scripts")
    public List<Script> getProjectScripts(@PathVariable Long id) {
        return projectService.getProjectScripts(id);
    }
    
    @PostMapping("/{id}/scripts")
    public Project addScriptsToProject(@PathVariable Long id, @RequestBody List<Long> scriptIds) {
        return projectService.addScriptsToProject(id, scriptIds);
    }
    
    @DeleteMapping("/{projectId}/scripts/{scriptId}")
    public Project removeScriptFromProject(@PathVariable Long projectId, @PathVariable Long scriptId) {
        return projectService.removeScriptFromProject(projectId, scriptId);
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
    public Project createProject(@RequestBody Project project) {
        return projectService.createProject(project);
    }
    
    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        return projectService.updateProject(id, projectDetails);
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
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
