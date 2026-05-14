package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record LlmMetricRecord(
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("model") String model,
    @JsonProperty("provider") String provider,
    @JsonProperty("latencyMs") long latencyMs,
    @JsonProperty("promptTokens") int promptTokens,
    @JsonProperty("completionTokens") int completionTokens,
    @JsonProperty("totalTokens") int totalTokens,
    @JsonProperty("status") String status,
    @JsonProperty("errorMessage") String errorMessage
) {}
