package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Serviço para gerenciamento de Agentes.
 * 
 * Realiza operações de CRUD, busca e criação de arquivos de agente.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Service
public class AgentService {
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private TargetRepository targetRepository;
    
    /**
     * Busca agentes recentes com paginação.
     * 
     * @param page Número da página
     * @param size Tamanho da página
     * @return Lista de agentes
     */
    public List<Agent> getRecentAgents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Agent> agentPage = agentRepository.findAll(pageable);
        return agentPage.getContent();
    }
    
    public List<Agent> getTop10RecentAgents() {
        return agentRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Agent getAgentById(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
    }
    
    public Agent createAgent(Agent agent) {
        return agentRepository.save(agent);
    }
    
    public Agent createAgent(Agent agent, Long projectId) {
        Agent savedAgent = agentRepository.save(agent);
        
        if (projectId != null && (agent.getPath() == null || agent.getPath().isEmpty())) {
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project != null && project.getPath() != null && !project.getPath().isEmpty()) {
                saveAgentToProject(project, savedAgent);
            }
        }
        
        return savedAgent;
    }
    
    private void saveAgentToProject(Project project, Agent agent) {
        try {
            String targetAgentsPath = "agents";
            Target target = null;
            
            if (project.getTargetId() != null) {
                target = targetRepository.findById(project.getTargetId()).orElse(null);
            } else if (project.getTarget() != null && !project.getTarget().isEmpty()) {
                List<Target> targets = targetRepository.findAll();
                target = targets.stream()
                        .filter(t -> t.getName().equalsIgnoreCase(project.getTarget()))
                        .findFirst()
                        .orElse(null);
            }
            
            if (target != null && target.getAgentsPath() != null && !target.getAgentsPath().isEmpty()) {
                targetAgentsPath = target.getAgentsPath();
            }
            
            String fullPath = project.getPath() + File.separator + targetAgentsPath;
            
            Path agentPathObj = Paths.get(fullPath);
            Files.createDirectories(agentPathObj);
            
            String fileName = agent.getName() + ".md";
            Path filePath = agentPathObj.resolve(fileName);
            
            StringBuilder content = new StringBuilder();
            content.append("# ").append(agent.getName()).append("\n\n");
            if (agent.getDescription() != null && !agent.getDescription().isEmpty()) {
                content.append(agent.getDescription()).append("\n\n");
            }
            if (agent.getPrompt() != null && !agent.getPrompt().isEmpty()) {
                content.append("## System Prompt\n\n").append(agent.getPrompt()).append("\n");
            }
            
            Files.write(filePath, content.toString().getBytes());
            
            String agentRelativePath = fileName;
            agent.setPath(agentRelativePath);
            agentRepository.save(agent);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to create agent file: " + e.getMessage(), e);
        }
    }
    
    public Agent updateAgent(Long id, Agent agentDetails) {
        Agent agent = getAgentById(id);
        agent.setName(agentDetails.getName());
        agent.setDescription(agentDetails.getDescription());
        agent.setPrompt(agentDetails.getPrompt());
        agent.setPath(agentDetails.getPath());
        return agentRepository.save(agent);
    }
    
    public void deleteAgent(Long id) {
        Agent agent = getAgentById(id);
        List<Project> projects = projectRepository.findAll();
        for (Project project : projects) {
            if (project.getAgents().contains(agent)) {
                project.getAgents().remove(agent);
                projectRepository.save(project);
            }
        }
        agentRepository.deleteById(id);
    }
    
    public List<Agent> searchAgents(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Agent> agentPage = agentRepository.searchAgents(searchTerm, namespace, pageable);
        return agentPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return agentRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return agentRepository.searchAgents(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllAgents() {
        return agentRepository.count();
    }
    
    public List<String> getDistinctNamespaces() {
        return agentRepository.findDistinctNamespaces();
    }
    
    public List<String> getDistinctCategories() {
        return agentRepository.findDistinctCategories();
    }
    
    public List<Agent> getAgentsByCategory(String category) {
        return agentRepository.findByCategory(category);
    }
    
    public List<Agent> getAgentsByNamespace(String namespace) {
        return agentRepository.findByNamespace(namespace);
    }
    
    public List<Agent> searchByNamespace(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Agent> agentPage = agentRepository.searchByNamespace(searchTerm, namespace, pageable);
        return agentPage.getContent();
    }
}