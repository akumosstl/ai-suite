package io.github.akumosstl.agentic.backend.config;

import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationListener;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class StartupErrorListener implements ApplicationListener<ApplicationFailedEvent> {

    @Override
    public void onApplicationEvent(ApplicationFailedEvent event) {
        Throwable exception = event.getException();
        
        String errorMessage = buildErrorMessage(exception);
        
        System.err.println("=====================================================");
        System.err.println("FALHA CRÍTICA: Erro ao iniciar o servidor!");
        System.err.println("Erro: " + exception.getMessage());
        
        if (exception.getCause() instanceof java.net.BindException) {
            System.err.println("Causa comum: Porta já está em uso.");
            System.err.println("Execute 'netstat -ano | findstr :1488' para verificar.");
            System.err.println("Ou altere a porta em application.properties.");
        }
        
        System.err.println("=====================================================");
        
        try {
            writeErrorToHtmlFile(errorMessage);
            openErrorInBrowser();
        } catch (Exception ex) {
            System.err.println("Falha ao abrir página de erro: " + ex.getMessage());
            System.err.println("Erro original: " + errorMessage);
        }
        
        System.exit(1);
    }

    private String buildErrorMessage(Throwable e) {
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

    private String getUserHome() {
        String userHome = System.getenv("USERPROFILE");
        if (userHome == null) {
            userHome = System.getenv("HOME");
        }
        return userHome;
    }

    private void writeErrorToHtmlFile(String errorMessage) throws Exception {
        String userHome = getUserHome();
        Path logsDir = Paths.get(userHome, ".agentic", "logs");
        
        if (!Files.exists(logsDir)) {
            Files.createDirectories(logsDir);
        }
        
        String errorHtml = buildErrorHtml(errorMessage);
        
        Path errorFilePath = logsDir.resolve("erro.html");
        Files.writeString(errorFilePath, errorHtml);
        
        System.out.println("Error page written to: " + errorFilePath.toAbsolutePath());
    }

    private String buildErrorHtml(String errorMessage) {
        return "<!DOCTYPE html>\n" +
            "<html lang=\"en\">\n" +
            "<head>\n" +
            "  <meta charset=\"utf-8\">\n" +
            "  <title>Agentic: Erro ao Iniciar</title>\n" +
            "  <style>\n" +
            "    html { height: 100%; }\n" +
            "    body {\n" +
            "      color-scheme: dark;\n" +
            "      background-color: #1a1a1a;\n" +
            "      color: #ffffff;\n" +
            "      font-family: Roboto, sans-serif;\n" +
            "      margin: 0;\n" +
            "      height: 100%;\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      justify-content: center;\n" +
            "    }\n" +
            "    .error-container {\n" +
            "      background-color: #2a2a2a;\n" +
            "      border-radius: 12px;\n" +
            "      border: 1px solid #3a3a3a;\n" +
            "      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);\n" +
            "      padding: 32px;\n" +
            "      max-width: 700px;\n" +
            "      width: 90%;\n" +
            "      text-align: center;\n" +
            "    }\n" +
            "    .error-icon {\n" +
            "      color: #f44336;\n" +
            "      font-size: 64px;\n" +
            "      margin-bottom: 16px;\n" +
            "    }\n" +
            "    .error-title {\n" +
            "      color: #ffffff;\n" +
            "      font-weight: 500;\n" +
            "      font-size: 1.5rem;\n" +
            "      margin-bottom: 16px;\n" +
            "    }\n" +
            "    .error-message {\n" +
            "      color: #e0e0e0;\n" +
            "      font-size: 0.95rem;\n" +
            "      line-height: 1.6;\n" +
            "      margin-bottom: 24px;\n" +
            "      text-align: left;\n" +
            "      background-color: #1a1a1a;\n" +
            "      padding: 16px;\n" +
            "      border-radius: 8px;\n" +
            "      border: 1px solid #3a3a3a;\n" +
            "      font-family: Consolas, Monaco, monospace;\n" +
            "      white-space: pre-wrap;\n" +
            "      overflow-x: auto;\n" +
            "    }\n" +
            "    ::-webkit-scrollbar { width: 8px; }\n" +
            "    ::-webkit-scrollbar-track { background: #1a1a1a; }\n" +
            "    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }\n" +
            "    ::-webkit-scrollbar-thumb:hover { background: #777; }\n" +
            "  </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "  <div class=\"error-container\">\n" +
            "    <div class=\"error-icon\">⚠</div>\n" +
            "    <div class=\"error-title\">Agentic: Erro ao Iniciar</div>\n" +
            "    <div class=\"error-message\">" + escapeHtml(errorMessage) + "</div>\n" +
            "  </div>\n" +
            "</body>\n" +
            "</html>";
    }

    private String escapeHtml(String text) {
        if (text == null || text.isEmpty()) return "Erro desconhecido";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    private void openErrorInBrowser() {
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
}