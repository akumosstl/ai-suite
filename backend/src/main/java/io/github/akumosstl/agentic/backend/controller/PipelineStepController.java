package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.service.PipelineStepService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Etapas (Steps) de Pipeline.
 * <p>
 * Fornece endpoints para criar, listar, atualizar e remover etapas.
 * Gerencia entrada, saída,CLI e ordenação de etapas.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/pipelines/{pipelineId}/steps")
@CrossOrigin(origins = "*")
public class PipelineStepController {

    @Autowired
    private PipelineStepService pipelineStepService;

    /**
     * Lista todas as etapas de um pipeline.
     *
     * @param pipelineId ID do pipeline
     * @return Lista de etapas
     */
    @GetMapping
    public List<PipelineStep> getSteps(@PathVariable Long pipelineId) {
        return pipelineStepService.getStepsByPipeline(pipelineId);
    }

    /**
     * Busca uma etapa pelo ID.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @return Etapa encontrada
     */
    @GetMapping("/{stepId}")
    public PipelineStep getStep(@PathVariable Long pipelineId, @PathVariable Long stepId) {
        return pipelineStepService.getStepById(stepId);
    }

    /**
     * Adiciona uma nova etapa ao pipeline.
     *
     * @param pipelineId ID do pipeline
     * @param agentId    ID do agente opcional
     * @param scriptId   ID do script opcional
     * @return Etapa criada
     */
    @PostMapping
    public PipelineStep addStep(@PathVariable Long pipelineId,
                                @RequestParam(required = false) Long agentId,
                                @RequestParam(required = false) Long scriptId) {
        return pipelineStepService.addStepToPipeline(pipelineId, agentId, scriptId);
    }

    /**
     * Atualiza uma etapa existente.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @param agentId    Novo ID do agente
     * @return Etapa atualizada
     */
    @PutMapping("/{stepId}")
    public PipelineStep updateStep(@PathVariable Long pipelineId,
                                   @PathVariable Long stepId,
                                   @RequestParam(required = false) Long agentId) {
        return pipelineStepService.updateStep(stepId, agentId);
    }

    /**
     * Remove uma etapa.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @return Response com mensagem
     */
    @DeleteMapping("/{stepId}")
    public ResponseEntity<Map<String, String>> removeStep(@PathVariable Long pipelineId,
                                                          @PathVariable Long stepId) {
        pipelineStepService.removeStep(stepId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Pipeline step removed successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * Remove todas as etapas de um pipeline.
     *
     * @param pipelineId ID do pipeline
     * @return Response com mensagem
     */
    @DeleteMapping
    public ResponseEntity<Map<String, String>> removeAllSteps(@PathVariable Long pipelineId) {
        pipelineStepService.removeStepsByPipeline(pipelineId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "All pipeline steps removed successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * Reordena as etapas de um pipeline.
     *
     * @param pipelineId     ID do pipeline
     * @param stepIdsInOrder Lista de IDs na nova ordem
     * @return Lista de etapas reordenadas
     */
    @PutMapping("/reorder")
    public List<PipelineStep> reorderSteps(@PathVariable Long pipelineId,
                                           @RequestBody List<Long> stepIdsInOrder) {
        return pipelineStepService.reorderSteps(pipelineId, stepIdsInOrder);
    }

    /**
     * Conta as etapas de um pipeline.
     *
     * @param pipelineId ID do pipeline
     * @return Quantidade de etapas
     */
    @GetMapping("/count")
    public Map<String, Long> countSteps(@PathVariable Long pipelineId) {
        long count = pipelineStepService.countSteps(pipelineId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return response;
    }

    /**
     * Salva o conteúdo de entrada de uma etapa.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @param inputData  Dados de entrada (content, type)
     * @return Etapa atualizada
     */
    @PutMapping("/{stepId}/input")
    public PipelineStep saveInput(@PathVariable Long pipelineId,
                                  @PathVariable Long stepId,
                                  @RequestBody Map<String, String> inputData) {
        String content = inputData.get("content");
        String type = inputData.get("type");
        return pipelineStepService.saveInput(stepId, content, type);
    }

    /**
     * Salva o conteúdo de saída de uma etapa.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @param outputData Dados de saída (content, type)
     * @return Etapa atualizada
     */
    @PutMapping("/{stepId}/output")
    public PipelineStep saveOutput(@PathVariable Long pipelineId,
                                   @PathVariable Long stepId,
                                   @RequestBody Map<String, String> outputData) {
        String content = outputData.get("content");
        String type = outputData.get("type");
        return pipelineStepService.saveOutput(stepId, content, type);
    }

    /**
     * Salva a saída de execução de uma etapa.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @param outputData Dados de saída (content, type)
     * @return Etapa atualizada
     */
    @PutMapping("/{stepId}/step-output")
    public PipelineStep saveStepOutput(@PathVariable Long pipelineId,
                                       @PathVariable Long stepId,
                                       @RequestBody Map<String, String> outputData) {
        String content = outputData.get("content");
        String type = outputData.get("type");
        return pipelineStepService.saveStepOutput(stepId, content, type);
    }

    /**
     * Salva configurações de CLI de uma etapa.
     *
     * @param pipelineId ID do pipeline
     * @param stepId     ID da etapa
     * @param cliData    Dados do CLI (cli, parameters, arguments, runtime)
     * @return Etapa atualizada
     */
    @PutMapping("/{stepId}/cli")
    public PipelineStep saveCli(@PathVariable Long pipelineId,
                                @PathVariable Long stepId,
                                @RequestBody Map<String, String> cliData) {
        String cli = cliData.get("cli");
        String parameters = cliData.get("parameters");
        String arguments = cliData.get("arguments");
        String runtime = cliData.get("runtime");
        return pipelineStepService.saveCli(stepId, cli, parameters, arguments, runtime);
    }

    @PutMapping("/{stepId}/engine")
    public PipelineStep saveEngine(@PathVariable Long pipelineId,
                                   @PathVariable Long stepId,
                                   @RequestBody Map<String, String> engineData) {
        String engine = engineData.get("engine");
        String llmProvider = engineData.get("llmProvider");
        String llmModel = engineData.get("llmModel");
        return pipelineStepService.saveStepEngine(stepId, engine, llmProvider, llmModel);
    }
}