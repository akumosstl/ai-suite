package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import jakarta.transaction.Transactional;
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
import java.util.*;

/**
 * Serviço para gerenciamento de Agentes.
 * <p>
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

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

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
        checkDuplicateNameNamespace(agent, null);
        return agentRepository.save(agent);
    }

    public Agent createAgent(Agent agent, Long projectId) {
        checkDuplicateNameNamespace(agent, null);
        return agentRepository.save(agent);
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
            if (agent.getPath() != null && !agent.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + agent.getPath();
            }

            Path agentPathObj = Paths.get(fullPath);
            Files.createDirectories(agentPathObj);

            String fileName = agent.getName();
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
            if (agent.getPath() == null || agent.getPath().isEmpty()) {
                agent.setPath(agentRelativePath);
            }
            agentRepository.save(agent);

        } catch (IOException e) {
            throw new RuntimeException("Failed to create agent file: " + e.getMessage(), e);
        }
    }

    public Agent updateAgent(Long id, Agent agentDetails) {
        Agent agent = getAgentById(id);
        checkDuplicateNameNamespace(agentDetails, id);

        boolean promptChanged = !java.util.Objects.equals(agent.getPrompt(), agentDetails.getPrompt());
        boolean nameChanged = !java.util.Objects.equals(agent.getName(), agentDetails.getName());

        agent.setName(agentDetails.getName());
        agent.setNamespace(agentDetails.getNamespace());
        agent.setDescription(agentDetails.getDescription());
        agent.setPrompt(agentDetails.getPrompt());
        agent.setPath(agentDetails.getPath());
        Agent saved = agentRepository.save(agent);

        if (promptChanged || nameChanged) {
            propagateAgentToProjects(saved);
        }

        return saved;
    }

    private void propagateAgentToProjects(Agent agent) {
        List<Project> allProjects = projectRepository.findAll();
        for (Project project : allProjects) {
            if (project.getAgents().contains(agent) && project.getPath() != null && !project.getPath().isEmpty()) {
                updateAgentFileOnDisk(project, agent);
            }
        }
    }

    private void updateAgentFileOnDisk(Project project, Agent agent) {
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
            if (agent.getPath() != null && !agent.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + agent.getPath();
            }

            Path agentPathObj = Paths.get(fullPath);
            if (!Files.exists(agentPathObj)) {
                return;
            }

            String fileName = agent.getName();
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
        } catch (IOException e) {
            System.err.println("WARNING: Failed to update agent file on disk for project " + project.getName() + ": " + e.getMessage());
        }
    }

    @Transactional
    public void deleteAgent(Long id) {
        Agent agent = getAgentById(id);

        java.util.List<String> pipelineNames = new java.util.ArrayList<>();
        List<PipelineStep> pipelineSteps = pipelineStepRepository.findByAgent_Id(id);
        java.util.Set<Long> seenPipelineIds = new java.util.HashSet<>();
        for (PipelineStep step : pipelineSteps) {
            if (step.getPipeline() != null && !seenPipelineIds.contains(step.getPipeline().getId())) {
                seenPipelineIds.add(step.getPipeline().getId());
                pipelineNames.add(step.getPipeline().getName());
            }
        }
        if (!pipelineNames.isEmpty()) {
            throw new RuntimeException("Cannot delete agent because it is used in pipeline(s): " + String.join(", ", pipelineNames));
        }

        java.util.List<String> projectNames = new java.util.ArrayList<>();
        List<Project> projectsWithAgent = projectRepository.findAll();
        for (Project project : projectsWithAgent) {
            if (project.getAgents().contains(agent)) {
                projectNames.add(project.getName());
            }
        }
        if (!projectNames.isEmpty()) {
            throw new RuntimeException("Cannot delete agent because it is associated with project(s): " + String.join(", ", projectNames));
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

    private void checkDuplicateNameNamespace(Agent agent, Long excludeId) {
        String name = agent.getName();
        String namespace = agent.getNamespace() != null ? agent.getNamespace() : "";
        Optional<Agent> existing = agentRepository.findByNameAndNamespace(name, namespace);
        if (existing.isPresent() && !existing.get().getId().equals(excludeId)) {
            throw new IllegalArgumentException("Agent with name '" + name + "' and namespace '" + namespace + "' already exists");
        }
    }

    public Agent findOrCreateAgent(String name, String namespace, String category, String description, String prompt, String path) {
        Optional<Agent> existing = agentRepository.findByNameAndNamespace(name, namespace != null ? namespace : "");
        if (existing.isPresent()) {
            return existing.get();
        }
        Agent agent = new Agent();
        agent.setName(name);
        agent.setNamespace(namespace != null ? namespace : "");
        agent.setCategory(category != null ? category : "");
        agent.setDescription(description != null ? description : "");
        agent.setPrompt(prompt != null ? prompt : "");
        agent.setPath(path != null ? path : "");
        return agentRepository.save(agent);
    }

    public java.util.Map<String, Object> getImpactReport(Long agentId) {
        Agent agent = getAgentById(agentId);
        java.util.Map<String, Object> report = new java.util.HashMap<>();

        java.util.List<java.util.Map<String, Object>> affectedPipelines = new java.util.ArrayList<>();
        java.util.List<java.util.Map<String, Object>> affectedProjects = new java.util.ArrayList<>();

        List<PipelineStep> pipelineSteps = pipelineStepRepository.findByAgent_Id(agentId);
        java.util.Set<Long> pipelineIds = new java.util.HashSet<>();
        for (PipelineStep step : pipelineSteps) {
            if (step.getPipeline() != null && !pipelineIds.contains(step.getPipeline().getId())) {
                pipelineIds.add(step.getPipeline().getId());
                java.util.Map<String, Object> pipelineInfo = new java.util.HashMap<>();
                pipelineInfo.put("pipelineId", step.getPipeline().getId());
                pipelineInfo.put("pipelineName", step.getPipeline().getName());
                if (step.getPipeline().getProject() != null) {
                    pipelineInfo.put("projectId", step.getPipeline().getProject().getId());
                    pipelineInfo.put("projectName", step.getPipeline().getProject().getName());
                }
                pipelineInfo.put("stepCount", pipelineSteps.stream()
                        .filter(s -> s.getPipeline() != null && s.getPipeline().getId().equals(step.getPipeline().getId()))
                        .count());
                affectedPipelines.add(pipelineInfo);
            }
        }

        List<Project> allProjects = projectRepository.findAll();
        for (Project project : allProjects) {
            if (project.getAgents().contains(agent)) {
                java.util.Map<String, Object> projectInfo = new java.util.HashMap<>();
                projectInfo.put("projectId", project.getId());
                projectInfo.put("projectName", project.getName());
                affectedProjects.add(projectInfo);
            }
        }

        report.put("agentId", agentId);
        report.put("agentName", agent.getName());
        report.put("affectedPipelines", affectedPipelines);
        report.put("affectedProjects", affectedProjects);
        report.put("totalPipelines", affectedPipelines.size());
        report.put("totalProjects", affectedProjects.size());

        return report;
    }
}