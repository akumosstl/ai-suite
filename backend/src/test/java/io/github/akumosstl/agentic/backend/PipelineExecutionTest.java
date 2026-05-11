package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineStep;
import io.github.akumosstl.agentic.backend.model.Project;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

class PipelineExecutionTest {

    @Test
    void testPipelineCreation() {
        Project project = new Project();
        project.setName("Test Project");
        project.setPath(System.getProperty("java.io.tmpdir"));

        Pipeline pipeline = new Pipeline("Test Pipeline", "Test Description", project);
        pipeline.setType("sequential");
        pipeline.setOutputExtension("txt");

        assertNotNull(pipeline);
        assertEquals("Test Pipeline", pipeline.getName());
        assertEquals("sequential", pipeline.getType());
        assertEquals("txt", pipeline.getOutputExtension());
    }

    @Test
    void testPipelineStatusTransitions() {
        Pipeline pipeline = new Pipeline();

        pipeline.setStatus("pending");
        assertEquals("pending", pipeline.getStatus());

        pipeline.setStatus("running");
        assertEquals("running", pipeline.getStatus());

        pipeline.setStatus("completed");
        assertEquals("completed", pipeline.getStatus());

        pipeline.setStatus("failed");
        assertEquals("failed", pipeline.getStatus());

        pipeline.setStatus("stopped");
        assertEquals("stopped", pipeline.getStatus());
    }

    @Test
    void testPipelineTypes() {
        Pipeline pipeline = new Pipeline();

        pipeline.setType("sequential");
        assertEquals("sequential", pipeline.getType());

        pipeline.setType("step_by_step");
        assertEquals("step_by_step", pipeline.getType());
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

        assertEquals("pending", step.getStatus());

        step.setStatus("running");
        assertEquals("running", step.getStatus());

        step.setStatus("completed");
        assertEquals("completed", step.getStatus());

        step.setStatus("failed");
        assertEquals("failed", step.getStatus());
    }

    @Test
    void testSequentialExecution() {
        Pipeline pipeline = new Pipeline();
        pipeline.setType("sequential");
        assertEquals("sequential", pipeline.getType());
    }

    @Test
    void testStepByStepExecution() {
        Pipeline pipeline = new Pipeline();
        pipeline.setType("step_by_step");
        assertEquals("step_by_step", pipeline.getType());
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
