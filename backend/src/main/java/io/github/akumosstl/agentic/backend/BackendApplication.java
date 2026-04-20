package io.github.akumosstl.agentic.backend;

import io.github.akumosstl.agentic.backend.config.AgenticConfigLoader;
import io.github.akumosstl.agentic.backend.controller.ExitController;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.EventListener;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Classe principal da aplicação Spring Boot.
 * 
 * Inicializa o servidor backend, cria diretórios necessários
 * e abre o navegador automaticamente após a inicialização.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@SpringBootApplication
@SpringBootConfiguration
public class BackendApplication {
    public static void main(String[] args) {
        ensureAgenticToolsDirectory();
        ConfigurableApplicationContext context = SpringApplication.run(BackendApplication.class, args);
        ExitController.setContext(context);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void openBrowser() {
        int port = AgenticConfigLoader.getServerPort();
        String url = "http://localhost:" + port;
        System.out.println("Attempting to open browser at: " + url);

        boolean opened = openBrowserFallback(url);

        if (opened) {
            System.out.println("Browser opened successfully at: " + url);
        }
    }
    
    private boolean openBrowserFallback(String url) {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            Runtime runtime = Runtime.getRuntime();
            
            if (os.contains("win")) {
                runtime.exec("cmd /c start " + url);
            } else if (os.contains("mac")) {
                runtime.exec("open " + url);
            } else {
                runtime.exec("xdg-open " + url);
            }
            return true;
        } catch (Exception e) {
            System.err.println("Fallback also failed: " + e.getMessage());
            return false;
        }
    }

    private static void ensureAgenticToolsDirectory() {
        String userHome = System.getenv("USERPROFILE");
        if (userHome == null) {
            userHome = System.getenv("HOME");
        }
        if (userHome == null) {
            System.err.println("WARNING: Could not determine user home directory");
            return;
        }
        
        Path toolsPath = Paths.get(userHome, ".agentic", "tools");
        if (!Files.exists(toolsPath)) {
            try {
                Files.createDirectories(toolsPath);
                System.out.println("Created tools directory: " + toolsPath);
            } catch (Exception e) {
                System.err.println("WARNING: Could not create tools directory: " + e.getMessage());
            }
        }
    }
}