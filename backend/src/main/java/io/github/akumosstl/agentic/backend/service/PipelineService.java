package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import org.springframework.beans.factory.ObjectProvider;
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
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final PipelineRunRepository pipelineRunRepository;
    private final ProjectService projectService;
    private final PipelineStepService pipelineStepService;
    private final SseService sseService;
    private final ObjectProvider<PipelineRunService> pipelineRunServiceProvider;

    @Autowired
    public PipelineService(
            PipelineRepository pipelineRepository,
            PipelineRunRepository pipelineRunRepository,
            ProjectService projectService,
            PipelineStepService pipelineStepService,
            SseService sseService,
            ObjectProvider<PipelineRunService> pipelineRunServiceProvider) {
        this.pipelineRepository = pipelineRepository;
        this.pipelineRunRepository = pipelineRunRepository;
        this.projectService = projectService;
        this.pipelineStepService = pipelineStepService;
        this.sseService = sseService;
        this.pipelineRunServiceProvider = pipelineRunServiceProvider;
    }

    private PipelineRunService getPipelineRunService() {
        return pipelineRunServiceProvider.getObject();
    }

    public PipelineRepository getPipelineRepository() {
        return pipelineRepository;
    }

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

    public Pipeline findOrCreatePipeline(Long projectId, String name, String description, String type, String outputExtension) {
        List<Pipeline> existing = pipelineRepository.findByProject_IdAndName(projectId, name);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        Pipeline pipeline = new Pipeline();
        pipeline.setName(name);
        pipeline.setDescription(description != null ? description : "");
        pipeline.setType(type != null ? type : "");
        pipeline.setOutputExtension(outputExtension != null ? outputExtension : "");
        pipeline.setStatus("pending");
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

    @Transactional
    public void deletePipeline(Long id) {
        Pipeline pipeline = pipelineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pipeline not found"));

        Long projectId = pipeline.getProject().getId();

        pipelineRunRepository.deleteStepsByPipelineId(id);
        pipelineRunRepository.flush();

        pipelineRunRepository.deleteByPipelineId(id);
        pipelineRunRepository.flush();

        pipelineRepository.deleteStepsByPipelineId(id);
        pipelineRepository.flush();

        pipelineRepository.deleteByIdNative(id);
        pipelineRepository.flush();
    }

    public List<Pipeline> getPipelinesByProjectAndStatus(Long projectId, String status) {
        return pipelineRepository.findByProject_IdAndStatus(projectId, status);
    }

    public List<Pipeline> getAllPipelines() {
        return pipelineRepository.findAll();
    }

    @Transactional
    public Pipeline duplicatePipeline(Long sourcePipelineId, String newName) {
        Pipeline source = getPipelineById(sourcePipelineId);

        Project project = source.getProject();
        Long projectId = project.getId();

        String finalName;
        if (newName != null && !newName.trim().isEmpty()) {
            finalName = newName.trim();
        } else {
            finalName = generateDuplicateName(projectId, source.getName());
        }

        Pipeline duplicate = new Pipeline();
        duplicate.setName(finalName);
        duplicate.setDescription(source.getDescription());
        duplicate.setStatus("pending");
        duplicate.setOutputExtension(source.getOutputExtension());
        duplicate.setType(source.getType());
        duplicate.setProject(project);

        List<PipelineStep> sourceSteps = source.getSteps();
        List<PipelineStep> newSteps = new ArrayList<>();
        for (PipelineStep sourceStep : sourceSteps) {
            PipelineStep newStep = new PipelineStep();
            newStep.setPipeline(duplicate);
            newStep.setAgent(sourceStep.getAgent());
            newStep.setScript(sourceStep.getScript());
            newStep.setStepOrder(sourceStep.getStepOrder());
            newStep.setStatus("pending");
            newStep.setInputContent(sourceStep.getInputContent());
            newStep.setInputType(sourceStep.getInputType());
            newStep.setOutputContent(sourceStep.getOutputContent());
            newStep.setOutputType(sourceStep.getOutputType());
            newStep.setStepOutput(sourceStep.getStepOutput());
            newStep.setStepOutputType(sourceStep.getStepOutputType());
            newStep.setCli(sourceStep.getCli());
            newStep.setParameters(sourceStep.getParameters());
            newStep.setArguments(sourceStep.getArguments());
            newStep.setType(sourceStep.getType());
            newStep.setRuntime(sourceStep.getRuntime());
            newSteps.add(newStep);
        }
        duplicate.setSteps(newSteps);

        return pipelineRepository.save(duplicate);
    }

    private String generateDuplicateName(Long projectId, String baseName) {
        String candidate = baseName + "copy";
        List<Pipeline> existing = pipelineRepository.findByProject_IdAndNameStartingWith(projectId, candidate);

        if (existing.isEmpty()) {
            if (!pipelineRepository.findByProject_IdAndName(projectId, candidate).isEmpty()) {
                return candidate + "(1)";
            }
            return candidate;
        }

        Pattern pattern = Pattern.compile("^" + Pattern.quote(candidate) + "(?:\\((\\d+)\\))?$");
        int maxNumber = 0;
        boolean exactMatch = false;

        for (Pipeline p : existing) {
            Matcher m = pattern.matcher(p.getName());
            if (m.matches()) {
                if (m.group(1) == null) {
                    exactMatch = true;
                } else {
                    maxNumber = Math.max(maxNumber, Integer.parseInt(m.group(1)));
                }
            }
        }

        if (!exactMatch) {
            List<Pipeline> exactPipelines = pipelineRepository.findByProject_IdAndName(projectId, candidate);
            if (exactPipelines.isEmpty()) {
                return candidate;
            }
        }

        return candidate + "(" + (maxNumber + 1) + ")";
    }

    public void runPipeline(Long pipelineId) {
        PipelineRun run = getPipelineRunService().createRun(pipelineId);
        runPipelineDirect(pipelineId, run.getId());
    }

    public void runPipelineDirect(Long pipelineId, Long runId) {
        Long actualPipelineId = getPipelineRunService().getPipelineIdByRunId(runId);
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

        PipelineRun runForDir = getPipelineRunService().getRunById(runId);
        if (runForDir != null) {
            runForDir.setRunDir(runDirPath);
            getPipelineRunService().saveRun(runForDir);
        }

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
                    getPipelineRunService().completeRun(finalRunId, "completed");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "completed");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "completed");
                } else {
                    getPipelineRunService().completeRun(finalRunId, "stopped");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "stopped");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "stopped");
                }
            } catch (Exception e) {
                Pipeline p = getPipelineById(finalPipelineIdUsed);
                if (!p.getStatus().equals("stopped")) {
                    p.setStatus("failed");
                    pipelineRepository.save(p);
                    getPipelineRunService().completeRun(finalRunId, "failed");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "failed");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "failed");
                } else {
                    getPipelineRunService().completeRun(finalRunId, "stopped");
                    sseService.sendPipelineComplete(finalPipelineIdUsed, "stopped");
                    sseService.sendPipelineCompleteToRun(finalRunId, finalPipelineIdUsed, "stopped");
                }
            }
        }).start();
    }
}