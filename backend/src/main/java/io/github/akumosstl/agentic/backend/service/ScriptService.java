package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.ScriptRepository;
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
import java.util.*;

@Service
public class ScriptService {

    @Autowired
    private ScriptRepository scriptRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private TargetRepository targetRepository;

    public List<Script> getRecentScripts(int page, int size) {
        return scriptRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending())).getContent();
    }

    public long countAllScripts() {
        return scriptRepository.count();
    }

    public Script getScriptById(Long id) {
        return scriptRepository.findById(id).orElseThrow(() -> new RuntimeException("Script not found"));
    }

    public Script createScript(Script script) {
        checkDuplicateNameNamespace(script, null);
        return scriptRepository.save(script);
    }

    public Script updateScript(Long id, Script scriptDetails) {
        Script script = getScriptById(id);
        checkDuplicateNameNamespace(scriptDetails, id);

        boolean contentChanged = !java.util.Objects.equals(script.getContent(), scriptDetails.getContent());
        boolean nameChanged = !java.util.Objects.equals(script.getName(), scriptDetails.getName());

        script.setName(scriptDetails.getName());
        script.setNamespace(scriptDetails.getNamespace());
        script.setPath(scriptDetails.getPath());
        script.setDescription(scriptDetails.getDescription());
        script.setContent(scriptDetails.getContent());
        script.setScope(scriptDetails.getScope());
        Script saved = scriptRepository.save(script);

        if (contentChanged || nameChanged) {
            propagateScriptToProjects(saved);
        }

        return saved;
    }

    private void propagateScriptToProjects(Script script) {
        List<Project> allProjects = projectRepository.findAll();
        for (Project project : allProjects) {
            if (project.getScripts().contains(script) && project.getPath() != null && !project.getPath().isEmpty()) {
                updateScriptFileOnDisk(project, script);
            }
        }
    }

    private void updateScriptFileOnDisk(Project project, Script script) {
        try {
            String targetScriptsPath = "scripts";
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

            if (target != null && target.getScriptsPath() != null && !target.getScriptsPath().isEmpty()) {
                targetScriptsPath = target.getScriptsPath();
            }

            String fullPath = project.getPath() + File.separator + targetScriptsPath;
            if (script.getPath() != null && !script.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + script.getPath();
            }

            Path scriptPathObj = Paths.get(fullPath);
            if (!Files.exists(scriptPathObj)) {
                return;
            }

            String scriptName = script.getName();
            if (!scriptName.toLowerCase().endsWith(".sh") && !scriptName.toLowerCase().endsWith(".ps1")) {
                scriptName = scriptName + ".sh";
            }
            Path filePath = scriptPathObj.resolve(scriptName);
            String content = script.getContent() != null ? script.getContent() : "";
            Files.write(filePath, content.getBytes());
        } catch (IOException e) {
            System.err.println("WARNING: Failed to update script file on disk for project " + project.getName() + ": " + e.getMessage());
        }
    }

    public void deleteScript(Long id) {
        Script script = getScriptById(id);

        java.util.List<String> pipelineNames = new java.util.ArrayList<>();
        List<PipelineStep> pipelineSteps = pipelineStepRepository.findByScript_Id(id);
        java.util.Set<Long> seenPipelineIds = new java.util.HashSet<>();
        for (PipelineStep step : pipelineSteps) {
            if (step.getPipeline() != null && !seenPipelineIds.contains(step.getPipeline().getId())) {
                seenPipelineIds.add(step.getPipeline().getId());
                pipelineNames.add(step.getPipeline().getName());
            }
        }
        if (!pipelineNames.isEmpty()) {
            throw new RuntimeException("Cannot delete script because it is used in pipeline(s): " + String.join(", ", pipelineNames));
        }

        java.util.List<String> projectNames = new java.util.ArrayList<>();
        List<Project> allProjects = projectRepository.findAll();
        for (Project project : allProjects) {
            if (project.getScripts().contains(script)) {
                projectNames.add(project.getName());
            }
        }
        if (!projectNames.isEmpty()) {
            throw new RuntimeException("Cannot delete script because it is associated with project(s): " + String.join(", ", projectNames));
        }

        scriptRepository.deleteById(id);
    }

    public List<Script> searchScripts(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Script> scriptPage = scriptRepository.searchScripts(searchTerm, namespace, pageable);
        return scriptPage.getContent();
    }

    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return scriptRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return scriptRepository.searchScripts(searchTerm, namespace, pageable).getTotalElements();
    }

    public List<String> getDistinctNamespaces() {
        return scriptRepository.findDistinctNamespaces();
    }

    public List<String> getDistinctCategories() {
        return scriptRepository.findDistinctCategories();
    }

    public List<Script> getScriptsByNamespace(String namespace) {
        return scriptRepository.findByNamespace(namespace);
    }

    private void checkDuplicateNameNamespace(Script script, Long excludeId) {
        String name = script.getName();
        String namespace = script.getNamespace() != null ? script.getNamespace() : "";
        Optional<Script> existing = scriptRepository.findByNameAndNamespace(name, namespace);
        if (existing.isPresent() && !existing.get().getId().equals(excludeId)) {
            throw new IllegalArgumentException("Script with name '" + name + "' and namespace '" + namespace + "' already exists");
        }
    }

    public Script findOrCreateScript(String name, String namespace, String category, String description, String content, String scope, String path) {
        Optional<Script> existing = scriptRepository.findByNameAndNamespace(name, namespace != null ? namespace : "");
        if (existing.isPresent()) {
            return existing.get();
        }
        Script script = new Script();
        script.setName(name);
        script.setNamespace(namespace != null ? namespace : "");
        script.setCategory(category != null ? category : "");
        script.setDescription(description != null ? description : "");
        script.setContent(content != null ? content : "");
        script.setScope(scope != null ? scope : "global");
        script.setPath(path != null ? path : "");
        return scriptRepository.save(script);
    }

    public java.util.Map<String, Object> getImpactReport(Long scriptId) {
        Script script = getScriptById(scriptId);
        java.util.Map<String, Object> report = new java.util.HashMap<>();

        java.util.List<java.util.Map<String, Object>> affectedPipelines = new java.util.ArrayList<>();
        java.util.List<java.util.Map<String, Object>> affectedProjects = new java.util.ArrayList<>();

        List<PipelineStep> pipelineSteps = pipelineStepRepository.findByScript_Id(scriptId);
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
            if (project.getScripts().contains(script)) {
                java.util.Map<String, Object> projectInfo = new java.util.HashMap<>();
                projectInfo.put("projectId", project.getId());
                projectInfo.put("projectName", project.getName());
                affectedProjects.add(projectInfo);
            }
        }

        report.put("scriptId", scriptId);
        report.put("scriptName", script.getName());
        report.put("affectedPipelines", affectedPipelines);
        report.put("affectedProjects", affectedProjects);
        report.put("totalPipelines", affectedPipelines.size());
        report.put("totalProjects", affectedProjects.size());

        return report;
    }
}
