package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.*;
import io.github.akumosstl.agentic.backend.service.*;
import io.github.akumosstl.agentic.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/namespaces")
@CrossOrigin(origins = "*")
public class NamespaceController {

    @Autowired
    private AgentService agentService;

    @Autowired
    private ScriptService scriptService;

    @Autowired
    private InstructionService instructionService;

    @Autowired
    private PipelineService pipelineService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @GetMapping("/types")
    public ResponseEntity<List<String>> getTypes() {
        return ResponseEntity.ok(Arrays.asList("agents", "scripts", "instructions"));
    }

    @GetMapping("/namespaces/{type}")
    public ResponseEntity<List<String>> getNamespacesByType(@PathVariable String type) {
        List<String> namespaces;
        switch (type) {
            case "agents":
                namespaces = agentService.getDistinctNamespaces();
                if (namespaces.isEmpty()) {
                    namespaces = agentService.getDistinctCategories();
                }
                break;
            case "scripts":
                namespaces = scriptService.getDistinctNamespaces();
                if (namespaces.isEmpty()) {
                    namespaces = scriptService.getDistinctCategories();
                }
                break;
            case "instructions":
                namespaces = instructionService.getDistinctNamespaces();
                if (namespaces.isEmpty()) {
                    namespaces = instructionService.getDistinctCategories();
                }
                break;
            default:
                return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(namespaces);
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, List<String>>> getAllNamespaces() {
        Map<String, List<String>> result = new HashMap<>();
        result.put("agents", agentService.getDistinctNamespaces());
        result.put("scripts", scriptService.getDistinctNamespaces());
        result.put("instructions", instructionService.getDistinctNamespaces());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{type}/{namespace}")
    public ResponseEntity<NamespaceItems> getNamespaceItems(
            @PathVariable String type,
            @PathVariable String namespace,
            @RequestParam(required = false) String searchTerm) {
        
        List<?> items = new ArrayList<>();

        switch (type) {
            case "agents":
                items = agentService.getAgentsByNamespace(namespace);
                break;
            case "scripts":
                items = scriptService.getScriptsByNamespace(namespace);
                break;
            case "instructions":
                items = instructionService.getInstructionsByNamespace(namespace);
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        NamespaceItems result = new NamespaceItems();
        result.setType(type);
        result.setNamespace(namespace);
        result.setItems(items);
        result.setTotalCount(items.size());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{type}/{namespace}/pipelines")
    public ResponseEntity<List<Pipeline>> getPipelinesUsingNamespace(
            @PathVariable String type,
            @PathVariable String namespace) {
        
        Set<Long> itemIds = getItemIdsByTypeAndNamespace(type, namespace);
        
        List<Pipeline> allPipelines = pipelineService.getAllPipelines();
        List<Pipeline> referencedPipelines = new ArrayList<>();

        for (Pipeline pipeline : allPipelines) {
            List<PipelineStep> steps = pipelineStepRepository.findByPipeline_Id(pipeline.getId());
            boolean referencesNamespace = steps.stream().anyMatch(step -> {
                if ("agents".equals(type) && step.getAgent() != null) {
                    return itemIds.contains(step.getAgent().getId());
                } else if ("scripts".equals(type) && step.getScript() != null) {
                    return itemIds.contains(step.getScript().getId());
                }
                return false;
            });
            
            if (referencesNamespace) {
                referencedPipelines.add(pipeline);
            }
        }

        return ResponseEntity.ok(referencedPipelines);
    }

    @GetMapping("/{type}/{namespace}/projects")
    public ResponseEntity<List<Project>> getProjectsUsingNamespace(
            @PathVariable String type,
            @PathVariable String namespace) {
        
        Set<Long> itemIds = getItemIdsByTypeAndNamespace(type, namespace);
        List<Project> allProjects = projectRepository.findAll();
        List<Project> referencedProjects = new ArrayList<>();

        for (Project project : allProjects) {
            boolean referencesNamespace = false;
            
            switch (type) {
                case "scripts":
                    if (project.getScripts() != null) {
                        referencesNamespace = project.getScripts().stream()
                            .anyMatch(s -> itemIds.contains(s.getId()));
                    }
                    break;
                case "agents":
                    if (project.getAgents() != null) {
                        referencesNamespace = project.getAgents().stream()
                            .anyMatch(a -> itemIds.contains(a.getId()));
                    }
                    break;
                case "instructions":
                    if (project.getInstructions() != null) {
                        referencesNamespace = project.getInstructions().stream()
                            .anyMatch(i -> itemIds.contains(i.getId()));
                    }
                    break;
            }
            
            if (referencesNamespace) {
                referencedProjects.add(project);
            }
        }
        
        return ResponseEntity.ok(referencedProjects);
    }

    @DeleteMapping("/{type}/{namespace}")
    public ResponseEntity<ClearResult> clearNamespace(
            @PathVariable String type,
            @PathVariable String namespace) {
        
        Set<Long> itemIds = getItemIdsByTypeAndNamespace(type, namespace);
        
        int pipelinesUsingCount = countPipelinesUsingNamespace(type, itemIds);
        int projectsUsingCount = countProjectsUsingNamespace(type, itemIds);
        
        if (pipelinesUsingCount > 0 || projectsUsingCount > 0) {
            ClearResult result = new ClearResult();
            result.setSuccess(false);
            result.setDeletedCount(0);
            result.setMessage("Cannot clear namespace - it is used by " + 
                pipelinesUsingCount + " pipeline(s) and " + 
                projectsUsingCount + " project(s)");
            return ResponseEntity.ok(result);
        }

        int deletedCount = 0;
        switch (type) {
            case "agents":
                for (Long id : itemIds) {
                    agentService.deleteAgent(id);
                    deletedCount++;
                }
                break;
            case "scripts":
                for (Long id : itemIds) {
                    scriptService.deleteScript(id);
                    deletedCount++;
                }
                break;
        }

        ClearResult result = new ClearResult();
        result.setSuccess(true);
        result.setDeletedCount(deletedCount);
        result.setMessage("Successfully cleared " + deletedCount + " " + type + " with namespace '" + namespace + "'");
        return ResponseEntity.ok(result);
    }

    private Set<Long> getItemIdsByTypeAndNamespace(String type, String namespace) {
        Set<Long> itemIds = new HashSet<>();
        
        switch (type) {
            case "agents":
                List<Agent> agents = agentService.getAgentsByNamespace(namespace);
                for (Agent a : agents) {
                    if (a.getId() != null) itemIds.add(a.getId());
                }
                break;
            case "scripts":
                List<Script> scripts = scriptService.getScriptsByNamespace(namespace);
                for (Script s : scripts) {
                    if (s.getId() != null) itemIds.add(s.getId());
                }
                break;
        }
        
        return itemIds;
    }

    private int countPipelinesUsingNamespace(String type, Set<Long> itemIds) {
        List<Pipeline> allPipelines = pipelineService.getAllPipelines();
        int count = 0;

        for (Pipeline pipeline : allPipelines) {
            List<PipelineStep> steps = pipelineStepRepository.findByPipeline_Id(pipeline.getId());
            boolean referencesNamespace = steps.stream().anyMatch(step -> {
                if ("agents".equals(type) && step.getAgent() != null) {
                    return itemIds.contains(step.getAgent().getId());
                } else if ("scripts".equals(type) && step.getScript() != null) {
                    return itemIds.contains(step.getScript().getId());
                }
                return false;
            });
            
            if (referencesNamespace) count++;
        }

        return count;
    }

    private int countProjectsUsingNamespace(String type, Set<Long> itemIds) {
        List<Project> allProjects = projectRepository.findAll();
        int count = 0;

        for (Project project : allProjects) {
            boolean referencesNamespace = false;
            
            switch (type) {
                case "scripts":
                    if (project.getScripts() != null) {
                        referencesNamespace = project.getScripts().stream()
                            .anyMatch(s -> itemIds.contains(s.getId()));
                    }
                    break;
                case "agents":
                    if (project.getAgents() != null) {
                        referencesNamespace = project.getAgents().stream()
                            .anyMatch(a -> itemIds.contains(a.getId()));
                    }
                    break;
            }
            
            if (referencesNamespace) count++;
        }

        return count;
    }

    public static class NamespaceItems {
        private String type;
        private String namespace;
        private List<?> items;
        private long totalCount;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getNamespace() { return namespace; }
        public void setNamespace(String namespace) { this.namespace = namespace; }
        public List<?> getItems() { return items; }
        public void setItems(List<?> items) { this.items = items; }
        public long getTotalCount() { return totalCount; }
        public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    }

    public static class ClearResult {
        private boolean success;
        private int deletedCount;
        private String message;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public int getDeletedCount() { return deletedCount; }
        public void setDeletedCount(int deletedCount) { this.deletedCount = deletedCount; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}