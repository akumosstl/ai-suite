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

    private static String errorMessage = "";

    public static void main(String[] args) {
        ensureAgenticToolsDirectory();
        
        try {
            ConfigurableApplicationContext context = SpringApplication.run(BackendApplication.class, args);
            ExitController.setContext(context);
        } catch (Exception e) {
            handleStartupError(e);
            System.exit(1);
        }
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
    
    private static void handleStartupError(Exception e) {
        errorMessage = buildErrorMessage(e);
        System.err.println("Startup error: " + errorMessage);
        
        try {
            writeErrorToHtmlFile();
            openErrorFileInBrowser();
        } catch (Exception ex) {
            System.err.println("Failed to show error page: " + ex.getMessage());
            System.err.println("Raw error: " + errorMessage);
        }
    }

    private static String buildErrorMessage(Exception e) {
        StringBuilder sb = new StringBuilder();
        sb.append("Erro ao iniciar o backend:\n\n");
        sb.append(e.getClass().getName()).append("\n\n");
        sb.append("Mensagem: ").append(e.getMessage()).append("\n\n");
        
        Throwable cause = e.getCause();
        while (cause != null) {
            sb.append("Causa: ").append(cause.getMessage()).append("\n");
            cause = cause.getCause();
        }
        
        StackTraceElement[] stackTrace = e.getStackTrace();
        if (stackTrace.length > 0) {
            sb.append("\nStack trace (primeiros elementos):\n");
            for (int i = 0; i < Math.min(5, stackTrace.length); i++) {
                sb.append("  at ").append(stackTrace[i]).append("\n");
            }
        }
        
        return sb.toString();
    }

    private static void writeErrorToHtmlFile() throws Exception {
        String userHome = getUserHome();
        Path logsDir = Paths.get(userHome, ".agentic", "logs");
        
        if (!Files.exists(logsDir)) {
            Files.createDirectories(logsDir);
        }
        
        Path templatePath = Paths.get("src/main/resources/static/error-template.html");
        String template = Files.readString(templatePath);
        
        String errorHtml = template.replace("ERROR_MESSAGE", escapeHtml(errorMessage));
        
        Path errorFilePath = logsDir.resolve("erro.html");
        Files.writeString(errorFilePath, errorHtml);
        
        System.out.println("Error page written to: " + errorFilePath.toAbsolutePath());
    }

    private static String getUserHome() {
        String userHome = System.getenv("USERPROFILE");
        if (userHome == null) {
            userHome = System.getenv("HOME");
        }
        return userHome;
    }

    private static String escapeHtml(String text) {
        if (text == null || text.isEmpty()) return "Erro desconhecido";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    private static void openErrorFileInBrowser() {
        try {
            String userHome = getUserHome();
            Path errorFilePath = Paths.get(userHome, ".agentic", "logs", "erro.html");
            String fileUrl = errorFilePath.toUri().toString();
            
            System.out.println("Opening error page: " + fileUrl);
            
            String os = System.getProperty("os.name").toLowerCase();
            Runtime runtime = Runtime.getRuntime();
            
            if (os.contains("win")) {
                runtime.exec("cmd /c start " + fileUrl);
            } else if (os.contains("mac")) {
                runtime.exec("open " + fileUrl);
            } else {
                runtime.exec("xdg-open " + fileUrl);
            }
            System.out.println("Error page opened in browser");
        } catch (Exception e) {
            System.err.println("Failed to open error page in browser: " + e.getMessage());
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
        String userHome = getUserHome();
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