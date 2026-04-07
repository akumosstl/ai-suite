package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PipelineRecoveryService implements CommandLineRunner {
    
    private final PipelineRunRepository pipelineRunRepository;
    private final PipelineRepository pipelineRepository;
    
    public PipelineRecoveryService(PipelineRunRepository pipelineRunRepository,
                                   PipelineRepository pipelineRepository) {
        this.pipelineRunRepository = pipelineRunRepository;
        this.pipelineRepository = pipelineRepository;
    }
    
    @Override
    public void run(String... args) {
        List<PipelineRun> runningRuns = pipelineRunRepository.findByStatus("running");
        for (PipelineRun run : runningRuns) {
            run.setStatus("interrupted");
            pipelineRunRepository.save(run);
            System.out.println("Recovered PipelineRun id=" + run.getId() + " to status=interrupted");
        }
        
        List<Pipeline> runningPipelines = pipelineRepository.findByStatus("running");
        for (Pipeline pipeline : runningPipelines) {
            pipeline.setStatus("interrupted");
            pipelineRepository.save(pipeline);
            System.out.println("Recovered Pipeline id=" + pipeline.getId() + " name=" + pipeline.getName() + " to status=interrupted");
        }
        
        if (!runningRuns.isEmpty() || !runningPipelines.isEmpty()) {
            System.out.println("Pipeline recovery completed: " + runningRuns.size() + " runs, " + runningPipelines.size() + " pipelines marked as interrupted");
        }
    }
}