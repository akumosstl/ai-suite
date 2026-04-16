package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class SkillCrudTest {

    @Autowired
    private SkillRepository skillRepository;

    @Test
    public void testCreateSkill() {
        Skill skill = new Skill();
        skill.setName("Test Skill");
        skill.setNamespace("test.namespace");
        skill.setDescription("Test description");
        skill.setInstructions("Test instructions");
        skill.setPath("/path/to/skill");

        Skill saved = skillRepository.save(skill);

        assertNotNull(saved.getId());
        assertEquals("Test Skill", saved.getName());
        assertEquals("test.namespace", saved.getNamespace());
    }

    @Test
    public void testReadSkill() {
        Skill skill = new Skill();
        skill.setName("Read Skill");
        skill.setNamespace("read.namespace");
        skill = skillRepository.save(skill);

        Optional<Skill> found = skillRepository.findById(skill.getId());

        assertTrue(found.isPresent());
        assertEquals("Read Skill", found.get().getName());
    }

    @Test
    public void testUpdateSkill() {
        Skill skill = new Skill();
        skill.setName("Update Skill");
        skill.setNamespace("update.namespace");
        skill.setCategory("test");
        skill = skillRepository.save(skill);

        Skill existing = skillRepository.findById(skill.getId()).get();
        existing.setName("Updated Name");
        existing.setCategory("updated");
        skillRepository.save(existing);

        Skill updated = skillRepository.findById(skill.getId()).get();
        assertEquals("Updated Name", updated.getName());
        assertEquals("updated", updated.getCategory());
    }

    @Test
    public void testDeleteSkill() {
        Skill skill = new Skill();
        skill.setName("Delete Skill");
        skill.setNamespace("delete.namespace");
        skill = skillRepository.save(skill);
        Long skillId = skill.getId();

        skillRepository.deleteById(skillId);

        Optional<Skill> found = skillRepository.findById(skillId);
        assertTrue(found.isEmpty());
    }

    @Test
    public void testFindByNamespace() {
        Skill skill1 = new Skill();
        skill1.setName("Skill 1");
        skill1.setNamespace("same.namespace");
        Skill skill2 = new Skill();
        skill2.setName("Skill 2");
        skill2.setNamespace("same.namespace");
        skillRepository.save(skill1);
        skillRepository.save(skill2);

        List<Skill> found = skillRepository.findByNamespace("same.namespace");

        assertEquals(2, found.size());
    }

    @Test
    public void testFindByCategory() {
        Skill skill1 = new Skill();
        skill1.setName("Skill 1");
        skill1.setNamespace("ns1");
        skill1.setCategory("programming");
        Skill skill2 = new Skill();
        skill2.setName("Skill 2");
        skill2.setNamespace("ns2");
        skill2.setCategory("programming");
        skillRepository.save(skill1);
        skillRepository.save(skill2);

        List<Skill> found = skillRepository.findByCategory("programming");

        assertEquals(2, found.size());
    }

    @Test
    public void testGetDistinctNamespaces() {
        Skill skill1 = new Skill();
        skill1.setName("Skill 1");
        skill1.setNamespace("ns1");
        Skill skill2 = new Skill();
        skill2.setName("Skill 2");
        skill2.setNamespace("ns2");
        Skill skill3 = new Skill();
        skill3.setName("Skill 3");
        skill3.setNamespace("ns1");
        skillRepository.save(skill1);
        skillRepository.save(skill2);
        skillRepository.save(skill3);

        List<String> namespaces = skillRepository.findDistinctNamespaces();

        assertEquals(2, namespaces.size());
        assertTrue(namespaces.contains("ns1"));
        assertTrue(namespaces.contains("ns2"));
    }
}
