package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.Project;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PipelineModelTest {

    @Test
    void testPipelineTypeSequential() {
        Pipeline pipeline = new Pipeline();
        pipeline.setType("sequential");
        assertEquals("sequential", pipeline.getType());
    }

    @Test
    void testPipelineTypeStepByStep() {
        Pipeline pipeline = new Pipeline();
        pipeline.setType("step_by_step");
        assertEquals("step_by_step", pipeline.getType());
    }

    @Test
    void testPipelineTypeNull() {
        Pipeline pipeline = new Pipeline();
        assertNull(pipeline.getType());
    }

    @Test
    void testPipelineTypeDefaultIsNull() {
        Pipeline pipeline = new Pipeline("Test", "Desc", null);
        assertNull(pipeline.getType());
    }

    @Test
    void testPipelineOutputExtension() {
        Pipeline pipeline = new Pipeline();
        pipeline.setOutputExtension("json");
        assertEquals("json", pipeline.getOutputExtension());
        
        pipeline.setOutputExtension("txt");
        assertEquals("txt", pipeline.getOutputExtension());
    }

    @Test
    void testPipelineId() {
        Pipeline pipeline = new Pipeline();
        pipeline.setId(1L);
        assertEquals(1L, pipeline.getId());
    }

    @Test
    void testPipelineName() {
        Pipeline pipeline = new Pipeline();
        pipeline.setName("My Pipeline");
        assertEquals("My Pipeline", pipeline.getName());
    }

    @Test
    void testPipelineDescription() {
        Pipeline pipeline = new Pipeline();
        pipeline.setDescription("Test Description");
        assertEquals("Test Description", pipeline.getDescription());
    }

    @Test
    void testPipelineStatus() {
        Pipeline pipeline = new Pipeline();
        pipeline.setStatus("running");
        assertEquals("running", pipeline.getStatus());
        
        pipeline.setStatus("completed");
        assertEquals("completed", pipeline.getStatus());
        
        pipeline.setStatus("failed");
        assertEquals("failed", pipeline.getStatus());
        
        pipeline.setStatus("stopped");
        assertEquals("stopped", pipeline.getStatus());
    }
}
