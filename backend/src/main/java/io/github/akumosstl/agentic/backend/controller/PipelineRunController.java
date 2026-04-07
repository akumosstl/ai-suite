package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.service.PipelineRunService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PipelineRunController {
    
    @Autowired
    private PipelineRunService pipelineRunService;
    
    @GetMapping("/projects/{projectId}/pipeline-runs")
    public ResponseEntity<Map<String, Object>> getRunsByProject(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<PipelineRun> runPage = pipelineRunService.getRunsByPipeline(projectId, page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("runs", runPage.getContent());
        response.put("currentPage", page);
        response.put("totalElements", runPage.getTotalElements());
        response.put("totalPages", runPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/projects/{projectId}/pipeline-runs/top20")
    public List<PipelineRun> getTop20RunsByProject(@PathVariable Long projectId) {
        return pipelineRunService.getTop20RunsByProject(projectId);
    }
    
    @GetMapping("/pipelines/{pipelineId}/runs")
    public ResponseEntity<Map<String, Object>> getRunsByPipeline(
            @PathVariable Long pipelineId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<PipelineRun> runPage = pipelineRunService.getRunsByPipeline(pipelineId, page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("runs", runPage.getContent());
        response.put("currentPage", page);
        response.put("totalElements", runPage.getTotalElements());
        response.put("totalPages", runPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/pipelines/{pipelineId}/runs/top20")
    public List<PipelineRun> getTop20RunsByPipeline(@PathVariable Long pipelineId) {
        return pipelineRunService.getTop20RunsByPipeline(pipelineId);
    }
    
    @GetMapping("/pipeline-runs/{id}")
    public PipelineRun getRunById(@PathVariable Long id) {
        return pipelineRunService.getRunById(id);
    }
    
    @GetMapping("/pipeline-runs/{runId}/steps/{stepOrder}")
    public Map<String, Object> getRunStepOutput(
            @PathVariable Long runId,
            @PathVariable Integer stepOrder) {
        PipelineRun run = pipelineRunService.getRunById(runId);
        Map<String, Object> response = new HashMap<>();
        
        if (run != null && run.getSteps() != null) {
            for (PipelineRunStep step : run.getSteps()) {
                if (step.getStepOrder() != null && step.getStepOrder().equals(stepOrder)) {
                    response.put("runId", run.getId());
                    response.put("runStatus", run.getStatus());
                    response.put("startedAt", run.getStartedAt());
                    response.put("completedAt", run.getCompletedAt());
                    response.put("stepOrder", step.getStepOrder());
                    response.put("agentName", step.getAgentName());
                    response.put("scriptName", step.getScriptName());
                    response.put("status", step.getStatus());
                    response.put("inputContent", step.getInputContent());
                    response.put("inputType", step.getInputType());
                    response.put("outputContent", step.getOutputContent());
                    response.put("outputType", step.getOutputType());
                    response.put("createdAt", step.getCreatedAt());
                    response.put("updatedAt", step.getUpdatedAt());
                    break;
                }
            }
        }
        
        return response;
    }
    
    @PostMapping("/pipelines/{pipelineId}/runs")
    public PipelineRun createRun(@PathVariable Long pipelineId) {
        return pipelineRunService.createRun(pipelineId);
    }
    
    @PutMapping("/pipeline-runs/{runId}/steps/{stepOrder}")
    public PipelineRun updateRunStep(
            @PathVariable Long runId,
            @PathVariable Integer stepOrder,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String outputContent = body.get("outputContent");
        String outputType = body.get("outputType");
        return pipelineRunService.updateRunStep(runId, stepOrder, status, outputContent, outputType);
    }
    
    @PutMapping("/pipeline-runs/{runId}/complete")
    public PipelineRun completeRun(@PathVariable Long runId, @RequestBody Map<String, String> body) {
        String finalStatus = body.get("status");
        return pipelineRunService.completeRun(runId, finalStatus);
    }
    
    @DeleteMapping("/pipeline-runs/{id}")
    public ResponseEntity<Map<String, String>> deleteRun(@PathVariable Long id) {
        pipelineRunService.deleteRun(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Pipeline run deleted successfully");
        
        return ResponseEntity.ok(response);
    }
}
