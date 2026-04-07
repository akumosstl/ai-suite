package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.lang.ProcessBuilder.Redirect;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class PipelineStepService {
    
    @Autowired
    private PipelineStepRepository pipelineStepRepository;
    
    @Autowired
    private PipelineRunRepository pipelineRunRepository;
    
    @Autowired
    private EntityManager entityManager;
    
    @Lazy
    @Autowired
    private PipelineService pipelineService;
    
    @Lazy
    @Autowired
    private PipelineRunService pipelineRunService;
    
    @Autowired
    private AgentService agentService;
    
    @Autowired
    private ScriptService scriptService;
    
    public List<PipelineStep> getStepsByPipeline(Long pipelineId) {
        return pipelineStepRepository.findByPipeline_IdOrderByStepOrderAsc(pipelineId);
    }
    
    public PipelineStep getStepById(Long stepId) {
        return pipelineStepRepository.findById(stepId)
                .orElseThrow(() -> new RuntimeException("Pipeline step not found"));
    }
    
    public PipelineStep addStepToPipeline(Long pipelineId, Long agentId, Long scriptId) {
        Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
        
        Integer nextStepOrder = pipelineStepRepository.getNextStepOrder(pipelineId);
        
        PipelineStep step = new PipelineStep();
        step.setPipeline(pipeline);
        step.setStepOrder(nextStepOrder);
        
        if (agentId != null) {
            Agent agent = agentService.getAgentById(agentId);
            step.setAgent(agent);
            step.setType("agent");
        }
        
        if (scriptId != null) {
            Script script = scriptService.getScriptById(scriptId);
            step.setScript(script);
            step.setType("script");
        }
        
        return pipelineStepRepository.save(step);
    }
    
    public PipelineStep updateStep(Long stepId, Long newAgentId) {
        PipelineStep step = getStepById(stepId);
        
        if (newAgentId != null) {
            Agent agent = agentService.getAgentById(newAgentId);
            step.setAgent(agent);
        }
        
        return pipelineStepRepository.save(step);
    }
    
    public void removeStep(Long stepId) {
        PipelineStep step = getStepById(stepId);
        Long pipelineId = step.getPipelineId();
        Integer removedOrder = step.getStepOrder();
        
        // Delete the step
        pipelineStepRepository.delete(step);
        
        // Reorder remaining steps
        List<PipelineStep> remainingSteps = pipelineStepRepository.findByPipeline_IdOrderByStepOrderAsc(pipelineId);
        for (int i = 0; i < remainingSteps.size(); i++) {
            PipelineStep remainingStep = remainingSteps.get(i);
            if (remainingStep.getStepOrder() != i + 1) {
                remainingStep.setStepOrder(i + 1);
                pipelineStepRepository.save(remainingStep);
            }
        }
    }
    
    public void removeStepsByPipeline(Long pipelineId) {
        pipelineStepRepository.deleteByPipeline_Id(pipelineId);
    }
    
    @Transactional
    public List<PipelineStep> reorderSteps(Long pipelineId, List<Long> stepIdsInOrder) {
        int offset = stepIdsInOrder.size() + 10;
        
        for (int i = 0; i < stepIdsInOrder.size(); i++) {
            Long stepId = stepIdsInOrder.get(i);
            entityManager.createNativeQuery(
                "UPDATE pipeline_step SET step_order = ?1 WHERE id = ?2 AND pipeline_id = ?3")
                .setParameter(1, offset + i)
                .setParameter(2, stepId)
                .setParameter(3, pipelineId)
                .executeUpdate();
        }
        
        entityManager.flush();
        entityManager.clear();
        
        for (int i = 0; i < stepIdsInOrder.size(); i++) {
            Long stepId = stepIdsInOrder.get(i);
            entityManager.createNativeQuery(
                "UPDATE pipeline_step SET step_order = ?1 WHERE id = ?2 AND pipeline_id = ?3")
                .setParameter(1, i + 1)
                .setParameter(2, stepId)
                .setParameter(3, pipelineId)
                .executeUpdate();
        }
        
        entityManager.flush();
        entityManager.clear();
        
        return getStepsByPipeline(pipelineId);
    }
    
    public long countSteps(Long pipelineId) {
        return pipelineStepRepository.countByPipeline_Id(pipelineId);
    }
    
    public PipelineStep saveInput(Long stepId, String content, String type) {
        PipelineStep step = getStepById(stepId);
        step.setInputContent(content);
        step.setInputType(type);
        return pipelineStepRepository.save(step);
    }
    
    public PipelineStep saveOutput(Long stepId, String content, String type) {
        PipelineStep step = getStepById(stepId);
        step.setOutputContent(content);
        step.setOutputType(type);
        return pipelineStepRepository.save(step);
    }
    
    public PipelineStep saveCli(Long stepId, String cli, String parameters, String arguments) {
        PipelineStep step = getStepById(stepId);
        step.setCli(cli);
        step.setParameters(parameters);
        step.setArguments(arguments);
        return pipelineStepRepository.save(step);
    }
    
    @Autowired
    private SseService sseService;
    
    private final Map<Long, AtomicBoolean> pausedPipelines = new ConcurrentHashMap<>();
    private final Set<Long> stoppedPipelines = ConcurrentHashMap.newKeySet();
    private final Map<Long, ReentrantLock> pipelineLocks = new ConcurrentHashMap<>();
    private final Map<Long, Integer> pendingStepOrders = new ConcurrentHashMap<>();
    
    public void pausePipeline(Long pipelineId) {
        pausedPipelines.putIfAbsent(pipelineId, new AtomicBoolean(true));
        pausedPipelines.get(pipelineId).set(true);
    }
    
    public void resumePipeline(Long pipelineId) {
        AtomicBoolean paused = pausedPipelines.get(pipelineId);
        if (paused != null) {
            paused.set(false);
        }
    }
    
    // Map to track running processes per pipeline
    private final Map<Long, Process> runningProcesses = new ConcurrentHashMap<>();

    public void registerRunningProcess(Long pipelineId, Process process) {
        runningProcesses.put(pipelineId, process);
    }

    public void stopPipelineExecution(Long pipelineId) {
        stoppedPipelines.add(pipelineId);
        pausedPipelines.remove(pipelineId);
        pendingStepOrders.remove(pipelineId);
        
        Optional<PipelineRun> runningRun = pipelineRunRepository.findAll().stream()
            .filter(r -> r.getPipeline() != null && r.getPipeline().getId().equals(pipelineId))
            .filter(r -> "running".equals(r.getStatus()))
            .findFirst();
        runningRun.ifPresent(run -> {
            run.setStatus("stopped");
            pipelineRunRepository.save(run);
        });
        
        Process process = runningProcesses.remove(pipelineId);
        if (process != null && process.isAlive()) {
            process.destroyForcibly();
            System.out.println("Stopped running process for pipeline " + pipelineId);
        }
    }
    
    public boolean isPipelineStopped(Long pipelineId) {
        return stoppedPipelines.contains(pipelineId);
    }
    
    public boolean isPipelinePaused(Long pipelineId) {
        AtomicBoolean paused = pausedPipelines.get(pipelineId);
        return paused != null && paused.get();
    }
    
    public void setPendingStepOrder(Long pipelineId, int stepOrder) {
        pendingStepOrders.put(pipelineId, stepOrder);
    }
    
    public Integer getPendingStepOrder(Long pipelineId) {
        return pendingStepOrders.get(pipelineId);
    }
    
    public ReentrantLock getPipelineLock(Long pipelineId) {
        return pipelineLocks.computeIfAbsent(pipelineId, k -> new ReentrantLock());
    }
    
    public void executePipeline(Long pipelineId, String workingDir, String runDir, String outputExtension) {
        stoppedPipelines.remove(pipelineId);
        
        ReentrantLock lock = getPipelineLock(pipelineId);
        if (!lock.tryLock()) {
            System.out.println("DEBUG: Pipeline " + pipelineId + " is already running, ignoring request");
            return;
        }
        
        try {
            System.out.println("DEBUG: executePipeline started for pipeline " + pipelineId);
            
            List<PipelineStep> steps = getStepsByPipeline(pipelineId);
            
            Integer pendingStepOrder = pendingStepOrders.get(pipelineId);
            int startIndex = 0;
            if (pendingStepOrder != null && pendingStepOrder > 1) {
                startIndex = pendingStepOrder - 1;
                System.out.println("DEBUG: Resuming from step " + pendingStepOrder);
            }
            
            boolean allPreviousCompleted = true;
            for (int i = 0; i < startIndex; i++) {
                PipelineStep step = steps.get(i);
                if (!"completed".equals(step.getStatus())) {
                    step.setStatus("ready");
                    step.setOutputContent(null);
                    pipelineStepRepository.save(step);
                    allPreviousCompleted = false;
                }
            }
            
            if (allPreviousCompleted && startIndex > 0) {
                System.out.println("DEBUG: All previous steps completed, will continue from step " + (startIndex + 1));
            }
            
            pipelineStepRepository.flush();
            
            Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
            boolean isStepByStep = "step_by_step".equals(pipeline.getType());
            
            if (isStepByStep) {
                executePipelineStepByStep(pipelineId, workingDir, runDir, outputExtension, startIndex);
            } else {
                executePipelineSequential(pipelineId, workingDir, runDir, outputExtension);
            }
            
            stopPipelineExecution(pipelineId);
            System.out.println("DEBUG: executePipeline completed for pipeline " + pipelineId);
        } finally {
            lock.unlock();
        }
    }
    
    private void executePipelineSequential(Long pipelineId, String workingDir, String runDir, String outputExtension) {
        List<PipelineStep> steps = getStepsByPipeline(pipelineId);
        System.out.println("DEBUG: Found " + steps.size() + " steps");
        
        sseService.sendStepOutput(pipelineId, 0L, 0, "Working directory: " + workingDir + "\n", "running");
        sseService.sendStepOutput(pipelineId, 0L, 0, "Run directory: " + runDir + "\n", "running");
        
        String previousOutputFile = null;
        
        for (PipelineStep step : steps) {
            if (isPipelineStopped(pipelineId)) {
                markRemainingStepsFailed(pipelineId, step.getStepOrder());
                break;
            }
            executeStep(step, pipelineId, workingDir, runDir, outputExtension, previousOutputFile);
            if ("completed".equals(step.getStatus()) && step.getOutputContent() != null) {
                previousOutputFile = runDir + File.separator + "step" + step.getStepOrder() + "-result." + outputExtension;
            }
        }
    }
    
    private void markRemainingStepsFailed(Long pipelineId, int fromStepOrder) {
        List<PipelineStep> steps = getStepsByPipeline(pipelineId);
        for (PipelineStep step : steps) {
            if (step.getStepOrder() > fromStepOrder && !"completed".equals(step.getStatus()) && !"failed".equals(step.getStatus())) {
                step.setStatus("failed");
                step.setOutputContent("Skipped due to pipeline stop");
                pipelineStepRepository.save(step);
                syncRunStepStatus(pipelineId, step.getStepOrder(), "failed", "Skipped due to pipeline stop", "text");
                sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), "Skipped due to pipeline stop\n--- Step failed ---\n", "failed");
            }
        }
    }
    
    private void executePipelineStepByStep(Long pipelineId, String workingDir, String runDir, String outputExtension, int startIndex) {
        List<PipelineStep> steps = getStepsByPipeline(pipelineId);
        System.out.println("DEBUG: Found " + steps.size() + " steps (step-by-step mode)");
        
        sseService.sendStepOutput(pipelineId, 0L, 0, "Working directory: " + workingDir + "\n", "running");
        sseService.sendStepOutput(pipelineId, 0L, 0, "Run directory: " + runDir + "\n", "running");
        sseService.sendStepOutput(pipelineId, 0L, 0, "Pipeline mode: step-by-step\n", "running");
        
        String previousOutputFile = null;
        pausedPipelines.putIfAbsent(pipelineId, new AtomicBoolean(false));
        
        for (int i = startIndex; i < steps.size(); i++) {
            PipelineStep step = steps.get(i);
            if (!pausedPipelines.containsKey(pipelineId) || isPipelineStopped(pipelineId)) {
                if (isPipelineStopped(pipelineId)) {
                    markRemainingStepsFailed(pipelineId, step.getStepOrder());
                }
                break;
            }
            
            executeStep(step, pipelineId, workingDir, runDir, outputExtension, previousOutputFile);
            
            if ("completed".equals(step.getStatus()) && step.getOutputContent() != null) {
                previousOutputFile = runDir + File.separator + "step" + step.getStepOrder() + "-result." + outputExtension;
            }
            
            if ("step_by_step".equals(pipelineService.getPipelineById(pipelineId).getType())) {
                if (!step.getStatus().equals("completed")) {
                    break;
                }
                
                int nextStepOrder = step.getStepOrder() + 1;
                if (nextStepOrder <= steps.size()) {
                    sseService.sendStepOutput(pipelineId, 0L, step.getStepOrder(), "Step " + step.getStepOrder() + " completed. Waiting for continue...\n", "paused");
                    setPendingStepOrder(pipelineId, nextStepOrder);
                    sseService.sendPipelinePaused(pipelineId, step.getStepOrder(), nextStepOrder);
                    
                    pausedPipelines.get(pipelineId).set(true);
                    waitForResume(pipelineId);
                    
                    if (!pausedPipelines.containsKey(pipelineId) || !pausedPipelines.get(pipelineId).compareAndSet(false, false)) {
                        break;
                    }
                } else {
                    sseService.sendStepOutput(pipelineId, 0L, step.getStepOrder(), "All steps completed!\n", "completed");
                }
            }
        }
    }
    
    private void waitForResume(Long pipelineId) {
        AtomicBoolean paused = pausedPipelines.get(pipelineId);
        if (paused == null) {
            return;
        }
        
        int waitCount = 0;
        while (paused.get() && !isPipelineStopped(pipelineId) && waitCount < 7200) {
            try {
                Thread.sleep(500);
                waitCount++;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
    
    private void executeStep(PipelineStep step, Long pipelineId, String workingDir, String runDir, String outputExtension, String previousOutputFile) {
        if (isPipelineStopped(pipelineId)) {
            step.setStatus("failed");
            step.setOutputContent("Pipeline was stopped by user");
            pipelineStepRepository.save(step);
            syncRunStepStatus(pipelineId, step.getStepOrder(), "failed", "Pipeline was stopped by user", "text");
            sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), "Pipeline was stopped by user\n--- Step failed ---\n", "failed");
            return;
        }
        
        try {
            System.out.println("DEBUG: Executing step " + step.getId() + " - " + (step.getAgent() != null ? step.getAgent().getName() : "script"));
            
            step.setStatus("running");
            pipelineStepRepository.save(step);
            pipelineStepRepository.flush();
            sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), "Starting step: " + (step.getAgent() != null ? step.getAgent().getName() : "script") + "\n", "running");
            syncRunStepStatus(pipelineId, step.getStepOrder(), "running", null, null);
            
            if (previousOutputFile != null) {
                String normalizedPath = previousOutputFile.replace("\\", "/");
                sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), "Previous output file: " + normalizedPath + "\n", "running");
            }
            
            System.out.println("DEBUG: Step status set to running, calling executeAgentStep");
            String output = "";
            
            String stepType = step.getType();
            System.out.println("DEBUG: Step type: " + stepType);
            System.out.println("DEBUG: Step agent: " + (step.getAgent() != null ? step.getAgent().getName() : "null"));
            System.out.println("DEBUG: Step script: " + (step.getScript() != null ? step.getScript().getName() : "null"));
            
            if ("script".equals(stepType)) {
                output = executeScriptStep(step, pipelineId, step.getId(), workingDir, previousOutputFile);
            } else if (step.getAgent() != null) {
                output = executeAgentStep(step, pipelineId, step.getId(), workingDir, previousOutputFile);
            } else if (step.getScript() != null) {
                output = "Script execution not implemented yet";
            } else {
                System.out.println("DEBUG: WARNING - No agent or script found for step!");
                output = "Error: No agent or script configured for this step";
            }
            
            if (isPipelineStopped(pipelineId)) {
                String stopOutput = "Pipeline was stopped by user";
                step.setStatus("failed");
                step.setOutputContent(stopOutput);
                step.setOutputType("text");
                pipelineStepRepository.save(step);
                syncRunStepStatus(pipelineId, step.getStepOrder(), "failed", stopOutput, "text");
                sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), stopOutput + "\n--- Step failed ---\n", "failed");
                return;
            }
            
            String fullOutput = output + "\n--- Step completed ---\n";
            step.setOutputContent(fullOutput);
            step.setOutputType("text");
            step.setStatus("completed");
            pipelineStepRepository.save(step);
            
            syncRunStepStatus(pipelineId, step.getStepOrder(), "completed", fullOutput, "text");
            
            String resultFileName = "step" + step.getStepOrder() + "-result." + outputExtension;
            File resultFile = new File(runDir, resultFileName);
            try {
                Files.writeString(resultFile.toPath(), fullOutput, StandardCharsets.UTF_8);
                System.out.println("DEBUG: Created result file: " + resultFile.getAbsolutePath());
            } catch (Exception e) {
                System.out.println("DEBUG: Error creating result file: " + e.getMessage());
            }
            
            sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), fullOutput, "completed");
            
        } catch (Exception e) {
            System.out.println("DEBUG: Exception in executeStep: " + e.getMessage());
            e.printStackTrace();
            String errorOutput = "Error: " + e.getMessage() + "\n--- Step failed ---\n";
            step.setStatus("failed");
            step.setOutputContent(errorOutput);
            step.setOutputType("text");
            pipelineStepRepository.save(step);
            syncRunStepStatus(pipelineId, step.getStepOrder(), "failed", errorOutput, "text");
            sseService.sendStepOutput(pipelineId, step.getId(), step.getStepOrder(), errorOutput, "failed");
            sseService.sendStepError(pipelineId, step.getId(), e.getMessage(), 
                java.util.Arrays.toString(e.getStackTrace()));
        }
    }
    
    private String executeAgentStep(PipelineStep step, Long pipelineId, Long stepId, String workingDir, String previousOutputFile) throws Exception {
        Agent agent = step.getAgent();
        
        System.out.println("DEBUG: executeAgentStep - agent is null: " + (agent == null));
        if (agent != null) {
            System.out.println("DEBUG: agent name: " + agent.getName());
            System.out.println("DEBUG: agent prompt: " + agent.getPrompt());
        }
        
        String prompt = agent != null ? agent.getPrompt() : null;
        
        if (prompt == null || prompt.isEmpty()) {
            prompt = "Hello, please respond.";
            sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "Warning: Agent has no prompt, using default.\n", "running");
        }
        
        System.out.println("DEBUG: Step " + step.getStepOrder() + " - Agent prompt before replacement: " + prompt);
        System.out.println("DEBUG: Step " + step.getStepOrder() + " - Previous output file: " + previousOutputFile);
        
        String placeholder = "{{previous-output-file}}";
        if (prompt.contains(placeholder)) {
            System.out.println("DEBUG: Found placeholder in prompt!");
            if (previousOutputFile != null) {
                String normalizedPath = previousOutputFile.replace("\\", "/");
                System.out.println("DEBUG: Replacing with: " + normalizedPath);
                prompt = prompt.replace(placeholder, normalizedPath);
                sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "INFO: Replaced {{previous-output-file}} with: " + normalizedPath + "\n", "running");
            } else {
                System.out.println("DEBUG: No previous output file, replacing with empty string");
                prompt = prompt.replace(placeholder, "");
                sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "WARNING: {{previous-output-file}} found but no previous step output - replaced with empty string\n", "running");
            }
        } else {
            System.out.println("DEBUG: Placeholder NOT found in prompt");
            System.out.println("DEBUG: Prompt length: " + prompt.length());
            System.out.println("DEBUG: Checking for: '" + placeholder + "'");
        }
        
        String inputContent = step.getInputContent() != null ? step.getInputContent() : "";
        String outputContent = step.getOutputContent() != null ? step.getOutputContent() : "";
        
        prompt = prompt.replace("{{agentic-input:file}}", inputContent);
        prompt = prompt.replace("{{agentic-output:file}}", outputContent);
        
        System.out.println("DEBUG: Agent prompt after replacement: " + prompt);
        
        String cli = step.getCli();
        String parameters = step.getParameters();
        String arguments = step.getArguments();
        
        StringBuilder fullCommand = new StringBuilder();
        
        if (cli != null && !cli.isEmpty()) {
            if (cli.equals("copilot")) {
                fullCommand.append("copilot --allow-all-paths --allow-all-tools -p ");
                // Escape prompt for Windows cmd
                String escapedPrompt = prompt.replace("\"", "\\\"").replace("\r", "").replace("\n", " ");
                fullCommand.append('"').append(escapedPrompt).append('"');
            } else if (!cli.equals("opencode")) {
                fullCommand.append(cli);
                if (parameters != null && !parameters.isEmpty()) {
                    fullCommand.append(" ").append(parameters);
                }
                if (arguments != null && !arguments.isEmpty()) {
                    fullCommand.append(" ").append(arguments);
                }
                fullCommand.append(" \"").append(prompt.replace("\"", "\\\"").replace("\r", "").replace("\n", " ")).append("\"");
            } else {
                fullCommand.append("opencode run");
                if (parameters != null && !parameters.isEmpty()) {
                    fullCommand.append(" ").append(parameters);
                }
                if (arguments != null && !arguments.isEmpty()) {
                    fullCommand.append(" ").append(arguments);
                }
                fullCommand.append(" \"").append(prompt.replace("\"", "\\\"").replace("\r", "").replace("\n", " ")).append("\"");
            }
        } else {
            fullCommand.append("opencode run");
            if (parameters != null && !parameters.isEmpty()) {
                fullCommand.append(" ").append(parameters);
            }
            if (arguments != null && !arguments.isEmpty()) {
                fullCommand.append(" ").append(arguments);
            }
            fullCommand.append(" \"").append(prompt.replace("\"", "\\\"").replace("\r", "").replace("\n", " ")).append("\"");
        }
        
        System.out.println("DEBUG: Full command: " + fullCommand.toString());
        
        String os = System.getProperty("os.name").toLowerCase();
        List<String> command;
        
        if (os.contains("win")) {
            command = List.of("cmd.exe", "/c", "chcp 65001 >nul && " + fullCommand.toString());
        } else {
            command = List.of("bash", "-c", fullCommand.toString());
        }
        
        System.out.println("Executing command: " + command);
        
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        
        System.out.println("Working directory: " + workingDir);
        processBuilder.directory(new java.io.File(workingDir));
        
        Map<String, String> env = processBuilder.environment();
        env.put("OPENCODE_HOME", System.getenv("USERPROFILE") != null ? System.getenv("USERPROFILE") : System.getenv("HOME"));
        
        String path = env.get("PATH");
        if (path != null) {
            env.put("PATH", path + ";" + System.getenv("USERPROFILE") + "\\AppData\\Local\\Programs\\opencode");
        }
        
        File outputFile = new File(System.getProperty("java.io.tmpdir"), "pipeline_output_" + System.currentTimeMillis() + ".txt");
        File errorFile = new File(System.getProperty("java.io.tmpdir"), "pipeline_error_" + System.currentTimeMillis() + ".txt");
        outputFile.deleteOnExit();
        errorFile.deleteOnExit();
        
        processBuilder.redirectErrorStream(false);
        processBuilder.redirectOutput(Redirect.to(outputFile));
        processBuilder.redirectError(Redirect.to(errorFile));
        processBuilder.redirectInput(Redirect.PIPE);
        
        sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "Starting process with file redirection...\n", "running");
        System.out.println("DEBUG: Starting process with file redirection...");
        Process process = processBuilder.start();
        // Register the running process for stop support
        registerRunningProcess(pipelineId, process);
        
        try {
            java.io.OutputStream processOutputStream = process.getOutputStream();
            processOutputStream.write("\n".getBytes());
            processOutputStream.flush();
            processOutputStream.close();
        } catch (Exception e) {
            System.out.println("DEBUG: Could not write to stdin: " + e.getMessage());
        }
        
        sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "Waiting for process to complete...\n", "running");
        System.out.println("DEBUG: Waiting for process to complete...");
        int exitCode = process.waitFor();
        
        StringBuilder output = new StringBuilder();
        try {
            List<String> lines = Files.readAllLines(outputFile.toPath(), StandardCharsets.UTF_8);
            for (String line : lines) {
                output.append(line).append("\n");
            }
        } catch (Exception e) {
            output.append("Error reading output file: ").append(e.getMessage()).append("\n");
        }
        
        System.out.println("Exit code: " + exitCode);
        System.out.println("Output: " + output.toString());
        
        if (exitCode != 0) {
            if (isPipelineStopped(pipelineId)) {
                return "Pipeline was stopped by user";
            }
            String errorMsg = output.toString();
            if (errorMsg.isEmpty()) {
                errorMsg = "Command failed with exit code: " + exitCode;
            } else {
                errorMsg = errorMsg + "\n\nCommand exited with code: " + exitCode;
            }
            throw new RuntimeException(errorMsg);
        }
        
        return output.toString();
    }
    
    private String executeScriptStep(PipelineStep step, Long pipelineId, Long stepId, String workingDir, String previousOutputFile) throws Exception {
        Script script = step.getScript();
        String scriptContent = script.getContent();
        
        if (scriptContent == null || scriptContent.isEmpty()) {
            throw new RuntimeException("Script content is empty");
        }
        
        String placeholder = "{{previous-output-file}}";
        if (scriptContent.contains(placeholder)) {
            if (previousOutputFile != null) {
                System.out.println("DEBUG: Found {{previous-output-file}} in script, replacing with: " + previousOutputFile);
                scriptContent = scriptContent.replace(placeholder, previousOutputFile);
                sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "INFO: Replaced {{previous-output-file}} with: " + previousOutputFile + "\n", "running");
            } else {
                System.out.println("DEBUG: Found {{previous-output-file}} in script but no previous output file available, replacing with empty string");
                scriptContent = scriptContent.replace(placeholder, "");
                sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "WARNING: {{previous-output-file}} found in script but no previous step output available - replaced with empty string\n", "running");
            }
        } else {
            System.out.println("DEBUG: No {{previous-output-file}} placeholder found in script");
        }
        
        String os = System.getProperty("os.name").toLowerCase();
        String scriptExtension;
        List<String> command;
        
        if (os.contains("win")) {
            scriptExtension = ".bat";
            command = List.of("cmd.exe", "/c");
        } else {
            scriptExtension = ".sh";
            command = List.of("bash");
        }
        
        File tempScript = new File(System.getProperty("java.io.tmpdir"), "pipeline_script_" + System.currentTimeMillis() + scriptExtension);
        tempScript.deleteOnExit();
        
        Files.writeString(tempScript.toPath(), scriptContent, StandardCharsets.UTF_8);
        
        if (!os.contains("win")) {
            tempScript.setExecutable(true);
        }
        
        sseService.sendStepOutput(pipelineId, stepId, step.getStepOrder(), "Executing script: " + script.getName() + "\n", "running");
        
        List<String> fullCommand = new ArrayList<>(command);
        fullCommand.add(tempScript.getAbsolutePath());
        
        ProcessBuilder processBuilder = new ProcessBuilder(fullCommand);
        processBuilder.directory(new java.io.File(workingDir));
        
        Map<String, String> env = processBuilder.environment();
        env.put("OPENCODE_HOME", System.getenv("USERPROFILE") != null ? System.getenv("USERPROFILE") : System.getenv("HOME"));
        
        String path = env.get("PATH");
        if (path != null && System.getenv("USERPROFILE") != null) {
            env.put("PATH", path + ";" + System.getenv("USERPROFILE") + "\\AppData\\Local\\Programs\\opencode");
        }
        
        File outputFile = new File(System.getProperty("java.io.tmpdir"), "script_output_" + System.currentTimeMillis() + ".txt");
        File errorFile = new File(System.getProperty("java.io.tmpdir"), "script_error_" + System.currentTimeMillis() + ".txt");
        outputFile.deleteOnExit();
        errorFile.deleteOnExit();
        
        processBuilder.redirectErrorStream(false);
        processBuilder.redirectOutput(Redirect.to(outputFile));
        processBuilder.redirectError(Redirect.to(errorFile));
        
        Process process = processBuilder.start();
        // Register the running process for stop support
        registerRunningProcess(pipelineId, process);
        
        int exitCode = process.waitFor();
        
        StringBuilder output = new StringBuilder();
        try {
            List<String> lines = Files.readAllLines(outputFile.toPath(), StandardCharsets.UTF_8);
            for (String line : lines) {
                output.append(line).append("\n");
            }
        } catch (Exception e) {
            output.append("Error reading output file: ").append(e.getMessage()).append("\n");
        }
        
        if (exitCode != 0) {
            try {
                List<String> errorLines = Files.readAllLines(errorFile.toPath(), StandardCharsets.UTF_8);
                for (String line : errorLines) {
                    output.append(line).append("\n");
                }
            } catch (Exception e) {
                // ignore
            }
            String errorMsg = output.toString();
            if (errorMsg.isEmpty()) {
                throw new RuntimeException("Script failed with exit code: " + exitCode);
            } else {
                throw new RuntimeException(errorMsg + "\n\nScript exited with code: " + exitCode);
            }
        }
        
        return output.toString();
    }
    
    private void syncRunStepStatus(Long pipelineId, Integer stepOrder, String status, String outputContent, String outputType) {
        try {
            List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(pipelineId);
            if (runs != null && !runs.isEmpty()) {
                PipelineRun latestRun = runs.get(0);
                if ("running".equals(latestRun.getStatus())) {
                    pipelineRunService.updateRunStep(latestRun.getId(), stepOrder, status, outputContent, outputType);
                }
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Error syncing run step status: " + e.getMessage());
        }
    }
}