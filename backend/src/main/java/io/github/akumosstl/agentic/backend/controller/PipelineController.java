package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import io.github.akumosstl.agentic.backend.service.PipelineStepService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/pipelines")
@CrossOrigin(origins = "*")
public class PipelineController {
    
    @Autowired
    private PipelineService pipelineService;
    
    @Autowired
    private PipelineStepService pipelineStepService;
    
    @Autowired
    private PipelineRunRepository pipelineRunRepository;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPipelines(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Pipeline> pipelinePage = pipelineService.getPipelinesByProject(projectId, page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("pipelines", pipelinePage.getContent());
        response.put("currentPage", page);
        response.put("totalElements", pipelinePage.getTotalElements());
        response.put("totalPages", pipelinePage.getTotalPages());
        response.put("pageSize", size);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Pipeline> getTop10Pipelines(@PathVariable Long projectId) {
        return pipelineService.getTop10PipelinesByProject(projectId);
    }
    
    @GetMapping("/{id}")
    public Pipeline getPipeline(@PathVariable Long projectId, @PathVariable Long id) {
        return pipelineService.getPipelineById(id);
    }
    
    @PostMapping
    public Pipeline createPipeline(@PathVariable Long projectId, @RequestBody Pipeline pipeline) {
        return pipelineService.createPipeline(projectId, pipeline);
    }
    
    @PutMapping("/{id}")
    public Pipeline updatePipeline(@PathVariable Long projectId, @PathVariable Long id, 
                                   @RequestBody Pipeline pipelineDetails) {
        return pipelineService.updatePipeline(id, pipelineDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePipeline(@PathVariable Long projectId, 
                                                               @PathVariable Long id) {
        pipelineService.deletePipeline(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Pipeline deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/status/{status}")
    public List<Pipeline> getPipelinesByStatus(@PathVariable Long projectId, 
                                                @PathVariable String status) {
        return pipelineService.getPipelinesByProjectAndStatus(projectId, status);
    }
    
    @PostMapping("/{id}/run")
    public Map<String, Object> runPipeline(@PathVariable Long projectId, @PathVariable Long id) {
        pipelineService.runPipeline(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Pipeline execution started");
        response.put("pipelineId", id);
        
        return response;
    }
    
    @PostMapping("/{id}/continue")
    public Map<String, Object> continuePipeline(@PathVariable Long projectId, @PathVariable Long id) {
        pipelineStepService.resumePipeline(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Pipeline continued");
        response.put("pipelineId", id);
        
        return response;
    }
    
    @GetMapping("/{id}/paused")
    public Map<String, Object> isPipelinePaused(@PathVariable Long projectId, @PathVariable Long id) {
        boolean paused = pipelineStepService.isPipelinePaused(id);
        Integer pendingStepOrder = pipelineStepService.getPendingStepOrder(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("paused", paused);
        response.put("pipelineId", id);
        response.put("pendingStepOrder", pendingStepOrder);
        
        return response;
    }
    
    @PostMapping("/{id}/stop")
    public Map<String, Object> stopPipeline(@PathVariable Long projectId, @PathVariable Long id) {
        pipelineStepService.stopPipelineExecution(id);
        
        Pipeline pipeline = pipelineService.getPipelineById(id);
        pipeline.setStatus("stopped");
        pipelineService.getPipelineRepository().save(pipeline);
        
        List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(id);
        if (runs != null && !runs.isEmpty()) {
            PipelineRun run = runs.get(0);
            run.setStatus("stopped");
            pipelineRunRepository.save(run);
            
            for (PipelineRunStep step : run.getSteps()) {
                if ("running".equals(step.getStatus()) || "ready".equals(step.getStatus())) {
                    step.setStatus("stopped");
                }
            }
            pipelineRunRepository.save(run);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Pipeline stopped");
        response.put("pipelineId", id);
        
        return response;
    }
    
    @PostMapping("/{id}/pause")
    public Map<String, Object> pausePipeline(@PathVariable Long projectId, @PathVariable Long id) {
        pipelineStepService.pausePipelineExecution(id);
        
        Pipeline pipeline = pipelineService.getPipelineById(id);
        pipeline.setStatus("paused");
        pipelineService.getPipelineRepository().save(pipeline);
        
        List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(id);
        if (runs != null && !runs.isEmpty()) {
            PipelineRun run = runs.get(0);
            run.setStatus("paused");
            run.setCompletedAt(java.time.LocalDateTime.now());
            pipelineRunRepository.save(run);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Pipeline paused successfully");
        response.put("pipelineId", id);
        
        return response;
    }
}
