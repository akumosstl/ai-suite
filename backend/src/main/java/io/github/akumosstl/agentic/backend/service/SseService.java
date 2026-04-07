package io.github.akumosstl.agentic.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseService {
    
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    
    public SseEmitter addEmitter(Long pipelineId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.computeIfAbsent(pipelineId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        
        emitter.onCompletion(() -> removeEmitter(pipelineId, emitter));
        emitter.onTimeout(() -> removeEmitter(pipelineId, emitter));
        emitter.onError(e -> removeEmitter(pipelineId, emitter));
        
        return emitter;
    }
    
    private void removeEmitter(Long pipelineId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(pipelineId);
        if (list != null) {
            list.remove(emitter);
        }
    }
    
    public void sendStepOutput(Long pipelineId, Long stepId, Integer stepOrder, String output, String status) {
        List<SseEmitter> list = emitters.get(pipelineId);
        if (list == null) return;
        
        StringBuilder data = new StringBuilder();
        data.append("{\"stepId\":").append(stepId);
        if (stepOrder != null) {
            data.append(",\"stepOrder\":").append(stepOrder);
        }
        data.append(",\"output\":\"").append(escapeJson(output)).append("\"");
        data.append(",\"status\":\"").append(status).append("\"}");
        
        for (SseEmitter emitter : list) {
            try {
                System.out.println(data.toString());
                emitter.send(SseEmitter.event()
                    .name("step-output")
                    .data(data.toString()));
            } catch (IOException e) {
                removeEmitter(pipelineId, emitter);
            }
        }
    }
    
    public void sendPipelineComplete(Long pipelineId, String status) {
        List<SseEmitter> list = emitters.get(pipelineId);
        if (list == null) return;
        
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                    .name("pipeline-complete")
                    .data("{\"status\":\"" + status + "\"}"));
            } catch (IOException e) {
                removeEmitter(pipelineId, emitter);
            }
        }
        emitters.remove(pipelineId);
    }
    
    public void sendPipelinePaused(Long pipelineId, int completedStepOrder, int nextStepOrder) {
        List<SseEmitter> list = emitters.get(pipelineId);
        if (list == null) return;
        
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                    .name("pipeline-paused")
                    .data("{\"completedStepOrder\":" + completedStepOrder + ",\"nextStepOrder\":" + nextStepOrder + "}"));
            } catch (IOException e) {
                removeEmitter(pipelineId, emitter);
            }
        }
    }
    
    public void sendStepError(Long pipelineId, Long stepId, String error, String stackTrace) {
        List<SseEmitter> list = emitters.get(pipelineId);
        if (list == null) return;
        
        StringBuilder data = new StringBuilder();
        data.append("{\"stepId\":").append(stepId);
        data.append(",\"error\":\"").append(escapeJson(error)).append("\"");
        if (stackTrace != null && !stackTrace.isEmpty()) {
            data.append(",\"stackTrace\":\"").append(escapeJson(stackTrace)).append("\"");
        }
        data.append("}");
        
        for (SseEmitter emitter : list) {
            try {
                System.out.println(data.toString());
                emitter.send(SseEmitter.event()
                    .name("step-error")
                    .data(data.toString()));
            } catch (IOException e) {
                removeEmitter(pipelineId, emitter);
            }
        }
    }
    
    private String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder result = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '\\': result.append("\\\\"); break;
                case '"': result.append("\\\""); break;
                case '\n': result.append("\\n"); break;
                case '\r': result.append("\\r"); break;
                case '\t': result.append("\\t"); break;
                case '\b': result.append("\\b"); break;
                case '\f': result.append("\\f"); break;
                default:
                    if (c < 32) {
                        result.append(String.format("\\u%04x", (int) c));
                    } else {
                        result.append(c);
                    }
            }
        }
        return result.toString();
    }
}
