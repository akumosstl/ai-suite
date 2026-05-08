package io.github.akumosstl.agentic.backend.mcp;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

public class McpEnabledCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String enabled = context.getEnvironment().getProperty("mcp.enabled", "true");
        return "true".equalsIgnoreCase(enabled);
    }
}
