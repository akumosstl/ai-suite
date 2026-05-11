package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.service.ConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controlador REST para configurações da aplicação.
 * <p>
 * Fornece endpoint para o frontend obter configurações,
 * incluindo a porta do servidor.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SimpleConfigController {

    @Autowired
    private ConfigService configService;

    /**
     * Retorna as configurações da aplicação para o frontend.
     *
     * @return Configurações incluindo porta do servidor
     */
    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return configService.getAppConfig();
    }
}