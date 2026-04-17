package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.service.PipelineRunService;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Execuções de Pipeline (PipelineRun).
 * 
 * Fornece endpoints para criar, listar e atualizar execuções de pipelines.
 * Gerencia etapas de execução e conclusão de runs.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PipelineRunController {
    
    @Autowired
    private PipelineRunService pipelineRunService;
    
    @Autowired
    private PipelineService pipelineService;
    
    /**
     * Lista execuções de pipelines de um projeto.
     * 
     * @param projectId ID do projeto
     * @param page Número da página
     * @param size Tamanho da página
     * @return Lista de execuções com paginação
     */
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
    
    /**
     * Lista execuções de um pipeline específico.
     * 
     * @param pipelineId ID do pipeline
     * @param page Número da página
     * @param size Tamanho da página
     * @return Lista de execuções
     */
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
    
    /**
     * Busca uma execução pelo ID.
     * 
     * @param id ID da execução
     * @return Execução encontrada
     */
    @GetMapping("/pipeline-runs/{id}")
    public PipelineRun getRunById(@PathVariable Long id) {
        return pipelineRunService.getRunById(id);
    }
    
    /**
     * Obtém a saída de uma etapa específica de uma execução.
     * 
     * @param runId ID da execução
     * @param stepOrder Ordem da etapa
     * @return Dados da etapa
     */
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
                    response.put("agentCategory", step.getAgentCategory());
                    response.put("scriptName", step.getScriptName());
                    response.put("scriptCategory", step.getScriptCategory());
                    response.put("scriptNamespace", step.getScriptNamespace());
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
    
    /**
     * Cria uma nova execução para um pipeline.
     * 
     * @param pipelineId ID do pipeline
     * @return Execução criada
     */
    @PostMapping("/pipelines/{pipelineId}/runs")
    public PipelineRun createRun(@PathVariable Long pipelineId) {
        System.out.println("DEBUG: createRun called with pipelineId=" + pipelineId);
        PipelineRun run = pipelineRunService.createRun(pipelineId);
        System.out.println("DEBUG: Created run " + run.getId() + " for pipeline " + run.getPipeline().getId());
        
        new Thread(() -> {
            try {
                System.out.println("DEBUG: Starting pipeline execution for pipelineId=" + pipelineId + ", runId=" + run.getId());
                pipelineService.runPipelineDirect(pipelineId, run.getId());
            } catch (Exception e) {
                System.err.println("Error starting pipeline run: " + e.getMessage());
            }
        }).start();
        
        return run;
    }
    
    /**
     * Atualiza uma etapa de uma execução.
     * 
     * @param runId ID da execução
     * @param stepOrder Ordem da etapa
     * @param body Dados atualizados (status, outputContent, outputType)
     * @return Execução atualizada
     */
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
    
    /**
     * Finaliza uma execução.
     * 
     * @param runId ID da execução
     * @param body Status final (sucesso ou falha)
     * @return Execução finalizada
     */
    @PutMapping("/pipeline-runs/{runId}/complete")
    public PipelineRun completeRun(@PathVariable Long runId, @RequestBody Map<String, String> body) {
        String finalStatus = body.get("status");
        return pipelineRunService.completeRun(runId, finalStatus);
    }
    
    /**
     * Exclui uma execução.
     * 
     * @param id ID da execução
     * @return Response com mensagem
     */
    @DeleteMapping("/pipeline-runs/{id}")
    public ResponseEntity<Map<String, String>> deleteRun(@PathVariable Long id) {
        pipelineRunService.deleteRun(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Pipeline run deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/all-pipeline-runs")
    public ResponseEntity<Map<String, Object>> getAllRuns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String projectName) {
        Page<PipelineRun> runPage = pipelineRunService.getAllRuns(page, size, projectName);
        
        Map<String, Object> response = new HashMap<>();
        response.put("runs", runPage.getContent());
        response.put("currentPage", page);
        response.put("totalElements", runPage.getTotalElements());
        response.put("totalPages", runPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/all-pipeline-runs/top20")
    public List<PipelineRun> getTop20AllRuns() {
        return pipelineRunService.getTop20AllRuns();
    }
    
    @DeleteMapping("/all-pipeline-runs/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupAllRuns() {
        int deletedCount = pipelineRunService.deleteAllNonRunningRuns();
        
        Map<String, Object> response = new HashMap<>();
        response.put("deletedCount", deletedCount);
        response.put("message", "Cleanup completed successfully");
        
        return ResponseEntity.ok(response);
    }
}
