package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.AppConfig;
import io.github.akumosstl.agentic.backend.service.AppConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/app-config")
public class AppConfigController {

    private final AppConfigService appConfigService;

    public AppConfigController(AppConfigService appConfigService) {
        this.appConfigService = appConfigService;
    }

    @GetMapping
    public List<AppConfig> getAllConfigs() {
        return appConfigService.getAllConfigs();
    }

    @GetMapping("/{key}")
    public ResponseEntity<AppConfig> getConfigByKey(@PathVariable String key) {
        AppConfig config = appConfigService.getConfigByKey(key);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }

    @PutMapping("/{key}")
    public ResponseEntity<AppConfig> updateConfigValue(@PathVariable String key, @RequestBody Map<String, String> body) {
        String value = body.get("value");
        if (value == null) {
            return ResponseEntity.badRequest().build();
        }
        AppConfig updated = appConfigService.setConfigValue(key, value);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/seed")
    public ResponseEntity<Void> seedDefaults() {
        appConfigService.seedDefaults();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test/{provider}")
    public ResponseEntity<Map<String, Object>> testProvider(@PathVariable String provider) {
        boolean success = appConfigService.testProviderConnection(provider);
        String error = null;
        if (!success) {
        String apiKeyKey = switch (provider) {
            case "openai" -> "openai.api.key";
            case "google" -> "google.api.key";
            case "anthropic" -> "anthropic.api.key";
            default -> "unknown";
        };
            String apiKey = appConfigService.getUnmaskedValue(apiKeyKey);
            if (apiKey == null || apiKey.isEmpty()) {
                error = "API Key not configured";
            } else {
                error = "API Key appears invalid";
            }
        }
        return ResponseEntity.ok(Map.of("success", success, "error", error != null ? error : ""));
    }
}
