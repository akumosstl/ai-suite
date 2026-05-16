package io.github.akumosstl.agentic.backend.service;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.anthropic.AnthropicStreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.chat.listener.ChatModelListener;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.googleai.GoogleAiGeminiStreamingChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class LangchainEngineService {

    private static final Logger log = LoggerFactory.getLogger(LangchainEngineService.class);
    private static final Duration STREAM_TIMEOUT = Duration.ofMinutes(5);
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 2000;

    @Autowired
    private AppConfigService appConfigService;

    @Autowired
    private SseService sseService;

    @Autowired
    @Lazy
    private PipelineStepService pipelineStepService;

    @Autowired
    private LangChainObservabilityListener observabilityListener;

    public String executeStreaming(
        String prompt, Long pipelineId, Long runId, Long stepId, int stepOrder,
        String provider, String modelName
    ) throws Exception {

        String resolvedProvider = resolveProvider(provider);
        String resolvedModel = resolveModelName(resolvedProvider, modelName);

        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 1) {
                    sendSseStepOutput(runId, pipelineId, stepId, stepOrder,
                        "Retry attempt " + attempt + "/" + MAX_RETRIES + "...\n", "running");
                }
                return doStreaming(prompt, pipelineId, runId, stepId, stepOrder,
                    resolvedProvider, resolvedModel, attempt);
            } catch (Exception e) {
                lastException = e;
                if (isRetryable(e) && attempt < MAX_RETRIES && !isPipelineStopped(pipelineId)) {
                    log.warn("Streaming attempt {}/{} failed for provider={}, model={}: {}",
                        attempt, MAX_RETRIES, resolvedProvider, resolvedModel, e.getMessage());
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                } else {
                    throw e;
                }
            }
        }
        throw lastException;
    }

    private String doStreaming(
        String prompt, Long pipelineId, Long runId, Long stepId, int stepOrder,
        String provider, String model, int attempt
    ) throws Exception {

        StreamingChatLanguageModel streamingModel = createStreamingModel(provider, model);

        ChatMessage userMessage = UserMessage.from(prompt);
        StringBuilder fullResponse = new StringBuilder();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> error = new AtomicReference<>();
        AtomicReference<Long> startTime = new AtomicReference<>(System.currentTimeMillis());
        AtomicReference<Integer> promptTokens = new AtomicReference<>(0);
        AtomicReference<Integer> completionTokens = new AtomicReference<>(0);
        AtomicReference<Integer> totalTokens = new AtomicReference<>(0);

        streamingModel.chat(List.of(userMessage), new StreamingChatResponseHandler() {
            @Override
            public void onPartialResponse(String partialResponse) {
                if (isPipelineStopped(pipelineId)) {
                    return;
                }
                fullResponse.append(partialResponse);
                sendSseStepOutput(runId, pipelineId, stepId, stepOrder, partialResponse, "running");
            }

            @Override
            public void onCompleteResponse(ChatResponse response) {
                var tokenUsage = response.tokenUsage();
                if (tokenUsage != null) {
                    promptTokens.set(tokenUsage.inputTokenCount());
                    completionTokens.set(tokenUsage.outputTokenCount());
                    totalTokens.set(tokenUsage.totalTokenCount());
                }
                latch.countDown();
            }

            @Override
            public void onError(Throwable t) {
                log.error("LangChain4j streaming error for provider={}, model={}, attempt={}: {}",
                    provider, model, attempt, t.getMessage(), t);
                long latencyMs = System.currentTimeMillis() - startTime.get();
                error.set(t);
                latch.countDown();
            }
        });

        boolean completed = latch.await(5, TimeUnit.MINUTES);

        if (!completed) {
            throw new RuntimeException("LangChain4j streaming timed out after 5 minutes (provider=" + provider + ", model=" + model + ")");
        }

        if (error.get() != null) {
            throw new RuntimeException("LangChain4j streaming error: " + error.get().getMessage()
                + " (provider=" + provider + ", model=" + model + ")", error.get());
        }

        long latencyMs = System.currentTimeMillis() - startTime.get();

        return fullResponse.toString();
    }

    private boolean isRetryable(Exception e) {
        if (e == null) return false;
        String msg = e.getMessage();
        if (msg == null) return true;
        String lower = msg.toLowerCase();
        return lower.contains("closed")
            || lower.contains("timeout")
            || lower.contains("timed out")
            || lower.contains("connection reset")
            || lower.contains("broken pipe")
            || lower.contains("429")
            || lower.contains("rate limit")
            || lower.contains("overloaded")
            || lower.contains("503")
            || lower.contains("500")
            || lower.contains("502")
            || lower.contains("socket")
            || lower.contains("connection refused")
            || lower.contains("internal server error");
    }

    private StreamingChatLanguageModel createStreamingModel(String provider, String modelName) {
        observabilityListener.setLastProvider(provider);
        List<ChatModelListener> listeners = Collections.singletonList(observabilityListener);

        switch (provider) {
            case "openai": {
                String apiKey = appConfigService.getUnmaskedValue("openai.api.key");
                if (apiKey == null || apiKey.isEmpty()) {
                    throw new RuntimeException("OpenAI API Key not configured. Set it in Settings > AI Engine.");
                }
                String baseUrl = appConfigService.getConfigValue("openai.base.url");
                if (baseUrl != null) {
                    baseUrl = baseUrl.trim();
                    if (baseUrl.endsWith("/")) {
                        baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
                    }
                }
                var builder = OpenAiStreamingChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName != null ? modelName : "gpt-4o-mini")
                    .timeout(STREAM_TIMEOUT)
                    .listeners(listeners);
                if (baseUrl != null && !baseUrl.isEmpty()) {
                    builder.baseUrl(baseUrl);
                }
                return builder.build();
            }
            case "google": {
                String apiKey = appConfigService.getUnmaskedValue("google.api.key");
                if (apiKey == null || apiKey.isEmpty()) {
                    throw new RuntimeException("Google Gemini API Key not configured. Set it in Settings > AI Engine.");
                }
                return GoogleAiGeminiStreamingChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName != null ? modelName : "gemini-2.0-flash")
                    .timeout(STREAM_TIMEOUT)
                    .maxRetries(3)
                    .listeners(listeners)
                    .build();
            }
            case "anthropic": {
                String apiKey = appConfigService.getUnmaskedValue("anthropic.api.key");
                if (apiKey == null || apiKey.isEmpty()) {
                    throw new RuntimeException("Anthropic API Key not configured. Set it in Settings > AI Engine.");
                }
                return AnthropicStreamingChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName != null ? modelName : "claude-3-5-haiku-20241022")
                    .timeout(STREAM_TIMEOUT)
                    .listeners(listeners)
                    .build();
            }
            default:
                throw new RuntimeException("Unknown LLM provider: " + provider);
        }
    }

    private String resolveProvider(String stepProvider) {
        if (stepProvider != null && !stepProvider.isEmpty()) {
            return stepProvider;
        }
        String defaultProvider = appConfigService.getConfigValue("default.llm.provider");
        return (defaultProvider != null && !defaultProvider.isEmpty()) ? defaultProvider : "openai";
    }

    private String resolveModelName(String provider, String stepModel) {
        if (stepModel != null && !stepModel.isEmpty()) {
            return stepModel;
        }
        String modelKey = switch (provider) {
            case "openai" -> "openai.default.model";
            case "google" -> "google.default.model";
            case "anthropic" -> "anthropic.default.model";
            default -> null;
        };
        if (modelKey != null) {
            String defaultModel = appConfigService.getConfigValue(modelKey);
            if (defaultModel != null && !defaultModel.isEmpty()) {
                return defaultModel;
            }
        }
        return switch (provider) {
            case "openai" -> "gpt-4o-mini";
            case "google" -> "gemini-2.0-flash";
            case "anthropic" -> "claude-3-5-haiku-20241022";
            default -> "gpt-4o-mini";
        };
    }

    private boolean isPipelineStopped(Long pipelineId) {
        return pipelineStepService.isPipelineStopped(pipelineId);
    }

    private void sendSseStepOutput(Long runId, Long pipelineId, Long stepId, int stepOrder, String output, String status) {
        if (runId != null) {
            sseService.sendStepOutputToRun(runId, pipelineId, stepId, stepOrder, output, status);
        } else {
            sseService.sendStepOutput(pipelineId, stepId, stepOrder, output, status);
        }
    }
}
