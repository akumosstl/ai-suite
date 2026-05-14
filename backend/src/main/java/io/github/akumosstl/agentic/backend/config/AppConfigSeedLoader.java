package io.github.akumosstl.agentic.backend.config;

import io.github.akumosstl.agentic.backend.service.AppConfigService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AppConfigSeedLoader {

    private final AppConfigService appConfigService;

    public AppConfigSeedLoader(AppConfigService appConfigService) {
        this.appConfigService = appConfigService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedAppConfigs() {
        appConfigService.seedDefaults();
    }
}
