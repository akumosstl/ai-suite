package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.service.SseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

/**
 * Controlador REST para Server-Sent Events (SSE).
 * 
 * Fornece endpoint para streaming em tempo real de eventos
 * do pipeline para o cliente.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SseController {
    
    @Autowired
    private SseService sseService;
    
    @GetMapping("/pipelines/{pipelineId}/stream")
    public SseEmitter streamPipeline(@PathVariable Long pipelineId) {
        SseEmitter emitter = sseService.addEmitter(pipelineId);
        
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"message\":\"Connected to pipeline " + pipelineId + "\"}"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        
        return emitter;
    }
    
    @GetMapping("/pipeline-runs/{runId}/stream")
    public SseEmitter streamPipelineRun(@PathVariable Long runId) {
        SseEmitter emitter = sseService.addRunEmitter(runId);
        
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"message\":\"Connected to pipeline run " + runId + "\",\"runId\":" + runId + "}"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        
        return emitter;
    }
}
