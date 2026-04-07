package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.SkillFile;
import io.github.akumosstl.agentic.backend.service.SkillFileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skill-files")
public class SkillFileController {
    
    private final SkillFileService skillFileService;
    
    public SkillFileController(SkillFileService skillFileService) {
        this.skillFileService = skillFileService;
    }
    
    @GetMapping("/skill/{skillId}")
    public List<SkillFile> getFilesBySkillId(@PathVariable Long skillId) {
        return skillFileService.getFilesBySkillId(skillId);
    }
    
    @PostMapping
    public SkillFile addFile(@RequestBody Map<String, String> request) {
        Long skillId = Long.parseLong(request.get("skillId"));
        String path = request.get("path");
        String fileName = request.get("fileName");
        String content = request.get("content");
        return skillFileService.addFile(skillId, path, fileName, content);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        skillFileService.deleteFile(id);
        return ResponseEntity.ok().build();
    }
}
