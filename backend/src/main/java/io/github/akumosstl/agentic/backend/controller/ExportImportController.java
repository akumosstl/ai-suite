package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.service.ExportImportService;
import io.github.akumosstl.agentic.backend.service.ImportResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/export-import")
@CrossOrigin(origins = "*")
public class ExportImportController {

    @Autowired
    private ExportImportService exportImportService;

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportData(@RequestParam Set<String> types) {
        String sqlContent = exportImportService.exportData(types);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/sql"));
        headers.setContentDispositionFormData("attachment", "export.sql");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(sqlContent.getBytes());
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importData(@RequestParam("file") MultipartFile file) {
        try {
            String sqlContent = new String(file.getBytes());
            ImportResult result = exportImportService.importData(sqlContent);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("imported", result.getImportedCount());
            response.put("skipped", result.getSkippedCount());
            response.put("details", result.getDetails());
            response.put("totalProcessed", result.getTotalProcessed());
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to read file: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Import failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
