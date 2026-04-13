package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.repository.PluginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PluginService {
    
    @Autowired
    private PluginRepository pluginRepository;
    
    public List<Plugin> getRecentPlugins(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Plugin> pluginPage = pluginRepository.findAll(pageable);
        return pluginPage.getContent();
    }
    
    public List<Plugin> getTop10RecentPlugins() {
        return pluginRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Plugin getPluginById(Long id) {
        return pluginRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plugin not found"));
    }
    
    public Plugin createPlugin(Plugin plugin) {
        return pluginRepository.save(plugin);
    }
    
    public Plugin updatePlugin(Long id, Plugin pluginDetails) {
        Plugin plugin = getPluginById(id);
        plugin.setName(pluginDetails.getName());
        plugin.setNamespace(pluginDetails.getNamespace());
        plugin.setPath(pluginDetails.getPath());
        plugin.setDescription(pluginDetails.getDescription());
        plugin.setInstructions(pluginDetails.getInstructions());
        return pluginRepository.save(plugin);
    }
    
    public void deletePlugin(Long id) {
        Plugin plugin = getPluginById(id);
        pluginRepository.deleteById(id);
    }
    
    public List<Plugin> getPluginsByNamespace(String namespace) {
        return pluginRepository.findByNamespace(namespace);
    }
    
    public List<Plugin> getPluginsByCategory(String category) {
        return pluginRepository.findByCategory(category);
    }
    
    public List<Plugin> searchPlugins(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Plugin> pluginPage = pluginRepository.searchPlugins(searchTerm, namespace, pageable);
        return pluginPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return pluginRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return pluginRepository.searchPlugins(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllPlugins() {
        return pluginRepository.count();
    }

    public List<String> getDistinctNamespaces() {
        return pluginRepository.findDistinctNamespaces();
    }
    
    public List<String> getDistinctCategories() {
        return pluginRepository.findDistinctCategories();
    }
}