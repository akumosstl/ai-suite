package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.AppConfig;
import io.github.akumosstl.agentic.backend.repository.AppConfigRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppConfigService {

    private final AppConfigRepository appConfigRepository;

    public AppConfigService(AppConfigRepository appConfigRepository) {
        this.appConfigRepository = appConfigRepository;
    }

    public String getConfigValue(String key) {
        return appConfigRepository.findByConfigKey(key)
                .map(AppConfig::getConfigValue)
                .orElse(null);
    }

    public String getUnmaskedValue(String key) {
        return appConfigRepository.findByConfigKey(key)
                .map(AppConfig::getConfigValue)
                .orElse(null);
    }

    public AppConfig setConfigValue(String key, String value) {
        if (value != null) {
            value = value.trim();
        }
        AppConfig config = appConfigRepository.findByConfigKey(key).orElse(null);
        if (config != null) {
            config.setConfigValue(value);
        } else {
            config = new AppConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setIsSecret(true);
        }
        return appConfigRepository.save(config);
    }

    public List<AppConfig> getAllConfigs() {
        return appConfigRepository.findAll();
    }

    public AppConfig getConfigByKey(String key) {
        return appConfigRepository.findByConfigKey(key).orElse(null);
    }

  public void seedDefaults() {
        seedIfNotExists("openai.api.key", "", "OpenAI API Key", true);
        seedIfNotExists("google.api.key", "", "Google Gemini API Key", true);
        seedIfNotExists("anthropic.api.key", "", "Anthropic API Key", true);
        seedIfNotExists("openai.default.model", "gpt-4o-mini", "Default OpenAI Model", false);
        seedIfNotExists("google.default.model", "gemini-2.0-flash", "Default Google Model", false);
        seedIfNotExists("anthropic.default.model", "claude-3-5-haiku-20241022", "Default Anthropic Model", false);
        seedIfNotExists("openai.base.url", "", "OpenAI-compatible Base URL without /v1 (e.g. https://integrate.api.nvidia.com for NVIDIA)", false);
        seedIfNotExists("default.llm.provider", "openai", "Default LLM Provider (openai, google, anthropic)", false);
    }

    private void seedIfNotExists(String key, String value, String description, boolean isSecret) {
        if (appConfigRepository.findByConfigKey(key).isEmpty()) {
            AppConfig config = new AppConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
            config.setIsSecret(isSecret);
            appConfigRepository.save(config);
            System.out.println("Created default app config: " + key);
        }
    }

  public boolean testProviderConnection(String provider) {
    try {
      String key = switch (provider) {
        case "openai" -> "openai.api.key";
        case "google" -> "google.api.key";
        case "anthropic" -> "anthropic.api.key";
        default -> null;
      };

      if (key == null) return false;

      String apiKey = getUnmaskedValue(key);
      if (apiKey == null || apiKey.isEmpty()) {
        return false;
      }

      return apiKey.length() >= 8;
    } catch (Exception e) {
      return false;
    }
  }
}
