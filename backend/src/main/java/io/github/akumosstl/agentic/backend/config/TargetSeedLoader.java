package io.github.akumosstl.agentic.backend.config;

import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Componente de configuração que carrega dados iniciais de Targets.
 * 
 * Cria os targets padrão (opencode, copilot, claude) ao iniciar a aplicação
 * caso não existam no banco de dados.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Component
public class TargetSeedLoader {

    private final TargetRepository targetRepository;

    public TargetSeedLoader(TargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedTargets() {
        seedTargetIfNotExists("opencode", ".opencode/skills/", ".opencode/commands/", "", ".opencode/agents/", "opencode");
        seedTargetIfNotExists("copilot", ".github/skills/", ".github/prompts/", "", ".github/prompts/", "copilot");
        seedTargetIfNotExists("claude", ".claude/skills/", ".claude/commands/", "", ".claude/agents/", "claude");
        
        updateExistingTargets();
    }
    
    private void updateExistingTargets() {
        targetRepository.findByName("opencode").ifPresent(target -> {
            if (target.getCli() == null || target.getCli().isEmpty()) {
                target.setCli("opencode");
                targetRepository.save(target);
                System.out.println("Updated target opencode with CLI");
            }
        });
        targetRepository.findByName("copilot").ifPresent(target -> {
            if (target.getCli() == null || target.getCli().isEmpty()) {
                target.setCli("copilot");
                targetRepository.save(target);
                System.out.println("Updated target copilot with CLI");
            }
        });
        targetRepository.findByName("claude").ifPresent(target -> {
            if (target.getCli() == null || target.getCli().isEmpty()) {
                target.setCli("claude");
                targetRepository.save(target);
                System.out.println("Updated target claude with CLI");
            }
        });
    }

    private void seedTargetIfNotExists(String name, String skillsPath, String commandsPath, String scriptsPath, String agentsPath, String cli) {
        if (targetRepository.findByName(name).isEmpty()) {
            Target target = new Target(name, skillsPath, commandsPath, scriptsPath, agentsPath, cli);
            targetRepository.save(target);
            System.out.println("Created default target: " + name);
        }
    }
}