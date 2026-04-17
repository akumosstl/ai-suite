package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.model.Command;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.model.SkillFile;
import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.model.InstructionFile;
import io.github.akumosstl.agentic.backend.model.PluginFile;
import io.github.akumosstl.agentic.backend.model.ToolFile;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.SkillRepository;
import io.github.akumosstl.agentic.backend.repository.CommandRepository;
import io.github.akumosstl.agentic.backend.repository.ScriptRepository;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import io.github.akumosstl.agentic.backend.repository.SkillFileRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import io.github.akumosstl.agentic.backend.repository.PluginRepository;
import io.github.akumosstl.agentic.backend.repository.ToolRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionFileRepository;
import io.github.akumosstl.agentic.backend.repository.PluginFileRepository;
import io.github.akumosstl.agentic.backend.repository.ToolFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Serviço para gerenciamento de Projetos.
 * 
 * Realiza operações de CRUD, gerenciamento de associações de recursos
 * (agentes, skills, commands, scripts, instructions, plugins, tools)
 * e manipulação de arquivos no sistema de arquivos.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private SkillRepository skillRepository;
    
    @Autowired
    private CommandRepository commandRepository;
    
    @Autowired
    private ScriptRepository scriptRepository;
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Autowired
    private TargetRepository targetRepository;
    
    @Autowired
    private SkillFileRepository skillFileRepository;
    
    @Autowired
    private InstructionRepository instructionRepository;
    
    @Autowired
    private PluginRepository pluginRepository;
    
    @Autowired
    private ToolRepository toolRepository;
    
    @Autowired
    private InstructionFileRepository instructionFileRepository;
    
    @Autowired
    private PluginFileRepository pluginFileRepository;
    
    @Autowired
    private ToolFileRepository toolFileRepository;
    
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
        return projectRepository.save(project);
    }
    
    @Transactional
    public void deleteProject(Long id) {
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
    
    // Skills management
    @Transactional(readOnly = true)
    public List<Skill> getProjectSkills(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getSkills();
    }
    
    @Transactional
    public Project addSkillsToProject(Long projectId, List<Long> skillIds) {
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
        String targetSkillsPath = "skills";
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
        if (target != null && target.getSkillsPath() != null && !target.getSkillsPath().isEmpty()) {
            targetSkillsPath = target.getSkillsPath();
        }
        
        for (Long skillId : skillIds) {
            Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));
            
            String fullPath = project.getPath() + File.separator + targetSkillsPath;
            if (skill.getPath() != null && !skill.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + skill.getPath();
            }
            
            Path skillPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(skillPathObj);
                String fileName = skill.getName();
                Path filePath = skillPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);
                String content = skill.getInstructions() != null ? skill.getInstructions() : "";
                Files.write(filePath, content.getBytes());
                
                List<SkillFile> skillFiles = skillFileRepository.findBySkillId(skillId);
                for (SkillFile skillFile : skillFiles) {
                    String fileDirPath = fullPath;
                    if (skillFile.getPath() != null && !skillFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + skillFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    Files.createDirectories(fileDirPathObj);
                    
                    String attachedFileName = skillFile.getFileName();
                    Path attachedFilePath = fileDirPathObj.resolve(attachedFileName);
                    Files.deleteIfExists(attachedFilePath);
                    String fileContent = skillFile.getContent() != null ? skillFile.getContent() : "";
                    Files.write(attachedFilePath, fileContent.getBytes());
                }
                
                if (!project.getSkills().contains(skill)) {
                    project.addSkill(skill);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create skill file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeSkillFromProject(Long projectId, Long skillId) {
        Project project = getProjectById(projectId);
        
        Skill skillToRemove = project.getSkills().stream()
                .filter(skill -> skill.getId().equals(skillId))
                .findFirst()
                .orElse(null);
        
        if (skillToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
            String targetSkillsPath = "skills";
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
            if (target != null && target.getSkillsPath() != null && !target.getSkillsPath().isEmpty()) {
                targetSkillsPath = target.getSkillsPath();
            }
            
            String fullPath = project.getPath() + File.separator + targetSkillsPath;
            if (skillToRemove.getPath() != null && !skillToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + skillToRemove.getPath();
            }
            
            Path skillPathObj = Paths.get(fullPath);
            try {
                String fileName = skillToRemove.getName();
                Path filePath = skillPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);

                List<SkillFile> skillFiles = skillFileRepository.findBySkillId(skillId);
                for (SkillFile skillFile : skillFiles) {
                    String fileDirPath = fullPath;
                    if (skillFile.getPath() != null && !skillFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + skillFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    String attachedFileName = skillFile.getFileName();
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

                File skillDir = skillPathObj.toFile();
                if (skillDir.exists() && skillDir.isDirectory()) {
                    File[] files = skillDir.listFiles();
                    if (files != null && files.length == 0) {
                        Files.delete(skillDir.toPath());
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete skill file: " + e.getMessage(), e);
            }
        }
        
        project.getSkills().removeIf(skill -> skill.getId().equals(skillId));
        return projectRepository.save(project);
    }
    
    // Commands management
    @Transactional(readOnly = true)
    public List<Command> getProjectCommands(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getCommands();
    }
    
    @Transactional
    public Project addCommandsToProject(Long projectId, List<Long> commandIds) {
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
        String targetCommandsPath = "commands";
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
        if (target != null && target.getCommandsPath() != null && !target.getCommandsPath().isEmpty()) {
            targetCommandsPath = target.getCommandsPath();
        }
        
        for (Long commandId : commandIds) {
            Command command = commandRepository.findById(commandId)
                    .orElseThrow(() -> new RuntimeException("Command not found: " + commandId));
            
            String fullPath = project.getPath() + File.separator + targetCommandsPath;
            if (command.getPath() != null && !command.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + command.getPath();
            }
            
            Path commandPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(commandPathObj);
                String fileName = command.getName();
                Path filePath = commandPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);
                String content = command.getCommand() != null ? command.getCommand() : "";
                Files.write(filePath, content.getBytes());
                
                if (!project.getCommands().contains(command)) {
                    project.addCommand(command);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create command file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeCommandFromProject(Long projectId, Long commandId) {
        Project project = getProjectById(projectId);
        
        Command commandToRemove = project.getCommands().stream()
                .filter(command -> command.getId().equals(commandId))
                .findFirst()
                .orElse(null);
        
        if (commandToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
            String targetCommandsPath = "commands";
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
            if (target != null && target.getCommandsPath() != null && !target.getCommandsPath().isEmpty()) {
                targetCommandsPath = target.getCommandsPath();
            }
            
            String fullPath = project.getPath() + File.separator + targetCommandsPath;
            if (commandToRemove.getPath() != null && !commandToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + commandToRemove.getPath();
            }
            
            Path commandPathObj = Paths.get(fullPath);
            try {
                String fileName = commandToRemove.getName();
                Path filePath = commandPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);

                File commandDir = commandPathObj.toFile();
                if (commandDir.exists() && commandDir.isDirectory()) {
                    File[] files = commandDir.listFiles();
                    if (files != null && files.length == 0) {
                        Files.delete(commandDir.toPath());
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete command file: " + e.getMessage(), e);
            }
        }
        
        project.getCommands().removeIf(command -> command.getId().equals(commandId));
        return projectRepository.save(project);
    }
    
    // Scripts management
    @Transactional(readOnly = true)
    public List<Script> getProjectScripts(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getScripts();
    }
    
    @Transactional
    public Project addScriptsToProject(Long projectId, List<Long> scriptIds) {
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
            
            String fullPath = project.getPath() + File.separator + targetScriptsPath;
            if (script.getPath() != null && !script.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + script.getPath();
            }
            
            Path scriptPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(scriptPathObj);
                String scriptName = script.getName();
                if (scriptName.toLowerCase().endsWith(".sh") || scriptName.toLowerCase().endsWith(".ps1")) {
                    // keep extension
                } else {
                    scriptName = scriptName + ".sh";
                }
                Path filePath = scriptPathObj.resolve(scriptName);
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
                if (scriptName.toLowerCase().endsWith(".sh") || scriptName.toLowerCase().endsWith(".ps1")) {
                    // keep extension
                } else {
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
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
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
        
        for (Long agentId : agentIds) {
            Agent agent = agentRepository.findById(agentId)
                    .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));
            
            String fullPath = project.getPath() + File.separator + targetAgentsPath;
            if (agent.getPath() != null && !agent.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + agent.getPath();
            }
            
            Path agentPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(agentPathObj);
                
                String fileName = agent.getName();
                Path filePath = agentPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);
                String content = agent.getPrompt() != null ? agent.getPrompt() : "";
                Files.write(filePath, content.getBytes());
                
                if (!project.getAgents().contains(agent)) {
                    project.addAgent(agent);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create agent file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeAgentFromProject(Long projectId, Long agentId) {
        Project project = getProjectById(projectId);
        
        Agent agentToRemove = project.getAgents().stream()
                .filter(agent -> agent.getId().equals(agentId))
                .findFirst()
                .orElse(null);
        
        if (agentToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
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
            if (agentToRemove.getPath() != null && !agentToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + agentToRemove.getPath();
            }
            
            Path agentPathObj = Paths.get(fullPath);
            try {
                String fileName = agentToRemove.getName();
                Path filePath = agentPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);

                File agentDir = agentPathObj.toFile();
                if (agentDir.exists() && agentDir.isDirectory()) {
                    File[] files = agentDir.listFiles();
                    if (files != null && files.length == 0) {
                        Files.delete(agentDir.toPath());
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete agent file: " + e.getMessage(), e);
            }
        }
        
        project.getAgents().removeIf(a -> a.getId().equals(agentId));
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
            
            String fullPath = project.getPath() + File.separator + targetInstructionsPath;
            if (instruction.getPath() != null && !instruction.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + instruction.getPath();
            }
            
            Path instructionPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(instructionPathObj);
                String fileName = instruction.getName();
                Path filePath = instructionPathObj.resolve(fileName);
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
                    Files.createDirectories(fileDirPathObj);
                    
                    String attachedFileName = instructionFile.getFileName();
                    Path attachedFilePath = fileDirPathObj.resolve(attachedFileName);
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
    
    // Plugins management
    @Transactional(readOnly = true)
    public List<Plugin> getProjectPlugins(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getPlugins();
    }
    
    @Transactional
    public Project addPluginsToProject(Long projectId, List<Long> pluginIds) {
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
        String targetPluginsPath = "plugins";
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
        if (target != null && target.getPluginsPath() != null && !target.getPluginsPath().isEmpty()) {
            targetPluginsPath = target.getPluginsPath();
        }
        
        for (Long pluginId : pluginIds) {
            Plugin plugin = pluginRepository.findById(pluginId)
                    .orElseThrow(() -> new RuntimeException("Plugin not found: " + pluginId));
            
            String fullPath = project.getPath() + File.separator + targetPluginsPath;
            if (plugin.getPath() != null && !plugin.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + plugin.getPath();
            }
            
            Path pluginPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(pluginPathObj);
                String fileName = plugin.getName();
                Path filePath = pluginPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);
                String content = plugin.getInstructions() != null ? plugin.getInstructions() : "";
                Files.write(filePath, content.getBytes());
                
                List<PluginFile> pluginFiles = pluginFileRepository.findByPluginId(pluginId);
                for (PluginFile pluginFile : pluginFiles) {
                    String fileDirPath = fullPath;
                    if (pluginFile.getPath() != null && !pluginFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + pluginFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    Files.createDirectories(fileDirPathObj);
                    
                    String attachedFileName = pluginFile.getFileName();
                    Path attachedFilePath = fileDirPathObj.resolve(attachedFileName);
                    Files.deleteIfExists(attachedFilePath);
                    String fileContent = pluginFile.getContent() != null ? pluginFile.getContent() : "";
                    Files.write(attachedFilePath, fileContent.getBytes());
                }
                
                if (!project.getPlugins().contains(plugin)) {
                    project.addPlugin(plugin);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create plugin file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removePluginFromProject(Long projectId, Long pluginId) {
        Project project = getProjectById(projectId);
        
        Plugin pluginToRemove = project.getPlugins().stream()
                .filter(p -> p.getId().equals(pluginId))
                .findFirst()
                .orElse(null);
        
        if (pluginToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
            String targetPluginsPath = "plugins";
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
            if (target != null && target.getPluginsPath() != null && !target.getPluginsPath().isEmpty()) {
                targetPluginsPath = target.getPluginsPath();
            }
            
            String fullPath = project.getPath() + File.separator + targetPluginsPath;
            if (pluginToRemove.getPath() != null && !pluginToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + pluginToRemove.getPath();
            }
            
            Path pluginPathObj = Paths.get(fullPath);
            try {
                String fileName = pluginToRemove.getName();
                Path filePath = pluginPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);

                List<PluginFile> pluginFiles = pluginFileRepository.findByPluginId(pluginId);
                for (PluginFile pluginFile : pluginFiles) {
                    String fileDirPath = fullPath;
                    if (pluginFile.getPath() != null && !pluginFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + pluginFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    String attachedFileName = pluginFile.getFileName();
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

                File pluginDir = pluginPathObj.toFile();
                if (pluginDir.exists() && pluginDir.isDirectory()) {
                    File[] files = pluginDir.listFiles();
                    if (files != null && files.length == 0) {
                        Files.delete(pluginDir.toPath());
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete plugin file: " + e.getMessage(), e);
            }
        }
        
        project.getPlugins().removeIf(p -> p.getId().equals(pluginId));
        return projectRepository.save(project);
    }
    
    // Tools management
    @Transactional(readOnly = true)
    public List<Tool> getProjectTools(Long projectId) {
        Project project = getProjectById(projectId);
        return project.getTools();
    }
    
    @Transactional
    public Project addToolsToProject(Long projectId, List<Long> toolIds) {
        Project project = getProjectById(projectId);
        
        if (project.getPath() == null || project.getPath().isEmpty()) {
            throw new RuntimeException("Project does not have a path defined");
        }
        
        String targetToolsPath = "tools";
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
        if (target != null && target.getToolsPath() != null && !target.getToolsPath().isEmpty()) {
            targetToolsPath = target.getToolsPath();
        }
        
        for (Long toolId : toolIds) {
            Tool tool = toolRepository.findById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found: " + toolId));
            
            String fullPath = project.getPath() + File.separator + targetToolsPath;
            if (tool.getPath() != null && !tool.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + tool.getPath();
            }
            
            Path toolPathObj = Paths.get(fullPath);
            try {
                Files.createDirectories(toolPathObj);
                String fileName = tool.getName();
                Path filePath = toolPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);
                String content = tool.getInstructions() != null ? tool.getInstructions() : "";
                Files.write(filePath, content.getBytes());
                
                List<ToolFile> toolFiles = toolFileRepository.findByToolId(toolId);
                for (ToolFile toolFile : toolFiles) {
                    String fileDirPath = fullPath;
                    if (toolFile.getPath() != null && !toolFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + toolFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    Files.createDirectories(fileDirPathObj);
                    
                    String attachedFileName = toolFile.getFileName();
                    Path attachedFilePath = fileDirPathObj.resolve(attachedFileName);
                    Files.deleteIfExists(attachedFilePath);
                    String fileContent = toolFile.getContent() != null ? toolFile.getContent() : "";
                    Files.write(attachedFilePath, fileContent.getBytes());
                }
                
                if (!project.getTools().contains(tool)) {
                    project.addTool(tool);
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create tool file: " + e.getMessage(), e);
            }
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project removeToolFromProject(Long projectId, Long toolId) {
        Project project = getProjectById(projectId);
        
        Tool toolToRemove = project.getTools().stream()
                .filter(t -> t.getId().equals(toolId))
                .findFirst()
                .orElse(null);
        
        if (toolToRemove != null && project.getPath() != null && !project.getPath().isEmpty()) {
            String targetToolsPath = "tools";
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
            if (target != null && target.getToolsPath() != null && !target.getToolsPath().isEmpty()) {
                targetToolsPath = target.getToolsPath();
            }
            
            String fullPath = project.getPath() + File.separator + targetToolsPath;
            if (toolToRemove.getPath() != null && !toolToRemove.getPath().isEmpty()) {
                fullPath = fullPath + File.separator + toolToRemove.getPath();
            }
            
            Path toolPathObj = Paths.get(fullPath);
            try {
                String fileName = toolToRemove.getName();
                Path filePath = toolPathObj.resolve(fileName);
                Files.deleteIfExists(filePath);

                List<ToolFile> toolFiles = toolFileRepository.findByToolId(toolId);
                for (ToolFile toolFile : toolFiles) {
                    String fileDirPath = fullPath;
                    if (toolFile.getPath() != null && !toolFile.getPath().isEmpty()) {
                        fileDirPath = fileDirPath + File.separator + toolFile.getPath();
                    }
                    Path fileDirPathObj = Paths.get(fileDirPath);
                    String attachedFileName = toolFile.getFileName();
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

                File toolDir = toolPathObj.toFile();
                if (toolDir.exists() && toolDir.isDirectory()) {
                    File[] files = toolDir.listFiles();
                    if (files != null && files.length == 0) {
                        Files.delete(toolDir.toPath());
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete tool file: " + e.getMessage(), e);
            }
        }
        
        project.getTools().removeIf(t -> t.getId().equals(toolId));
        return projectRepository.save(project);
    }
    
    public void createProjectFile(Long projectId, String fileName, String content) throws IOException {
        Project project = getProjectById(projectId);
        String projectPath = project.getPath();
        
        if (projectPath == null || projectPath.isEmpty()) {
            throw new RuntimeException("Project path is not set");
        }
        
        Path filePath = Paths.get(projectPath, fileName);
        Files.writeString(filePath, content);
    }
}
