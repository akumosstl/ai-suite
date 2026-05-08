package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.service.PipelineRunService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class PipelineRunTools {

    private final PipelineRunService pipelineRunService;

    @Autowired
    public PipelineRunTools(PipelineRunService pipelineRunService) {
        this.pipelineRunService = pipelineRunService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listPipelineRuns());
        tools.add(listAllPipelineRuns());
        tools.add(getPipelineRun());
        tools.add(deletePipelineRun());
        tools.add(deleteNonRunningRuns());
        return tools;
    }

    private SyncToolSpecification listPipelineRuns() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_pipeline_runs")
                        .description("List pipeline runs for a specific pipeline.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "pipelineId", Map.of("type", "integer", "description", "Pipeline ID (required)")
                        ), List.of("pipelineId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long pipelineId = ((Number) request.arguments().get("pipelineId")).longValue();
                        List<PipelineRun> runs = pipelineRunService.getTop20RunsByPipeline(pipelineId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipelineRunsList(runs))))
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

    private SyncToolSpecification listAllPipelineRuns() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_all_pipeline_runs")
                        .description("List all pipeline runs across all projects and pipelines.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        List<PipelineRun> runs = pipelineRunService.getTop20AllRuns();
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipelineRunsList(runs))))
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

    private SyncToolSpecification getPipelineRun() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_pipeline_run")
                        .description("Get detailed information about a specific pipeline run, including step results.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Pipeline Run ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        PipelineRun run = pipelineRunService.getRunById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipelineRun(run))))
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

    private SyncToolSpecification deletePipelineRun() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_pipeline_run")
                        .description("Delete a pipeline run by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Pipeline Run ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        pipelineRunService.deleteRun(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Pipeline run " + id + " deleted successfully.")))
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

    private SyncToolSpecification deleteNonRunningRuns() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_non_running_runs")
                        .description("Delete all pipeline runs that are not currently running.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        int deleted = pipelineRunService.deleteAllNonRunningRuns();
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Deleted " + deleted + " non-running pipeline runs.")))
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
