package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.*;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.ScriptRepository;
import io.github.akumosstl.agentic.backend.service.AgentService;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import io.github.akumosstl.agentic.backend.service.ScriptService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/namespaces")
@CrossOrigin(origins = "*")
public class NamespaceController {

    @Autowired
    private AgentService agentService;

    @Autowired
    private ScriptService scriptService;

    @Autowired
    private PipelineService pipelineService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private ScriptRepository scriptRepository;

    @GetMapping("/types")
    public ResponseEntity<List<String>> getTypes() {
        return ResponseEntity.ok(Arrays.asList("agents", "scripts"));
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

    @GetMapping("/{type}/{namespace}/export")
    public ResponseEntity<byte[]> exportNamespace(
            @PathVariable String type,
            @PathVariable String namespace) {

        StringBuilder sql = new StringBuilder();
        sql.append("-- Export for namespace: ").append(namespace).append(" (type: ").append(type).append(")\n");
        sql.append("-- Generated by Agentic AI Suite\n\n");

        switch (type) {
            case "agents":
                List<Agent> agents = agentService.getAgentsByNamespace(namespace);
                for (Agent agent : agents) {
                    sql.append("INSERT INTO agent (name, namespace, category, description, prompt, path) VALUES (");
                    sql.append(sqlEscape(agent.getName())).append(", ");
                    sql.append(sqlEscape(agent.getNamespace())).append(", ");
                    sql.append(sqlEscape(agent.getCategory())).append(", ");
                    sql.append(sqlEscape(agent.getDescription())).append(", ");
                    sql.append(sqlEscape(agent.getPrompt())).append(", ");
                    sql.append(sqlEscape(agent.getPath()));
                    sql.append(");\n");
                }
                break;
            case "scripts":
                List<Script> scripts = scriptService.getScriptsByNamespace(namespace);
                for (Script script : scripts) {
                    sql.append("INSERT INTO script (name, namespace, category, path, description, content, scope) VALUES (");
                    sql.append(sqlEscape(script.getName())).append(", ");
                    sql.append(sqlEscape(script.getNamespace())).append(", ");
                    sql.append(sqlEscape(script.getCategory())).append(", ");
                    sql.append(sqlEscape(script.getPath())).append(", ");
                    sql.append(sqlEscape(script.getDescription())).append(", ");
                    sql.append(sqlEscape(script.getContent())).append(", ");
                    sql.append(sqlEscape(script.getScope()));
                    sql.append(");\n");
                }
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        String fileName = namespace.replaceAll("[^a-zA-Z0-9\\-_]", "_") + "_" + type + ".sql";
        byte[] content = sql.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("application/sql"))
                .contentLength(content.length)
                .body(content);
    }

    @PostMapping("/import")
    @Transactional
    public ResponseEntity<ImportResult> importNamespace(@RequestBody ImportRequest request) {
        String sqlContent = request.getSqlContent();
        ImportResult result = new ImportResult();

        if (sqlContent == null || sqlContent.trim().isEmpty()) {
            result.setSuccess(false);
            result.setMessage("Empty SQL content");
            result.setErrors(List.of("SQL content is empty"));
            return ResponseEntity.badRequest().body(result);
        }

        String[] statements = sqlContent.split(";");
        List<String> errors = new ArrayList<>();
        List<String> imported = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        int lineNumber = 0;

        for (String rawStatement : statements) {
            String statement = stripComments(rawStatement).trim();
            if (statement.isEmpty()) {
                continue;
            }
            lineNumber++;

            String upperStatement = statement.toUpperCase().trim();
            if (!upperStatement.startsWith("INSERT INTO")) {
                errors.add("Line " + lineNumber + ": Only INSERT statements are allowed. Found: " + truncate(statement, 50));
                result.setSuccess(false);
                result.setMessage("Import failed - invalid SQL statements found");
                result.setErrors(errors);
                result.setImported(imported);
                result.setSkipped(skipped);
                return ResponseEntity.ok(result);
            }

            if (!upperStatement.startsWith("INSERT INTO AGENT") && !upperStatement.startsWith("INSERT INTO SCRIPT")) {
                errors.add("Line " + lineNumber + ": INSERT only allowed for 'agent' or 'script' tables. Found: " + truncate(statement, 80));
                result.setSuccess(false);
                result.setMessage("Import failed - INSERT statements only allowed for agent and script tables");
                result.setErrors(errors);
                result.setImported(imported);
                result.setSkipped(skipped);
                return ResponseEntity.ok(result);
            }

            try {
                if (upperStatement.startsWith("INSERT INTO AGENT")) {
                    Agent parsed = parseAgentInsert(statement);
                    Optional<Agent> existing = agentRepository.findByNameAndNamespace(parsed.getName(), parsed.getNamespace());
                    if (existing.isPresent()) {
                        skipped.add("Agent: " + parsed.getName() + " (namespace: " + parsed.getNamespace() + ") - already exists");
                    } else {
                        agentRepository.save(parsed);
                        imported.add("Agent: " + parsed.getName() + " (namespace: " + parsed.getNamespace() + ")");
                    }
                } else if (upperStatement.startsWith("INSERT INTO SCRIPT")) {
                    Script parsed = parseScriptInsert(statement);
                    Optional<Script> existing = scriptRepository.findByNameAndNamespace(parsed.getName(), parsed.getNamespace());
                    if (existing.isPresent()) {
                        skipped.add("Script: " + parsed.getName() + " (namespace: " + parsed.getNamespace() + ") - already exists");
                    } else {
                        scriptRepository.save(parsed);
                        imported.add("Script: " + parsed.getName() + " (namespace: " + parsed.getNamespace() + ")");
                    }
                }
            } catch (Exception e) {
                errors.add("Line " + lineNumber + ": Failed to parse/execute: " + e.getMessage());
                result.setSuccess(false);
                result.setMessage("Import failed - error processing statements");
                result.setErrors(errors);
                result.setImported(imported);
                result.setSkipped(skipped);
                return ResponseEntity.ok(result);
            }
        }

        result.setSuccess(true);
        result.setMessage("Import completed: " + imported.size() + " inserted, " + skipped.size() + " skipped, " + errors.size() + " errors");
        result.setErrors(errors);
        result.setImported(imported);
        result.setSkipped(skipped);
        return ResponseEntity.ok(result);
    }

    private String sqlEscape(String value) {
        if (value == null) return "NULL";
        return "'" + value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t") + "'";
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "NULL";
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }

    private String stripComments(String sql) {
        StringBuilder sb = new StringBuilder();
        for (String line : sql.split("\n")) {
            String trimmed = line.trim();
            if (!trimmed.startsWith("--")) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString().trim();
    }

    private Agent parseAgentInsert(String statement) {
        String valuesPart = extractValuesPart(statement);
        List<String> values = parseValues(valuesPart);
        Agent agent = new Agent();
        agent.setName(sqlUnescape(values.get(0)));
        agent.setNamespace(values.size() > 1 ? sqlUnescape(values.get(1)) : "");
        agent.setCategory(values.size() > 2 ? sqlUnescape(values.get(2)) : null);
        agent.setDescription(values.size() > 3 ? sqlUnescape(values.get(3)) : null);
        agent.setPrompt(values.size() > 4 ? sqlUnescape(values.get(4)) : null);
        agent.setPath(values.size() > 5 ? sqlUnescape(values.get(5)) : null);
        return agent;
    }

    private Script parseScriptInsert(String statement) {
        String valuesPart = extractValuesPart(statement);
        List<String> values = parseValues(valuesPart);
        Script script = new Script();
        script.setName(sqlUnescape(values.get(0)));
        script.setNamespace(values.size() > 1 ? sqlUnescape(values.get(1)) : "");
        script.setCategory(values.size() > 2 ? sqlUnescape(values.get(2)) : null);
        script.setPath(values.size() > 3 ? sqlUnescape(values.get(3)) : null);
        script.setDescription(values.size() > 4 ? sqlUnescape(values.get(4)) : null);
        script.setContent(values.size() > 5 ? sqlUnescape(values.get(5)) : null);
        script.setScope(values.size() > 6 ? sqlUnescape(values.get(6)) : "global");
        return script;
    }

    private String extractValuesPart(String statement) {
        int valuesIdx = statement.toUpperCase().indexOf("VALUES");
        if (valuesIdx < 0) throw new IllegalArgumentException("No VALUES clause found");
        String afterValues = statement.substring(valuesIdx + 6).trim();
        if (!afterValues.startsWith("(")) throw new IllegalArgumentException("Expected '(' after VALUES");
        int closeIdx = afterValues.lastIndexOf(')');
        if (closeIdx < 0) throw new IllegalArgumentException("Expected ')' to close VALUES");
        return afterValues.substring(1, closeIdx);
    }

    private List<String> parseValues(String valuesPart) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inString = false;
        boolean escape = false;
        boolean hadStringValue = false;

        for (int i = 0; i < valuesPart.length(); i++) {
            char c = valuesPart.charAt(i);
            if (escape) {
                if (c == 'n') current.append('\n');
                else if (c == 'r') current.append('\r');
                else if (c == 't') current.append('\t');
                else current.append(c);
                escape = false;
                continue;
            }
            if (c == '\\' && inString) {
                escape = true;
                continue;
            }
            if (c == '\'') {
                if (inString) {
                    inString = false;
                } else {
                    inString = true;
                    hadStringValue = true;
                }
                continue;
            }
            if (c == ',' && !inString) {
                values.add(resolveValue(current.toString().trim(), hadStringValue));
                current = new StringBuilder();
                hadStringValue = false;
                continue;
            }
            if (inString) {
                current.append(c);
            } else if (c != ' ' && c != '\t') {
                current.append(c);
            }
        }
        values.add(resolveValue(current.toString().trim(), hadStringValue));
        return values;
    }

    private String resolveValue(String raw, boolean hadStringValue) {
        if (hadStringValue) return raw;
        if (raw.isEmpty() || raw.equalsIgnoreCase("NULL")) return null;
        return raw;
    }

    private String sqlUnescape(String value) {
        if (value == null) return null;
        return value;
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

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getNamespace() {
            return namespace;
        }

        public void setNamespace(String namespace) {
            this.namespace = namespace;
        }

        public List<?> getItems() {
            return items;
        }

        public void setItems(List<?> items) {
            this.items = items;
        }

        public long getTotalCount() {
            return totalCount;
        }

        public void setTotalCount(long totalCount) {
            this.totalCount = totalCount;
        }
    }

    public static class ClearResult {
        private boolean success;
        private int deletedCount;
        private String message;

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public int getDeletedCount() {
            return deletedCount;
        }

        public void setDeletedCount(int deletedCount) {
            this.deletedCount = deletedCount;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class ImportResult {
        private boolean success;
        private String message;
        private List<String> errors = new ArrayList<>();
        private List<String> imported = new ArrayList<>();
        private List<String> skipped = new ArrayList<>();

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }

        public List<String> getImported() { return imported; }
        public void setImported(List<String> imported) { this.imported = imported; }

        public List<String> getSkipped() { return skipped; }
        public void setSkipped(List<String> skipped) { this.skipped = skipped; }
    }

    public static class ImportRequest {
        private String sqlContent;

        public String getSqlContent() { return sqlContent; }
        public void setSqlContent(String sqlContent) { this.sqlContent = sqlContent; }
    }
}