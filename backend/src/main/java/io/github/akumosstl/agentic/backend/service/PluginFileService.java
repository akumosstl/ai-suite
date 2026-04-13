package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.model.PluginFile;
import io.github.akumosstl.agentic.backend.repository.PluginFileRepository;
import io.github.akumosstl.agentic.backend.repository.PluginRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PluginFileService {
    
    private final PluginFileRepository pluginFileRepository;
    private final PluginRepository pluginRepository;
    
    public PluginFileService(PluginFileRepository pluginFileRepository, PluginRepository pluginRepository) {
        this.pluginFileRepository = pluginFileRepository;
        this.pluginRepository = pluginRepository;
    }
    
    public List<PluginFile> getFilesByPluginId(Long pluginId) {
        return pluginFileRepository.findByPluginId(pluginId);
    }
    
    @Transactional
    public PluginFile addFile(Long pluginId, String path, String fileName, String content) {
        Plugin plugin = pluginRepository.findById(pluginId)
            .orElseThrow(() -> new RuntimeException("Plugin not found"));
        
        PluginFile pluginFile = new PluginFile(path, fileName, content, plugin);
        return pluginFileRepository.save(pluginFile);
    }
    
    @Transactional
    public void deleteFile(Long id) {
        pluginFileRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteFilesByPluginId(Long pluginId) {
        pluginFileRepository.deleteByPluginId(pluginId);
    }
}