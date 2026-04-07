package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.PipelineRun;
import io.github.akumosstl.agentic.backend.model.PipelineRunStep;
import io.github.akumosstl.agentic.backend.model.Project;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PipelineRunTest {

    private Project testProject;
    private Pipeline testPipeline;
    private PipelineRun pipelineRun;

    @BeforeEach
    void setUp() {
        testProject = new Project();
        testProject.setId(1L);
        testProject.setName("Test Project");
        
        testPipeline = new Pipeline("Test Pipeline", "Test Description", testProject);
        testPipeline.setId(1L);
        
        pipelineRun = new PipelineRun(testPipeline);
    }

    @Test
    void testPipelineRunCreation() {
        pipelineRun.setStatus("running");
        assertNotNull(pipelineRun);
        assertEquals(testPipeline, pipelineRun.getPipeline());
        assertEquals("running", pipelineRun.getStatus());
        pipelineRun.setStartedAt(java.time.LocalDateTime.now());
        pipelineRun.setCreatedAt(java.time.LocalDateTime.now());
        assertNotNull(pipelineRun.getStartedAt());
        assertNotNull(pipelineRun.getCreatedAt());
    }

    @Test
    void testPipelineRunPipelineId() {
        assertEquals(1L, pipelineRun.getPipelineId());
    }

    @Test
    void testPipelineRunPipelineName() {
        assertEquals("Test Pipeline", pipelineRun.getPipelineName());
    }

    @Test
    void testPipelineRunSteps() {
        assertNotNull(pipelineRun.getSteps());
        assertTrue(pipelineRun.getSteps().isEmpty());
    }

    @Test
    void testAddStep() {
        PipelineRunStep step1 = new PipelineRunStep(1);
        PipelineRunStep step2 = new PipelineRunStep(2);
        
        pipelineRun.addStep(step1);
        pipelineRun.addStep(step2);
        
        assertEquals(2, pipelineRun.getSteps().size());
        assertEquals(step1, pipelineRun.getSteps().get(0));
        assertEquals(step2, pipelineRun.getSteps().get(1));
    }

    @Test
    void testPipelineRunStepOrder() {
        PipelineRunStep step1 = new PipelineRunStep(1);
        step1.setStatus("pending");
        step1.setAgentName("Test Agent");
        
        pipelineRun.addStep(step1);
        
        assertEquals(1, pipelineRun.getSteps().get(0).getStepOrder());
        assertEquals("pending", pipelineRun.getSteps().get(0).getStatus());
        assertEquals("Test Agent", pipelineRun.getSteps().get(0).getAgentName());
    }

    @Test
    void testPipelineRunSetters() {
        pipelineRun.setStatus("completed");
        assertEquals("completed", pipelineRun.getStatus());
        
        pipelineRun.setId(100L);
        assertEquals(100L, pipelineRun.getId());
    }

    @Test
    void testPipelineRunWithNullPipeline() {
        PipelineRun runNoPipeline = new PipelineRun();
        assertNull(runNoPipeline.getPipeline());
        assertNull(runNoPipeline.getPipelineId());
        assertNull(runNoPipeline.getPipelineName());
    }
}
