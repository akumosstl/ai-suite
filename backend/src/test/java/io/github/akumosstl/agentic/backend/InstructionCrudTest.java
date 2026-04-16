package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class InstructionCrudTest {

    @Autowired
    private InstructionRepository instructionRepository;

    @Test
    public void testCreateInstruction() {
        Instruction instruction = new Instruction();
        instruction.setName("Test Instruction");
        instruction.setNamespace("test.namespace");
        instruction.setDescription("Test description");
        instruction.setInstructions("Test instructions");
        instruction.setPath("/path/to/instruction");

        Instruction saved = instructionRepository.save(instruction);

        assertNotNull(saved.getId());
        assertEquals("Test Instruction", saved.getName());
        assertEquals("test.namespace", saved.getNamespace());
    }

    @Test
    public void testReadInstruction() {
        Instruction instruction = new Instruction();
        instruction.setName("Read Instruction");
        instruction.setNamespace("read.namespace");
        instruction = instructionRepository.save(instruction);

        Optional<Instruction> found = instructionRepository.findById(instruction.getId());

        assertTrue(found.isPresent());
        assertEquals("Read Instruction", found.get().getName());
    }

    @Test
    public void testUpdateInstruction() {
        Instruction instruction = new Instruction();
        instruction.setName("Update Instruction");
        instruction.setNamespace("update.namespace");
        instruction.setCategory("test");
        instruction = instructionRepository.save(instruction);

        Instruction existing = instructionRepository.findById(instruction.getId()).get();
        existing.setName("Updated Name");
        existing.setCategory("updated");
        instructionRepository.save(existing);

        Instruction updated = instructionRepository.findById(instruction.getId()).get();
        assertEquals("Updated Name", updated.getName());
        assertEquals("updated", updated.getCategory());
    }

    @Test
    public void testDeleteInstruction() {
        Instruction instruction = new Instruction();
        instruction.setName("Delete Instruction");
        instruction.setNamespace("delete.namespace");
        instruction = instructionRepository.save(instruction);
        Long instructionId = instruction.getId();

        instructionRepository.deleteById(instructionId);

        Optional<Instruction> found = instructionRepository.findById(instructionId);
        assertTrue(found.isEmpty());
    }

    @Test
    public void testFindByNamespace() {
        Instruction instruction1 = new Instruction();
        instruction1.setName("Instruction 1");
        instruction1.setNamespace("same.namespace");
        Instruction instruction2 = new Instruction();
        instruction2.setName("Instruction 2");
        instruction2.setNamespace("same.namespace");
        instructionRepository.save(instruction1);
        instructionRepository.save(instruction2);

        List<Instruction> found = instructionRepository.findByNamespace("same.namespace");

        assertEquals(2, found.size());
    }

    @Test
    public void testFindByCategory() {
        Instruction instruction1 = new Instruction();
        instruction1.setName("Instruction 1");
        instruction1.setNamespace("ns1");
        instruction1.setCategory("security");
        Instruction instruction2 = new Instruction();
        instruction2.setName("Instruction 2");
        instruction2.setNamespace("ns2");
        instruction2.setCategory("security");
        instructionRepository.save(instruction1);
        instructionRepository.save(instruction2);

        List<Instruction> found = instructionRepository.findByCategory("security");

        assertEquals(2, found.size());
    }

    @Test
    public void testGetDistinctNamespaces() {
        Instruction instruction1 = new Instruction();
        instruction1.setName("Instruction 1");
        instruction1.setNamespace("ns1");
        Instruction instruction2 = new Instruction();
        instruction2.setName("Instruction 2");
        instruction2.setNamespace("ns2");
        Instruction instruction3 = new Instruction();
        instruction3.setName("Instruction 3");
        instruction3.setNamespace("ns1");
        instructionRepository.save(instruction1);
        instructionRepository.save(instruction2);
        instructionRepository.save(instruction3);

        List<String> namespaces = instructionRepository.findDistinctNamespaces();

        assertEquals(2, namespaces.size());
        assertTrue(namespaces.contains("ns1"));
        assertTrue(namespaces.contains("ns2"));
    }
}
