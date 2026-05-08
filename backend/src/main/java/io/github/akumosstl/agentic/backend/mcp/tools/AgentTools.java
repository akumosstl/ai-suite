package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.service.AgentService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class AgentTools {

    private final AgentService agentService;

    @Autowired
    public AgentTools(AgentService agentService) {
        this.agentService = agentService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listAgents());
        tools.add(getAgent());
        tools.add(createAgent());
        tools.add(updateAgent());
        tools.add(deleteAgent());
        tools.add(searchAgents());
        tools.add(getAgentNamespaces());
        return tools;
    }

    private SyncToolSpecification listAgents() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_agents")
                        .description("List all agents in the system.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<Agent> agents = agentService.getTop10RecentAgents();
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatAgentsList(agents))))
                            .build();
                })
                .build();
    }

    private SyncToolSpecification getAgent() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_agent")
                        .description("Get detailed information about a specific agent by ID, including its prompt.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Agent ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Agent agent = agentService.getAgentById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatAgent(agent))))
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

    private SyncToolSpecification createAgent() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_agent")
                        .description("Create a new agent.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "name", Map.of("type", "string", "description", "Agent name (required)"),
                                "namespace", Map.of("type", "string", "description", "Agent namespace"),
                                "category", Map.of("type", "string", "description", "Agent category"),
                                "description", Map.of("type", "string", "description", "Agent description"),
                                "prompt", Map.of("type", "string", "description", "Agent instruction prompt"),
                                "path", Map.of("type", "string", "description", "Agent file path")
                        ), List.of("name")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Agent agent = new Agent();
                        agent.setName((String) request.arguments().get("name"));
                        agent.setNamespace((String) request.arguments().get("namespace"));
                        agent.setCategory((String) request.arguments().get("category"));
                        agent.setDescription((String) request.arguments().get("description"));
                        agent.setPrompt((String) request.arguments().get("prompt"));
                        agent.setPath((String) request.arguments().get("path"));
                        Agent created = agentService.createAgent(agent);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Agent created successfully.\n\n" + McpResponseFormatter.formatAgent(created))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating agent: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification updateAgent() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("update_agent")
                        .description("Update an existing agent.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Agent ID (required)"),
                                "name", Map.of("type", "string", "description", "Agent name"),
                                "namespace", Map.of("type", "string", "description", "Agent namespace"),
                                "category", Map.of("type", "string", "description", "Agent category"),
                                "description", Map.of("type", "string", "description", "Agent description"),
                                "prompt", Map.of("type", "string", "description", "Agent instruction prompt"),
                                "path", Map.of("type", "string", "description", "Agent file path")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Agent details = new Agent();
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
                        if (request.arguments().get("prompt") != null) {
                            details.setPrompt((String) request.arguments().get("prompt"));
                        }
                        if (request.arguments().get("path") != null) {
                            details.setPath((String) request.arguments().get("path"));
                        }
                        Agent updated = agentService.updateAgent(id, details);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Agent updated successfully.\n\n" + McpResponseFormatter.formatAgent(updated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error updating agent: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification deleteAgent() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_agent")
                        .description("Delete an agent by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Agent ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        agentService.deleteAgent(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Agent " + id + " deleted successfully.")))
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

    private SyncToolSpecification searchAgents() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("search_agents")
                        .description("Search agents by name or namespace.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "searchTerm", Map.of("type", "string", "description", "Search term (required)"),
                                "namespace", Map.of("type", "string", "description", "Filter by namespace (optional)")
                        ), List.of("searchTerm")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String searchTerm = (String) request.arguments().get("searchTerm");
                        String namespace = (String) request.arguments().get("namespace");
                        List<Agent> agents = agentService.searchAgents(searchTerm, namespace, 0, 50);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatAgentsList(agents))))
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

    private SyncToolSpecification getAgentNamespaces() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_agent_namespaces")
                        .description("Get all distinct agent namespaces.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<String> namespaces = agentService.getDistinctNamespaces();
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text("Agent Namespaces: " + String.join(", ", namespaces))))
                            .build();
                })
                .build();
    }
}
