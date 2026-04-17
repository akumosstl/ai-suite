package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.model.ToolFile;
import io.github.akumosstl.agentic.backend.repository.ToolFileRepository;
import io.github.akumosstl.agentic.backend.repository.ToolRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ToolFileService {
    
    private final ToolFileRepository toolFileRepository;
    private final ToolRepository toolRepository;
    
    public ToolFileService(ToolFileRepository toolFileRepository, ToolRepository toolRepository) {
        this.toolFileRepository = toolFileRepository;
        this.toolRepository = toolRepository;
    }
    
    public List<ToolFile> getFilesByToolId(Long toolId) {
        return toolFileRepository.findByToolId(toolId);
    }
    
    @Transactional
    public ToolFile addFile(Long toolId, String path, String fileName, String content) {
        Tool tool = toolRepository.findById(toolId)
            .orElseThrow(() -> new RuntimeException("Tool not found"));
        
        ToolFile toolFile = new ToolFile(path, fileName, content, tool);
        ToolFile savedFile = toolFileRepository.save(toolFile);
        
        saveFileToFilesystem(tool, path, fileName, content);
        
        return savedFile;
    }
    
    private void saveFileToFilesystem(Tool tool, String filePath, String fileName, String content) {
        try {
            String projectPath = getProjectPath(tool);
            if (projectPath == null || projectPath.isEmpty()) {
                System.out.println("No project path found for tool: " + tool.getName());
                return;
            }
            
            String fullPath = projectPath + "/.opencode/tools/" + filePath + "/" + fileName;
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
    
    private String getProjectPath(Tool tool) {
        if (tool.getProjects() != null && !tool.getProjects().isEmpty()) {
            return tool.getProjects().get(0).getPath();
        }
        return null;
    }
    
    @Transactional
    public void deleteFile(Long id) {
        toolFileRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteFilesByToolId(Long toolId) {
        toolFileRepository.deleteByToolId(toolId);
    }
}