package io.github.akumosstl.agentic.backend.config;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@Component
public class AgenticConfigLoader implements BeanFactoryPostProcessor {

    private static final String AGENTIC_DIR = System.getProperty("user.home") + File.separator + ".agentic";
    private static final String AGENTIC_JSON_PATH = AGENTIC_DIR + File.separator + "agentic.json";

    private static String databasePath;
    private static int serverPort = 1488;

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        try {
            init();
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize Agentic config", e);
        }
    }

    private void init() throws IOException {
        File agenticDir = new File(AGENTIC_DIR);
        if (!agenticDir.exists()) {
            Files.createDirectories(agenticDir.toPath());
        }

        File agenticFile = new File(AGENTIC_JSON_PATH);
        if (!agenticFile.exists()) {
            createDefaultConfig(agenticFile);
        }

        loadConfig(agenticFile);
        setDataSourceUrl();
        setServerPort();
    }

    private void createDefaultConfig(File file) throws IOException {
        String defaultConfig = """
            {
              "version": "1.0.0",
              "port": 1488,
              "database": {
                "path": "db/agentic_db"
              }
            }
            """;
        Files.writeString(file.toPath(), defaultConfig);
    }

    private void loadConfig(File file) throws IOException {
        Gson gson = new Gson();
        String content = Files.readString(file.toPath());
        Map<String, Object> config = gson.fromJson(content, new TypeToken<Map<String, Object>>() {}.getType());
        
        Object portObj = config.get("port");
        if (portObj != null) {
            serverPort = ((Number) portObj).intValue();
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> database = (Map<String, Object>) config.get("database");
        if (database != null && database.get("path") != null) {
            databasePath = (String) database.get("path");
        } else {
            databasePath = "db/agentic_db";
        }
    }

    private void setDataSourceUrl() {
        String normalizedPath = databasePath.replace("/", File.separator).replace("\\", File.separator);
        String dbPath = AGENTIC_DIR + File.separator + normalizedPath;
        System.setProperty("spring.datasource.url", "jdbc:h2:file:" + dbPath + ";AUTO_SERVER=TRUE;LOCK_TIMEOUT=10000;WRITE_DELAY=0");
    }

    private void setServerPort() {
        System.setProperty("server.port", String.valueOf(serverPort));
    }

    public static int getServerPort() {
        return serverPort;
    }
}