package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class SystemTools {

    @Value("${agentic.version:1.0.0}")
    private String agenticVersion;

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(getVersion());
        return tools;
    }

    private SyncToolSpecification getVersion() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_version")
                        .description("Get the current version of the Agentic backend system.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text("Agentic Backend Version: " + agenticVersion)))
                            .build();
                })
                .build();
    }
}