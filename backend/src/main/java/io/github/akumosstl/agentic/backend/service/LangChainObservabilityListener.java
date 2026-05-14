package io.github.akumosstl.agentic.backend.service;

import dev.langchain4j.model.chat.listener.ChatModelErrorContext;
import dev.langchain4j.model.chat.listener.ChatModelListener;
import dev.langchain4j.model.chat.listener.ChatModelRequestContext;
import dev.langchain4j.model.chat.listener.ChatModelResponseContext;
import io.github.akumosstl.agentic.backend.model.LlmMetricRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class LangChainObservabilityListener implements ChatModelListener {

    private static final Logger log = LoggerFactory.getLogger(LangChainObservabilityListener.class);
    private static final int MAX_RECORDS = 500;
    private static final String TIMING_KEY = "observability.requestStartMs";

    private final ConcurrentLinkedQueue<LlmMetricRecord> metricsQueue = new ConcurrentLinkedQueue<>();
    private final Map<Object, Long> requestStartTimes = new ConcurrentHashMap<>();

    private volatile String lastProvider = "unknown";

    public void setLastProvider(String provider) {
        this.lastProvider = provider;
    }

    @Override
    public void onRequest(ChatModelRequestContext context) {
        context.attributes().put(TIMING_KEY, System.currentTimeMillis());
        log.info("[LLM REQUEST] Model: {} | Messages: {}",
                context.request().model(),
                context.request().messages().size());
    }

    @Override
    public void onResponse(ChatModelResponseContext context) {
        var request = context.request();
        var response = context.response();
        var tokenUsage = response.tokenUsage();

        int promptTokens = tokenUsage != null ? tokenUsage.inputTokenCount() : 0;
        int completionTokens = tokenUsage != null ? tokenUsage.outputTokenCount() : 0;
        int totalTokens = tokenUsage != null ? tokenUsage.totalTokenCount() : 0;
        long latencyMs = computeLatency(context.attributes());

        LlmMetricRecord record = new LlmMetricRecord(
                Instant.now(),
                request.model(),
                lastProvider,
                latencyMs,
                promptTokens,
                completionTokens,
                totalTokens,
                "SUCCESS",
                null
        );
        saveRecord(record);

        log.info("[LLM RESPONSE] Success | Latency: {}ms | Tokens: [Prompt: {} | Completion: {} | Total: {}]",
                latencyMs, promptTokens, completionTokens, totalTokens);
    }

    @Override
    public void onError(ChatModelErrorContext context) {
        long latencyMs = computeLatency(context.attributes());
        String errorMsg = context.error() != null ? context.error().getMessage() : "Unknown error";
        String model = context.request() != null ? context.request().model() : "unknown";

        LlmMetricRecord record = new LlmMetricRecord(
                Instant.now(),
                model,
                lastProvider,
                latencyMs,
                0,
                0,
                0,
                "ERROR",
                errorMsg
        );
        saveRecord(record);

        log.error("[LLM ERROR] Latency: {}ms | Error: {}", latencyMs, errorMsg);
    }

    private long computeLatency(Map<Object, Object> attributes) {
        Object startMs = attributes.get(TIMING_KEY);
        if (startMs instanceof Long) {
            return System.currentTimeMillis() - (Long) startMs;
        }
        return 0;
    }

    private void saveRecord(LlmMetricRecord record) {
        metricsQueue.add(record);
        while (metricsQueue.size() > MAX_RECORDS) {
            metricsQueue.poll();
        }
    }

    public List<LlmMetricRecord> getMetrics() {
        List<LlmMetricRecord> list = new ArrayList<>(metricsQueue);
        Collections.reverse(list);
        return list;
    }

    public void clearMetrics() {
        metricsQueue.clear();
    }
}
