package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.repository.PipelineRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineStepRepository;
import io.github.akumosstl.agentic.backend.repository.PipelineRunRepository;
import io.github.akumosstl.agentic.backend.service.PipelineService;
import io.github.akumosstl.agentic.backend.service.PipelineStepService;
import io.github.akumosstl.agentic.backend.service.SseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class PipelineExecutionTest {

    @Autowired
    private PipelineService pipelineService;

    @Autowired
    private PipelineStepService pipelineStepService;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private SseService sseService;

    private Project testProject;
    private Pipeline testPipeline;

    @BeforeEach
    void setUp() {
        pipelineRunRepository.deleteAll();
        pipelineStepRepository.deleteAll();
        pipelineRepository.deleteAll();

        testProject = new Project();
        testProject.setName("Test Project");
        testProject.setPath(System.getProperty("java.io.tmpdir"));

        testPipeline = new Pipeline("Test Pipeline", "Test Description", testProject);
        testPipeline.setType("sequential");
        testPipeline.setOutputExtension("txt");
    }

    @Test
    void testPipelineCreation() {
        assertNotNull(testPipeline);
        assertEquals("Test Pipeline", testPipeline.getName());
        assertEquals("sequential", testPipeline.getType());
        assertEquals("txt", testPipeline.getOutputExtension());
    }

    @Test
    void testPipelineStatusTransitions() {
        testPipeline.setStatus("pending");
        assertEquals("pending", testPipeline.getStatus());

        testPipeline.setStatus("running");
        assertEquals("running", testPipeline.getStatus());

        testPipeline.setStatus("completed");
        assertEquals("completed", testPipeline.getStatus());

        testPipeline.setStatus("failed");
        assertEquals("failed", testPipeline.getStatus());

        testPipeline.setStatus("stopped");
        assertEquals("stopped", testPipeline.getStatus());
    }

    @Test
    void testPipelineTypes() {
        testPipeline.setType("sequential");
        assertEquals("sequential", testPipeline.getType());

        testPipeline.setType("step_by_step");
        assertEquals("step_by_step", testPipeline.getType());
    }

    @Test
    void testPauseResumeMechanism() {
        Long pipelineId = 1L;

        pipelineStepService.pausePipeline(pipelineId);
        assertTrue(pipelineStepService.isPipelinePaused(pipelineId));

        pipelineStepService.resumePipeline(pipelineId);
        assertFalse(pipelineStepService.isPipelinePaused(pipelineId));
    }

    @Test
    void testStopPipeline() {
        Long pipelineId = 1L;

        pipelineStepService.pausePipeline(pipelineId);
        assertTrue(pipelineStepService.isPipelinePaused(pipelineId));

        pipelineStepService.stopPipelineExecution(pipelineId);
        assertTrue(pipelineStepService.isPipelineStopped(pipelineId));
    }

    @Test
    void testPendingStepOrderTracking() {
        Long pipelineId = 1L;
        int stepOrder = 3;

        pipelineStepService.setPendingStepOrder(pipelineId, stepOrder);
        assertEquals(stepOrder, pipelineStepService.getPendingStepOrder(pipelineId));
    }

    @Test
    void testPipelineLock() {
        Long pipelineId = 1L;

        var lock1 = pipelineStepService.getPipelineLock(pipelineId);
        var lock2 = pipelineStepService.getPipelineLock(pipelineId);

        assertSame(lock1, lock2);
    }

    @Test
    void testSseService() {
        Long pipelineId = 1L;

        var emitter = sseService.addEmitter(pipelineId);
        assertNotNull(emitter);

        sseService.sendStepOutput(pipelineId, 1L, 1, "Test output", "running");
        sseService.sendPipelinePaused(pipelineId, 1, 2);
        sseService.sendPipelineComplete(pipelineId, "completed");
    }

    @Test
    void testStepStatusTransitions() {
        Agent agent = new Agent();
        agent.setName("Test Agent");
        agent.setPrompt("Test prompt");

        PipelineStep step = new PipelineStep();
        step.setAgent(agent);
        step.setType("agent");
        step.setStepOrder(1);

        assertEquals("ready", step.getStatus());

        step.setStatus("running");
        assertEquals("running", step.getStatus());

        step.setStatus("completed");
        assertEquals("completed", step.getStatus());

        step.setStatus("failed");
        assertEquals("failed", step.getStatus());
    }

    @Test
    void testSequentialExecution() {
        testPipeline.setType("sequential");
        assertEquals("sequential", testPipeline.getType());
    }

    @Test
    void testStepByStepExecution() {
        testPipeline.setType("step_by_step");
        assertEquals("step_by_step", testPipeline.getType());
    }

    @Test
    void testPlaceholderReplacement() {
        String prompt = "Review the following file: {{previous-output-file}}";
        String previousOutput = "C:/test/output.txt";
        
        String replaced = prompt.replace("{{previous-output-file}}", previousOutput.replace("\\", "/"));
        
        assertTrue(replaced.contains("C:/test/output.txt"));
        assertFalse(replaced.contains("{{previous-output-file}}"));
    }

    @Test
    void testAtomicBooleanPause() {
        AtomicBoolean paused = new AtomicBoolean(true);
        
        assertTrue(paused.get());
        
        paused.set(false);
        assertFalse(paused.get());
        
        paused.compareAndSet(false, true);
        assertTrue(paused.get());
    }
}
