package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Template;
import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import io.github.akumosstl.agentic.backend.repository.ScriptRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import io.github.akumosstl.agentic.backend.repository.TemplateRepository;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BackupService {

    private static final String DB_PATH = System.getProperty("user.home") + "/.agentic/db/agentic_db";

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private ScriptRepository scriptRepository;

    @Autowired
    private InstructionRepository instructionRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    public String createBackup(String targetDirectory, String fileName) throws IOException {
        String finalFileName = fileName.endsWith(".sql") ? fileName : fileName + ".sql";

        if (!finalFileName.contains("/") && !finalFileName.contains("\\")) {
            if (targetDirectory.isEmpty()) {
                targetDirectory = System.getProperty("user.home");
            }
            finalFileName = targetDirectory + File.separator + finalFileName;
        }

        Path targetPath = Paths.get(finalFileName);
        Files.createDirectories(targetPath.getParent());

        String sqlContent = createFullBackup();
        Files.writeString(targetPath, sqlContent);

        return targetPath.toString();
    }

    /**
     * Creates a full database backup in memory and returns the SQL content.
     * This is used for direct download without saving to disk.
     */
    public String createFullBackup() {
        StringBuilder sql = new StringBuilder();
        sql.append("-- AI Suite Database Backup\n");
        sql.append("-- Generated: ").append(LocalDateTime.now()).append("\n\n");

        sql.append(exportAgents());
        sql.append(exportScripts());
        sql.append(exportInstructions());
        sql.append(exportTemplates());
        sql.append(exportProjects());
        sql.append(exportPipelines());
        sql.append(exportPipelineSteps());
        sql.append(exportPipelineRuns());

        return sql.toString();
    }

    private String exportAgents() {
        StringBuilder sql = new StringBuilder();
        List<Agent> agents = agentRepository.findAll();
        
        if (agents.isEmpty()) return "";
        
        sql.append("-- Agents\n");
        sql.append("INSERT INTO agent (id, name, namespace, category, description, prompt, path, created_at, updated_at) VALUES\n");

        for (int i = 0; i < agents.size(); i++) {
            Agent a = agents.get(i);
            sql.append("(").append(a.getId()).append(", ");
            sql.append("'").append(escape(a.getName())).append("', ");
            sql.append("'").append(escape(a.getNamespace())).append("', ");
            sql.append("'").append(escape(a.getCategory())).append("', ");
            sql.append("'").append(escape(a.getDescription())).append("', ");
            sql.append("'").append(escape(a.getPrompt())).append("', ");
            sql.append("'").append(escape(a.getPath())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < agents.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportScripts() {
        StringBuilder sql = new StringBuilder();
        List<Script> scripts = scriptRepository.findAll();
        
        if (scripts.isEmpty()) return "";
        
        sql.append("-- Scripts\n");
        sql.append("INSERT INTO script (id, name, namespace, category, path, description, content, scope, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < scripts.size(); i++) {
            Script s = scripts.get(i);
            sql.append("(").append(s.getId()).append(", ");
            sql.append("'").append(escape(s.getName())).append("', ");
            sql.append("'").append(escape(s.getNamespace())).append("', ");
            sql.append("'").append(escape(s.getCategory())).append("', ");
            sql.append("'").append(escape(s.getPath())).append("', ");
            sql.append("'").append(escape(s.getDescription())).append("', ");
            sql.append("'").append(escape(s.getContent())).append("', ");
            sql.append("'").append(escape(s.getScope())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < scripts.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportInstructions() {
        StringBuilder sql = new StringBuilder();
        List<Instruction> instructions = instructionRepository.findAll();
        
        if (instructions.isEmpty()) return "";
        
        sql.append("-- Instructions\n");
        sql.append("INSERT INTO instruction (id, name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < instructions.size(); i++) {
            Instruction ins = instructions.get(i);
            sql.append("(").append(ins.getId()).append(", ");
            sql.append("'").append(escape(ins.getName())).append("', ");
            sql.append("'").append(escape(ins.getNamespace())).append("', ");
            sql.append("'").append(escape(ins.getCategory())).append("', ");
            sql.append("'").append(escape(ins.getPath())).append("', ");
            sql.append("'").append(escape(ins.getDescription())).append("', ");
            sql.append("'").append(escape(ins.getInstructions())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < instructions.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportTemplates() {
        StringBuilder sql = new StringBuilder();
        List<Template> templates = templateRepository.findAll();
        
        if (templates.isEmpty()) return "";
        
        sql.append("-- Templates\n");
        sql.append("INSERT INTO template (id, name, description, template, type, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < templates.size(); i++) {
            Template t = templates.get(i);
            sql.append("(").append(t.getId()).append(", ");
            sql.append("'").append(escape(t.getName())).append("', ");
            sql.append("'").append(escape(t.getDescription())).append("', ");
            sql.append("'").append(escape(t.getTemplate())).append("', ");
            sql.append("'").append(escape(t.getType())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < templates.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportProjects() {
        StringBuilder sql = new StringBuilder();
        List<Project> projects = projectRepository.findAll();
        
        if (projects.isEmpty()) return "";
        
        sql.append("-- Projects\n");
        sql.append("INSERT INTO project (id, name, description, path, target, target_id, status, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < projects.size(); i++) {
            Project p = projects.get(i);
            sql.append("(").append(p.getId()).append(", ");
            sql.append("'").append(escape(p.getName())).append("', ");
            sql.append("'").append(escape(p.getDescription())).append("', ");
            sql.append("'").append(escape(p.getPath())).append("', ");
            sql.append("'").append(escape(p.getTarget())).append("', ");
            sql.append(p.getTargetId() != null ? p.getTargetId() : "NULL").append(", ");
            sql.append("'").append(escape(p.getStatus())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < projects.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportPipelines() {
        StringBuilder sql = new StringBuilder();
        List<Pipeline> pipelines = pipelineRepository.findAll();
        
        if (pipelines.isEmpty()) return "";
        
        sql.append("-- Pipelines\n");
        sql.append("INSERT INTO pipeline (id, name, description, status, project_id, output_extension, type, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < pipelines.size(); i++) {
            Pipeline p = pipelines.get(i);
            sql.append("(").append(p.getId()).append(", ");
            sql.append("'").append(escape(p.getName())).append("', ");
            sql.append("'").append(escape(p.getDescription())).append("', ");
            sql.append("'").append(escape(p.getStatus())).append("', ");
            sql.append(p.getProject() != null ? p.getProject().getId() : "NULL").append(", ");
            sql.append("'").append(escape(p.getOutputExtension())).append("', ");
            sql.append("'").append(escape(p.getType())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < pipelines.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportPipelineSteps() {
        StringBuilder sql = new StringBuilder();
        List<PipelineStep> steps = pipelineStepRepository.findAll();
        
        if (steps.isEmpty()) return "";
        
        sql.append("-- Pipeline Steps\n");
        sql.append("INSERT INTO pipeline_step (id, pipeline_id, agent_id, script_id, step_order, status, input_content, input_type, output_content, output_type, cli, parameters, arguments, type, runtime, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < steps.size(); i++) {
            PipelineStep s = steps.get(i);
            sql.append("(").append(s.getId()).append(", ");
            sql.append(s.getPipeline() != null ? s.getPipeline().getId() : "NULL").append(", ");
            sql.append(s.getAgent() != null ? s.getAgent().getId() : "NULL").append(", ");
            sql.append(s.getScript() != null ? s.getScript().getId() : "NULL").append(", ");
            sql.append(s.getStepOrder() != null ? s.getStepOrder() : 0).append(", ");
            sql.append("'").append(escape(s.getStatus())).append("', ");
            sql.append("'").append(escape(s.getInputContent())).append("', ");
            sql.append("'").append(escape(s.getInputType())).append("', ");
            sql.append("'").append(escape(s.getOutputContent())).append("', ");
            sql.append("'").append(escape(s.getOutputType())).append("', ");
            sql.append("'").append(escape(s.getCli())).append("', ");
            sql.append("'").append(escape(s.getParameters())).append("', ");
            sql.append("'").append(escape(s.getArguments())).append("', ");
            sql.append("'").append(escape(s.getType())).append("', ");
            sql.append("'").append(escape(s.getRuntime())).append("', ");
            sql.append("CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            if (i < steps.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportPipelineRuns() {
        StringBuilder sql = new StringBuilder();
        List<PipelineRun> runs = pipelineRunRepository.findAll();
        
        if (runs.isEmpty()) return "";
        
        sql.append("-- Pipeline Runs\n");
        sql.append("INSERT INTO pipeline_run (id, pipeline_id, status, started_at, completed_at, created_at) VALUES\n");
        
        for (int i = 0; i < runs.size(); i++) {
            PipelineRun r = runs.get(i);
            sql.append("(").append(r.getId()).append(", ");
            sql.append(r.getPipeline() != null ? r.getPipeline().getId() : "NULL").append(", ");
            sql.append("'").append(escape(r.getStatus())).append("', ");
            sql.append(r.getStartedAt() != null ? "CURRENT_TIMESTAMP" : "NULL").append(", ");
            sql.append(r.getCompletedAt() != null ? "CURRENT_TIMESTAMP" : "NULL").append(", ");
            sql.append("CURRENT_TIMESTAMP)");
            if (i < runs.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("'", "''").replace("\n", "\\n").replace("\r", "");
    }
}