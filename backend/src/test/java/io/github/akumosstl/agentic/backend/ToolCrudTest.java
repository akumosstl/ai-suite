package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.repository.ToolRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class ToolCrudTest {

    @Autowired
    private ToolRepository toolRepository;

    @Test
    public void testCreateTool() {
        Tool tool = new Tool();
        tool.setName("Test Tool");
        tool.setNamespace("test.namespace");
        tool.setDescription("Test description");
        tool.setInstructions("Test instructions");
        tool.setPath("/path/to/tool");

        Tool saved = toolRepository.save(tool);

        assertNotNull(saved.getId());
        assertEquals("Test Tool", saved.getName());
        assertEquals("test.namespace", saved.getNamespace());
    }

    @Test
    public void testReadTool() {
        Tool tool = new Tool();
        tool.setName("Read Tool");
        tool.setNamespace("read.namespace");
        tool = toolRepository.save(tool);

        Optional<Tool> found = toolRepository.findById(tool.getId());

        assertTrue(found.isPresent());
        assertEquals("Read Tool", found.get().getName());
    }

    @Test
    public void testUpdateTool() {
        Tool tool = new Tool();
        tool.setName("Update Tool");
        tool.setNamespace("update.namespace");
        tool.setCategory("test");
        tool = toolRepository.save(tool);

        Tool existing = toolRepository.findById(tool.getId()).get();
        existing.setName("Updated Name");
        existing.setCategory("updated");
        toolRepository.save(existing);

        Tool updated = toolRepository.findById(tool.getId()).get();
        assertEquals("Updated Name", updated.getName());
        assertEquals("updated", updated.getCategory());
    }

    @Test
    public void testDeleteTool() {
        Tool tool = new Tool();
        tool.setName("Delete Tool");
        tool.setNamespace("delete.namespace");
        tool = toolRepository.save(tool);
        Long toolId = tool.getId();

        toolRepository.deleteById(toolId);

        Optional<Tool> found = toolRepository.findById(toolId);
        assertTrue(found.isEmpty());
    }

    @Test
    public void testFindByNamespace() {
        Tool tool1 = new Tool();
        tool1.setName("Tool 1");
        tool1.setNamespace("same.namespace");
        Tool tool2 = new Tool();
        tool2.setName("Tool 2");
        tool2.setNamespace("same.namespace");
        toolRepository.save(tool1);
        toolRepository.save(tool2);

        List<Tool> found = toolRepository.findByNamespace("same.namespace");

        assertEquals(2, found.size());
    }

    @Test
    public void testFindByCategory() {
        Tool tool1 = new Tool();
        tool1.setName("Tool 1");
        tool1.setNamespace("ns1");
        tool1.setCategory("devops");
        Tool tool2 = new Tool();
        tool2.setName("Tool 2");
        tool2.setNamespace("ns2");
        tool2.setCategory("devops");
        toolRepository.save(tool1);
        toolRepository.save(tool2);

        List<Tool> found = toolRepository.findByCategory("devops");

        assertEquals(2, found.size());
    }

    @Test
    public void testGetDistinctNamespaces() {
        Tool tool1 = new Tool();
        tool1.setName("Tool 1");
        tool1.setNamespace("ns1");
        Tool tool2 = new Tool();
        tool2.setName("Tool 2");
        tool2.setNamespace("ns2");
        Tool tool3 = new Tool();
        tool3.setName("Tool 3");
        tool3.setNamespace("ns1");
        toolRepository.save(tool1);
        toolRepository.save(tool2);
        toolRepository.save(tool3);

        List<String> namespaces = toolRepository.findDistinctNamespaces();

        assertEquals(2, namespaces.size());
        assertTrue(namespaces.contains("ns1"));
        assertTrue(namespaces.contains("ns2"));
    }
}
