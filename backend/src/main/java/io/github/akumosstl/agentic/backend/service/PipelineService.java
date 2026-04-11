package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PipelineService {
    
    @Autowired
    private PipelineRepository pipelineRepository;
    
    public PipelineRepository getPipelineRepository() {
        return pipelineRepository;
    }
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private PipelineRunService pipelineRunService;
    
    public List<Pipeline> getTop10PipelinesByProject(Long projectId) {
        return pipelineRepository.findTop10ByProject_IdOrderByCreatedAtDesc(projectId);
    }
    
    public Page<Pipeline> getPipelinesByProject(Long projectId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return pipelineRepository.findByProject_IdOrderByCreatedAtDesc(projectId, pageable);
    }
    
    public Pipeline getPipelineById(Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pipeline not found"));
    }
    
    public Pipeline createPipeline(Long projectId, Pipeline pipeline) {
        Project project = projectService.getProjectById(projectId);
        pipeline.setProject(project);
        return pipelineRepository.save(pipeline);
    }
    
    public Pipeline updatePipeline(Long id, Pipeline pipelineDetails) {
        Pipeline pipeline = getPipelineById(id);
        pipeline.setName(pipelineDetails.getName());
        pipeline.setDescription(pipelineDetails.getDescription());
        pipeline.setStatus(pipelineDetails.getStatus());
        pipeline.setOutputExtension(pipelineDetails.getOutputExtension());
        pipeline.setType(pipelineDetails.getType());
        return pipelineRepository.save(pipeline);
    }
    
    public void deletePipeline(Long id) {
        pipelineRunService.deleteRunsByPipeline(id);
        pipelineRepository.deleteById(id);
    }
    
    public List<Pipeline> getPipelinesByProjectAndStatus(Long projectId, String status) {
        return pipelineRepository.findByProject_IdAndStatus(projectId, status);
    }
    
    public long countPipelinesByProject(Long projectId) {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return pipelineRepository.findByProject_IdOrderByCreatedAtDesc(projectId, pageable).getTotalElements();
    }
    
    public List<Pipeline> getAllPipelines() {
        return pipelineRepository.findAll();
    }
    
    @Autowired
    private PipelineStepService pipelineStepService;
    
    @Autowired
    private SseService sseService;
    
    public void runPipeline(Long pipelineId) {
        Pipeline pipeline = getPipelineById(pipelineId);
        pipeline.setStatus("running");
        pipelineRepository.save(pipeline);
        
        PipelineRun run = pipelineRunService.createRun(pipelineId);
        
        Project project = pipeline.getProject();
        String workingDir = project.getPath();
        
        if (workingDir == null || workingDir.isEmpty()) {
            String userHome = System.getProperty("user.home");
            workingDir = userHome + File.separator + ".agentic";
        }
        
        String pipelinesBaseDir = workingDir + File.separator + ".agentic" + File.separator + "pipelines";
        File pipelinesDir = new File(pipelinesBaseDir);
        if (!pipelinesDir.exists()) {
            pipelinesDir.mkdirs();
        }
        
        String pipelineName = pipeline.getName() != null ? pipeline.getName().replaceAll("\\s+", "") : "pipeline";
        String pipelineDirPath = pipelinesBaseDir + File.separator + pipelineName;
        File pipelineDir = new File(pipelineDirPath);
        if (!pipelineDir.exists()) {
            pipelineDir.mkdirs();
        }
        
        LocalDateTime now = LocalDateTime.now();
        String timestamp = now.format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String runDirPath = pipelineDirPath + File.separator + timestamp;
        File runDir = new File(runDirPath);
        if (!runDir.exists()) {
            runDir.mkdirs();
        }
        
        String outputExtension = pipeline.getOutputExtension() != null ? pipeline.getOutputExtension() : "txt";
        
        final String workDir = workingDir;
        final String runDirFinal = runDirPath;
        
        final Long runId = run.getId();
        
        System.out.println("DEBUG: Pipeline run directory: " + runDirPath);
        
        new Thread(() -> {
            try {
                pipelineStepService.executePipeline(pipelineId, workDir, runDirFinal, outputExtension);
                
                Pipeline p = getPipelineById(pipelineId);
                if (!p.getStatus().equals("stopped")) {
                    p.setStatus("completed");
                    pipelineRepository.save(p);
                    pipelineRunService.completeRun(runId, "completed");
                    sseService.sendPipelineComplete(pipelineId, "completed");
                } else {
                    pipelineRunService.completeRun(runId, "stopped");
                    sseService.sendPipelineComplete(pipelineId, "stopped");
                }
            } catch (Exception e) {
                Pipeline p = getPipelineById(pipelineId);
                if (!p.getStatus().equals("stopped")) {
                    p.setStatus("failed");
                    pipelineRepository.save(p);
                    pipelineRunService.completeRun(runId, "failed");
                    sseService.sendPipelineComplete(pipelineId, "failed");
                } else {
                    pipelineRunService.completeRun(runId, "stopped");
                    sseService.sendPipelineComplete(pipelineId, "stopped");
                }
            }
        }).start();
    }
}
