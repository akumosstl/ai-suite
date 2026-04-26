package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.InstructionFile;
import io.github.akumosstl.agentic.backend.service.InstructionFileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/instruction-files")
public class InstructionFileController {
    
    private final InstructionFileService instructionFileService;
    
    public InstructionFileController(InstructionFileService instructionFileService) {
        this.instructionFileService = instructionFileService;
    }
    
    @GetMapping("/instruction/{instructionId}")
    public List<InstructionFile> getFilesByInstructionId(@PathVariable Long instructionId) {
        return instructionFileService.getFilesByInstructionId(instructionId);
    }
    
    @PostMapping
    public InstructionFile addFile(@RequestBody Map<String, String> request) {
        Long instructionId = Long.parseLong(request.get("instructionId"));
        String path = request.get("path");
        String fileName = request.get("fileName");
        String content = request.get("content");
        return instructionFileService.addFile(instructionId, path, fileName, content);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        instructionFileService.deleteFile(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}")
    public InstructionFile updateFile(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String path = request.get("path");
        String fileName = request.get("fileName");
        String content = request.get("content");
        return instructionFileService.updateFile(id, path, fileName, content);
    }

    @PostMapping("/sync-to-filesystem")
    public ResponseEntity<Map<String, Object>> syncToFilesystem(@RequestBody Map<String, Object> request) {
        String targetPath = (String) request.get("targetPath");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> files = (List<Map<String, String>>) request.get("files");
        return ResponseEntity.ok(instructionFileService.syncToFilesystem(targetPath, files));
    }
}