package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.service.ScriptService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ScriptTools {

    private final ScriptService scriptService;

    @Autowired
    public ScriptTools(ScriptService scriptService) {
        this.scriptService = scriptService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listScripts());
        tools.add(getScript());
        tools.add(createScript());
        tools.add(updateScript());
        tools.add(deleteScript());
        tools.add(searchScripts());
        tools.add(getScriptNamespaces());
        return tools;
    }

    private SyncToolSpecification listScripts() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_scripts")
                        .description("List all scripts in the system.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<Script> scripts = scriptService.getRecentScripts(0, 50);
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatScriptsList(scripts))))
                            .build();
                })
                .build();
    }

    private SyncToolSpecification getScript() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_script")
                        .description("Get detailed information about a specific script by ID, including its content.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Script ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Script script = scriptService.getScriptById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatScript(script))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification createScript() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_script")
                        .description("Create a new script.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "name", Map.of("type", "string", "description", "Script name (required)"),
                                "namespace", Map.of("type", "string", "description", "Script namespace"),
                                "category", Map.of("type", "string", "description", "Script category"),
                                "description", Map.of("type", "string", "description", "Script description"),
                                "content", Map.of("type", "string", "description", "Script content"),
                                "scope", Map.of("type", "string", "description", "Script scope (global or project, default: global)"),
                                "path", Map.of("type", "string", "description", "Script file path")
                        ), List.of("name")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Script script = new Script();
                        script.setName((String) request.arguments().get("name"));
                        script.setNamespace((String) request.arguments().get("namespace"));
                        script.setCategory((String) request.arguments().get("category"));
                        script.setDescription((String) request.arguments().get("description"));
                        script.setContent((String) request.arguments().get("content"));
                        script.setScope((String) request.arguments().get("scope"));
                        script.setPath((String) request.arguments().get("path"));
                        if (script.getScope() == null) {
                            script.setScope("global");
                        }
                        Script created = scriptService.createScript(script);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Script created successfully.\n\n" + McpResponseFormatter.formatScript(created))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating script: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification updateScript() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("update_script")
                        .description("Update an existing script.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Script ID (required)"),
                                "name", Map.of("type", "string", "description", "Script name"),
                                "namespace", Map.of("type", "string", "description", "Script namespace"),
                                "category", Map.of("type", "string", "description", "Script category"),
                                "description", Map.of("type", "string", "description", "Script description"),
                                "content", Map.of("type", "string", "description", "Script content"),
                                "scope", Map.of("type", "string", "description", "Script scope (global or project)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Script details = new Script();
                        if (request.arguments().get("name") != null) {
                            details.setName((String) request.arguments().get("name"));
                        }
                        if (request.arguments().get("namespace") != null) {
                            details.setNamespace((String) request.arguments().get("namespace"));
                        }
                        if (request.arguments().get("category") != null) {
                            details.setCategory((String) request.arguments().get("category"));
                        }
                        if (request.arguments().get("description") != null) {
                            details.setDescription((String) request.arguments().get("description"));
                        }
                        if (request.arguments().get("content") != null) {
                            details.setContent((String) request.arguments().get("content"));
                        }
                        if (request.arguments().get("scope") != null) {
                            details.setScope((String) request.arguments().get("scope"));
                        }
                        Script updated = scriptService.updateScript(id, details);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Script updated successfully.\n\n" + McpResponseFormatter.formatScript(updated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error updating script: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification deleteScript() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_script")
                        .description("Delete a script by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Script ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        scriptService.deleteScript(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Script " + id + " deleted successfully.")))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification searchScripts() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("search_scripts")
                        .description("Search scripts by name or namespace.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "searchTerm", Map.of("type", "string", "description", "Search term (required)"),
                                "namespace", Map.of("type", "string", "description", "Filter by namespace (optional)")
                        ), List.of("searchTerm")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String searchTerm = (String) request.arguments().get("searchTerm");
                        String namespace = (String) request.arguments().get("namespace");
                        List<Script> scripts = scriptService.searchScripts(searchTerm, namespace, 0, 50);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatScriptsList(scripts))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification getScriptNamespaces() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_script_namespaces")
                        .description("Get all distinct script namespaces.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<String> namespaces = scriptService.getDistinctNamespaces();
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text("Script Namespaces: " + String.join(", ", namespaces))))
                            .build();
                })
                .build();
    }
}
