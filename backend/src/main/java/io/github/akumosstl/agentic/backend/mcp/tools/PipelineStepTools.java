package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.service.PipelineStepService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class PipelineStepTools {

    private final PipelineStepService pipelineStepService;

    @Autowired
    public PipelineStepTools(PipelineStepService pipelineStepService) {
        this.pipelineStepService = pipelineStepService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listPipelineSteps());
        tools.add(getPipelineStep());
        tools.add(addStepToPipeline());
        tools.add(removeStep());
        tools.add(saveStepInput());
        tools.add(saveStepOutput());
        tools.add(saveStepCli());
        return tools;
    }

    private SyncToolSpecification listPipelineSteps() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_pipeline_steps")
                        .description("List all steps in a pipeline with their order, type, agent/script, and status.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "pipelineId", Map.of("type", "integer", "description", "Pipeline ID (required)")
                        ), List.of("pipelineId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long pipelineId = ((Number) request.arguments().get("pipelineId")).longValue();
                        List<PipelineStep> steps = pipelineStepService.getStepsByPipeline(pipelineId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipelineStepsList(steps))))
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

    private SyncToolSpecification getPipelineStep() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_pipeline_step")
                        .description("Get detailed information about a specific pipeline step.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Step ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        PipelineStep step = pipelineStepService.getStepById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipelineStep(step))))
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

    private SyncToolSpecification addStepToPipeline() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("add_step_to_pipeline")
                        .description("Add a new step to a pipeline. Specify either an agentId or scriptId.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "pipelineId", Map.of("type", "integer", "description", "Pipeline ID (required)"),
                                "agentId", Map.of("type", "integer", "description", "Agent ID (optional, for agent-type steps)"),
                                "scriptId", Map.of("type", "integer", "description", "Script ID (optional, for script-type steps)")
                        ), List.of("pipelineId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long pipelineId = ((Number) request.arguments().get("pipelineId")).longValue();
                        Long agentId = request.arguments().get("agentId") != null ? ((Number) request.arguments().get("agentId")).longValue() : null;
                        Long scriptId = request.arguments().get("scriptId") != null ? ((Number) request.arguments().get("scriptId")).longValue() : null;
                        PipelineStep step = pipelineStepService.addStepToPipeline(pipelineId, agentId, scriptId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Step added successfully.\n\n" + McpResponseFormatter.formatPipelineStep(step))))
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

    private SyncToolSpecification removeStep() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("remove_step")
                        .description("Remove a step from a pipeline.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Step ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        pipelineStepService.removeStep(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Step " + id + " removed successfully.")))
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

    private SyncToolSpecification saveStepInput() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("save_step_input")
                        .description("Save input content for a pipeline step.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "stepId", Map.of("type", "integer", "description", "Step ID (required)"),
                                "content", Map.of("type", "string", "description", "Input content (required)"),
                                "type", Map.of("type", "string", "description", "Content type (e.g. text, markdown)")
                        ), List.of("stepId", "content")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long stepId = ((Number) request.arguments().get("stepId")).longValue();
                        String content = (String) request.arguments().get("content");
                        String type = (String) request.arguments().get("type");
                        pipelineStepService.saveInput(stepId, content, type);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Step " + stepId + " input saved successfully.")))
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

    private SyncToolSpecification saveStepOutput() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("save_step_output")
                        .description("Save output content for a pipeline step.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "stepId", Map.of("type", "integer", "description", "Step ID (required)"),
                                "content", Map.of("type", "string", "description", "Output content (required)"),
                                "type", Map.of("type", "string", "description", "Content type (e.g. text, markdown)")
                        ), List.of("stepId", "content")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long stepId = ((Number) request.arguments().get("stepId")).longValue();
                        String content = (String) request.arguments().get("content");
                        String type = (String) request.arguments().get("type");
                        pipelineStepService.saveOutput(stepId, content, type);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Step " + stepId + " output saved successfully.")))
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

    private SyncToolSpecification saveStepCli() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("save_step_cli")
                        .description("Configure CLI settings for a pipeline step (e.g. opencode, copilot, or custom CLI).")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "stepId", Map.of("type", "integer", "description", "Step ID (required)"),
                                "cli", Map.of("type", "string", "description", "CLI name (required, e.g. opencode, copilot)"),
                                "parameters", Map.of("type", "string", "description", "CLI parameters"),
                                "arguments", Map.of("type", "string", "description", "CLI arguments"),
                                "runtime", Map.of("type", "string", "description", "Runtime (cmd, node, java, py, custom)")
                        ), List.of("stepId", "cli")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long stepId = ((Number) request.arguments().get("stepId")).longValue();
                        String cli = (String) request.arguments().get("cli");
                        String parameters = (String) request.arguments().get("parameters");
                        String arguments = (String) request.arguments().get("arguments");
                        String runtime = (String) request.arguments().get("runtime");
                        pipelineStepService.saveCli(stepId, cli, parameters, arguments, runtime);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Step " + stepId + " CLI settings saved successfully.")))
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
