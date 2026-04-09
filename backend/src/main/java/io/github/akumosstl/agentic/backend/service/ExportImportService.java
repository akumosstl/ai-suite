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

        return sql.toString();
    }

    private String exportAgents() {
        StringBuilder sql = new StringBuilder();
        List<Agent> agents = agentRepository.findAll();
        
        sql.append("-- Agents\n");
        sql.append("INSERT INTO agent (name, category, description, prompt, scope, path, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < agents.size(); i++) {
            Agent a = agents.get(i);
            sql.append("('").append(escape(a.getName())).append("', ");
            sql.append("'").append(escape(a.getCategory())).append("', ");
            sql.append("'").append(escape(a.getDescription())).append("', ");
            sql.append("'").append(escape(a.getPrompt())).append("', ");
            sql.append("'").append(escape(a.getScope())).append("', ");
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
        
        sql.append("-- Skills\n");
        sql.append("INSERT INTO skill (name, namespace, category, path, description, instructions, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < skills.size(); i++) {
            Skill s = skills.get(i);
            sql.append("('").append(escape(s.getName())).append("', ");
            sql.append("'").append(escape(s.getNamespace())).append("', ");
            sql.append("'").append(escape(s.getCategory())).append("', ");
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
        
        sql.append("-- Commands\n");
        sql.append("INSERT INTO command (name, namespace, category, path, description, command, scope, created_at, updated_at) VALUES\n");
        
        for (int i = 0; i < commands.size(); i++) {
            Command c = commands.get(i);
            sql.append("('").append(escape(c.getName())).append("', ");
            sql.append("'").append(escape(c.getNamespace())).append("', ");
            sql.append("'").append(escape(c.getCategory())).append("', ");
            sql.append("'").append(escape(c.getPath())).append("', ");
            sql.append("'").append(escape(c.getDescription())).append("', ");
            sql.append("'").append(escape(c.getCommand())).append("', ");
            sql.append("'").append(escape(c.getScope())).append("', ");
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
        
        String[] statements = sqlContent.split(";");
        
        for (String statement : statements) {
            statement = statement.trim();
            if (statement.isEmpty() || statement.startsWith("--")) {
                continue;
            }
            
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
            }
        }
        
        return result;
    }

    private void importAgents(String statement, ImportResult result) {
        String valuesPart = extractValues(statement);
        if (valuesPart == null) return;
        
        List<String[]> rows = parseValues(valuesPart);
        for (String[] row : rows) {
            if (row.length < 5) continue;
            
            String name = unescape(row[0]);
            String category = unescape(row[1]);
            
            Optional<Agent> existing = agentRepository.findByNameAndCategory(name, category);
            if (existing.isPresent()) {
                result.addDetail("Agent", name, false, "Already exists with same name and category");
            } else {
                Agent agent = new Agent();
                agent.setName(name);
                agent.setCategory(category);
                agent.setDescription(row.length > 2 ? unescape(row[2]) : null);
                agent.setPrompt(row.length > 3 ? unescape(row[3]) : null);
                agent.setScope(row.length > 4 ? unescape(row[4]) : "global");
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
                command.setScope(row.length > 6 ? unescape(row[6]) : "global");
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

    private String extractValues(String statement) {
        int start = statement.toUpperCase().indexOf("VALUES");
        if (start == -1) return null;
        return statement.substring(start + 6).trim();
    }

    private List<String[]> parseValues(String valuesPart) {
        List<String[]> rows = new ArrayList<>();
        StringBuilder currentRow = new StringBuilder();
        boolean inQuote = false;
        boolean prevWasQuote = false;
        
        for (int i = 0; i < valuesPart.length(); i++) {
            char c = valuesPart.charAt(i);
            
            if (c == '\'' && !prevWasQuote) {
                inQuote = !inQuote;
                currentRow.append(c);
            } else if (c == '\'' && prevWasQuote) {
                currentRow.append(c);
                prevWasQuote = false;
            } else if (c == ',' && !inQuote) {
                String value = currentRow.toString().trim();
                if (value.startsWith("(") && value.endsWith(")")) {
                    value = value.substring(1, value.length() - 1);
                }
                rows.add(parseRow(value));
                currentRow = new StringBuilder();
            } else {
                currentRow.append(c);
                prevWasQuote = (c == '\'');
            }
        }
        
        if (currentRow.length() > 0) {
            String value = currentRow.toString().trim();
            if (value.startsWith("(") && value.endsWith(")")) {
                value = value.substring(1, value.length() - 1);
            }
            rows.add(parseRow(value));
        }
        
        return rows;
    }

    private String[] parseRow(String row) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuote = false;
        
        for (int i = 0; i < row.length(); i++) {
            char c = row.charAt(i);
            
            if (c == '\'') {
                inQuote = !inQuote;
                current.append(c);
            } else if (c == ',' && !inQuote) {
                values.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        values.add(current.toString().trim());
        
        return values.toArray(new String[0]);
    }

    private String unescape(String value) {
        if (value == null) return "";
        if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length() - 1);
        }
        return value.replace("''", "'").replace("\\n", "\n");
    }
}
