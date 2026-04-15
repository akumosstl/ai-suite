package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.*;
import io.github.akumosstl.agentic.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ExportImportService {

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private CommandRepository commandRepository;

    @Autowired
    private ScriptRepository scriptRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private InstructionRepository instructionRepository;

    public String exportData(Set<String> types) {
        StringBuilder sql = new StringBuilder();
        sql.append("-- AI Suite Export\n");
        sql.append("-- Generated: ").append(new java.util.Date()).append("\n\n");

        if (types.contains("agents")) {
            sql.append(exportAgents());
        }
        if (types.contains("skills")) {
            sql.append(exportSkills());
        }
        if (types.contains("commands")) {
            sql.append(exportCommands());
        }
        if (types.contains("scripts")) {
            sql.append(exportScripts());
        }
        if (types.contains("templates")) {
            sql.append(exportTemplates());
        }
        if (types.contains("tools")) {
            sql.append(exportTools());
        }
        if (types.contains("plugins")) {
            sql.append(exportPlugins());
        }
        if (types.contains("instructions")) {
            sql.append(exportInstructions());
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

    private String exportSkills() {
        StringBuilder sql = new StringBuilder();
        List<Skill> skills = skillRepository.findAll();
        
        if (skills.isEmpty()) {
            return sql.toString();
        }
        
        sql.append("-- Skills\n");
        sql.append("INSERT INTO skill (name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < skills.size(); i++) {
            Skill s = skills.get(i);
            sql.append("('").append(escape(s.getName())).append("', ");
            sql.append("'").append(escape(s.getNamespace())).append("', ");
            sql.append("'").append(escape(s.getCategory() != null ? s.getCategory() : "")).append("', ");
            sql.append("'").append(escape(s.getPath())).append("', ");
            sql.append("'").append(escape(s.getDescription())).append("', ");
            sql.append("'").append(escape(s.getInstructions())).append("', ");
            sql.append("NOW(), NOW())");
            if (i < skills.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportCommands() {
        StringBuilder sql = new StringBuilder();
        List<Command> commands = commandRepository.findAll();
        
        if (commands.isEmpty()) {
            return sql.toString();
        }
        
        sql.append("-- Commands\n");
        sql.append("INSERT INTO command (name, namespace, category, path, description, command, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < commands.size(); i++) {
            Command c = commands.get(i);
            sql.append("('").append(escape(c.getName())).append("', ");
            sql.append("'").append(escape(c.getNamespace())).append("', ");
            sql.append("'").append(escape(c.getCategory())).append("', ");
            sql.append("'").append(escape(c.getPath())).append("', ");
            sql.append("'").append(escape(c.getDescription())).append("', ");
            sql.append("'").append(escape(c.getCommand())).append("', ");
            sql.append("NOW(), NOW())");
            if (i < commands.size() - 1) {
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

    private String exportTools() {
        StringBuilder sql = new StringBuilder();
        List<io.github.akumosstl.agentic.backend.model.Tool> tools = toolRepository.findAll();
        
        if (tools.isEmpty()) {
            return sql.toString();
        }
        
        sql.append("-- Tools\n");
        sql.append("INSERT INTO tool (name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < tools.size(); i++) {
            io.github.akumosstl.agentic.backend.model.Tool t = tools.get(i);
            sql.append("('").append(escape(t.getName())).append("', ");
            sql.append("'").append(escape(t.getNamespace())).append("', ");
            sql.append("'").append(escape(t.getCategory())).append("', ");
            sql.append("'").append(escape(t.getPath())).append("', ");
            sql.append("'").append(escape(t.getDescription())).append("', ");
            sql.append("'").append(escape(t.getInstructions())).append("', ");
            sql.append("NOW(), NOW())");
            if (i < tools.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportPlugins() {
        StringBuilder sql = new StringBuilder();
        List<io.github.akumosstl.agentic.backend.model.Plugin> plugins = pluginRepository.findAll();
        
        if (plugins.isEmpty()) {
            return sql.toString();
        }
        
        sql.append("-- Plugins\n");
        sql.append("INSERT INTO plugin (name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < plugins.size(); i++) {
            io.github.akumosstl.agentic.backend.model.Plugin p = plugins.get(i);
            sql.append("('").append(escape(p.getName())).append("', ");
            sql.append("'").append(escape(p.getNamespace())).append("', ");
            sql.append("'").append(escape(p.getCategory())).append("', ");
            sql.append("'").append(escape(p.getPath())).append("', ");
            sql.append("'").append(escape(p.getDescription())).append("', ");
            sql.append("'").append(escape(p.getInstructions())).append("', ");
            sql.append("NOW(), NOW())");
            if (i < plugins.size() - 1) {
                sql.append(",\n");
            } else {
                sql.append(";\n\n");
            }
        }
        
        return sql.toString();
    }

    private String exportInstructions() {
        StringBuilder sql = new StringBuilder();
        List<io.github.akumosstl.agentic.backend.model.Instruction> instructions = instructionRepository.findAll();
        
        if (instructions.isEmpty()) {
            return sql.toString();
        }
        
        sql.append("-- Instructions\n");
        sql.append("INSERT INTO instruction (name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < instructions.size(); i++) {
            io.github.akumosstl.agentic.backend.model.Instruction ins = instructions.get(i);
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
        if (statement.toUpperCase().contains("INSERT INTO AGENT")) {
            importAgents(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO SKILL")) {
            importSkills(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO COMMAND")) {
            importCommands(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO SCRIPT")) {
            importScripts(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO TEMPLATE")) {
            importTemplates(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO TOOL")) {
            importTools(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO PLUGIN")) {
            importPlugins(statement, result);
        } else if (statement.toUpperCase().contains("INSERT INTO INSTRUCTION")) {
            importInstructions(statement, result);
        }
    }

    private void importAgents(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 5) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            String category = unescape(row[2]);
            
            Optional<Agent> existing = agentRepository.findByNameAndCategory(name, category);
            if (existing.isPresent()) {
                result.addDetail("Agent", name, false, "Already exists with same name and category");
            } else {
                Agent agent = new Agent();
                agent.setName(name);
                agent.setNamespace(namespace);
                agent.setCategory(category);
                agent.setDescription(row.length > 3 ? unescape(row[3]) : null);
                agent.setPrompt(row.length > 4 ? unescape(row[4]) : null);
                agent.setPath(row.length > 5 ? unescape(row[5]) : null);
                agentRepository.save(agent);
                result.incrementImported();
                result.addDetail("Agent", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importSkills(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 3) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            
            Optional<Skill> existing = skillRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Skill", name, false, "Already exists with same name and namespace");
            } else {
                Skill skill = new Skill();
                skill.setName(name);
                skill.setNamespace(namespace);
                skill.setCategory(row.length > 2 ? unescape(row[2]) : null);
                skill.setPath(row.length > 3 ? unescape(row[3]) : null);
                skill.setDescription(row.length > 4 ? unescape(row[4]) : null);
                skill.setInstructions(row.length > 5 ? unescape(row[5]) : null);
                skillRepository.save(skill);
                result.incrementImported();
                result.addDetail("Skill", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importCommands(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 4) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            
            Optional<Command> existing = commandRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Command", name, false, "Already exists with same name and namespace");
            } else {
                Command command = new Command();
                command.setName(name);
                command.setNamespace(namespace);
                command.setCategory(row.length > 2 ? unescape(row[2]) : null);
                command.setPath(row.length > 3 ? unescape(row[3]) : null);
                command.setDescription(row.length > 4 ? unescape(row[4]) : null);
                command.setCommand(row.length > 5 ? unescape(row[5]) : null);
                commandRepository.save(command);
                result.incrementImported();
                result.addDetail("Command", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importScripts(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 4) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            
            Optional<Script> existing = scriptRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Script", name, false, "Already exists with same name and namespace");
            } else {
                Script script = new Script();
                script.setName(name);
                script.setNamespace(namespace);
                script.setCategory(row.length > 2 ? unescape(row[2]) : null);
                script.setPath(row.length > 3 ? unescape(row[3]) : null);
                script.setDescription(row.length > 4 ? unescape(row[4]) : null);
                script.setContent(row.length > 5 ? unescape(row[5]) : null);
                script.setScope(row.length > 6 ? unescape(row[6]) : "global");
                scriptRepository.save(script);
                result.incrementImported();
                result.addDetail("Script", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importTemplates(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 2) continue;
            
            String name = unescape(row[0]);
            String type = unescape(row[3]);
            
            Optional<Template> existing = templateRepository.findByNameAndType(name, type);
            if (existing.isPresent()) {
                result.addDetail("Template", name, false, "Already exists with same name and type");
            } else {
                Template template = new Template();
                template.setName(name);
                template.setDescription(row.length > 1 ? unescape(row[1]) : null);
                template.setTemplate(row.length > 2 ? unescape(row[2]) : null);
                template.setType(type);
                templateRepository.save(template);
                result.incrementImported();
                result.addDetail("Template", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importTools(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 3) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            
            Optional<io.github.akumosstl.agentic.backend.model.Tool> existing = toolRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Tool", name, false, "Already exists with same name and namespace");
            } else {
                io.github.akumosstl.agentic.backend.model.Tool tool = new io.github.akumosstl.agentic.backend.model.Tool();
                tool.setName(name);
                tool.setNamespace(namespace);
                tool.setCategory(row.length > 2 ? unescape(row[2]) : null);
                tool.setPath(row.length > 3 ? unescape(row[3]) : null);
                tool.setDescription(row.length > 4 ? unescape(row[4]) : null);
                tool.setInstructions(row.length > 5 ? unescape(row[5]) : null);
                toolRepository.save(tool);
                result.incrementImported();
                result.addDetail("Tool", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importPlugins(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 3) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            
            Optional<io.github.akumosstl.agentic.backend.model.Plugin> existing = pluginRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Plugin", name, false, "Already exists with same name and namespace");
            } else {
                io.github.akumosstl.agentic.backend.model.Plugin plugin = new io.github.akumosstl.agentic.backend.model.Plugin();
                plugin.setName(name);
                plugin.setNamespace(namespace);
                plugin.setCategory(row.length > 2 ? unescape(row[2]) : null);
                plugin.setPath(row.length > 3 ? unescape(row[3]) : null);
                plugin.setDescription(row.length > 4 ? unescape(row[4]) : null);
                plugin.setInstructions(row.length > 5 ? unescape(row[5]) : null);
                pluginRepository.save(plugin);
                result.incrementImported();
                result.addDetail("Plugin", name, true, "Imported successfully");
            }
            result.incrementTotal();
        }
    }

    private void importInstructions(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 3) continue;
            
            String name = unescape(row[0]);
            String namespace = unescape(row[1]);
            
            Optional<io.github.akumosstl.agentic.backend.model.Instruction> existing = instructionRepository.findByNameAndNamespace(name, namespace);
            if (existing.isPresent()) {
                result.addDetail("Instruction", name, false, "Already exists with same name and namespace");
            } else {
                io.github.akumosstl.agentic.backend.model.Instruction instruction = new io.github.akumosstl.agentic.backend.model.Instruction();
                instruction.setName(name);
                instruction.setNamespace(namespace);
                instruction.setCategory(row.length > 2 ? unescape(row[2]) : null);
                instruction.setPath(row.length > 3 ? unescape(row[3]) : null);
                instruction.setDescription(row.length > 4 ? unescape(row[4]) : null);
                instruction.setInstructions(row.length > 5 ? unescape(row[5]) : null);
                instructionRepository.save(instruction);
                result.incrementImported();
                result.addDetail("Instruction", name, true, "Imported successfully");
            }
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
        
        int start = 0;
        int parenCount = 0;
        boolean inQuotes = false;
        StringBuilder currentRow = new StringBuilder();
        
        for (int i = 0; i < valuesPart.length(); i++) {
            char c = valuesPart.charAt(i);
            
            if (c == '\'') {
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
            
            if (c == '\'') {
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
        if (value == null) return "";
        if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length() - 1);
        }
        return value.replace("''", "'").replace("\\n", "\n");
    }
}
