package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.ToolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ToolService {
    
    @Autowired
    private ToolRepository toolRepository;
    
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ToolFileService toolFileService;

    public List<Tool> getRecentTools(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Tool> toolPage = toolRepository.findAll(pageable);
        return toolPage.getContent();
    }
    
    public List<Tool> getTop10RecentTools() {
        return toolRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Tool getToolById(Long id) {
        return toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found"));
    }
    
    public Tool createTool(Tool tool) {
        return toolRepository.save(tool);
    }
    
    public Tool updateTool(Long id, Tool toolDetails) {
        Tool tool = getToolById(id);
        tool.setName(toolDetails.getName());
        tool.setNamespace(toolDetails.getNamespace());
        tool.setCategory(toolDetails.getCategory());
        tool.setPath(toolDetails.getPath());
        tool.setDescription(toolDetails.getDescription());
        tool.setInstructions(toolDetails.getInstructions());
        return toolRepository.save(tool);
    }
    
    public void deleteTool(Long id) {
        Tool tool = getToolById(id);

        // Check if tool has project relations
        List<Project> projectsWithTool = projectRepository.findAll();
        for (Project project : projectsWithTool) {
            if (project.getTools().contains(tool)) {
                throw new RuntimeException("Cannot delete tool because it is associated with project: " + project.getName());
            }
        }

        // Delete all associated files
        toolFileService.deleteFilesByToolId(id);

        toolRepository.deleteById(id);
    }
    
    public List<Tool> getToolsByNamespace(String namespace) {
        return toolRepository.findByNamespace(namespace);
    }
    
    public List<Tool> getToolsByCategory(String category) {
        return toolRepository.findByCategory(category);
    }
    
    public List<Tool> searchTools(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Tool> toolPage = toolRepository.searchTools(searchTerm, namespace, pageable);
        return toolPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return toolRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return toolRepository.searchTools(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllTools() {
        return toolRepository.count();
    }

    public List<String> getDistinctNamespaces() {
        return toolRepository.findDistinctNamespaces();
    }
    
    public List<String> getDistinctCategories() {
        return toolRepository.findDistinctCategories();
    }
}