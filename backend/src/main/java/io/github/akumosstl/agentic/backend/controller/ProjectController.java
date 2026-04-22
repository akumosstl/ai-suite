package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.model.Command;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.model.ProjectFile;
import io.github.akumosstl.agentic.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Projetos.
 * 
 * Fornece endpoints para gerenciar projetos e suas associações
 * (agentes, skills, commands, scripts, instructions, plugins, tools).
 * Suporta manipulação de arquivos de projeto.
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
    
    // Agents endpoints
    @GetMapping("/{id}/agents")
    public List<Agent> getProjectAgents(@PathVariable Long id) {
        return projectService.getProjectAgents(id);
    }
    
    @PostMapping("/{id}/agents")
    public Project addAgentsToProject(@PathVariable Long id, @RequestBody List<Long> agentIds) {
        return projectService.addAgentsToProject(id, agentIds);
    }
    
    @DeleteMapping("/{projectId}/agents/{agentId}")
    public Project removeAgentFromProject(@PathVariable Long projectId, @PathVariable Long agentId) {
        return projectService.removeAgentFromProject(projectId, agentId);
    }
    
    // Instructions endpoints
    @GetMapping("/{id}/instructions")
    public List<Instruction> getProjectInstructions(@PathVariable Long id) {
        return projectService.getProjectInstructions(id);
    }
    
    @PostMapping("/{id}/instructions")
    public Project addInstructionsToProject(@PathVariable Long id, @RequestBody List<Long> instructionIds) {
        return projectService.addInstructionsToProject(id, instructionIds);
    }
    
    @DeleteMapping("/{projectId}/instructions/{instructionId}")
    public Project removeInstructionFromProject(@PathVariable Long projectId, @PathVariable Long instructionId) {
        return projectService.removeInstructionFromProject(projectId, instructionId);
    }
    
    // Plugins endpoints
    @GetMapping("/{id}/plugins")
    public List<Plugin> getProjectPlugins(@PathVariable Long id) {
        return projectService.getProjectPlugins(id);
    }
    
    @PostMapping("/{id}/plugins")
    public Project addPluginsToProject(@PathVariable Long id, @RequestBody List<Long> pluginIds) {
        return projectService.addPluginsToProject(id, pluginIds);
    }
    
    @DeleteMapping("/{projectId}/plugins/{pluginId}")
    public Project removePluginFromProject(@PathVariable Long projectId, @PathVariable Long pluginId) {
        return projectService.removePluginFromProject(projectId, pluginId);
    }
    
    // Tools endpoints
    @GetMapping("/{id}/tools")
    public List<Tool> getProjectTools(@PathVariable Long id) {
        return projectService.getProjectTools(id);
    }
    
    @PostMapping("/{id}/tools")
    public Project addToolsToProject(@PathVariable Long id, @RequestBody List<Long> toolIds) {
        return projectService.addToolsToProject(id, toolIds);
    }
    
    @DeleteMapping("/{projectId}/tools/{toolId}")
    public Project removeToolFromProject(@PathVariable Long projectId, @PathVariable Long toolId) {
        return projectService.removeToolFromProject(projectId, toolId);
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
    
    @PostMapping("/{id}/files")
    public ResponseEntity<ProjectFile> createProjectFile(@PathVariable Long id, @RequestBody Map<String, String> fileData) {
        logger.info("createProjectFile called - projectId: {}, fileData: {}", id, fileData);
        String fileName = fileData.get("fileName");
        String content = fileData.get("content");
        logger.info("Creating file - fileName: {}, content length: {}", fileName, content != null ? content.length() : 0);
        
        ProjectFile projectFile = projectService.createProjectFile(id, fileName, content);
        logger.info("File created successfully - id: {}, fileName: {}", projectFile.getId(), projectFile.getFileName());
        return ResponseEntity.ok(projectFile);
    }
    
    @GetMapping("/{id}/files")
    public ResponseEntity<List<ProjectFile>> getProjectFiles(@PathVariable Long id) {
        logger.info("getProjectFiles called - projectId: {}", id);
        List<ProjectFile> files = projectService.getProjectFiles(id);
        logger.info("getProjectFiles returning {} files", files.size());
        return ResponseEntity.ok(files);
    }
    
    @GetMapping("/{id}/files/{fileId}")
    public ResponseEntity<ProjectFile> getProjectFile(@PathVariable Long id, @PathVariable Long fileId) {
        ProjectFile file = projectService.getProjectFileById(fileId);
        return ResponseEntity.ok(file);
    }
    
    @GetMapping("/{id}/files/by-name/{fileName}")
    public ResponseEntity<ProjectFile> getProjectFileByName(@PathVariable Long id, @PathVariable String fileName) {
        ProjectFile file = projectService.getProjectFile(id, fileName);
        return ResponseEntity.ok(file);
    }
    
    @PutMapping("/{id}/files/{fileId}")
    public ResponseEntity<ProjectFile> updateProjectFile(@PathVariable Long id, @PathVariable Long fileId, @RequestBody Map<String, String> fileData) {
        String content = fileData.get("content");
        
        ProjectFile projectFile = projectService.updateProjectFile(fileId, content);
        return ResponseEntity.ok(projectFile);
    }
    
    @PutMapping("/{id}/files/by-name/{fileName}")
    public ResponseEntity<ProjectFile> updateProjectFileByName(@PathVariable Long id, @PathVariable String fileName, @RequestBody Map<String, String> fileData) {
        String content = fileData.get("content");
        
        ProjectFile projectFile = projectService.updateProjectFileByName(id, fileName, content);
        return ResponseEntity.ok(projectFile);
    }
    
    @DeleteMapping("/{id}/files/{fileId}")
    public ResponseEntity<Map<String, String>> deleteProjectFile(@PathVariable Long id, @PathVariable Long fileId) {
        projectService.deleteProjectFile(fileId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "File deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}/files/by-name/{fileName}")
    public ResponseEntity<Map<String, String>> deleteProjectFileByName(@PathVariable Long id, @PathVariable String fileName) {
        projectService.deleteProjectFileByName(id, fileName);
        Map<String, String> response = new HashMap<>();
        response.put("message", "File deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/sync-to-fs")
    public ResponseEntity<Map<String, String>> syncProjectToFileSystem(@PathVariable Long id) {
        String result = projectService.syncProjectToFileSystem(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", result);
        return ResponseEntity.ok(response);
    }
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
