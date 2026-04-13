package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Tool;
import io.github.akumosstl.agentic.backend.model.ToolFile;
import io.github.akumosstl.agentic.backend.repository.ToolFileRepository;
import io.github.akumosstl.agentic.backend.repository.ToolRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return toolFileRepository.save(toolFile);
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