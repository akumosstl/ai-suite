package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.service.BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class BackupController {

    @Autowired
    private BackupService backupService;

    @PostMapping("/backup")
    public ResponseEntity<Map<String, Object>> createBackup(@RequestBody Map<String, String> request) {
        String directory = request.getOrDefault("directory", System.getProperty("user.home"));
        String fileName = request.getOrDefault("fileName", "backup_" + System.currentTimeMillis() + ".sql");

        try {
            String filePath = backupService.createBackup(directory, fileName);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "filePath", filePath,
                "message", "Backup created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/backup/download")
    public ResponseEntity<byte[]> downloadBackup(@RequestParam String filePath) {
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(filePath);
            byte[] content = java.nio.file.Files.readAllBytes(path);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", java.nio.file.Paths.get(filePath).getFileName().toString());

            return ResponseEntity.ok()
                .headers(headers)
                .body(content);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}