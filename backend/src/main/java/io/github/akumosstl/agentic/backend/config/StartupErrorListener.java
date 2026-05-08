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
        System.err.println("CRITICAL ERROR: Failed to start server!");
        System.err.println("Error: " + exception.getMessage());
        
        if (exception.getCause() instanceof java.net.BindException) {
            System.err.println("Common cause: Port already in use.");
            System.err.println("Run 'netstat -ano | findstr :1488' to check.");
            System.err.println("Or change port in application.properties.");
        }
        
        System.err.println("=====================================================");
        
        try {
            writeErrorToHtmlFile(errorMessage, exception);
            openErrorInBrowser();
        } catch (Exception ex) {
            System.err.println("Failed to open error page: " + ex.getMessage());
            System.err.println("Original error: " + errorMessage);
        }
        
        System.exit(1);
    }

    private String buildErrorMessage(Throwable e) {
        StringBuilder sb = new StringBuilder();
        sb.append("Failed to start backend:\n\n");
        sb.append(e.getClass().getName()).append("\n\n");
        sb.append("Message: ").append(e.getMessage()).append("\n\n");
        
        Throwable cause = e.getCause();
        while (cause != null) {
            sb.append("Cause: ").append(cause.getMessage()).append("\n");
            cause = cause.getCause();
        }
        
        StackTraceElement[] stackTrace = e.getStackTrace();
        if (stackTrace.length > 0) {
            sb.append("\nStack trace (first elements):\n");
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

    private void writeErrorToHtmlFile(String errorMessage, Throwable exception) throws Exception {
        String userHome = getUserHome();
        Path logsDir = Paths.get(userHome, ".agentic", "logs");
        
        if (!Files.exists(logsDir)) {
            Files.createDirectories(logsDir);
        }
        
        String errorHtml = buildErrorHtml(errorMessage, exception);
        
        Path errorFilePath = logsDir.resolve("erro.html");
        Files.writeString(errorFilePath, errorHtml);
        
        System.out.println("Error page written to: " + errorFilePath.toAbsolutePath());
    }

    private String buildErrorHtml(String errorMessage, Throwable exception) {
        boolean isBindException = exception.getCause() instanceof java.net.BindException;
        
        String helpSection = isBindException ? 
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Port already in use</div>\n" +
            "          <div class=\"help-command\">netstat -ano | findstr :1488</div>\n" +
            "          <div class=\"help-comment\">Find and kill the process using port 1488</div>\n" +
            "        </div>\n" +
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Change port in configuration</div>\n" +
            "          <div class=\"help-comment\">Edit: <code>server.port=1489</code> in file:</div>\n" +
            "          <div class=\"help-file\">backend/src/main/resources/application.properties</div>\n" +
            "        </div>\n" +
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Kill process by PID</div>\n" +
            "          <div class=\"help-command\">taskkill /PID &lt;PID&gt; /F</div>\n" +
            "        </div>\n" +
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Check if Agentic is already running</div>\n" +
            "          <div class=\"help-command\">tasklist | findstr java</div>\n" +
            "        </div>\n" :
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Check configuration files</div>\n" +
            "          <div class=\"help-comment\">Verify files in:</div>\n" +
            "          <div class=\"help-file\">~\\.agentic\\</div>\n" +
            "        </div>\n" +
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Check agentic.json</div>\n" +
            "          <div class=\"help-file\">~\\.agentic\\agentic.json</div>\n" +
            "        </div>\n" +
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Check log files</div>\n" +
            "          <div class=\"help-file\">~\\.agentic\\logs\\</div>\n" +
            "        </div>\n";
        
        return "<!DOCTYPE html>\n" +
            "<html lang=\"en\">\n" +
            "<head>\n" +
            "  <meta charset=\"utf-8\">\n" +
            "  <title>Agentic - Error</title>\n" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
            "  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n" +
            "  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n" +
            "  <link href=\"https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap\" rel=\"stylesheet\">\n" +
            "  <link href=\"https://fonts.googleapis.com/icon?family=Material+Icons\" rel=\"stylesheet\">\n" +
            "  <style>\n" +
            "    * { box-sizing: border-box; }\n" +
            "    html { height: 100%; }\n" +
            "    body {\n" +
            "      color-scheme: dark;\n" +
            "      background-color: #121212;\n" +
            "      color: #e0e0e0;\n" +
            "      font-family: 'Roboto', sans-serif;\n" +
            "      font-size: 14px;\n" +
            "      line-height: 1.5;\n" +
            "      margin: 0;\n" +
            "      padding: 24px;\n" +
            "      min-height: 100vh;\n" +
            "    }\n" +
            "    .error-container {\n" +
            "      max-width: 800px;\n" +
            "      margin: 0 auto;\n" +
            "    }\n" +
            "    .error-header {\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      gap: 16px;\n" +
            "      margin-bottom: 24px;\n" +
            "      padding-bottom: 16px;\n" +
            "      border-bottom: 1px solid #333;\n" +
            "    }\n" +
            "    .error-icon {\n" +
            "      width: 56px;\n" +
            "      height: 56px;\n" +
            "      background: linear-gradient(135deg, #f44336, #d32f2f);\n" +
            "      border-radius: 12px;\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      justify-content: center;\n" +
            "    }\n" +
            "    .error-icon .material-icons {\n" +
            "      color: white;\n" +
            "      font-size: 32px;\n" +
            "    }\n" +
            "    .error-title {\n" +
            "      font-size: 24px;\n" +
            "      font-weight: 500;\n" +
            "      color: #ffffff;\n" +
            "      margin: 0;\n" +
            "    }\n" +
            "    .error-subtitle {\n" +
            "      color: #888;\n" +
            "      font-size: 14px;\n" +
            "      margin-top: 4px;\n" +
            "    }\n" +
            "    .error-content {\n" +
            "      background: #1e1e1e;\n" +
            "      border: 1px solid #333;\n" +
            "      border-radius: 12px;\n" +
            "      overflow: hidden;\n" +
            "      margin-bottom: 24px;\n" +
            "    }\n" +
            "    .error-content-header {\n" +
            "      background: #252525;\n" +
            "      padding: 12px 16px;\n" +
            "      border-bottom: 1px solid #333;\n" +
            "      font-weight: 500;\n" +
            "      color: #ffffff;\n" +
            "      font-size: 13px;\n" +
            "      text-transform: uppercase;\n" +
            "      letter-spacing: 0.5px;\n" +
            "    }\n" +
            "    .error-details {\n" +
            "      padding: 16px;\n" +
            "      font-family: 'Consolas', 'Monaco', monospace;\n" +
            "      font-size: 13px;\n" +
            "      white-space: pre-wrap;\n" +
            "      word-break: break-word;\n" +
            "      color: #b0b0b0;\n" +
            "      max-height: 300px;\n" +
            "      overflow-y: auto;\n" +
            "    }\n" +
            "    .error-details::-webkit-scrollbar {\n" +
            "      width: 8px;\n" +
            "    }\n" +
            "    .error-details::-webkit-scrollbar-track {\n" +
            "      background: #1e1e1e;\n" +
            "    }\n" +
            "    .error-details::-webkit-scrollbar-thumb {\n" +
            "      background: #444;\n" +
            "      border-radius: 4px;\n" +
            "    }\n" +
            "    .help-section {\n" +
            "      background: #1e1e1e;\n" +
            "      border: 1px solid #333;\n" +
            "      border-radius: 12px;\n" +
            "      overflow: hidden;\n" +
            "    }\n" +
            "    .help-header {\n" +
            "      background: #252525;\n" +
            "      padding: 12px 16px;\n" +
            "      border-bottom: 1px solid #333;\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      gap: 8px;\n" +
            "    }\n" +
            "    .help-header .material-icons {\n" +
            "      color: #1976d2;\n" +
            "      font-size: 20px;\n" +
            "    }\n" +
            "    .help-title {\n" +
            "      font-weight: 500;\n" +
            "      color: #ffffff;\n" +
            "      font-size: 13px;\n" +
            "      text-transform: uppercase;\n" +
            "      letter-spacing: 0.5px;\n" +
            "    }\n" +
            "    .help-content {\n" +
            "      padding: 16px;\n" +
            "    }\n" +
            "    .help-item {\n" +
            "      margin-bottom: 16px;\n" +
            "    }\n" +
            "    .help-item:last-child {\n" +
            "      margin-bottom: 0;\n" +
            "    }\n" +
            "    .help-label {\n" +
            "      font-weight: 500;\n" +
            "      color: #1976d2;\n" +
            "      font-size: 13px;\n" +
            "      margin-bottom: 4px;\n" +
            "    }\n" +
            "    .help-command {\n" +
            "      background: #121212;\n" +
            "      padding: 8px 12px;\n" +
            "      border-radius: 6px;\n" +
            "      font-family: 'Consolas', 'Monaco', monospace;\n" +
            "      font-size: 12px;\n" +
            "      color: #b0b0b0;\n" +
            "      border: 1px solid #333;\n" +
            "    }\n" +
            "    .help-comment {\n" +
            "      color: #666;\n" +
            "      font-size: 12px;\n" +
            "      margin-top: 4px;\n" +
            "    }\n" +
            "    .help-file {\n" +
            "      color: #888;\n" +
            "      font-size: 12px;\n" +
            "      margin-top: 8px;\n" +
            "    }\n" +
            "    .help-file code {\n" +
            "      background: #252525;\n" +
            "      padding: 2px 6px;\n" +
            "      border-radius: 4px;\n" +
            "      font-family: 'Consolas', 'Monaco', monospace;\n" +
            "    }\n" +
            "    ::-webkit-scrollbar {\n" +
            "      width: 8px;\n" +
            "      height: 8px;\n" +
            "    }\n" +
            "    ::-webkit-scrollbar-track {\n" +
            "      background: #121212;\n" +
            "    }\n" +
            "    ::-webkit-scrollbar-thumb {\n" +
            "      background: #444;\n" +
            "      border-radius: 4px;\n" +
            "    }\n" +
            "    ::-webkit-scrollbar-thumb:hover {\n" +
            "      background: #555;\n" +
            "    }\n" +
            "  </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "  <div class=\"error-container\">\n" +
            "    <div class=\"error-header\">\n" +
            "      <div class=\"error-icon\">\n" +
            "        <span class=\"material-icons\">error_outline</span>\n" +
            "      </div>\n" +
            "      <div>\n" +
            "        <h1 class=\"error-title\">Agentic - Error</h1>\n" +
            "        <p class=\"error-subtitle\">Failed to start application</p>\n" +
            "      </div>\n" +
            "    </div>\n" +
            "    <div class=\"error-content\">\n" +
            "      <div class=\"error-content-header\">Error Details</div>\n" +
            "      <div class=\"error-details\">" + escapeHtml(errorMessage) + "</div>\n" +
            "    </div>\n" +
            "    <div class=\"help-section\">\n" +
            "      <div class=\"help-header\">\n" +
            "        <span class=\"material-icons\">lightbulb</span>\n" +
            "        <span class=\"help-title\">Common Solutions</span>\n" +
            "      </div>\n" +
            "      <div class=\"help-content\">\n" +
            helpSection +
            "        <div class=\"help-item\">\n" +
            "          <div class=\"help-label\">Restart application</div>\n" +
            "          <div class=\"help-comment\">Close terminal and run again</div>\n" +
            "        </div>\n" +
            "      </div>\n" +
            "    </div>\n" +
            "  </div>\n" +
            "</body>\n" +
            "</html>";
    }

    private String escapeHtml(String text) {
        if (text == null || text.isEmpty()) return "Unknown error";
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