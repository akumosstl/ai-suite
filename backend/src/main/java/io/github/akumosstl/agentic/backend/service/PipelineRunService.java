package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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
    
    @Autowired
    private PipelineRunRepository pipelineRunRepository;
    
    @Lazy
    @Autowired
    private PipelineService pipelineService;
    
    @Lazy
    @Autowired
    private PipelineStepService pipelineStepService;
    
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
        Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
        PipelineRun run = new PipelineRun(pipeline);
        run.setStatus("running");
        
        List<PipelineStep> steps = pipelineStepService.getStepsByPipeline(pipelineId);
        if (steps != null) {
            for (PipelineStep step : steps) {
                PipelineRunStep runStep = new PipelineRunStep(step.getStepOrder());
                runStep.setStatus("ready");
                runStep.setAgentName(step.getAgent() != null ? step.getAgent().getName() : null);
                runStep.setAgentNamespace(step.getAgent() != null ? step.getAgent().getNamespace() : null);
                runStep.setScriptName(step.getScript() != null ? step.getScript().getName() : null);
                runStep.setScriptNamespace(step.getScript() != null ? step.getScript().getNamespace() : null);
                runStep.setInputContent(step.getInputContent());
                runStep.setInputType(step.getInputType());
                runStep.setOutputContent("");
                runStep.setOutputType(step.getOutputType());
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
    public void deleteRun(Long id) {
        pipelineRunRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteRunsByPipeline(Long pipelineId) {
        List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(pipelineId);
        pipelineRunRepository.deleteAll(runs);
    }
    
    public Page<PipelineRun> getAllRuns(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return pipelineRunRepository.findAll(pageable);
    }
    
    public List<PipelineRun> getTop20AllRuns() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        return pipelineRunRepository.findAll(pageable).getContent();
    }
    
    @Transactional
    public int deleteAllNonRunningRuns() {
        List<PipelineRun> nonRunningRuns = pipelineRunRepository.findByStatusNot("running");
        int count = nonRunningRuns.size();
        pipelineRunRepository.deleteAll(nonRunningRuns);
        return count;
    }
}
