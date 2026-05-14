package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PipelineRunService {

    private static final Logger logger = LoggerFactory.getLogger(PipelineRunService.class);

    private final PipelineRunRepository pipelineRunRepository;
    private final PipelineStepService pipelineStepService;
    private final ObjectProvider<PipelineService> pipelineServiceProvider;

    @Autowired
    public PipelineRunService(
            PipelineRunRepository pipelineRunRepository,
            PipelineStepService pipelineStepService,
            ObjectProvider<PipelineService> pipelineServiceProvider) {
        this.pipelineRunRepository = pipelineRunRepository;
        this.pipelineStepService = pipelineStepService;
        this.pipelineServiceProvider = pipelineServiceProvider;
    }

    private PipelineService getPipelineService() {
        return pipelineServiceProvider.getObject();
    }

    public List<PipelineRun> getTop20RunsByPipeline(Long pipelineId) {
        return pipelineRunRepository.findTop20ByPipeline_IdOrderByCreatedAtDesc(pipelineId);
    }

    public List<PipelineRun> getTop20RunsByProject(Long projectId) {
        return pipelineRunRepository.findTop20ByPipeline_Project_IdOrderByCreatedAtDesc(projectId);
    }

    public Page<PipelineRun> getRunsByPipeline(Long pipelineId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(pipelineId, pageable);
    }

    public PipelineRun getRunById(Long id) {
        return pipelineRunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pipeline run not found"));
    }

    public Long getPipelineIdByRunId(Long runId) {
        PipelineRun run = getRunById(runId);
        return run.getPipeline().getId();
    }

    @Transactional
    public PipelineRun createRun(Long pipelineId) {
        Pipeline pipeline = getPipelineService().getPipelineById(pipelineId);
        PipelineRun run = new PipelineRun(pipeline);
        run.setStatus("running");

        List<PipelineStep> steps = pipelineStepService.getStepsByPipeline(pipelineId);
        if (steps != null) {
            for (PipelineStep step : steps) {
                PipelineRunStep runStep = new PipelineRunStep(step.getStepOrder());
                runStep.setStatus("ready");
                runStep.setName(step.getName());
                runStep.setType(step.getType());
                runStep.setRuntime(step.getRuntime());
                runStep.setAgent(step.getAgent());
                runStep.setScript(step.getScript());
                runStep.setAgentName(step.getAgent() != null ? step.getAgent().getName() : null);
                runStep.setAgentNamespace(step.getAgent() != null ? step.getAgent().getNamespace() : null);
                runStep.setAgentPrompt(step.getAgent() != null ? step.getAgent().getPrompt() : null);
                runStep.setScriptName(step.getScript() != null ? step.getScript().getName() : null);
                runStep.setScriptNamespace(step.getScript() != null ? step.getScript().getNamespace() : null);
                runStep.setScriptContent(step.getScript() != null ? step.getScript().getContent() : null);
                runStep.setInputContent(step.getInputContent());
                runStep.setInputType(step.getInputType());
                runStep.setOutputContent("");
                runStep.setOutputType(step.getOutputType());
                runStep.setStepOutput(step.getStepOutput());
                runStep.setStepOutputType(step.getStepOutputType());
            runStep.setCli(step.getCli());
            runStep.setParameters(step.getParameters());
            runStep.setArguments(step.getArguments());
            runStep.setEngine(step.getEngine());
            runStep.setLlmProvider(step.getLlmProvider());
            runStep.setLlmModel(step.getLlmModel());
            run.addStep(runStep);
            }
        }

        return pipelineRunRepository.save(run);
    }

    @Transactional
    public PipelineRun updateRunStep(Long runId, Integer stepOrder, String status, String outputContent, String outputType) {
        PipelineRun run = getRunById(runId);

        for (PipelineRunStep step : run.getSteps()) {
            if (step.getStepOrder().equals(stepOrder)) {
                step.setStatus(status);
                if (outputContent != null) {
                    step.setOutputContent(outputContent);
                }
                if (outputType != null) {
                    step.setOutputType(outputType);
                }
                break;
            }
        }

        return pipelineRunRepository.save(run);
    }

    @Transactional
    public PipelineRun completeRun(Long runId, String finalStatus) {
        PipelineRun run = getRunById(runId);
        run.setStatus(finalStatus);
        run.setCompletedAt(LocalDateTime.now());
        return pipelineRunRepository.save(run);
    }

    @Transactional
    public PipelineRun saveRun(PipelineRun run) {
        return pipelineRunRepository.save(run);
    }

    @Transactional
    public void deleteRun(Long id) {
        PipelineRun run = getRunById(id);
        run.getSteps().clear();
        pipelineRunRepository.delete(run);
    }

    @Transactional
    public void deleteRunsByPipeline(Long pipelineId) {
        List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(pipelineId);
        for (PipelineRun run : runs) {
            run.getSteps().clear();
        }
        pipelineRunRepository.deleteAll(runs);
    }

    public Page<PipelineRun> getAllRuns(int page, int size, String projectName) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (projectName != null && !projectName.isEmpty()) {
            return pipelineRunRepository.findByPipeline_Project_NameContainingIgnoreCase(projectName, pageable);
        }
        return pipelineRunRepository.findAll(pageable);
    }

    public List<PipelineRun> getTop20AllRuns() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        return pipelineRunRepository.findAll(pageable).getContent();
    }

    @Transactional
    public int deleteAllNonRunningRuns() {
        logger.info("Starting cleanup of non-running pipeline runs using native query");

        // First delete all steps for non-running runs
        pipelineRunRepository.deleteStepsByNonRunningRuns();
        logger.info("Deleted steps for non-running runs");

        // Then delete the runs themselves
        int deletedCount = pipelineRunRepository.deleteAllNonRunningRunsNative();
        logger.info("Native query deleted {} pipeline runs", deletedCount);

        return deletedCount;
    }
}