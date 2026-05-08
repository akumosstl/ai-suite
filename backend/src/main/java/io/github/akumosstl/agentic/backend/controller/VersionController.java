package io.github.akumosstl.agentic.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/version")
@CrossOrigin(origins = "*")
public class VersionController {

    @Value("${agentic.version}")
    private String version;

    @GetMapping
    public ResponseEntity<Map<String, String>> getVersion() {
        Map<String, String> response = new HashMap<>();
        response.put("version", version);
        return ResponseEntity.ok(response);
    }
}