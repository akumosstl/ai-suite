package io.github.akumosstl.agentic.backend.controller;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for handling application exit/shutdown requests.
 */
@RestController
@RequestMapping("/api/exit")
public class ExitController {

    private static ConfigurableApplicationContext context;

    /**
     * Sets the application context for shutdown purposes.
     * This should be called during application startup.
     */
    public static void setContext(ConfigurableApplicationContext ctx) {
        context = ctx;
    }

    /**
     * Endpoint to shut down the application.
     * Returns immediately while the shutdown proceeds in the background.
     */
    @PostMapping
    public String exit() {
        if (context != null) {
            int exitCode = SpringApplication.exit(context, () -> 0);
            // The actual System.exit will be called by Spring's exit code generator
            return "Shutting down...";
        } else {
            // Fallback if context is not available
            System.exit(0);
            return "Shutting down...";
        }
    }
}