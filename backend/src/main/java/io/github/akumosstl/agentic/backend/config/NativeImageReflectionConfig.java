package io.github.akumosstl.agentic.backend.config;

import io.github.akumosstl.agentic.backend.controller.NamespaceController;
import io.github.akumosstl.agentic.backend.controller.TargetController;
import io.github.akumosstl.agentic.backend.model.*;
import io.github.akumosstl.agentic.backend.recipe.*;
import io.modelcontextprotocol.spec.McpError;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.spec.McpSchema.*;
import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Configuration;

@Configuration
@RegisterReflectionForBinding({

        JSONRPCMessage.class,
        JSONRPCRequest.class,
        JSONRPCResponse.class,
        McpSchema.JSONRPCResponse.JSONRPCError.class,
        JSONRPCNotification.class,
        McpError.class,

        InitializeRequest.class,
        InitializeResult.class,
        Implementation.class,

        ClientCapabilities.class,
        McpSchema.ClientCapabilities.RootCapabilities.class,
        McpSchema.ClientCapabilities.Sampling.class,
        McpSchema.ClientCapabilities.Elicitation.class,
        McpSchema.ClientCapabilities.Elicitation.Form.class,
        McpSchema.ClientCapabilities.Elicitation.Url.class,

        ServerCapabilities.class,
        McpSchema.ServerCapabilities.ToolCapabilities.class,
        McpSchema.ServerCapabilities.CompletionCapabilities.class,
        McpSchema.ServerCapabilities.LoggingCapabilities.class,
        McpSchema.ServerCapabilities.PromptCapabilities.class,
        McpSchema.ServerCapabilities.ResourceCapabilities.class,

        Tool.class,
        CallToolResult.class,
        CallToolRequest.class,
        ListToolsResult.class,
        JsonSchema.class,
        Annotations.class,
        ToolAnnotations.class,

        Content.class,
        TextContent.class,
        ImageContent.class,
        AudioContent.class,
        EmbeddedResource.class,
        ResourceLink.class,
        ResourceContents.class,
        TextResourceContents.class,
        BlobResourceContents.class,
        McpSchema.ResourceContent.class,
        Resource.class,
        ResourceTemplate.class,

        Prompt.class,
        PromptArgument.class,
        PromptMessage.class,
        GetPromptResult.class,
        GetPromptRequest.class,
        ListPromptsResult.class,

        ListResourcesResult.class,
        ListResourceTemplatesResult.class,
        ReadResourceRequest.class,
        ReadResourceResult.class,

        Root.class,
        ListRootsResult.class,

        ProgressNotification.class,
        LoggingMessageNotification.class,
        SubscribeRequest.class,
        UnsubscribeRequest.class,
        SetLevelRequest.class,

        CompleteRequest.class,
        McpSchema.CompleteRequest.CompleteArgument.class,
        McpSchema.CompleteRequest.CompleteContext.class,
        CompleteResult.class,
        McpSchema.CompleteResult.CompleteCompletion.class,
        CompleteReference.class,

        CreateMessageRequest.class,
        McpSchema.CreateMessageRequest.ContextInclusionStrategy.class,
        CreateMessageResult.class,
        McpSchema.CreateMessageResult.StopReason.class,
        SamplingMessage.class,
        ModelPreferences.class,
        ModelHint.class,

        ElicitRequest.class,
        ElicitResult.class,
        McpSchema.ElicitResult.Action.class,

        ResourcesUpdatedNotification.class,
        PaginatedResult.class,
        PaginatedRequest.class,
        PromptReference.class,
        ResourceReference.class,

        Result.class,
        Request.class,
        io.modelcontextprotocol.spec.McpSchema.Notification.class,
        Meta.class,
        Identifier.class,

        Role.class,
        LoggingLevel.class,

        Project.class,
        Pipeline.class,
        PipelineStep.class,
        PipelineRun.class,
        PipelineRunStep.class,
        Agent.class,
        Script.class,
        Target.class,
        Template.class,

        Recipe.class,
        RecipeFile.class,
        RecipeTaskResult.class,

        RecipeYaml.class,
        RecipeHeader.class,
        RecipeTarget.class,
        RecipeProject.class,
        RecipeAgent.class,
        RecipeScript.class,
        RecipeTemplate.class,
        RecipePipeline.class,
        RecipeStep.class,
        RecipeStepIO.class,
        RecipeTask.class,
        RecipeRetry.class,
        RecipeLoop.class,

        NamespaceController.NamespaceItems.class,
        NamespaceController.ClearResult.class,
        TargetController.ErrorResponse.class
})
public class NativeImageReflectionConfig {
}
