package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class PipelineTools {

	private final PipelineService pipelineService;

	@Autowired
	public PipelineTools(PipelineService pipelineService) {
		this.pipelineService = pipelineService;
	}

	public List<SyncToolSpecification> getToolSpecifications() {
		List<SyncToolSpecification> tools = new ArrayList<>();
		tools.add(listPipelines());
		tools.add(getPipeline());
		tools.add(createPipeline());
		tools.add(updatePipeline());
		tools.add(deletePipeline());
    tools.add(runPipeline());
        tools.add(stopPipeline());
        tools.add(duplicatePipeline());
        return tools;
	}

	private SyncToolSpecification listPipelines() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("list_pipelines")
				.description("List pipelines for a project, or all pipelines if no projectId is specified.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"projectId", Map.of("type", "integer", "description", "Project ID to filter pipelines (optional)")
				)))
				.build())
			.callHandler((exchange, request) -> {
				try {
					List<Pipeline> pipelines;
					if (request.arguments().get("projectId") != null) {
						Long projectId = ((Number) request.arguments().get("projectId")).longValue();
						pipelines = pipelineService.getTop10PipelinesByProject(projectId);
					} else {
						pipelines = pipelineService.getAllPipelines();
					}
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipelinesList(pipelines))))
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

	private SyncToolSpecification getPipeline() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("get_pipeline")
				.description("Get detailed information about a specific pipeline by ID, including its steps.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"id", Map.of("type", "integer", "description", "Pipeline ID (required)")
				), List.of("id")))
				.build())
			.callHandler((exchange, request) -> {
				try {
					Long id = ((Number) request.arguments().get("id")).longValue();
					Pipeline pipeline = pipelineService.getPipelineById(id);
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatPipeline(pipeline))))
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

	private SyncToolSpecification createPipeline() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("create_pipeline")
				.description("Create a new pipeline in a project.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"projectId", Map.of("type", "integer", "description", "Project ID (required)"),
					"name", Map.of("type", "string", "description", "Pipeline name (required)"),
					"description", Map.of("type", "string", "description", "Pipeline description"),
					"type", Map.of("type", "string", "description", "Pipeline type"),
					"outputExtension", Map.of("type", "string", "description", "Output file extension")
				), List.of("projectId", "name")))
				.build())
			.callHandler((exchange, request) -> {
				try {
					Long projectId = ((Number) request.arguments().get("projectId")).longValue();
					Pipeline pipeline = new Pipeline();
					pipeline.setName((String) request.arguments().get("name"));
					pipeline.setDescription((String) request.arguments().get("description"));
					pipeline.setType((String) request.arguments().get("type"));
					pipeline.setOutputExtension((String) request.arguments().get("outputExtension"));
					Pipeline created = pipelineService.createPipeline(projectId, pipeline);
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Pipeline created successfully.\n\n" + McpResponseFormatter.formatPipeline(created))))
						.build();
				} catch (Exception e) {
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Error creating pipeline: " + e.getMessage())))
						.isError(true)
						.build();
				}
			})
			.build();
	}

	private SyncToolSpecification updatePipeline() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("update_pipeline")
				.description("Update an existing pipeline.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"id", Map.of("type", "integer", "description", "Pipeline ID (required)"),
					"name", Map.of("type", "string", "description", "Pipeline name"),
					"description", Map.of("type", "string", "description", "Pipeline description"),
					"status", Map.of("type", "string", "description", "Pipeline status (pending/running/completed/failed)")
				), List.of("id")))
				.build())
			.callHandler((exchange, request) -> {
				try {
					Long id = ((Number) request.arguments().get("id")).longValue();
					Pipeline details = new Pipeline();
					if (request.arguments().get("name") != null) {
						details.setName((String) request.arguments().get("name"));
					}
					if (request.arguments().get("description") != null) {
						details.setDescription((String) request.arguments().get("description"));
					}
					if (request.arguments().get("status") != null) {
						details.setStatus((String) request.arguments().get("status"));
					}
					Pipeline updated = pipelineService.updatePipeline(id, details);
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Pipeline updated successfully.\n\n" + McpResponseFormatter.formatPipeline(updated))))
						.build();
				} catch (Exception e) {
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Error updating pipeline: " + e.getMessage())))
						.isError(true)
						.build();
				}
			})
			.build();
	}

	private SyncToolSpecification deletePipeline() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("delete_pipeline")
				.description("Delete a pipeline by ID.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"id", Map.of("type", "integer", "description", "Pipeline ID (required)")
				), List.of("id")))
				.build())
			.callHandler((exchange, request) -> {
				try {
					Long id = ((Number) request.arguments().get("id")).longValue();
					pipelineService.deletePipeline(id);
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Pipeline " + id + " deleted successfully.")))
						.build();
				} catch (Exception e) {
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Error deleting pipeline: " + e.getMessage())))
						.isError(true)
						.build();
				}
			})
			.build();
	}

	private SyncToolSpecification runPipeline() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("run_pipeline")
				.description("Execute a pipeline by ID. The pipeline will start running asynchronously.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"id", Map.of("type", "integer", "description", "Pipeline ID to run (required)")
				), List.of("id")))
				.build())
			.callHandler((exchange, request) -> {
				try {
					Long id = ((Number) request.arguments().get("id")).longValue();
					pipelineService.runPipeline(id);
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Pipeline " + id + " execution started.")))
						.build();
				} catch (Exception e) {
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Error running pipeline: " + e.getMessage())))
						.isError(true)
						.build();
				}
			})
			.build();
	}

    private SyncToolSpecification duplicatePipeline() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("duplicate_pipeline")
                        .description("Duplicate a pipeline, copying all steps and configurations. A new name can be provided; if omitted, a default name like 'OriginalNamecopy' is generated.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Pipeline ID to duplicate (required)"),
                                "name", Map.of("type", "string", "description", "Name for the duplicated pipeline (optional, auto-generated if omitted)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        String newName = (String) request.arguments().get("name");
                        Pipeline duplicated = pipelineService.duplicatePipeline(id, newName);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Pipeline duplicated successfully.\n\n" + McpResponseFormatter.formatPipeline(duplicated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error duplicating pipeline: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification stopPipeline() {
		return SyncToolSpecification.builder()
			.tool(McpSchema.Tool.builder()
				.name("stop_pipeline")
				.description("Stop a running pipeline execution.")
				.inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
					"id", Map.of("type", "integer", "description", "Pipeline ID to stop (required)")
				), List.of("id")))
				.build())
			.callHandler((exchange, request) -> {
				try {
					Long id = ((Number) request.arguments().get("id")).longValue();
					Pipeline details = new Pipeline();
                        details.setStatus("stopped");
                        pipelineService.updatePipeline(id, details);
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Pipeline " + id + " stop requested.")))
						.build();
				} catch (Exception e) {
					return McpSchema.CallToolResult.builder()
						.content(List.of(McpResponseFormatter.text("Error stopping pipeline: " + e.getMessage())))
						.isError(true)
						.build();
				}
			})
			.build();
	}
}
