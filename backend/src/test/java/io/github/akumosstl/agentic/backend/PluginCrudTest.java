package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.repository.PluginRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class PluginCrudTest {

    @Autowired
    private PluginRepository pluginRepository;

    @Test
    public void testCreatePlugin() {
        Plugin plugin = new Plugin();
        plugin.setName("Test Plugin");
        plugin.setNamespace("test.namespace");
        plugin.setDescription("Test description");
        plugin.setInstructions("Test instructions");
        plugin.setPath("/path/to/plugin");

        Plugin saved = pluginRepository.save(plugin);

        assertNotNull(saved.getId());
        assertEquals("Test Plugin", saved.getName());
        assertEquals("test.namespace", saved.getNamespace());
    }

    @Test
    public void testReadPlugin() {
        Plugin plugin = new Plugin();
        plugin.setName("Read Plugin");
        plugin.setNamespace("read.namespace");
        plugin = pluginRepository.save(plugin);

        Optional<Plugin> found = pluginRepository.findById(plugin.getId());

        assertTrue(found.isPresent());
        assertEquals("Read Plugin", found.get().getName());
    }

    @Test
    public void testUpdatePlugin() {
        Plugin plugin = new Plugin();
        plugin.setName("Update Plugin");
        plugin.setNamespace("update.namespace");
        plugin.setCategory("test");
        plugin = pluginRepository.save(plugin);

        Plugin existing = pluginRepository.findById(plugin.getId()).get();
        existing.setName("Updated Name");
        existing.setCategory("updated");
        pluginRepository.save(existing);

        Plugin updated = pluginRepository.findById(plugin.getId()).get();
        assertEquals("Updated Name", updated.getName());
        assertEquals("updated", updated.getCategory());
    }

    @Test
    public void testDeletePlugin() {
        Plugin plugin = new Plugin();
        plugin.setName("Delete Plugin");
        plugin.setNamespace("delete.namespace");
        plugin = pluginRepository.save(plugin);
        Long pluginId = plugin.getId();

        pluginRepository.deleteById(pluginId);

        Optional<Plugin> found = pluginRepository.findById(pluginId);
        assertTrue(found.isEmpty());
    }

    @Test
    public void testFindByNamespace() {
        Plugin plugin1 = new Plugin();
        plugin1.setName("Plugin 1");
        plugin1.setNamespace("same.namespace");
        Plugin plugin2 = new Plugin();
        plugin2.setName("Plugin 2");
        plugin2.setNamespace("same.namespace");
        pluginRepository.save(plugin1);
        pluginRepository.save(plugin2);

        List<Plugin> found = pluginRepository.findByNamespace("same.namespace");

        assertEquals(2, found.size());
    }

    @Test
    public void testFindByCategory() {
        Plugin plugin1 = new Plugin();
        plugin1.setName("Plugin 1");
        plugin1.setNamespace("ns1");
        plugin1.setCategory("utilities");
        Plugin plugin2 = new Plugin();
        plugin2.setName("Plugin 2");
        plugin2.setNamespace("ns2");
        plugin2.setCategory("utilities");
        pluginRepository.save(plugin1);
        pluginRepository.save(plugin2);

        List<Plugin> found = pluginRepository.findByCategory("utilities");

        assertEquals(2, found.size());
    }

    @Test
    public void testGetDistinctNamespaces() {
        Plugin plugin1 = new Plugin();
        plugin1.setName("Plugin 1");
        plugin1.setNamespace("ns1");
        Plugin plugin2 = new Plugin();
        plugin2.setName("Plugin 2");
        plugin2.setNamespace("ns2");
        Plugin plugin3 = new Plugin();
        plugin3.setName("Plugin 3");
        plugin3.setNamespace("ns1");
        pluginRepository.save(plugin1);
        pluginRepository.save(plugin2);
        pluginRepository.save(plugin3);

        List<String> namespaces = pluginRepository.findDistinctNamespaces();

        assertEquals(2, namespaces.size());
        assertTrue(namespaces.contains("ns1"));
        assertTrue(namespaces.contains("ns2"));
    }
}
