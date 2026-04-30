package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.service.BackupService;
import io.github.akumosstl.agentic.backend.service.ExportImportService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class SystemTools {

    private final ExportImportService exportImportService;
    private final BackupService backupService;

    @Value("${agentic.version:1.0.0}")
    private String agenticVersion;

    @Autowired
    public SystemTools(ExportImportService exportImportService,
                       BackupService backupService) {
        this.exportImportService = exportImportService;
        this.backupService = backupService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(getVersion());
        tools.add(exportData());
        tools.add(createBackup());
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

    private SyncToolSpecification exportData() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("export_data")
                        .description("Export all system data as SQL. Optionally specify which entity types to export.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "types", Map.of("type", "array", "items", Map.of("type", "string"),
                                        "description", "Entity types to export (e.g. [\"projects\", \"pipelines\", \"agents\"]). If not specified, exports all.")
                        )))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Set<String> types = null;
                        if (request.arguments().get("types") != null) {
                            @SuppressWarnings("unchecked")
                            List<String> typeList = (List<String>) request.arguments().get("types");
                            types = Set.copyOf(typeList);
                        }
                        String sql = exportImportService.exportData(types);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Data exported successfully.\n\n```sql\n" + sql + "\n```")))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error exporting data: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification createBackup() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_backup")
                        .description("Create a full backup of the database.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String result = backupService.createFullBackup();
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Backup created successfully: " + result)))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating backup: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }
}
