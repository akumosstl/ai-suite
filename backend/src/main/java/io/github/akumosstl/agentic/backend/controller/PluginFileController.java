package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.PluginFile;
import io.github.akumosstl.agentic.backend.service.PluginFileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plugin-files")
public class PluginFileController {
    
    private final PluginFileService pluginFileService;
    
    public PluginFileController(PluginFileService pluginFileService) {
        this.pluginFileService = pluginFileService;
    }
    
    @GetMapping("/plugin/{pluginId}")
    public List<PluginFile> getFilesByPluginId(@PathVariable Long pluginId) {
        return pluginFileService.getFilesByPluginId(pluginId);
    }
    
    @PostMapping
    public PluginFile addFile(@RequestBody Map<String, String> request) {
        Long pluginId = Long.parseLong(request.get("pluginId"));
        String path = request.get("path");
        String fileName = request.get("fileName");
        String content = request.get("content");
        return pluginFileService.addFile(pluginId, path, fileName, content);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        pluginFileService.deleteFile(id);
        return ResponseEntity.ok().build();
    }
}