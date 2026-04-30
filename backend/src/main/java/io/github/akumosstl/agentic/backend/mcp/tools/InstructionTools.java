package io.github.akumosstl.agentic.backend.mcp.tools;

import io.github.akumosstl.agentic.backend.mcp.JsonSchemaBuilder;
import io.github.akumosstl.agentic.backend.mcp.McpResponseFormatter;
import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.service.InstructionService;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class InstructionTools {

    private final InstructionService instructionService;

    @Autowired
    public InstructionTools(InstructionService instructionService) {
        this.instructionService = instructionService;
    }

    public List<SyncToolSpecification> getToolSpecifications() {
        List<SyncToolSpecification> tools = new ArrayList<>();
        tools.add(listInstructions());
        tools.add(getInstruction());
        tools.add(createInstruction());
        tools.add(updateInstruction());
        tools.add(deleteInstruction());
        tools.add(searchInstructions());
        return tools;
    }

    private SyncToolSpecification listInstructions() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("list_instructions")
                        .description("List all instructions in the system.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of()))
                        .build())
                .callHandler((exchange, request) -> {
                    List<Instruction> instructions = instructionService.getTop10RecentInstructions();
                    return McpSchema.CallToolResult.builder()
                            .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatInstructionsList(instructions))))
                            .build();
                })
                .build();
    }

    private SyncToolSpecification getInstruction() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("get_instruction")
                        .description("Get detailed information about a specific instruction by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Instruction ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Instruction instruction = instructionService.getInstructionById(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text(McpResponseFormatter.formatInstruction(instruction))))
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

    private SyncToolSpecification createInstruction() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("create_instruction")
                        .description("Create a new instruction.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "name", Map.of("type", "string", "description", "Instruction name (required)"),
                                "namespace", Map.of("type", "string", "description", "Instruction namespace (required)"),
                                "category", Map.of("type", "string", "description", "Instruction category"),
                                "description", Map.of("type", "string", "description", "Instruction description"),
                                "instructions", Map.of("type", "string", "description", "Instruction content"),
                                "path", Map.of("type", "string", "description", "Instruction file path")
                        ), List.of("name", "namespace")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Instruction instruction = new Instruction();
                        instruction.setName((String) request.arguments().get("name"));
                        instruction.setNamespace((String) request.arguments().get("namespace"));
                        instruction.setCategory((String) request.arguments().get("category"));
                        instruction.setDescription((String) request.arguments().get("description"));
                        instruction.setInstructions((String) request.arguments().get("instructions"));
                        instruction.setPath((String) request.arguments().get("path"));
                        Instruction created = instructionService.createInstruction(instruction);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Instruction created successfully.\n\n" + McpResponseFormatter.formatInstruction(created))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error creating instruction: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification updateInstruction() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("update_instruction")
                        .description("Update an existing instruction.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Instruction ID (required)"),
                                "name", Map.of("type", "string", "description", "Instruction name"),
                                "namespace", Map.of("type", "string", "description", "Instruction namespace"),
                                "category", Map.of("type", "string", "description", "Instruction category"),
                                "description", Map.of("type", "string", "description", "Instruction description"),
                                "instructions", Map.of("type", "string", "description", "Instruction content")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        Instruction details = new Instruction();
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
                        if (request.arguments().get("instructions") != null) {
                            details.setInstructions((String) request.arguments().get("instructions"));
                        }
                        Instruction updated = instructionService.updateInstruction(id, details);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Instruction updated successfully.\n\n" + McpResponseFormatter.formatInstruction(updated))))
                                .build();
                    } catch (Exception e) {
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Error updating instruction: " + e.getMessage())))
                                .isError(true)
                                .build();
                    }
                })
                .build();
    }

    private SyncToolSpecification deleteInstruction() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("delete_instruction")
                        .description("Delete an instruction by ID.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "id", Map.of("type", "integer", "description", "Instruction ID (required)")
                        ), List.of("id")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        Long id = ((Number) request.arguments().get("id")).longValue();
                        instructionService.deleteInstruction(id);
                        return McpSchema.CallToolResult.builder()
                                .content(List.of(McpResponseFormatter.text("Instruction " + id + " deleted successfully.")))
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

    private SyncToolSpecification searchInstructions() {
        return SyncToolSpecification.builder()
                .tool(McpSchema.Tool.builder()
                        .name("search_instructions")
                        .description("Search instructions by name or namespace.")
                        .inputSchema(JsonSchemaBuilder.objectSchema(Map.of(
                                "searchTerm", Map.of("type", "string", "description", "Search term (required)"),
                                "namespace", Map.of("type", "string", "description", "Filter by namespace (optional)")
                        ), List.of("searchTerm")))
                        .build())
                .callHandler((exchange, request) -> {
                    try {
                        String searchTerm = (String) request.arguments().get("searchTerm");
                        String namespace = (String) request.arguments().get("namespace");
                        List<Instruction> instructions = instructionService.searchInstructions(searchTerm, namespace, 0, 50);
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
}
