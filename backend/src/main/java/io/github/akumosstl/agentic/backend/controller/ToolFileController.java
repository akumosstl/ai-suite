package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.ToolFile;
import io.github.akumosstl.agentic.backend.service.ToolFileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tool-files")
public class ToolFileController {
    
    private final ToolFileService toolFileService;
    
    public ToolFileController(ToolFileService toolFileService) {
        this.toolFileService = toolFileService;
    }
    
    @GetMapping("/tool/{toolId}")
    public List<ToolFile> getFilesByToolId(@PathVariable Long toolId) {
        return toolFileService.getFilesByToolId(toolId);
    }
    
    @PostMapping
    public ToolFile addFile(@RequestBody Map<String, String> request) {
        Long toolId = Long.parseLong(request.get("toolId"));
        String path = request.get("path");
        String fileName = request.get("fileName");
        String content = request.get("content");
        return toolFileService.addFile(toolId, path, fileName, content);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        toolFileService.deleteFile(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}")
    public ToolFile updateFile(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String path = request.get("path");
        String fileName = request.get("fileName");
        String content = request.get("content");
        return toolFileService.updateFile(id, path, fileName, content);
    }
}