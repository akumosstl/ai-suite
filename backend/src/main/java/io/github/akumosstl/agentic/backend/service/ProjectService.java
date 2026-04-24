package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.model.InstructionFile;
import io.github.akumosstl.agentic.backend.exception.FileAlreadyExistsException;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.ScriptRepository;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionFileRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ProjectService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ScriptRepository scriptRepository;
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Autowired
    private TargetRepository targetRepository;
    
    @Autowired
    private InstructionRepository instructionRepository;

    @Autowired
    private InstructionFileRepository instructionFileRepository;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;
    
    public List<Project> getRecentProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Project> projectPage = projectRepository.findAll(pageable);
        return projectPage.getContent();
    }
    
    public List<Project> getTop10RecentProjects() {
        return projectRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Project getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        if (project.getTargetId() != null) {
            Target target = targetRepository.findById(project.getTargetId()).orElse(null);
            if (target != null) {
                project.setTarget(target.getName());
            }
        }
        
        return project;
    }
    
    public Project createProject(Project project) {
        if (project.getPath() != null && !project.getPath().isEmpty()) {
            File path = new File(project.getPath());
            if (!path.exists()) {
                throw new RuntimeException("Path does not exist: " + project.getPath());
            }
            if (!path.isDirectory()) {
                throw new RuntimeException("Path is not a directory: " + project.getPath());
            }
        }
        return projectRepository.save(project);
    }
    
    public Project updateProject(Long id, Project projectDetails) {
        Project project = getProjectById(id);
        project.setName(projectDetails.getName());
        project.setDescription(projectDetails.getDescription());
        project.setPath(projectDetails.getPath());
        project.setTarget(projectDetails.getTarget());
        project.setStatus(projectDetails.getStatus());
        project.setReadme(projectDetails.getReadme());
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project updateProjectReadme(Long projectId, String readmeContent) {
        Project project = getProjectById(projectId);
        project.setReadme(readmeContent);
        project = projectRepository.save(project);
        
        String projectPath = project.getPath();
        if (projectPath != null && !projectPath.isEmpty()) {
            Path readmePath = Paths.get(projectPath, "README.md");
            try {
                Files.writeString(readmePath, readmeContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            } catch (Exception e) {
                System.err.println("Error writing README.md file: " + e.getMessage());
            }
        }
        
        return project;
    }
    
    @Transactional
    public void deleteProject(Long id) {
        pipelineRunRepository.deleteStepsByProjectId(id);
        pipelineRunRepository.deleteRunsByProjectId(id);
        pipelineRepository.deleteStepsByProjectId(id);
        pipelineRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
    }
    
    public List<Project> getProjectsByStatus(String status) {
        return projectRepository.findByStatus(status);
    }
    
    public List<Project> searchProjects(String searchTerm, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Project> projectPage = projectRepository.searchProjects(searchTerm, pageable);
        return projectPage.getContent();
    }
    
    public long countSearchResults(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return projectRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return projectRepository.searchProjects(searchTerm.trim(), pageable).getTotalElements();
    }
    
    public long countAllProjects() {
        return projectRepository.count();
    }
    
    public Page<Project> findAllPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return projectRepository.findAll(pageable);
    }
    
    // Scripts management
    @Transactional(readOnly = true)
    public List<Script> getProjectScripts(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getScripts();
    }
    
    @Transactional
    public Project addScriptsToProject(Long projectId, List<Long> scriptIds) {
        return addScriptsToProject(projectId, scriptIds, false);
    }

    @Transactional
    public Project addScriptsToProject(Long projectId, List<Long> scriptIds, boolean force) {
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
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
        
        for (Long scriptId : scriptIds) {
            Script script = scriptRepository.findById(scriptId)
                    .orElseThrow(() -> new RuntimeException("Script not found: " + scriptId));
            
            if (project.getScripts().contains(script)) {
                continue;
            }
            
            String fullPath = project.getPath() + File.separator + targetScriptsPath;
            if (script.getPath() != null && !script.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + script.getPath();
            }
            
            Path scriptPathObj = Paths.get(fullPath);
            try {
                if (!Files.exists(scriptPathObj) || !Files.isDirectory(scriptPathObj)) {
                    Files.createDirectories(scriptPathObj);
                }
                String scriptName = script.getName();
                if (scriptName.toLowerCase().endsWith(".sh") || scriptName.toLowerCase().endsWith(".ps1")) {
                } else {
                    scriptName = scriptName + ".sh";
                }
                Path filePath = scriptPathObj.resolve(scriptName);
                if (!force && Files.exists(filePath)) {
                    throw new FileAlreadyExistsException(scriptName, fullPath);
                }
                Files.deleteIfExists(filePath);
                String content = script.getContent() != null ? script.getContent() : "";
                Files.write(filePath, content.getBytes());
                
                if (!project.getScripts().contains(script)) {
                    project.addScript(script);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create script file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeScriptFromProject(Long projectId, Long scriptId) {
        Project project = getProjectById(projectId);
        
        Script scriptToRemove = project.getScripts().stream()
                .filter(script -> script.getId().equals(scriptId))
                .findFirst()
                .orElse(null);
        
        if (scriptToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
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
            if (scriptToRemove.getPath() != null && !scriptToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + scriptToRemove.getPath();
            }
            
            Path scriptPathObj = Paths.get(fullPath);
            try {
                String scriptName = scriptToRemove.getName();
                if (!scriptName.toLowerCase().endsWith(".sh") && !scriptName.toLowerCase().endsWith(".ps1")) {
                    scriptName = scriptName + ".sh";
                }
                Path filePath = scriptPathObj.resolve(scriptName);
                Files.deleteIfExists(filePath);

                File scriptDir = scriptPathObj.toFile();
                if (scriptDir.exists() && scriptDir.isDirectory()) {
                    File[] files = scriptDir.listFiles();
                    if (files != null && files.length == 0) {
                        Files.delete(scriptDir.toPath());
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete script file: " + e.getMessage(), e);
            }
        }
        
        project.getScripts().removeIf(script -> script.getId().equals(scriptId));
        return projectRepository.save(project);
    }
    
    // Agents management
    @Transactional(readOnly = true)
    public List<Agent> getProjectAgents(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getAgents();
    }
    
    @Transactional
    public Project addAgentsToProject(Long projectId, List<Long> agentIds) {
        return addAgentsToProject(projectId, agentIds, false);
    }

    @Transactional
    public Project addAgentsToProject(Long projectId, List<Long> agentIds, boolean force) {
        Project project = getProjectById(projectId);
        for (Long agentId : agentIds) {
            Agent agent = agentRepository.findById(agentId)
                    .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));
            if (!project.getAgents().contains(agent)) {
                project.addAgent(agent);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeAgentFromProject(Long projectId, Long agentId) {
        Project project = getProjectById(projectId);
        project.getAgents().removeIf(agent -> agent.getId().equals(agentId));
        return projectRepository.save(project);
    }
    
    // Instructions management
    @Transactional(readOnly = true)
    public List<Instruction> getProjectInstructions(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getInstructions();
    }
    
    @Transactional
    public Project addInstructionsToProject(Long projectId, List<Long> instructionIds) {
        return addInstructionsToProject(projectId, instructionIds, false);
    }

    @Transactional
    public Project addInstructionsToProject(Long projectId, List<Long> instructionIds, boolean force) {
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
        String targetInstructionsPath = "instructions";
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
        if (target != null && target.getInstructionsPath() != null && !target.getInstructionsPath().isEmpty()) {
            targetInstructionsPath = target.getInstructionsPath();
        }
        
        for (Long instructionId : instructionIds) {
            Instruction instruction = instructionRepository.findById(instructionId)
                    .orElseThrow(() -> new RuntimeException("Instruction not found: " + instructionId));

            boolean alreadyAdded = project.getInstructions().stream()
                    .anyMatch(i -> i.getId().equals(instructionId));
            if (alreadyAdded) {
                continue;
            }
            
            String fullPath = project.getPath() + File.separator + targetInstructionsPath;
            if (instruction.getPath() != null && !instruction.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + instruction.getPath();
            }
            
            Path instructionPathObj = Paths.get(fullPath);
            try {
                if (!Files.exists(instructionPathObj) || !Files.isDirectory(instructionPathObj)) {
                    Files.createDirectories(instructionPathObj);
                }
                String fileName = instruction.getName();
                Path filePath = instructionPathObj.resolve(fileName);
                if (!force && Files.exists(filePath)) {
                    throw new FileAlreadyExistsException(fileName, fullPath);
                }
                Files.deleteIfExists(filePath);
                String content = instruction.getInstructions() != null ? instruction.getInstructions() : "";
                Files.write(filePath, content.getBytes());
                
                List<InstructionFile> instructionFiles = instructionFileRepository.findByInstructionId(instructionId);
                for (InstructionFile instructionFile : instructionFiles) {
                    String fileDirPath = fullPath;
                    if (instructionFile.getPath() != null && !instructionFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + instructionFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    if (!Files.exists(fileDirPathObj) || !Files.isDirectory(fileDirPathObj)) {
                        Files.createDirectories(fileDirPathObj);
                    }
                    
                    String attachedFileName = instructionFile.getFileName();
                    Path attachedFilePath = fileDirPathObj.resolve(attachedFileName);
                    if (!force && Files.exists(attachedFilePath)) {
                        throw new FileAlreadyExistsException(attachedFileName, fileDirPath);
                    }
                    Files.deleteIfExists(attachedFilePath);
                    String fileContent = instructionFile.getContent() != null ? instructionFile.getContent() : "";
                    Files.write(attachedFilePath, fileContent.getBytes());
                }
                
                if (!project.getInstructions().contains(instruction)) {
                    project.addInstruction(instruction);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create instruction file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeInstructionFromProject(Long projectId, Long instructionId) {
        Project project = getProjectById(projectId);
        
        Instruction instructionToRemove = project.getInstructions().stream()
                .filter(i -> i.getId().equals(instructionId))
                .findFirst()
                .orElse(null);
        
        if (instructionToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
            String targetInstructionsPath = "instructions";
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
            if (target != null && target.getInstructionsPath() != null && !target.getInstructionsPath().isEmpty()) {
                targetInstructionsPath = target.getInstructionsPath();
            }
            
            String fullPath = project.getPath() + File.separator + targetInstructionsPath;
            if (instructionToRemove.getPath() != null && !instructionToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + instructionToRemove.getPath();
            }
            
            Path instructionPathObj = Paths.get(fullPath);
            try {
                String fileName = instructionToRemove.getName();
                Path filePath = instructionPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);

                List<InstructionFile> instructionFiles = instructionFileRepository.findByInstructionId(instructionId);
                for (InstructionFile instructionFile : instructionFiles) {
                    String fileDirPath = fullPath;
                    if (instructionFile.getPath() != null && !instructionFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + instructionFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    String attachedFileName = instructionFile.getFileName();
                    Path attachedFilePath = fileDirPathObj.resolve(attachedFileName);
                    Files.deleteIfExists(attachedFilePath);

                    File attachedDir = fileDirPathObj.toFile();
                    if (attachedDir.exists() && attachedDir.isDirectory()) {
                        File[] files = attachedDir.listFiles();
                        if (files != null && files.length == 0) {
                            Files.delete(attachedDir.toPath());
                        }
                    }
                }

                File instructionDir = instructionPathObj.toFile();
                if (instructionDir.exists() && instructionDir.isDirectory()) {
                    File[] files = instructionDir.listFiles();
        if (files != null && files.length == 0) {
          Files.delete(instructionDir.toPath());
        }
      }
    } catch (IOException e) {
      throw new RuntimeException("Failed to delete instruction file: " + e.getMessage(), e);
    }
  }

  project.getInstructions().removeIf(i -> i.getId().equals(instructionId));
  return projectRepository.save(project);
}
}