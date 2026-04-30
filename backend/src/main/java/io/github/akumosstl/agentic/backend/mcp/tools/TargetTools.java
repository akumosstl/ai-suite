package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.service.TargetService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class TargetTools {

    private final TargetService targetService;

    @Autowired
    public TargetTools(TargetService targetService) {
        this.targetService = targetService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listTargets());
        tools.add(getTarget());
        tools.add(createTarget());
        tools.add(updateTarget());
        tools.add(deleteTarget());
        return tools;
    }

    private SyncToolSpecification listTargets() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_targets")
                        .description("List all targets in the system.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<Target> targets = targetService.getAllTargets();
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatTargetsList(targets))))
                            .build();
                })
                .build();
    }

    private SyncToolSpecification getTarget() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_target")
                        .description("Get detailed information about a specific target by ID or name.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Target ID"),
                                "name", Map.of("type", "string", "description", "Target name (alternative to ID)")
                        )))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Target target;
                        if (request.arguments().get("id") != null) {
                            Long id = ((Number) request.arguments().get("id")).longValue();
                            target = targetService.getTargetById(id);
                        } else if (request.arguments().get("name") != null) {
                            String name = (String) request.arguments().get("name");
                            target = targetService.getTargetByName(name);
                        } else {
                            return McpSchema.CallToolResult.builder()
                                    .content(List.of(McpResponseFormatter.text("Error: Provide either 'id' or 'name' parameter.")))
                                    .isError(true)
                                    .build();
                        }
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatTarget(target))))
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

    private SyncToolSpecification createTarget() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_target")
                        .description("Create a new target configuration.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "name", Map.of("type", "string", "description", "Target name (required, must be unique)"),
                                "agentsPath", Map.of("type", "string", "description", "Path to agents directory"),
                                "scriptsPath", Map.of("type", "string", "description", "Path to scripts directory"),
                                "instructionsPath", Map.of("type", "string", "description", "Path to instructions directory"),
                                "cli", Map.of("type", "string", "description", "CLI command")
                        ), List.of("name")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Target target = new Target();
                        target.setName((String) request.arguments().get("name"));
                        target.setAgentsPath((String) request.arguments().get("agentsPath"));
                        target.setScriptsPath((String) request.arguments().get("scriptsPath"));
                        target.setInstructionsPath((String) request.arguments().get("instructionsPath"));
                        target.setCli((String) request.arguments().get("cli"));
                        Target created = targetService.createTarget(target);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Target created successfully.\n\n" + McpResponseFormatter.formatTarget(created))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating target: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification updateTarget() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("update_target")
                        .description("Update an existing target configuration.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Target ID (required)"),
                                "name", Map.of("type", "string", "description", "Target name"),
                                "agentsPath", Map.of("type", "string", "description", "Path to agents directory"),
                                "scriptsPath", Map.of("type", "string", "description", "Path to scripts directory"),
                                "instructionsPath", Map.of("type", "string", "description", "Path to instructions directory"),
                                "cli", Map.of("type", "string", "description", "CLI command")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Target details = new Target();
                        if (request.arguments().get("name") != null) {
                            details.setName((String) request.arguments().get("name"));
                        }
                        if (request.arguments().get("agentsPath") != null) {
                            details.setAgentsPath((String) request.arguments().get("agentsPath"));
                        }
                        if (request.arguments().get("scriptsPath") != null) {
                            details.setScriptsPath((String) request.arguments().get("scriptsPath"));
                        }
                        if (request.arguments().get("instructionsPath") != null) {
                            details.setInstructionsPath((String) request.arguments().get("instructionsPath"));
                        }
                        if (request.arguments().get("cli") != null) {
                            details.setCli((String) request.arguments().get("cli"));
                        }
                        Target updated = targetService.updateTarget(id, details);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Target updated successfully.\n\n" + McpResponseFormatter.formatTarget(updated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error updating target: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification deleteTarget() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_target")
                        .description("Delete a target by ID. Will fail if the target is linked to projects.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Target ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        if (targetService.isTargetLinkedToProjects(id)) {
                            return McpSchema.CallToolResult.builder()
                                    .content(List.of(McpResponseFormatter.text("Cannot delete target " + id + ": it is linked to existing projects.")))
                                    .isError(true)
                                    .build();
                        }
                        targetService.deleteTarget(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Target " + id + " deleted successfully.")))
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
