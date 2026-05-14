package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.LlmMetricRecord;
import io.github.akumosstl.agentic.backend.service.LangChainObservabilityListener;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/llm-metrics")
public class LlmMetricsController {

    private final LangChainObservabilityListener listener;

    public LlmMetricsController(LangChainObservabilityListener listener) {
        this.listener = listener;
    }

    @GetMapping
    public List<LlmMetricRecord> getHistory() {
        return listener.getMetrics();
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        List<LlmMetricRecord> records = listener.getMetrics();
        int totalCalls = records.size();
        long totalTokens = records.stream().mapToLong(LlmMetricRecord::totalTokens).sum();
        long totalPromptTokens = records.stream().mapToLong(LlmMetricRecord::promptTokens).sum();
        long totalCompletionTokens = records.stream().mapToLong(LlmMetricRecord::completionTokens).sum();
        double avgLatency = records.stream().mapToLong(LlmMetricRecord::latencyMs).average().orElse(0.0);
        long errorCount = records.stream().filter(r -> "ERROR".equals(r.status())).count();
        long successCount = totalCalls - errorCount;
        double successRate = totalCalls > 0 ? (successCount * 100.0 / totalCalls) : 100.0;

        return Map.of(
            "totalCalls", totalCalls,
            "totalTokens", totalTokens,
            "totalPromptTokens", totalPromptTokens,
            "totalCompletionTokens", totalCompletionTokens,
            "avgLatencyMs", Math.round(avgLatency),
            "errorCount", errorCount,
            "successCount", successCount,
            "successRate", Math.round(successRate * 100.0) / 100.0
        );
    }

    @DeleteMapping
    public Map<String, String> clearMetrics() {
        listener.clearMetrics();
        return Map.of("message", "Metrics cleared");
    }
}
