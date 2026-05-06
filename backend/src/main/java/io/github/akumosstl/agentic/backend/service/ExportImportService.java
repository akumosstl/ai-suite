package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.model.Template;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
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

import java.util.*;

@Service
public class ExportImportService {

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

    public String exportData(Set<String> types) {
        StringBuilder sql = new StringBuilder();
        sql.append("-- AI Suite Export\n");
        sql.append("-- Generated: ").append(new java.util.Date()).append("\n\n");

        if (types.contains("agents")) {
            sql.append(exportAgents());
        }
        if (types.contains("scripts")) {
            sql.append(exportScripts());
        }
        if (types.contains("instructions")) {
            sql.append(exportInstructions());
        }
        if (types.contains("templates")) {
            sql.append(exportTemplates());
        }

        return sql.toString();
    }

    private String exportAgents() {
        StringBuilder sql = new StringBuilder();
        List<Agent> agents = agentRepository.findAll();

        if (agents.isEmpty()) {
            return sql.toString();
        }

        sql.append("-- Agents\n");
        sql.append("INSERT INTO agent (name, namespace, category, description, prompt, path, created_at, updated_at) VALUES\n");

        for (int i = 0; i < agents.size(); i++) {
            Agent a = agents.get(i);
            sql.append("('").append(escape(a.getName())).append("', ");
            sql.append("'").append(escape(a.getNamespace() != null ? a.getNamespace() : "")).append("', ");
            sql.append("'").append(escape(a.getCategory() != null ? a.getCategory() : "")).append("', ");
            sql.append("'").append(escape(a.getDescription())).append("', ");
            sql.append("'").append(escape(a.getPrompt())).append("', ");
            sql.append("'").append(escape(a.getPath())).append("', ");
            sql.append("NOW(), NOW())");
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

        if (scripts.isEmpty()) {
            return sql.toString();
        }

        sql.append("-- Scripts\n");
        sql.append("INSERT INTO script (name, namespace, category, path, description, content, scope, created_at, updated_at) VALUES\n");

        for (int i = 0; i < scripts.size(); i++) {
            Script s = scripts.get(i);
            sql.append("('").append(escape(s.getName())).append("', ");
            sql.append("'").append(escape(s.getNamespace())).append("', ");
            sql.append("'").append(escape(s.getCategory())).append("', ");
            sql.append("'").append(escape(s.getPath())).append("', ");
            sql.append("'").append(escape(s.getDescription())).append("', ");
            sql.append("'").append(escape(s.getContent())).append("', ");
            sql.append("'").append(escape(s.getScope())).append("', ");
            sql.append("NOW(), NOW())");
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

        if (instructions.isEmpty()) {
            return sql.toString();
        }

        sql.append("-- Instructions\n");
        sql.append("INSERT INTO instruction (name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");

        for (int i = 0; i < instructions.size(); i++) {
            Instruction ins = instructions.get(i);
            sql.append("('").append(escape(ins.getName())).append("', ");
            sql.append("'").append(escape(ins.getNamespace())).append("', ");
            sql.append("'").append(escape(ins.getCategory())).append("', ");
            sql.append("'").append(escape(ins.getPath())).append("', ");
            sql.append("'").append(escape(ins.getDescription())).append("', ");
            sql.append("'").append(escape(ins.getInstructions())).append("', ");
            sql.append("NOW(), NOW())");
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

        if (templates.isEmpty()) {
            return sql.toString();
        }

        sql.append("-- Templates\n");
        sql.append("INSERT INTO template (name, description, template, type, created_at, updated_at) VALUES\n");

        for (int i = 0; i < templates.size(); i++) {
            Template t = templates.get(i);
            sql.append("('").append(escape(t.getName())).append("', ");
            sql.append("'").append(escape(t.getDescription())).append("', ");
            sql.append("'").append(escape(t.getTemplate())).append("', ");
            sql.append("'").append(escape(t.getType())).append("', ");
            sql.append("NOW(), NOW())");
            if (i < templates.size() - 1) {
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

    public ImportResult importData(String sqlContent) {
        ImportResult result = new ImportResult();

        String[] lines = sqlContent.split("\n");
        StringBuilder currentStatement = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("--")) {
                continue;
            }

            currentStatement.append(" ").append(trimmed);

            if (trimmed.endsWith(";")) {
                String statement = currentStatement.toString().trim();
                processStatement(statement, result);
                currentStatement = new StringBuilder();
            }
        }

        return result;
    }

    private void processStatement(String statement, ImportResult result) {
        String upper = statement.toUpperCase();
        if (upper.contains("INSERT INTO PIPELINE_STEP")) {
            importPipelineSteps(statement, result);
        } else if (upper.contains("INSERT INTO PIPELINE_RUN")) {
            importPipelineRuns(statement, result);
        } else if (upper.contains("INSERT INTO PIPELINE")) {
            importPipelines(statement, result);
        } else if (upper.contains("INSERT INTO PROJECT")) {
            importProjects(statement, result);
        } else if (upper.contains("INSERT INTO AGENT")) {
            importAgents(statement, result);
        } else if (upper.contains("INSERT INTO SCRIPT")) {
            importScripts(statement, result);
        } else if (upper.contains("INSERT INTO INSTRUCTION")) {
            importInstructions(statement, result);
        } else if (upper.contains("INSERT INTO TEMPLATE")) {
            importTemplates(statement, result);
        }
    }

    private List<String> extractColumns(String statement) {
        int colStart = statement.indexOf('(');
        int colEnd = statement.indexOf(')', colStart);
        if (colStart == -1 || colEnd == -1) return Collections.emptyList();

        String colPart = statement.substring(colStart + 1, colEnd);
        List<String> columns = new ArrayList<>();
        for (String col : colPart.split(",")) {
            columns.add(col.trim().toLowerCase());
        }
        return columns;
    }

    private Map<String, Integer> buildColumnIndex(List<String> columns) {
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < columns.size(); i++) {
            index.put(columns.get(i), i);
        }
        return index;
    }

    private String getVal(String[] row, Map<String, Integer> colIndex, String colName) {
        Integer idx = colIndex.get(colName);
        if (idx == null || idx >= row.length) return null;
        return unescape(row[idx]);
    }

    private String getValRaw(String[] row, Map<String, Integer> colIndex, String colName) {
        Integer idx = colIndex.get(colName);
        if (idx == null || idx >= row.length) return null;
        return row[idx].trim();
    }

    private Long getValLong(String[] row, Map<String, Integer> colIndex, String colName) {
        String raw = getValRaw(row, colIndex, colName);
        if (raw == null || raw.equalsIgnoreCase("NULL") || raw.isEmpty()) return null;
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer getValInt(String[] row, Map<String, Integer> colIndex, String colName) {
        String raw = getValRaw(row, colIndex, colName);
        if (raw == null || raw.equalsIgnoreCase("NULL") || raw.isEmpty()) return null;
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void importAgents(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            String name = getVal(row, colIndex, "name");
            if (name == null || name.isEmpty()) continue;

            String category = getVal(row, colIndex, "category");
            String namespace = getVal(row, colIndex, "namespace");

            Optional<Agent> existing = agentRepository.findByNameAndCategory(name, category);
            if (existing.isPresent()) {
                result.addDetail("Agent", name, false, "Already exists with same name and category");
            } else {
                Agent agent = new Agent();
                agent.setName(name);
                agent.setNamespace(namespace);
                agent.setCategory(category);
                agent.setDescription(getVal(row, colIndex, "description"));
                agent.setPrompt(getVal(row, colIndex, "prompt"));
                agent.setPath(getVal(row, colIndex, "path"));
                agentRepository.save(agent);
                result.incrementImported();
                result.addDetail("Agent", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importScripts(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            String name = getVal(row, colIndex, "name");
            if (name == null || name.isEmpty()) continue;

            String namespace = getVal(row, colIndex, "namespace");

            Optional<Script> existing = scriptRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Script", name, false, "Already exists with same name and namespace");
            } else {
                Script script = new Script();
                script.setName(name);
                script.setNamespace(namespace != null ? namespace : "");
                script.setCategory(getVal(row, colIndex, "category"));
                script.setPath(getVal(row, colIndex, "path"));
                script.setDescription(getVal(row, colIndex, "description"));
                script.setContent(getVal(row, colIndex, "content"));
                script.setScope(getVal(row, colIndex, "scope") != null ? getVal(row, colIndex, "scope") : "global");
                scriptRepository.save(script);
                result.incrementImported();
                result.addDetail("Script", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importInstructions(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            String name = getVal(row, colIndex, "name");
            if (name == null || name.isEmpty()) continue;

            String namespace = getVal(row, colIndex, "namespace");

            Optional<Instruction> existing = instructionRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Instruction", name, false, "Already exists with same name and namespace");
            } else {
                Instruction instruction = new Instruction();
                instruction.setName(name);
                instruction.setNamespace(namespace != null ? namespace : "");
                instruction.setCategory(getVal(row, colIndex, "category"));
                instruction.setPath(getVal(row, colIndex, "path"));
                instruction.setDescription(getVal(row, colIndex, "description"));
                instruction.setInstructions(getVal(row, colIndex, "instructions"));
                instructionRepository.save(instruction);
                result.incrementImported();
                result.addDetail("Instruction", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importTemplates(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            String name = getVal(row, colIndex, "name");
            if (name == null || name.isEmpty()) continue;

            String type = getVal(row, colIndex, "type");

            Optional<Template> existing = templateRepository.findByNameAndType(name, type);
            if (existing.isPresent()) {
                result.addDetail("Template", name, false, "Already exists with same name and type");
            } else {
                Template template = new Template();
                template.setName(name);
                template.setDescription(getVal(row, colIndex, "description"));
                template.setTemplate(getVal(row, colIndex, "template"));
                template.setType(type != null ? type : "");
                templateRepository.save(template);
                result.incrementImported();
                result.addDetail("Template", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importProjects(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            String name = getVal(row, colIndex, "name");
            if (name == null || name.isEmpty()) continue;

            Project project = new Project();
            project.setName(name);
            project.setDescription(getVal(row, colIndex, "description"));
            project.setPath(getVal(row, colIndex, "path"));
            project.setTarget(getVal(row, colIndex, "target"));
            project.setTargetId(getValLong(row, colIndex, "target_id"));
            project.setStatus(getVal(row, colIndex, "status") != null ? getVal(row, colIndex, "status") : "active");
            projectRepository.save(project);
            result.incrementImported();
            result.addDetail("Project", name, true, "Imported successfully");
            result.incrementTotal();
        }
    }

    private void importPipelines(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            String name = getVal(row, colIndex, "name");
            if (name == null || name.isEmpty()) continue;

            Long projectId = getValLong(row, colIndex, "project_id");
            if (projectId == null) {
                result.addDetail("Pipeline", name, false, "No project_id found");
                result.incrementTotal();
                continue;
            }

            Optional<Project> projectOpt = projectRepository.findById(projectId);
            if (projectOpt.isEmpty()) {
                result.addDetail("Pipeline", name, false, "Project not found with id " + projectId);
                result.incrementTotal();
                continue;
            }

            Pipeline pipeline = new Pipeline();
            pipeline.setName(name);
            pipeline.setProject(projectOpt.get());
            pipeline.setDescription(getVal(row, colIndex, "description"));
            pipeline.setStatus(getVal(row, colIndex, "status") != null ? getVal(row, colIndex, "status") : "pending");
            pipeline.setOutputExtension(getVal(row, colIndex, "output_extension"));
            pipeline.setType(getVal(row, colIndex, "type"));
            pipelineRepository.save(pipeline);
            result.incrementImported();
            result.addDetail("Pipeline", name, true, "Imported successfully");
            result.incrementTotal();
        }
    }

    private void importPipelineSteps(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            Long pipelineId = getValLong(row, colIndex, "pipeline_id");
            if (pipelineId == null) {
                result.addDetail("PipelineStep", "unknown", false, "No pipeline_id found");
                result.incrementTotal();
                continue;
            }

            Optional<Pipeline> pipelineOpt = pipelineRepository.findById(pipelineId);
            if (pipelineOpt.isEmpty()) {
                result.addDetail("PipelineStep", "pipeline:" + pipelineId, false, "Pipeline not found with id " + pipelineId);
                result.incrementTotal();
                continue;
            }

            PipelineStep step = new PipelineStep();
            step.setPipeline(pipelineOpt.get());
            step.setStepOrder(getValInt(row, colIndex, "step_order") != null ? getValInt(row, colIndex, "step_order") : 0);
            step.setStatus(getVal(row, colIndex, "status") != null ? getVal(row, colIndex, "status") : "pending");

            Long agentId = getValLong(row, colIndex, "agent_id");
            if (agentId != null) {
                agentRepository.findById(agentId).ifPresent(step::setAgent);
            }

            Long scriptId = getValLong(row, colIndex, "script_id");
            if (scriptId != null) {
                scriptRepository.findById(scriptId).ifPresent(step::setScript);
            }

            step.setInputContent(getVal(row, colIndex, "input_content"));
            step.setInputType(getVal(row, colIndex, "input_type"));
            step.setOutputContent(getVal(row, colIndex, "output_content"));
            step.setOutputType(getVal(row, colIndex, "output_type"));
            step.setCli(getVal(row, colIndex, "cli"));
            step.setParameters(getVal(row, colIndex, "parameters"));
            step.setArguments(getVal(row, colIndex, "arguments"));
            step.setType(getVal(row, colIndex, "type"));
            step.setRuntime(getVal(row, colIndex, "runtime"));

            pipelineStepRepository.save(step);
            result.incrementImported();
            result.addDetail("PipelineStep", "step " + step.getStepOrder(), true, "Imported successfully");
            result.incrementTotal();
        }
    }

    private void importPipelineRuns(String statement, ImportResult result) {
        List<String> columns = extractColumns(statement);
        Map<String, Integer> colIndex = buildColumnIndex(columns);

        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;

        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            Long pipelineId = getValLong(row, colIndex, "pipeline_id");
            if (pipelineId == null) {
                result.addDetail("PipelineRun", "unknown", false, "No pipeline_id found");
                result.incrementTotal();
                continue;
            }

            Optional<Pipeline> pipelineOpt = pipelineRepository.findById(pipelineId);
            if (pipelineOpt.isEmpty()) {
                result.addDetail("PipelineRun", "pipeline:" + pipelineId, false, "Pipeline not found with id " + pipelineId);
                result.incrementTotal();
                continue;
            }

            PipelineRun run = new PipelineRun();
            run.setPipeline(pipelineOpt.get());
            run.setStatus(getVal(row, colIndex, "status") != null ? getVal(row, colIndex, "status") : "completed");

            pipelineRunRepository.save(run);
            result.incrementImported();
            result.addDetail("PipelineRun", "run " + run.getId(), true, "Imported successfully");
            result.incrementTotal();
        }
    }

    private String extractValues(String statement) {
        int start = statement.toUpperCase().indexOf("VALUES");
        if (start == -1) return null;
        return statement.substring(start + 6).trim();
    }

    private List<String[]> parseValues(String valuesPart) {
        List<String[]> rows = new ArrayList<>();
        valuesPart = valuesPart.trim();

        int parenCount = 0;
        boolean inQuotes = false;
        StringBuilder currentRow = new StringBuilder();

        for (int i = 0; i < valuesPart.length(); i++) {
            char c = valuesPart.charAt(i);

            if (c == '\'' && (i == 0 || valuesPart.charAt(i - 1) != '\\')) {
                inQuotes = !inQuotes;
            }

            if (!inQuotes) {
                if (c == '(') {
                    if (parenCount == 0 && currentRow.length() > 0) {
                        currentRow.setLength(0);
                    }
                    parenCount++;
                } else if (c == ')') {
                    parenCount--;
                }

                if (parenCount == 0 && currentRow.length() > 0) {
                    String rowStr = currentRow.toString().trim();
                    if (rowStr.startsWith("(") && rowStr.endsWith(")")) {
                        rowStr = rowStr.substring(1, rowStr.length() - 1);
                    }
                    String[] columns = splitByCommaOutsideQuotes(rowStr);
                    rows.add(columns);
                    currentRow.setLength(0);
                    continue;
                }
            }

            currentRow.append(c);
        }

        return rows;
    }

    private String[] splitByCommaOutsideQuotes(String value) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);

            if (c == '\'' && (i == 0 || value.charAt(i - 1) != '\\')) {
                inQuotes = !inQuotes;
                current.append(c);
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }

        if (current.length() > 0) {
            result.add(current.toString().trim());
        }

        return result.toArray(new String[0]);
    }

    private String unescape(String value) {
        if (value == null) return null;
        if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
            value = value.substring(1, value.length() - 1);
        }
        return value.replace("''", "'").replace("\\n", "\n");
    }
}
