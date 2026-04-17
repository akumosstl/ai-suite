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
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Serviço para gerenciamento de Pipelines.
 * 
 * Realiza operações de CRUD, execução de pipelines e gerenciamento deRunDirs.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
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

    public List<Pipeline> getAllPipelines() {
        return pipelineRepository.findAll();
    }
    
    @Autowired
    private PipelineStepService pipelineStepService;
    
    @Autowired
    private SseService sseService;
    
    public void runPipeline(Long pipelineId) {
        PipelineRun run = pipelineRunService.createRun(pipelineId);
        runPipelineDirect(pipelineId, run.getId());
    }
    
    public void runPipelineDirect(Long pipelineId, Long runId) {
        Long actualPipelineId = pipelineRunService.getPipelineIdByRunId(runId);
        System.out.println("DEBUG: runPipelineDirect - runId=" + runId + ", received pipelineId=" + pipelineId + ", actual pipelineId=" + actualPipelineId);
        
        final Long finalPipelineId = !pipelineId.equals(actualPipelineId) ? actualPipelineId : pipelineId;
        
Pipeline pipeline = pipelineRepository.findById(finalPipelineId)
                .orElseThrow(() -> new RuntimeException("Pipeline not found with id: " + finalPipelineId));
        
        String projectPath = null;
        Long projectIdVal = null;
        if (pipeline.getProject() != null) {
            projectIdVal = pipeline.getProject().getId();
            projectPath = pipeline.getProject().getPath();
        }
        
        if (projectPath == null || projectPath.isEmpty()) {
            String userHome = System.getProperty("user.home");
            projectPath = userHome + File.separator + ".agentic";
        }
        
        final Long projectIdFinal = projectIdVal;
        final String workingDir = projectPath;
        final String pipelineNameStr = pipeline.getName() != null ? pipeline.getName().replaceAll("\\s+", "") : "pipeline";
        
        pipeline.setStatus("running");
        pipelineRepository.save(pipeline);
        
        String pipelinesBaseDir = projectPath + File.separator + ".agentic" + File.separator + "pipelines";
        File pipelinesDir = new File(pipelinesBaseDir);
        if (!pipelinesDir.exists()) {
            pipelinesDir.mkdirs();
        }
        
        String pipelineDirPath = pipelinesBaseDir + File.separator + pipelineNameStr;
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
        
        final String runDirFinal = runDirPath;
        final Long finalRunId = runId;
        final Long finalPipelineIdUsed = finalPipelineId;
        
        System.out.println("DEBUG: Pipeline run directory: " + runDirPath);
        
        new Thread(() -> {
            try {
                System.out.println("DEBUG: Pipeline thread starting for pipelineId=" + finalPipelineIdUsed + ", runId=" + finalRunId);
                pipelineStepService.executePipeline(finalPipelineIdUsed, finalRunId, workingDir, runDirFinal, outputExtension);
                System.out.println("DEBUG: executePipeline completed, checking status...");
                
                Pipeline p = getPipelineById(finalPipelineIdUsed);
                System.out.println("DEBUG: Pipeline status after execution: " + p.getStatus());
                if (!p.getStatus().equals("stopped")) {
                    p.setStatus("completed");
                    pipelineRepository.save(p);
                    pipelineRunService.completeRun(finalRunId, "completed");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "completed");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "completed");
                } else {
                    pipelineRunService.completeRun(finalRunId, "stopped");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "stopped");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "stopped");
                }
            } catch (Exception e) {
                Pipeline p = getPipelineById(finalPipelineIdUsed);
                if (!p.getStatus().equals("stopped")) {
                    p.setStatus("failed");
                    pipelineRepository.save(p);
                    pipelineRunService.completeRun(finalRunId, "failed");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "failed");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "failed");
                } else {
                    pipelineRunService.completeRun(finalRunId, "stopped");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "stopped");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "stopped");
                }
            }
        }).start();
    }
}
