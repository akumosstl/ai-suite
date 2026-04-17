package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Plugin;
import io.github.akumosstl.agentic.backend.model.PluginFile;
import io.github.akumosstl.agentic.backend.repository.PluginFileRepository;
import io.github.akumosstl.agentic.backend.repository.PluginRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        PluginFile savedFile = pluginFileRepository.save(pluginFile);
        
        saveFileToFilesystem(plugin, path, fileName, content);
        
        return savedFile;
    }
    
    private void saveFileToFilesystem(Plugin plugin, String filePath, String fileName, String content) {
        try {
            String projectPath = getProjectPath(plugin);
            if (projectPath == null || projectPath.isEmpty()) {
                System.out.println("No project path found for plugin: " + plugin.getName());
                return;
            }
            
            String fullPath = projectPath + "/.opencode/plugins/" + filePath + "/" + fileName;
            Path file = Paths.get(fullPath);
            
            Path directory = file.getParent();
            if (directory != null) {
                Files.createDirectories(directory);
            }
            
            Files.write(file, content.getBytes());
            System.out.println("File saved to filesystem: " + fullPath);
        } catch (IOException e) {
            System.err.println("Error saving file to filesystem: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private String getProjectPath(Plugin plugin) {
        if (plugin.getProjects() != null && !plugin.getProjects().isEmpty()) {
            return plugin.getProjects().get(0).getPath();
        }
        return null;
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