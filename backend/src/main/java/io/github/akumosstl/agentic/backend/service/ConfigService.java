package io.github.akumosstl.agentic.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Serviço de configurações da aplicação.
 * 
 * Fornece configurações dinámicas para o frontend,
 * incluindo a porta do servidor.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Service
public class ConfigService {
    
    @Value("${server.port:8080}")
    private int port;
    
    @Value("${agentic.version:1.0.0}")
    private String version;
    
    /**
     * Retorna as configurações da aplicação.
     * 
     * @return Mapa com configurações
     */
    public Map<String, Object> getAppConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("port", port);
        config.put("version", version);
        config.put("apiUrl", "http://localhost:" + port);
        return config;
    }
    
    /**
     * Retorna a porta do servidor.
     * 
     * @return porta
     */
    public int getPort() {
        return port;
    }
}