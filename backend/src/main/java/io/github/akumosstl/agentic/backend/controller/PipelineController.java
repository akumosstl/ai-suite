package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import io.github.akumosstl.agentic.backend.service.PipelineStepService;
import io.github.akumosstl.agentic.backend.service.SseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Pipelines.
 * <p>
 * Fornece endpoints para criar, listar, atualizar e excluir pipelines.
 * Suporta execução, pausa, continuação e parada de pipelines.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/projects/{projectId}/pipelines")
@CrossOrigin(origins = "*")
public class PipelineController {

    @Autowired
    private PipelineService pipelineService;

    @Autowired
    private PipelineStepService pipelineStepService;

    @Autowired
    private SseService sseService;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    /**
     * Lista pipelines de um projeto com paginação.
     *
     * @param projectId ID do projeto
     * @param page      Número da página
     * @param size      Tamanho da página
     * @return Lista de pipelines com informações de paginação
     */
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

    /**
     * Busca um pipeline pelo ID.
     *
     * @param projectId ID do projeto
     * @param id        ID do pipeline
     * @return Pipeline encontrado
     */
    @GetMapping("/{id}")
    public Pipeline getPipeline(@PathVariable Long projectId, @PathVariable Long id) {
        return pipelineService.getPipelineById(id);
    }

    /**
     * Cria um novo pipeline.
     *
     * @param projectId ID do projeto
     * @param pipeline  Dados do pipeline
     * @return Pipeline criado
     */
    @PostMapping
    public Pipeline createPipeline(@PathVariable Long projectId, @RequestBody Pipeline pipeline) {
        return pipelineService.createPipeline(projectId, pipeline);
    }

    /**
     * Atualiza um pipeline existente.
     *
     * @param projectId       ID do projeto
     * @param id              ID do pipeline
     * @param pipelineDetails Novos dados
     * @return Pipeline atualizado
     */
    @PutMapping("/{id}")
    public Pipeline updatePipeline(@PathVariable Long projectId, @PathVariable Long id,
                                   @RequestBody Pipeline pipelineDetails) {
        return pipelineService.updatePipeline(id, pipelineDetails);
    }

    /**
     * Exclui um pipeline.
     *
     * @param projectId ID do projeto
     * @param id        ID do pipeline
     * @return Response com mensagem de sucesso
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePipeline(@PathVariable Long projectId,
                                                              @PathVariable Long id) {
        pipelineService.deletePipeline(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Pipeline deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * Lista pipelines por status.
     *
     * @param projectId ID do projeto
     * @param status    Status a filtrar
     * @return Lista de pipelines
     */
    @GetMapping("/status/{status}")
    public List<Pipeline> getPipelinesByStatus(@PathVariable Long projectId,
                                               @PathVariable String status) {
        return pipelineService.getPipelinesByProjectAndStatus(projectId, status);
    }

    /**
     * Executa um pipeline.
     *
     * @param projectId ID do projeto
     * @param id        ID do pipeline
     * @return Response indicando início da execução
     */
    @PostMapping("/{id}/run")
    public Map<String, Object> runPipeline(@PathVariable Long projectId, @PathVariable Long id) {
        pipelineService.runPipeline(id);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Pipeline execution started");
        response.put("pipelineId", id);

        return response;
    }

    /**
     * Para a execução de um pipeline.
     *
     * @param projectId ID do projeto
     * @param id        ID do pipeline
     * @return Response indicando parada
     */
    @PostMapping("/{id}/stop")
    public Map<String, Object> stopPipeline(@PathVariable Long projectId, @PathVariable Long id) {
        pipelineStepService.stopPipelineExecution(id);

        var pipeline = pipelineService.getPipelineById(id);
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

    @PostMapping("/{id}/duplicate")
    public Pipeline duplicatePipeline(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String newName = body != null ? body.get("name") : null;
        return pipelineService.duplicatePipeline(id, newName);
    }
}
