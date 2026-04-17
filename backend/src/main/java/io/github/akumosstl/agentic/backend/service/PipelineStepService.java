package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileReader;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.ProcessBuilder.Redirect;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serviço para gerenciamento de Etapas (Steps) de Pipeline.
 * 
 * Realiza operações de CRUD, execução de etapas de pipeline,
 * resolução de placeholders e streaming de saída em tempo real.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
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
    
    @Autowired
    private TargetRepository targetRepository;
    
    @Autowired
    private PipelineRepository pipelineRepository;
    
    private static final Pattern STEP_OUTPUT_PATTERN = Pattern.compile("\\{\\{step:(\\d+):output\\}\\}");
    private static final Pattern FILE_PATTERN = Pattern.compile("\\{\\{file:([^}]+)\\}\\}");
    private static final Pattern ENV_PATTERN = Pattern.compile("\\{\\{env:([A-Za-z_][A-Za-z0-9_]*)\\}\\}");

    private String escapeWindowsCommand(String input) {
        if (input == null) return "";
        return input
            .replace("\"", "\"\"")
            .replace("%", "%%")
            .replace("^", "^^")
            .replace("&", "^&")
            .replace("|", "^|")
            .replace("<", "^<")
            .replace(">", "^>")
            .replace("\r", "")
            .replace("\n", " ");
    }

    private List<String> parseCommandWindows(String commandLine) {
        List<String> args = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < commandLine.length(); i++) {
            char c = commandLine.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ' ' && !inQuotes) {
                if (current.length() > 0) {
                    args.add(current.toString());
                    current = new StringBuilder();
                }
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            args.add(current.toString());
        }

        return args.isEmpty() ? java.util.List.of("node") : args;
    }

    private String resolveInputContent(String inputContent, Long pipelineId, int currentStepOrder, String runDir) {
        if (inputContent == null || inputContent.isEmpty()) {
            return inputContent;
        }
        
        String resolved = inputContent;
        
        resolved = resolveStepOutputReferences(resolved, pipelineId, currentStepOrder, runDir);
        
        resolved = resolveFileReferences(resolved);
        
        resolved = resolveEnvironmentVariables(resolved);
        
        return resolved;
    }
    
    private String getProjectTargetCli(Long pipelineId) {
        try {
            Project project = entityManager.createQuery(
                "SELECT p FROM Pipeline pipeline JOIN pipeline.project p WHERE pipeline.id = :pipelineId",
                Project.class)
                .setParameter("pipelineId", pipelineId)
                .getSingleResult();
            
            if (project.getTargetId() != null) {
                Target target = targetRepository.findById(project.getTargetId()).orElse(null);
                if (target != null) {
                    System.out.println("DEBUG: Found project target CLI via targetId: " + target.getCli());
                    return target.getCli();
                }
            }
            
            String targetName = project.getTarget();
            if (targetName != null && !targetName.isEmpty()) {
                var targetOpt = targetRepository.findByName(targetName);
                if (targetOpt.isPresent()) {
                    System.out.println("DEBUG: Found project target CLI via target name: " + targetOpt.get().getCli());
                    return targetOpt.get().getCli();
                }
            }
            
            System.out.println("DEBUG: No target found for project, no CLI configured");
            return "opencode";
        } catch (Exception e) {
            System.out.println("DEBUG: Error getting project target CLI: " + e.getMessage());
        }
        return "opencode";
    }
    
    private String resolveStepOutputReferences(String content, Long pipelineId, int currentStepOrder, String runDir) {
        Matcher matcher = STEP_OUTPUT_PATTERN.matcher(content);
        StringBuffer sb = new StringBuffer();
        
        while (matcher.find()) {
            int referencedStepOrder = Integer.parseInt(matcher.group(1));
            String replacement;
            
            if (referencedStepOrder >= currentStepOrder) {
                replacement = "{{step:" + referencedStepOrder + ":output}} (future step - not available yet)";
            } else {
                List<PipelineStep> steps = getStepsByPipeline(pipelineId);
                PipelineStep referencedStep = steps.stream()
                    .filter(s -> s.getStepOrder() == referencedStepOrder)
                    .findFirst()
                    .orElse(null);
                
                if (referencedStep != null && referencedStep.getOutputContent() != null) {
                    replacement = referencedStep.getOutputContent();
                } else {
                    String resultFilePath = runDir + File.separator + "step" + referencedStepOrder + "-result.txt";
                    File resultFile = new File(resultFilePath);
                    if (resultFile.exists()) {
                        try {
                            replacement = Files.readString(resultFile.toPath());
                        } catch (Exception e) {
                            replacement = "{{step:" + referencedStepOrder + ":output}} (file not readable: " + e.getMessage() + ")";
                        }
                    } else {
                        replacement = "{{step:" + referencedStepOrder + ":output}} (no output found)";
                    }
                }
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
    
    private String resolveFileReferences(String content) {
        Matcher matcher = FILE_PATTERN.matcher(content);
        StringBuffer sb = new StringBuffer();
        
        while (matcher.find()) {
            String filePath = matcher.group(1);
            String replacement;
            
            File file = new File(filePath);
            if (file.exists() && file.isFile()) {
                try {
                    replacement = Files.readString(file.toPath());
                } catch (Exception e) {
                    replacement = "{{file:" + filePath + "}} (error reading: " + e.getMessage() + ")";
                }
            } else {
                replacement = "{{file:" + filePath + "}} (file not found)";
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
    
    private String resolveEnvironmentVariables(String content) {
        Matcher matcher = ENV_PATTERN.matcher(content);
        StringBuffer sb = new StringBuffer();
        
        while (matcher.find()) {
            String varName = matcher.group(1);
            String replacement = System.getenv(varName);
            
            if (replacement == null) {
                replacement = "{{env:" + varName + "}} (not set)";
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
    
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
    
    public PipelineStep saveStepOutput(Long stepId, String content, String type) {
        PipelineStep step = getStepById(stepId);
        step.setStepOutput(content);
        step.setStepOutputType(type);
        return pipelineStepRepository.save(step);
    }
    
    public PipelineStep saveCli(Long stepId, String cli, String parameters, String arguments, String runtime) {
        PipelineStep step = getStepById(stepId);
        step.setCli(cli);
        step.setParameters(parameters);
        step.setArguments(arguments);
        step.setRuntime(runtime);
        return pipelineStepRepository.save(step);
    }
    
    @Autowired
    private SseService sseService;
    
    private final Set<Long> stoppedPipelines = ConcurrentHashMap.newKeySet();
    private final Map<Long, ReentrantLock> pipelineLocks = new ConcurrentHashMap<>();
    
    // Map to track running processes per pipeline
    private final Map<Long, Process> runningProcesses = new ConcurrentHashMap<>();

    public void registerRunningProcess(Long pipelineId, Process process) {
        runningProcesses.put(pipelineId, process);
    }

    public void stopPipelineExecution(Long pipelineId) {
        stoppedPipelines.add(pipelineId);
        
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
    
    public ReentrantLock getPipelineLock(Long pipelineId) {
        return pipelineLocks.computeIfAbsent(pipelineId, k -> new ReentrantLock());
    }
    
    public void executePipeline(Long pipelineId, String workingDir, String runDir, String outputExtension) {
        executePipeline(pipelineId, null, workingDir, runDir, outputExtension);
    }
    
    public void executePipeline(Long pipelineId, Long runId, String workingDir, String runDir, String outputExtension) {
        stoppedPipelines.remove(pipelineId);
        
        ReentrantLock lock = getPipelineLock(pipelineId);
        if (!lock.tryLock()) {
            System.out.println("DEBUG: Pipeline " + pipelineId + " is already running, ignoring request");
            return;
        }
        
        try {
            System.out.println("DEBUG: executePipeline started for pipeline " + pipelineId + (runId != null ? " with runId " + runId : ""));
            
            List<PipelineStep> steps = getStepsByPipeline(pipelineId);
            
            for (PipelineStep step : steps) {
                if ("paused".equals(step.getStatus())) {
                    step.setStatus("ready");
                } else if (!"completed".equals(step.getStatus()) && !"failed".equals(step.getStatus())) {
                    step.setStatus("ready");
                }
                step.setOutputContent(null);
                pipelineStepRepository.save(step);
            }
            
            pipelineStepRepository.flush();
            
            Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
            boolean isStepByStep = "step_by_step".equals(pipeline.getType());
            
            if (isStepByStep) {
                executePipelineStepByStep(pipelineId, runId, workingDir, runDir, outputExtension);
            } else {
                executePipelineSequential(pipelineId, runId, workingDir, runDir, outputExtension);
            }
            
            stopPipelineExecution(pipelineId);
            System.out.println("DEBUG: executePipeline completed for pipeline " + pipelineId);
        } finally {
            lock.unlock();
        }
    }
    
    private void executePipelineSequential(Long pipelineId, Long runId, String workingDir, String runDir, String outputExtension) {
        List<PipelineStep> steps = getStepsByPipeline(pipelineId);
        System.out.println("DEBUG: Found " + steps.size() + " steps");
        
        sendSseStepOutput(runId, pipelineId, 0L, 0, "Working directory: " + workingDir + "\n", "running");
        sendSseStepOutput(runId, pipelineId, 0L, 0, "Run directory: " + runDir + "\n", "running");
        
        String previousOutputFile = null;
        
        for (int i = 0; i < steps.size(); i++) {
            PipelineStep step = steps.get(i);
            if (isPipelineStopped(pipelineId)) {
                markRemainingStepsFailed(pipelineId, runId, step.getStepOrder());
                break;
            }
            executeStep(step, pipelineId, runId, workingDir, runDir, outputExtension, previousOutputFile);
            if ("completed".equals(step.getStatus()) && step.getOutputContent() != null) {
                previousOutputFile = runDir + File.separator + "step" + step.getStepOrder() + "-result." + outputExtension;
            }
        }
    }
    
    private void markRemainingStepsFailed(Long pipelineId, Long runId, int fromStepOrder) {
        List<PipelineStep> steps = getStepsByPipeline(pipelineId);
        for (PipelineStep step : steps) {
            if (step.getStepOrder() > fromStepOrder && !"completed".equals(step.getStatus()) && !"failed".equals(step.getStatus())) {
                step.setStatus("failed");
                step.setOutputContent("Skipped due to pipeline stop");
                pipelineStepRepository.save(step);
                syncRunStepStatus(runId, pipelineId, step.getStepOrder(), "failed", "Skipped due to pipeline stop", "text");
                sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), "Skipped due to pipeline stop\n--- Step failed ---\n", "failed");
            }
        }
    }
    
    private void executePipelineStepByStep(Long pipelineId, Long runId, String workingDir, String runDir, String outputExtension) {
        List<PipelineStep> steps = getStepsByPipeline(pipelineId);
        System.out.println("DEBUG: Found " + steps.size() + " steps (step-by-step mode)");
        
        sendSseStepOutput(runId, pipelineId, 0L, 0, "Working directory: " + workingDir + "\n", "running");
        sendSseStepOutput(runId, pipelineId, 0L, 0, "Run directory: " + runDir + "\n", "running");
        sendSseStepOutput(runId, pipelineId, 0L, 0, "Pipeline mode: step-by-step\n", "running");
        
        String previousOutputFile = null;
        
        for (int i = 0; i < steps.size(); i++) {
            PipelineStep step = steps.get(i);
            if (isPipelineStopped(pipelineId)) {
                if (isPipelineStopped(pipelineId)) {
                    markRemainingStepsFailed(pipelineId, runId, step.getStepOrder());
                }
                break;
            }
            
            executeStep(step, pipelineId, runId, workingDir, runDir, outputExtension, previousOutputFile);
            
            if ("completed".equals(step.getStatus()) && step.getOutputContent() != null) {
                previousOutputFile = runDir + File.separator + "step" + step.getStepOrder() + "-result." + outputExtension;
            }
            
            if ("step_by_step".equals(pipelineService.getPipelineById(pipelineId).getType())) {
                if (!step.getStatus().equals("completed")) {
                    break;
                }
                
                int nextStepOrder = step.getStepOrder() + 1;
                if (nextStepOrder <= steps.size()) {
                    sendSseStepOutput(runId, pipelineId, 0L, step.getStepOrder(), "Step " + step.getStepOrder() + " completed. Waiting for continue...\n", "running");
                } else {
                    sendSseStepOutput(runId, pipelineId, 0L, step.getStepOrder(), "All steps completed!\n", "completed");
                }
            }
        }
    }
    
    private void sendSseStepOutput(Long runId, Long pipelineId, Long stepId, Integer stepOrder, String output, String status) {
        if (runId != null) {
            sseService.sendStepOutputToRun(runId, pipelineId, stepId, stepOrder, output, status);
        } else {
            sseService.sendStepOutput(pipelineId, stepId, stepOrder, output, status);
        }
    }
    
    private void sendSseStepError(Long runId, Long pipelineId, Long stepId, String error, String stackTrace) {
        if (runId != null) {
            sseService.sendStepErrorToRun(runId, pipelineId, stepId, error, stackTrace);
        } else {
            sseService.sendStepError(pipelineId, stepId, error, stackTrace);
        }
    }
    
    private void executeStep(PipelineStep step, Long pipelineId, Long runId, String workingDir, String runDir, String outputExtension, String previousOutputFile) {
        System.out.println("DEBUG: === executeStep START === for pipeline " + pipelineId + ", runId " + runId + ", step " + step.getStepOrder());
        System.out.println("DEBUG: step.getId() = " + step.getId());
        System.out.println("DEBUG: step.getType() = " + step.getType());
        System.out.println("DEBUG: step.getAgent() = " + (step.getAgent() != null ? step.getAgent().getName() : "null"));
        System.out.println("DEBUG: step.getScript() = " + (step.getScript() != null ? step.getScript().getName() : "null"));
        
        if (isPipelineStopped(pipelineId)) {
            step.setStatus("failed");
            step.setOutputContent("Pipeline was stopped by user");
            pipelineStepRepository.save(step);
            syncRunStepStatus(runId, pipelineId, step.getStepOrder(), "failed", "Pipeline was stopped by user", "text");
            sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), "Pipeline was stopped by user\n--- Step failed ---\n", "failed");
            return;
        }
        
        try {
            System.out.println("DEBUG: Executing step " + step.getId() + " - " + (step.getAgent() != null ? step.getAgent().getName() : "script"));
            
            step.setStatus("running");
            pipelineStepRepository.save(step);
            pipelineStepRepository.flush();
            sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), "Starting step: " + (step.getAgent() != null ? step.getAgent().getName() : "script") + "\n", "running");
            syncRunStepStatus(runId, pipelineId, step.getStepOrder(), "running", null, null);
            
            if (previousOutputFile != null) {
                String normalizedPath = previousOutputFile.replace("\\", "/");
                sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), "Previous output file: " + normalizedPath + "\n", "running");
            }
            
            System.out.println("DEBUG: Step status set to running, calling executeAgentStep");
            String output = "";
            
            String stepType = step.getType();
            System.out.println("DEBUG: Step type: '" + stepType + "' (length=" + (stepType != null ? stepType.length() : 0) + ")");
            System.out.println("DEBUG: stepType == null: " + (stepType == null));
            System.out.println("DEBUG: stepType.equals('script'): " + (stepType != null && stepType.equals("script")));
            System.out.println("DEBUG: Step agent: " + (step.getAgent() != null ? step.getAgent().getName() : "null"));
            System.out.println("DEBUG: Step script: " + (step.getScript() != null ? step.getScript().getName() : "null"));
            
            if ("script".equals(stepType)) {
                System.out.println("DEBUG: BRANCH: executing script");
                output = executeScriptStep(step, pipelineId, runId, step.getId(), workingDir, runDir, previousOutputFile);
                System.out.println("DEBUG: Script execution completed");
            } else if (step.getAgent() != null) {
                System.out.println("DEBUG: BRANCH: executing agent");
                output = executeAgentStep(step, pipelineId, runId, step.getId(), workingDir, runDir, previousOutputFile);
            } else if (step.getScript() != null) {
                System.out.println("DEBUG: BRANCH: fallback script execution (type not set)");
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
                syncRunStepStatus(runId, pipelineId, step.getStepOrder(), "failed", stopOutput, "text");
                sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), stopOutput + "\n--- Step failed ---\n", "failed");
                return;
            }
            
            String fullOutput = output + "\n--- Step completed ---\n";
            step.setOutputContent(fullOutput);
            step.setOutputType("text");
            step.setStatus("completed");
            pipelineStepRepository.save(step);
            
            syncRunStepStatus(runId, pipelineId, step.getStepOrder(), "completed", fullOutput, "text");
            
            String resultFileName = "step" + step.getStepOrder() + "-result." + outputExtension;
            File resultFile = new File(runDir, resultFileName);
            try {
                Files.writeString(resultFile.toPath(), fullOutput, StandardCharsets.UTF_8);
                System.out.println("DEBUG: Created result file: " + resultFile.getAbsolutePath());
            } catch (Exception e) {
                System.out.println("DEBUG: Error creating result file: " + e.getMessage());
            }
            
            sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), fullOutput, "completed");
            
        } catch (Exception e) {
            System.out.println("DEBUG: Exception in executeStep: " + e.getMessage());
            e.printStackTrace();
            String errorOutput = "Error: " + e.getMessage() + "\n--- Step failed ---\n";
            step.setStatus("failed");
            step.setOutputContent(errorOutput);
            step.setOutputType("text");
            pipelineStepRepository.save(step);
            syncRunStepStatus(runId, pipelineId, step.getStepOrder(), "failed", errorOutput, "text");
            sendSseStepOutput(runId, pipelineId, step.getId(), step.getStepOrder(), errorOutput, "failed");
            sendSseStepError(runId, pipelineId, step.getId(), e.getMessage(), 
                java.util.Arrays.toString(e.getStackTrace()));
        }
    }
    
    private static final int PERSIST_INTERVAL = 10;
    private int lineCount = 0;
    
    private void streamProcessOutput(BufferedReader reader, Long pipelineId, Long runId, Long stepId, int stepOrder, StringBuilder outputBuilder) {
        try {
            String line;
            while ((line = reader.readLine()) != null) {
                outputBuilder.append(line).append("\n");
                sendSseStepOutput(runId, pipelineId, stepId, stepOrder, line + "\n", "running");
                lineCount++;
                if (lineCount % PERSIST_INTERVAL == 0) {
                    persistOutputIncrementally(stepId, outputBuilder.toString());
                }
            }
            if (lineCount % PERSIST_INTERVAL != 0) {
                persistOutputIncrementally(stepId, outputBuilder.toString());
            }
        } catch (Exception e) {
            sendSseStepOutput(runId, pipelineId, stepId, stepOrder, "Error reading output: " + e.getMessage() + "\n", "running");
        }
    }
    
    private void persistOutputIncrementally(Long stepId, String content) {
        try {
            PipelineStep step = pipelineStepRepository.findById(stepId).orElse(null);
            if (step != null) {
                step.setOutputContent(content);
                step.setOutputType("text");
                pipelineStepRepository.save(step);
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Error persisting output incrementally: " + e.getMessage());
        }
    }
    
    private String executeAgentStep(PipelineStep step, Long pipelineId, Long runId, Long stepId, String workingDir, String runDir, String previousOutputFile) throws Exception {
        Agent agent = step.getAgent();
        
        System.out.println("DEBUG: executeAgentStep - agent is null: " + (agent == null));
        if (agent != null) {
            System.out.println("DEBUG: agent name: " + agent.getName());
            System.out.println("DEBUG: agent prompt: " + agent.getPrompt());
        }
        
        String prompt = agent != null ? agent.getPrompt() : null;
        
        if (prompt == null || prompt.isEmpty()) {
            prompt = "Hello, please respond.";
            sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Warning: Agent has no prompt, using default.\n", "running");
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
                sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "INFO: Replaced {{previous-output-file}} with: " + normalizedPath + "\n", "running");
            } else {
                System.out.println("DEBUG: No previous output file, replacing with empty string");
                prompt = prompt.replace(placeholder, "");
                sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "WARNING: {{previous-output-file}} found but no previous step output - replaced with empty string\n", "running");
            }
        } else {
            System.out.println("DEBUG: Placeholder NOT found in prompt");
            System.out.println("DEBUG: Prompt length: " + prompt.length());
            System.out.println("DEBUG: Checking for: '" + placeholder + "'");
        }
        
        String inputContent = step.getInputContent() != null ? step.getInputContent() : "";
        inputContent = resolveInputContent(inputContent, pipelineId, step.getStepOrder(), runDir);
        String stepOutput = step.getStepOutput() != null ? step.getStepOutput() : "";
        
        prompt = prompt.replace("{{agentic-input:file}}", inputContent);
        prompt = prompt.replace("{{agentic-output:file}}", stepOutput);
        
        System.out.println("DEBUG: Agent prompt after replacement: " + prompt);
        
        String projectTargetCli = getProjectTargetCli(pipelineId);
        String cli = step.getCli();
        
        if (cli == null || cli.isEmpty()) {
            cli = projectTargetCli;
        }
        
        String parameters = step.getParameters();
        String arguments = step.getArguments();
        
        StringBuilder fullCommand = new StringBuilder();

        if (cli.equals("copilot")) {
            fullCommand.append("copilot --allow-all-paths --allow-all-tools -p ");
            String escapedPrompt = escapeWindowsCommand(prompt);
            fullCommand.append('"').append(escapedPrompt).append('"');
        } else if (cli.equals("opencode")) {
            fullCommand.append("opencode run");
            if (parameters != null && !parameters.isEmpty()) {
                fullCommand.append(" ").append(parameters);
            }
            if (arguments != null && !arguments.isEmpty()) {
                fullCommand.append(" ").append(arguments);
            }
            fullCommand.append(" \"").append(escapeWindowsCommand(prompt)).append("\"");
        } else if (cli.equals("claude")) {
            fullCommand.append("claude -p ");
            String escapedPrompt = escapeWindowsCommand(prompt);
            fullCommand.append('"').append(escapedPrompt).append('"');
        } else {
            fullCommand.append(cli);
            if (parameters != null && !parameters.isEmpty()) {
                fullCommand.append(" ").append(parameters);
            }
            if (arguments != null && !arguments.isEmpty()) {
                fullCommand.append(" ").append(arguments);
            }
            fullCommand.append(" \"").append(escapeWindowsCommand(prompt)).append("\"");
        }
        
        System.out.println("DEBUG: Full command: " + fullCommand.toString());
        
        String os = System.getProperty("os.name").toLowerCase();
        List<String> command;
        
        if (os.contains("win")) {
            command = List.of("cmd.exe", "/c", fullCommand.toString());
        } else {
            command = List.of("bash", "-c", fullCommand.toString());
        }
        
        System.out.println("Executing command: " + command);
        
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        
        System.out.println("Working directory: " + workingDir);
        processBuilder.directory(new java.io.File(workingDir));
        
        Map<String, String> env = processBuilder.environment();
        configureProcessEnvironment(env);
        
        File outputFile = new File(System.getProperty("java.io.tmpdir"), "pipeline_output_" + System.currentTimeMillis() + ".txt");
        File errorFile = new File(System.getProperty("java.io.tmpdir"), "pipeline_error_" + System.currentTimeMillis() + ".txt");
        outputFile.deleteOnExit();
        errorFile.deleteOnExit();
        
        processBuilder.redirectErrorStream(true);
        processBuilder.redirectOutput(Redirect.PIPE);
        processBuilder.redirectInput(Redirect.PIPE);
        
        sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Starting process with real-time output streaming...\n", "running");
        System.out.println("DEBUG: Starting process with real-time streaming...");
        Process process = processBuilder.start();
        registerRunningProcess(pipelineId, process);
        
        StringBuilder output = new StringBuilder();
        
        Thread outputThread = new Thread(() -> {
            try {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
                streamProcessOutput(reader, pipelineId, runId, stepId, step.getStepOrder(), output);
            } catch (Exception e) {
                sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Error reading output: " + e.getMessage() + "\n", "running");
            }
        });
        outputThread.start();
        
        try {
            java.io.OutputStream processOutputStream = process.getOutputStream();
            processOutputStream.write("\n".getBytes());
            processOutputStream.flush();
            processOutputStream.close();
        } catch (Exception e) {
            System.out.println("DEBUG: Could not write to stdin: " + e.getMessage());
        }
        
        sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Waiting for process to complete...\n", "running");
        System.out.println("DEBUG: Waiting for process to complete...");
        int exitCode = process.waitFor();
        
        outputThread.join(5000);
        
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
    
    private String executeScriptStep(PipelineStep step, Long pipelineId, Long runId, Long stepId, String workingDir, String runDir, String previousOutputFile) throws Exception {
        System.out.println("DEBUG: === executeScriptStep START ===");
        System.out.println("DEBUG: step.getId() = " + stepId);
        System.out.println("DEBUG: step.getScript() = " + (step.getScript() != null ? step.getScript().getName() : "null"));
        
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
                sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "INFO: Replaced {{previous-output-file}} with: " + previousOutputFile + "\n", "running");
            } else {
                System.out.println("DEBUG: Found {{previous-output-file}} in script but no previous output file available, replacing with empty string");
                scriptContent = scriptContent.replace(placeholder, "");
                sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "WARNING: {{previous-output-file}} found in script but no previous step output available - replaced with empty string\n", "running");
            }
        } else {
            System.out.println("DEBUG: No {{previous-output-file}} placeholder found in script");
        }
        
        String inputContent = step.getInputContent() != null ? step.getInputContent() : "";
        inputContent = resolveInputContent(inputContent, pipelineId, step.getStepOrder(), runDir);
        if (!inputContent.isEmpty()) {
            scriptContent = scriptContent.replace("{{agentic-input:file}}", inputContent);
        }
        
        String stepOutput = step.getStepOutput() != null ? step.getStepOutput() : "";
        if (!stepOutput.isEmpty()) {
            scriptContent = scriptContent.replace("{{agentic-output:file}}", stepOutput);
        }
        
        String runtime = step.getRuntime();
        String customCli = step.getCli();
        String parameters = step.getParameters();
        String arguments = step.getArguments();
        
        String os = System.getProperty("os.name").toLowerCase();
        String scriptExtension;
        List<String> command;
        
        if (runtime == null) {
            runtime = "cmd";
        }
        
        switch (runtime) {
            case "node":
                command = List.of("node");
                break;
            case "java":
                command = List.of("java");
                break;
            case "py":
                command = List.of("py");
                break;
            case "custom":
                if (customCli != null && !customCli.isEmpty()) {
                    command = List.of(customCli);
                } else {
                    throw new RuntimeException("Custom CLI is not specified");
                }
                break;
            case "cmd":
            default:
                if (os.contains("win")) {
                    command = List.of("cmd.exe", "/c");
                } else {
                    command = List.of("bash");
                }
                break;
        }
        
        if ("cmd".equals(runtime)) {
            if (os.contains("win")) {
                scriptExtension = ".bat";
            } else {
                scriptExtension = ".sh";
            }
            if (arguments != null && !arguments.isEmpty()) {
                scriptContent = scriptContent.replace("%0", arguments);
            }
        } else {
            String scriptName = script.getName();
            if (scriptName != null && scriptName.contains(".")) {
                int lastDot = scriptName.lastIndexOf('.');
                scriptExtension = scriptName.substring(lastDot + 1);
            } else {
                scriptExtension = "";
            }
        }
        
        String extWithDot = scriptExtension.isEmpty() ? "" : "." + scriptExtension;
        File tempScript = new File(System.getProperty("java.io.tmpdir"), "pipeline_script_" + System.currentTimeMillis() + extWithDot);
        tempScript.deleteOnExit();
        
        Files.writeString(tempScript.toPath(), scriptContent, StandardCharsets.UTF_8);
        
        if (!os.contains("win")) {
            tempScript.setExecutable(true);
        }
        
        sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Executing script: " + script.getName() + " (runtime: " + runtime + ")\n", "running");
        
        List<String> fullCommand = new ArrayList<>(command);
        fullCommand.add(tempScript.getAbsolutePath());
        
        if (parameters != null && !parameters.isEmpty()) {
            fullCommand.add(parameters);
        }
        
        if (arguments != null && !arguments.isEmpty() && !"cmd".equals(runtime)) {
            fullCommand.add(arguments);
        }
        
        ProcessBuilder processBuilder = new ProcessBuilder(fullCommand);
        processBuilder.directory(new java.io.File(workingDir));
        
        Map<String, String> env = processBuilder.environment();
        configureProcessEnvironment(env);
        
        File outputFile = new File(System.getProperty("java.io.tmpdir"), "script_output_" + System.currentTimeMillis() + ".txt");
        outputFile.deleteOnExit();
        
        processBuilder.redirectErrorStream(true);
        processBuilder.redirectOutput(Redirect.PIPE);
        
        sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Starting script with real-time output streaming...\n", "running");
        sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Command: " + String.join(" ", fullCommand) + "\n", "running");
        System.out.println("DEBUG: Starting script with real-time streaming...");
        Process process = processBuilder.start();
        registerRunningProcess(pipelineId, process);
        
        StringBuilder output = new StringBuilder();
        
        Thread outputThread = new Thread(() -> {
            try {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
                streamProcessOutput(reader, pipelineId, runId, stepId, step.getStepOrder(), output);
            } catch (Exception e) {
                sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(), "Error reading output: " + e.getMessage() + "\n", "running");
            }
        });
        outputThread.start();
        
        int exitCode = process.waitFor();
        
        outputThread.join(5000);
        
        if (exitCode != 0) {
            String errorMsg = output.toString();
            if (errorMsg.isEmpty()) {
                throw new RuntimeException("Script failed with exit code: " + exitCode);
            } else {
                throw new RuntimeException(errorMsg + "\n\nScript exited with code: " + exitCode);
            }
        }
        
        return output.toString();
    }
    
    private void syncRunStepStatus(Long runId, Long pipelineId, Integer stepOrder, String status, String outputContent, String outputType) {
        try {
            Long targetRunId = runId;
            Long targetPipelineId = pipelineId;
            
            if (targetRunId == null) {
                List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(pipelineId);
                System.out.println("DEBUG: syncRunStepStatus - found " + runs.size() + " runs for pipeline " + pipelineId);
                if (runs != null && !runs.isEmpty()) {
                    targetRunId = runs.get(0).getId();
                    targetPipelineId = runs.get(0).getPipeline().getId();
                }
            } else {
                PipelineRun run = pipelineRunService.getRunById(targetRunId);
                if (run != null) {
                    targetPipelineId = run.getPipeline().getId();
                }
            }
            
            if (targetRunId != null) {
                System.out.println("DEBUG: syncRunStepStatus - syncing run " + targetRunId + " (pipeline " + targetPipelineId + "), step " + stepOrder + " to " + status);
                pipelineRunService.updateRunStep(targetRunId, stepOrder, status, outputContent, outputType);
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Error syncing run step status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void configureProcessEnvironment(Map<String, String> env) {
        String osName = System.getProperty("os.name").toLowerCase();
        boolean isWindows = osName.contains("win");
        
        String userHome = System.getenv("USERPROFILE");
        if (userHome == null) {
            userHome = System.getenv("HOME");
        }
        
        env.put("OPENCODE_HOME", userHome != null ? userHome : System.getProperty("user.home"));
        
        if (isWindows) {
            String pathext = env.get("PATHEXT");
            if (pathext == null || !pathext.contains(".CMD")) {
                env.put("PATHEXT", ".CMD;.EXE;.BAT;.PS1");
            }
        }
        
        String path = env.get("PATH");
        String pathSeparator = isWindows ? ";" : ":";
        
        String systemPath = System.getenv("PATH");
        
        if (path == null) {
            path = systemPath;
        }
        
        if (path != null && userHome != null) {
            StringBuilder newPath = new StringBuilder();
            
            Path toolsPath = Paths.get(userHome, ".agentic", "tools");
            if (Files.exists(toolsPath)) {
                newPath.append(toolsPath.toAbsolutePath()).append(pathSeparator);
            }
            
            newPath.append(userHome).append("\\AppData\\Roaming\\npm");
            newPath.append(pathSeparator);
            newPath.append("C:\\Program Files\\nodejs");
            
            if (isWindows) {
                Path psPath = Paths.get("C:\\Program Files\\PowerShell\\7");
                if (Files.exists(psPath)) {
                    newPath.append(pathSeparator).append(psPath.toAbsolutePath());
                }
                
                Path psPath86 = Paths.get("C:\\Program Files (x86)\\PowerShell\\7");
                if (Files.exists(psPath86)) {
                    newPath.append(pathSeparator).append(psPath86.toAbsolutePath());
                }
                
                Path opencodePath = Paths.get("C:\\Users\\" + System.getenv("USERNAME") + "\\AppData\\Local\\Programs\\opencode");
                if (Files.exists(opencodePath)) {
                    newPath.append(pathSeparator).append(opencodePath.toAbsolutePath());
                }
            }
            
            env.put("PATH", newPath.toString() + pathSeparator + path);
            
            System.out.println("DEBUG: Updated PATH for process: " + newPath);
            System.out.println("DEBUG: Original system PATH: " + systemPath);
        }
    }
}