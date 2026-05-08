package io.github.akumosstl.agentic.backend.config;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Event;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.model.Template;
import io.modelcontextprotocol.spec.McpError;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.spec.McpSchema.Annotations;
import io.modelcontextprotocol.spec.McpSchema.AudioContent;
import io.modelcontextprotocol.spec.McpSchema.BlobResourceContents;
import io.modelcontextprotocol.spec.McpSchema.CallToolRequest;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import io.modelcontextprotocol.spec.McpSchema.ClientCapabilities;
import io.modelcontextprotocol.spec.McpSchema.CompleteReference;
import io.modelcontextprotocol.spec.McpSchema.CompleteRequest;
import io.modelcontextprotocol.spec.McpSchema.CompleteResult;
import io.modelcontextprotocol.spec.McpSchema.Content;
import io.modelcontextprotocol.spec.McpSchema.CreateMessageRequest;
import io.modelcontextprotocol.spec.McpSchema.CreateMessageResult;
import io.modelcontextprotocol.spec.McpSchema.ElicitRequest;
import io.modelcontextprotocol.spec.McpSchema.ElicitResult;
import io.modelcontextprotocol.spec.McpSchema.EmbeddedResource;
import io.modelcontextprotocol.spec.McpSchema.GetPromptRequest;
import io.modelcontextprotocol.spec.McpSchema.GetPromptResult;
import io.modelcontextprotocol.spec.McpSchema.Identifier;
import io.modelcontextprotocol.spec.McpSchema.ImageContent;
import io.modelcontextprotocol.spec.McpSchema.Implementation;
import io.modelcontextprotocol.spec.McpSchema.InitializeRequest;
import io.modelcontextprotocol.spec.McpSchema.InitializeResult;
import io.modelcontextprotocol.spec.McpSchema.JSONRPCMessage;
import io.modelcontextprotocol.spec.McpSchema.JSONRPCNotification;
import io.modelcontextprotocol.spec.McpSchema.JSONRPCRequest;
import io.modelcontextprotocol.spec.McpSchema.JSONRPCResponse;
import io.modelcontextprotocol.spec.McpSchema.JsonSchema;
import io.modelcontextprotocol.spec.McpSchema.ListPromptsResult;
import io.modelcontextprotocol.spec.McpSchema.ListResourceTemplatesResult;
import io.modelcontextprotocol.spec.McpSchema.ListResourcesResult;
import io.modelcontextprotocol.spec.McpSchema.ListRootsResult;
import io.modelcontextprotocol.spec.McpSchema.ListToolsResult;
import io.modelcontextprotocol.spec.McpSchema.LoggingLevel;
import io.modelcontextprotocol.spec.McpSchema.LoggingMessageNotification;
import io.modelcontextprotocol.spec.McpSchema.Meta;
import io.modelcontextprotocol.spec.McpSchema.ModelHint;
import io.modelcontextprotocol.spec.McpSchema.ModelPreferences;
import io.modelcontextprotocol.spec.McpSchema.PaginatedRequest;
import io.modelcontextprotocol.spec.McpSchema.PaginatedResult;
import io.modelcontextprotocol.spec.McpSchema.Prompt;
import io.modelcontextprotocol.spec.McpSchema.PromptArgument;
import io.modelcontextprotocol.spec.McpSchema.PromptMessage;
import io.modelcontextprotocol.spec.McpSchema.PromptReference;
import io.modelcontextprotocol.spec.McpSchema.ProgressNotification;
import io.modelcontextprotocol.spec.McpSchema.ReadResourceRequest;
import io.modelcontextprotocol.spec.McpSchema.ReadResourceResult;
import io.modelcontextprotocol.spec.McpSchema.Request;
import io.modelcontextprotocol.spec.McpSchema.Resource;
import io.modelcontextprotocol.spec.McpSchema.ResourceContents;
import io.modelcontextprotocol.spec.McpSchema.ResourceLink;
import io.modelcontextprotocol.spec.McpSchema.ResourceTemplate;
import io.modelcontextprotocol.spec.McpSchema.ResourceReference;
import io.modelcontextprotocol.spec.McpSchema.ResourcesUpdatedNotification;
import io.modelcontextprotocol.spec.McpSchema.Result;
import io.modelcontextprotocol.spec.McpSchema.Role;
import io.modelcontextprotocol.spec.McpSchema.Root;
import io.modelcontextprotocol.spec.McpSchema.SamplingMessage;
import io.modelcontextprotocol.spec.McpSchema.ServerCapabilities;
import io.modelcontextprotocol.spec.McpSchema.SetLevelRequest;
import io.modelcontextprotocol.spec.McpSchema.SubscribeRequest;
import io.modelcontextprotocol.spec.McpSchema.TextContent;
import io.modelcontextprotocol.spec.McpSchema.TextResourceContents;
import io.modelcontextprotocol.spec.McpSchema.Tool;
import io.modelcontextprotocol.spec.McpSchema.ToolAnnotations;
import io.modelcontextprotocol.spec.McpSchema.UnsubscribeRequest;
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
		Event.class
})
public class NativeImageReflectionConfig {
}
