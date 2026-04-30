package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.service.AgentService;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import io.github.akumosstl.agentic.backend.service.ProjectService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ProjectTools {

    private final ProjectService projectService;
    private final PipelineService pipelineService;

    @Autowired
    public ProjectTools(ProjectService projectService, PipelineService pipelineService) {
        this.projectService = projectService;
        this.pipelineService = pipelineService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listProjects());
        tools.add(listProjectsWithPipelines());
        tools.add(getProject());
        tools.add(createProject());
        tools.add(updateProject());
        tools.add(deleteProject());
        tools.add(getProjectAgents());
        tools.add(getProjectScripts());
        tools.add(getProjectInstructions());
        tools.add(addAgentToProject());
        tools.add(addScriptToProject());
        tools.add(addInstructionToProject());
        tools.add(removeAgentFromProject());
        tools.add(removeScriptFromProject());
        tools.add(removeInstructionFromProject());
        return tools;
    }

    private SyncToolSpecification listProjects() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_projects")
                        .description("List all projects in the system. Returns project names, IDs, status, and basic info.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<Project> projects = projectService.getTop10RecentProjects();
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatProjectsList(projects))))
                            .build();
                })
                .build();
    }

    private SyncToolSpecification listProjectsWithPipelines() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_projects_with_pipelines")
                        .description("List all projects with their pipelines. Returns full project info including all pipelines with their names, statuses, and step counts.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<Project> projects = projectService.getTop10RecentProjects();
                    StringBuilder sb = new StringBuilder();
                    sb.append("# All Projects with Pipelines\n\n");
                    for (Project p : projects) {
                        List<Pipeline> pipelines = pipelineService.getTop10PipelinesByProject(p.getId());
                        sb.append(McpResponseFormatter.formatProjectWithPipelines(p, pipelines)).append("\n");
                    }
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text(sb.toString())))
                            .build();
                })
                .build();
    }

    private SyncToolSpecification getProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_project")
                        .description("Get detailed information about a specific project by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Project ID")
                        )))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Project project = projectService.getProjectById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatProject(project))))
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

    private SyncToolSpecification createProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_project")
                        .description("Create a new project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "name", Map.of("type", "string", "description", "Project name (required)"),
                                "description", Map.of("type", "string", "description", "Project description"),
                                "path", Map.of("type", "string", "description", "Project path"),
                                "target", Map.of("type", "string", "description", "Target name"),
                                "targetId", Map.of("type", "integer", "description", "Target ID")
                        ), List.of("name")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Project project = new Project();
                        project.setName((String) request.arguments().get("name"));
                        project.setDescription((String) request.arguments().get("description"));
                        project.setPath((String) request.arguments().get("path"));
                        project.setTarget((String) request.arguments().get("target"));
                        if (request.arguments().get("targetId") != null) {
                            project.setTargetId(((Number) request.arguments().get("targetId")).longValue());
                        }
                        Project created = projectService.createProject(project);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Project created successfully.\n\n" + McpResponseFormatter.formatProject(created))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating project: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification updateProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("update_project")
                        .description("Update an existing project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Project ID (required)"),
                                "name", Map.of("type", "string", "description", "Project name"),
                                "description", Map.of("type", "string", "description", "Project description"),
                                "path", Map.of("type", "string", "description", "Project path"),
                                "status", Map.of("type", "string", "description", "Project status (active/completed/archived)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Project details = new Project();
                        if (request.arguments().get("name") != null) {
                            details.setName((String) request.arguments().get("name"));
                        }
                        if (request.arguments().get("description") != null) {
                            details.setDescription((String) request.arguments().get("description"));
                        }
                        if (request.arguments().get("path") != null) {
                            details.setPath((String) request.arguments().get("path"));
                        }
                        if (request.arguments().get("status") != null) {
                            details.setStatus((String) request.arguments().get("status"));
                        }
                        Project updated = projectService.updateProject(id, details);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Project updated successfully.\n\n" + McpResponseFormatter.formatProject(updated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error updating project: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification deleteProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_project")
                        .description("Delete a project by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Project ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        projectService.deleteProject(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Project " + id + " deleted successfully.")))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error deleting project: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification getProjectAgents() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_project_agents")
                        .description("List all agents associated with a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)")
                        ), List.of("projectId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        List<Agent> agents = projectService.getProjectAgents(projectId);
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

    private SyncToolSpecification getProjectScripts() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_project_scripts")
                        .description("List all scripts associated with a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)")
                        ), List.of("projectId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        var scripts = projectService.getProjectScripts(projectId);
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

    private SyncToolSpecification getProjectInstructions() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_project_instructions")
                        .description("List all instructions associated with a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)")
                        ), List.of("projectId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        var instructions = projectService.getProjectInstructions(projectId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatInstructionsList(instructions))))
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

    private SyncToolSpecification addAgentToProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("add_agent_to_project")
                        .description("Add an agent to a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)"),
                                "agentId", Map.of("type", "integer", "description", "Agent ID to add (required)")
                        ), List.of("projectId", "agentId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        Long agentId = ((Number) request.arguments().get("agentId")).longValue();
                        projectService.addAgentsToProject(projectId, List.of(agentId));
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Agent " + agentId + " added to project " + projectId + ".")))
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

    private SyncToolSpecification addScriptToProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("add_script_to_project")
                        .description("Add a script to a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)"),
                                "scriptId", Map.of("type", "integer", "description", "Script ID to add (required)")
                        ), List.of("projectId", "scriptId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        Long scriptId = ((Number) request.arguments().get("scriptId")).longValue();
                        projectService.addScriptsToProject(projectId, List.of(scriptId));
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Script " + scriptId + " added to project " + projectId + ".")))
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

    private SyncToolSpecification addInstructionToProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("add_instruction_to_project")
                        .description("Add an instruction to a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)"),
                                "instructionId", Map.of("type", "integer", "description", "Instruction ID to add (required)")
                        ), List.of("projectId", "instructionId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        Long instructionId = ((Number) request.arguments().get("instructionId")).longValue();
                        projectService.addInstructionsToProject(projectId, List.of(instructionId));
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Instruction " + instructionId + " added to project " + projectId + ".")))
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

    private SyncToolSpecification removeAgentFromProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("remove_agent_from_project")
                        .description("Remove an agent from a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)"),
                                "agentId", Map.of("type", "integer", "description", "Agent ID to remove (required)")
                        ), List.of("projectId", "agentId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        Long agentId = ((Number) request.arguments().get("agentId")).longValue();
                        projectService.removeAgentFromProject(projectId, agentId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Agent " + agentId + " removed from project " + projectId + ".")))
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

    private SyncToolSpecification removeScriptFromProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("remove_script_from_project")
                        .description("Remove a script from a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)"),
                                "scriptId", Map.of("type", "integer", "description", "Script ID to remove (required)")
                        ), List.of("projectId", "scriptId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        Long scriptId = ((Number) request.arguments().get("scriptId")).longValue();
                        projectService.removeScriptFromProject(projectId, scriptId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Script " + scriptId + " removed from project " + projectId + ".")))
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

    private SyncToolSpecification removeInstructionFromProject() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("remove_instruction_from_project")
                        .description("Remove an instruction from a project.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "projectId", Map.of("type", "integer", "description", "Project ID (required)"),
                                "instructionId", Map.of("type", "integer", "description", "Instruction ID to remove (required)")
                        ), List.of("projectId", "instructionId")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long projectId = ((Number) request.arguments().get("projectId")).longValue();
                        Long instructionId = ((Number) request.arguments().get("instructionId")).longValue();
                        projectService.removeInstructionFromProject(projectId, instructionId);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Instruction " + instructionId + " removed from project " + projectId + ".")))
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
