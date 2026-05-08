package io.github.akumosstl.agentic.backend.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.util.*;

@RestController
@RequestMapping("/api/plugins/registry")
@CrossOrigin(origins = "*")
public class PluginRegistryController {

    @Value("${plugins.registry.url:}")
    private String pluginRegistryUrl;
    
    private final RestTemplate restTemplate;
    private final Gson gson;

    public PluginRegistryController() {
        this.restTemplate = new RestTemplate();
        this.gson = new Gson();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPlugins() {
        try {
            if (pluginRegistryUrl != null && !pluginRegistryUrl.isEmpty()) {
                try {
                    String jsonString = restTemplate.getForObject(pluginRegistryUrl, String.class);
                    
                    if (jsonString != null && !jsonString.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> result = gson.fromJson(jsonString, new TypeToken<Map<String, Object>>() {}.getType());
                        
                        if (result != null && result.containsKey("plugins")) {
                            return ResponseEntity.ok(result);
                        }
                    }
                } catch (Exception e) {
                    // URL externa falhou, usar arquivo local
                }
            }
            
            return getLocalPlugins();
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("plugins", Collections.emptyList());
            response.put("error", "Failed to fetch plugins from registry: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    private ResponseEntity<Map<String, Object>> getLocalPlugins() throws Exception {
        Resource resource = new ClassPathResource("plugins-registry-example.json");
        String jsonString = new String(resource.getInputStream().readAllBytes());
        
    @SuppressWarnings("unchecked")
    Map<String, Object> result = gson.fromJson(jsonString, new TypeToken<Map<String, Object>>() {}.getType());
        
        if (result == null || !result.containsKey("plugins")) {
            result = new HashMap<>();
            result.put("plugins", Collections.emptyList());
        }
        return ResponseEntity.ok(result);
    }
}
