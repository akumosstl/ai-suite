package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Template;
import io.github.akumosstl.agentic.backend.service.TemplateService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class TemplateTools {

    private final TemplateService templateService;

    @Autowired
    public TemplateTools(TemplateService templateService) {
        this.templateService = templateService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listTemplates());
        tools.add(getTemplate());
        tools.add(createTemplate());
        tools.add(updateTemplate());
        tools.add(deleteTemplate());
        return tools;
    }

    private SyncToolSpecification listTemplates() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_templates")
                        .description("List all templates. Optionally filter by type (agents, skills, commands, scripts).")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "type", Map.of("type", "string", "description", "Template type filter (agents, skills, commands, scripts)")
                        )))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        List<Template> templates;
                        if (request.arguments().get("type") != null) {
                            String type = (String) request.arguments().get("type");
                            templates = templateService.getTemplatesByType(type);
                        } else {
                            templates = templateService.getRecentTemplates(0, 50);
                        }
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatTemplatesList(templates))))
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

    private SyncToolSpecification getTemplate() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_template")
                        .description("Get detailed information about a specific template by ID, including its content.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Template ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Template template = templateService.getTemplateById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatTemplate(template))))
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

    private SyncToolSpecification createTemplate() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_template")
                        .description("Create a new template.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "name", Map.of("type", "string", "description", "Template name (required)"),
                                "type", Map.of("type", "string", "description", "Template type (agents, skills, commands, scripts) (required)"),
                                "description", Map.of("type", "string", "description", "Template description"),
                                "template", Map.of("type", "string", "description", "Template content")
                        ), List.of("name", "type")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Template template = new Template();
                        template.setName((String) request.arguments().get("name"));
                        template.setType((String) request.arguments().get("type"));
                        template.setDescription((String) request.arguments().get("description"));
                        template.setTemplate((String) request.arguments().get("template"));
                        Template created = templateService.createTemplate(template);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Template created successfully.\n\n" + McpResponseFormatter.formatTemplate(created))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating template: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification updateTemplate() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("update_template")
                        .description("Update an existing template.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Template ID (required)"),
                                "name", Map.of("type", "string", "description", "Template name"),
                                "type", Map.of("type", "string", "description", "Template type"),
                                "description", Map.of("type", "string", "description", "Template description"),
                                "template", Map.of("type", "string", "description", "Template content")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Template details = new Template();
                        if (request.arguments().get("name") != null) {
                            details.setName((String) request.arguments().get("name"));
                        }
                        if (request.arguments().get("type") != null) {
                            details.setType((String) request.arguments().get("type"));
                        }
                        if (request.arguments().get("description") != null) {
                            details.setDescription((String) request.arguments().get("description"));
                        }
                        if (request.arguments().get("template") != null) {
                            details.setTemplate((String) request.arguments().get("template"));
                        }
                        Template updated = templateService.updateTemplate(id, details);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Template updated successfully.\n\n" + McpResponseFormatter.formatTemplate(updated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error updating template: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification deleteTemplate() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_template")
                        .description("Delete a template by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Template ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        templateService.deleteTemplate(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Template " + id + " deleted successfully.")))
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
}
