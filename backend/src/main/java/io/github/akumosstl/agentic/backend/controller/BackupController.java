package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.service.BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
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

    /**
     * Downloads a full database backup directly as a .sql file.
     * This endpoint generates the backup in memory and streams it for download.
     */
    @GetMapping("/backup/download")
    public ResponseEntity<byte[]> downloadBackup() {
        try {
            String sqlContent = backupService.createFullBackup();

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = "agentic_backup_" + timestamp + ".sql";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/sql"));
            headers.setContentDispositionFormData("attachment", fileName);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(sqlContent.getBytes());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}