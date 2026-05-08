package io.github.akumosstl.agentic.backend.mcp;

import io.modelcontextprotocol.spec.McpSchema;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class JsonSchemaBuilder {

    private JsonSchemaBuilder() {
    }

    public static McpSchema.JsonSchema objectSchema(Map<String, Object> properties) {
        return objectSchema(properties, List.of());
    }

    public static McpSchema.JsonSchema objectSchema(Map<String, Object> properties, List<String> required) {
        Map<String, Object> props = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : properties.entrySet()) {
            if (entry.getValue() instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> propDef = new LinkedHashMap<>((Map<String, Object>) entry.getValue());
                props.put(entry.getKey(), propDef);
            } else {
                props.put(entry.getKey(), entry.getValue());
            }
        }
        return new McpSchema.JsonSchema("object", props, required, false, Map.of(), Map.of());
    }
}
