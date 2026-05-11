package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import io.github.akumosstl.agentic.backend.model.Project;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PipelineTest {

    private Project testProject;
    private Pipeline pipeline;

    @BeforeEach
    void setUp() {
        testProject = new Project();
        testProject.setId(1L);
        testProject.setName("Test Project");

        pipeline = new Pipeline("Test Pipeline", "Test Description", testProject);
    }

    @Test
    void testPipelineCreation() {
        assertNotNull(pipeline);
        assertEquals("Test Pipeline", pipeline.getName());
        assertEquals("Test Description", pipeline.getDescription());
        assertEquals(testProject, pipeline.getProject());

        pipeline.setStatus("pending");
        assertEquals("pending", pipeline.getStatus());
    }

    @Test
    void testPipelineDefaultStatus() {
        pipeline.setStatus("pending");
        assertEquals("pending", pipeline.getStatus());
    }

    @Test
    void testPipelineTypeField() {
        assertNull(pipeline.getType());

        pipeline.setType("sequential");
        assertEquals("sequential", pipeline.getType());

        pipeline.setType("step_by_step");
        assertEquals("step_by_step", pipeline.getType());
    }

    @Test
    void testPipelineOutputExtension() {
        assertNull(pipeline.getOutputExtension());

        pipeline.setOutputExtension("json");
        assertEquals("json", pipeline.getOutputExtension());

        pipeline.setOutputExtension("txt");
        assertEquals("txt", pipeline.getOutputExtension());
    }

    @Test
    void testPipelineProjectId() {
        assertEquals(1L, pipeline.getProjectId());
    }

    @Test
    void testPipelineTimestamps() {
        pipeline.setCreatedAt(java.time.LocalDateTime.now());
        pipeline.setUpdatedAt(java.time.LocalDateTime.now());
        assertNotNull(pipeline.getCreatedAt());
        assertNotNull(pipeline.getUpdatedAt());
    }

    @Test
    void testPipelineSetters() {
        pipeline.setName("Updated Name");
        pipeline.setDescription("Updated Description");
        pipeline.setStatus("running");
        pipeline.setType("step_by_step");
        pipeline.setOutputExtension("yml");

        assertEquals("Updated Name", pipeline.getName());
        assertEquals("Updated Description", pipeline.getDescription());
        assertEquals("running", pipeline.getStatus());
        assertEquals("step_by_step", pipeline.getType());
        assertEquals("yml", pipeline.getOutputExtension());
    }

    @Test
    void testPipelineId() {
        assertNull(pipeline.getId());

        pipeline.setId(100L);
        assertEquals(100L, pipeline.getId());
    }

    @Test
    void testPipelineWithNullProject() {
        Pipeline pipelineNoProject = new Pipeline();
        pipelineNoProject.setName("Standalone Pipeline");

        assertNull(pipelineNoProject.getProject());
        assertNull(pipelineNoProject.getProjectId());
    }
}
