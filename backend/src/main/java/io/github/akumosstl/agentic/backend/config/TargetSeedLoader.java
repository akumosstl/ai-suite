package io.github.akumosstl.agentic.backend.config;

import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

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
        seedTargetIfNotExists("opencode", ".opencode/skills", ".opencode/commands", "scripts", ".opencode/prompts/agents", ".opencode/instructions", ".opencode/instructions", ".opencode/tools", "opencode");
        seedTargetIfNotExists("copilot", ".github/skills", ".github/commands", "scripts", ".github/prompts/agents", ".github/instructions", ".github/instructions", ".github/tools", "copilot");
        seedTargetIfNotExists("claude", ".claude/skills", ".claude/commands", "scripts", ".claude/prompts/agents", ".claude/instructions", ".claude/instructions", ".claude/tools", "claude");
    }

    private void seedTargetIfNotExists(String name, String skillsPath, String commandsPath, String scriptsPath, 
            String agentsPath, String instructionsPath, String pluginsPath, String toolsPath, String cli) {
        if (targetRepository.findByName(name).isEmpty()) {
            Target target = new Target();
            target.setName(name);
            target.setSkillsPath(skillsPath);
            target.setCommandsPath(commandsPath);
            target.setScriptsPath(scriptsPath);
            target.setAgentsPath(agentsPath);
            target.setInstructionsPath(instructionsPath);
            target.setPluginsPath(pluginsPath);
            target.setToolsPath(toolsPath);
            target.setCli(cli);
            targetRepository.save(target);
            System.out.println("Created default target: " + name);
        }
    }
}