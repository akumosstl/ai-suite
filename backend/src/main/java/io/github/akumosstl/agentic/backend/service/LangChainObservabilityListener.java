package io.github.akumosstl.agentic.backend.service;

import dev.langchain4j.data.message.UserMessage;
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
    private static final String USER_PROMPT_KEY = "observability.userPrompt";

    private final ConcurrentLinkedQueue<LlmMetricRecord> metricsQueue = new ConcurrentLinkedQueue<>();
    private final Map<Object, Long> requestStartTimes = new ConcurrentHashMap<>();

    private volatile String lastProvider = "unknown";

    public void setLastProvider(String provider) {
        this.lastProvider = provider;
    }

    @Override
    public void onRequest(ChatModelRequestContext context) {
        context.attributes().put(TIMING_KEY, System.currentTimeMillis());
        
        String userPrompt = extractUserPrompt(context.request().messages());
        context.attributes().put(USER_PROMPT_KEY, userPrompt);
        
        log.info("[LLM REQUEST] Model: {} | Messages: {} | UserPrompt: {}",
                context.request().model(),
                context.request().messages().size(),
                userPrompt);
    }
    
    private String extractUserPrompt(List<dev.langchain4j.data.message.ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            log.warn("[LLM PROMPT] Messages is null or empty");
            return "";
        }
        
        for (dev.langchain4j.data.message.ChatMessage msg : messages) {
            log.info("[LLM PROMPT] Message type: {}", msg.getClass().getSimpleName());
            if (msg instanceof UserMessage userMsg) {
                String text = userMsg.singleText();
                log.info("[LLM PROMPT] UserMessage text: {}", text);
                return text != null ? text : "";
            }
        }
        
        log.warn("[LLM PROMPT] No UserMessage found in messages");
        return "";
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
        String userPrompt = getUserPrompt(context.attributes());

        LlmMetricRecord record = new LlmMetricRecord(
                Instant.now(),
                request.model(),
                lastProvider,
                latencyMs,
                promptTokens,
                completionTokens,
                totalTokens,
                "SUCCESS",
                null,
                userPrompt
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
        String userPrompt = getUserPrompt(context.attributes());

        LlmMetricRecord record = new LlmMetricRecord(
                Instant.now(),
                model,
                lastProvider,
                latencyMs,
                0,
                0,
                0,
                "ERROR",
                errorMsg,
                userPrompt
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
    
    private String getUserPrompt(Map<Object, Object> attributes) {
        Object prompt = attributes.get(USER_PROMPT_KEY);
        return prompt != null ? prompt.toString() : "";
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

    public int clearMetricsByDateAndProvider(Instant startDate, Instant endDate, String provider) {
        List<LlmMetricRecord> toRemove = new ArrayList<>();
        for (LlmMetricRecord record : metricsQueue) {
            boolean matchesDate = true;
            boolean matchesProvider = true;

            if (startDate != null && record.timestamp().isBefore(startDate)) {
                matchesDate = false;
            }
            if (endDate != null && record.timestamp().isAfter(endDate)) {
                matchesDate = false;
            }
            if (provider != null && !provider.isEmpty() && !record.provider().equalsIgnoreCase(provider)) {
                matchesProvider = false;
            }

            if (matchesDate && matchesProvider) {
                toRemove.add(record);
            }
        }

        metricsQueue.removeAll(toRemove);
        return toRemove.size();
    }

    public int getMetricsCountByDateAndProvider(Instant startDate, Instant endDate, String provider) {
        int count = 0;
        for (LlmMetricRecord record : metricsQueue) {
            boolean matchesDate = true;
            boolean matchesProvider = true;

            if (startDate != null && record.timestamp().isBefore(startDate)) {
                matchesDate = false;
            }
            if (endDate != null && record.timestamp().isAfter(endDate)) {
                matchesDate = false;
            }
            if (provider != null && !provider.isEmpty() && !record.provider().equalsIgnoreCase(provider)) {
                matchesProvider = false;
            }

            if (matchesDate && matchesProvider) {
                count++;
            }
        }
        return count;
    }

    public void recordMetric(String model, String provider, long latencyMs, 
            int promptTokens, int completionTokens, int totalTokens, 
            String status, String errorMessage, String userPrompt) {
        LlmMetricRecord record = new LlmMetricRecord(
                Instant.now(),
                model,
                provider,
                latencyMs,
                promptTokens,
                completionTokens,
                totalTokens,
                status,
                errorMessage,
                userPrompt
        );
        saveRecord(record);
        log.info("[LLM METRIC] Recorded - Model: {} | Provider: {} | Latency: {}ms | Status: {}", 
                model, provider, latencyMs, status);
    }
}
