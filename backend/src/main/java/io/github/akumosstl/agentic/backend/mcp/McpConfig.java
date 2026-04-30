package io.github.akumosstl.agentic.backend.mcp;

import io.github.akumosstl.agentic.backend.mcp.tools.AgentTools;
import io.github.akumosstl.agentic.backend.mcp.tools.InstructionTools;
import io.github.akumosstl.agentic.backend.mcp.tools.PipelineRunTools;
import io.github.akumosstl.agentic.backend.mcp.tools.PipelineStepTools;
import io.github.akumosstl.agentic.backend.mcp.tools.PipelineTools;
import io.github.akumosstl.agentic.backend.mcp.tools.ProjectTools;
import io.github.akumosstl.agentic.backend.mcp.tools.ScriptTools;
import io.github.akumosstl.agentic.backend.mcp.tools.SystemTools;
import io.github.akumosstl.agentic.backend.mcp.tools.TargetTools;
import io.github.akumosstl.agentic.backend.mcp.tools.TemplateTools;
import io.modelcontextprotocol.json.jackson2.JacksonMcpJsonMapper;
import io.modelcontextprotocol.server.McpServer;
import io.modelcontextprotocol.server.McpSyncServer;
import io.modelcontextprotocol.server.transport.HttpServletStreamableServerTransportProvider;
import io.modelcontextprotocol.spec.McpSchema;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.CorsFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

@Configuration
@Conditional(McpEnabledCondition.class)
public class McpConfig {

    private static final Logger log = LoggerFactory.getLogger(McpConfig.class);

    @Value("${mcp.endpoint:/mcp}")
    private String mcpEndpoint;

    @Bean
    public JacksonMcpJsonMapper mcpJsonMapper() {
        return new JacksonMcpJsonMapper(new com.fasterxml.jackson.databind.ObjectMapper());
    }

    @Bean
    public HttpServletStreamableServerTransportProvider mcpTransportProvider(JacksonMcpJsonMapper jsonMapper) {
        return HttpServletStreamableServerTransportProvider.builder()
                .jsonMapper(jsonMapper)
                .mcpEndpoint(mcpEndpoint)
                .build();
    }

    @Bean
    public ServletRegistrationBean<?> mcpServlet(HttpServletStreamableServerTransportProvider transportProvider) {
        return new ServletRegistrationBean<>(transportProvider, mcpEndpoint + "/*");
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> mcpCorsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
                new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(mcpEndpoint + "/*", config);
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.addUrlPatterns(mcpEndpoint + "/*");
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }

    @Bean
    public McpSyncServer mcpServer(
            HttpServletStreamableServerTransportProvider transportProvider,
            JacksonMcpJsonMapper jsonMapper,
            ProjectTools projectTools,
            PipelineTools pipelineTools,
            PipelineRunTools pipelineRunTools,
            PipelineStepTools pipelineStepTools,
            AgentTools agentTools,
            ScriptTools scriptTools,
            InstructionTools instructionTools,
            TargetTools targetTools,
            TemplateTools templateTools,
            SystemTools systemTools) {

        List<io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification> allTools = new ArrayList<>();
        allTools.addAll(projectTools.getToolSpecifications());
        allTools.addAll(pipelineTools.getToolSpecifications());
        allTools.addAll(pipelineRunTools.getToolSpecifications());
        allTools.addAll(pipelineStepTools.getToolSpecifications());
        allTools.addAll(agentTools.getToolSpecifications());
        allTools.addAll(scriptTools.getToolSpecifications());
        allTools.addAll(instructionTools.getToolSpecifications());
        allTools.addAll(targetTools.getToolSpecifications());
        allTools.addAll(templateTools.getToolSpecifications());
        allTools.addAll(systemTools.getToolSpecifications());

        McpSyncServer server = McpServer.sync(transportProvider)
                .serverInfo("agentic-mcp", "1.0.0")
                .capabilities(McpSchema.ServerCapabilities.builder()
                        .tools(true)
                        .build())
                .tools(allTools)
                .build();

        log.info("==========================================================");
        log.info("  MCP Server started at endpoint: {}", mcpEndpoint);
        log.info("  MCP Tools registered: {}", allTools.size());
        log.info("  MCP Server name: agentic-mcp, version: 1.0.0");
        log.info("==========================================================");

        return server;
    }
}
