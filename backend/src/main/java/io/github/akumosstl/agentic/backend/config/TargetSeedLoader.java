package io.github.akumosstl.agentic.backend.config;

import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class TargetSeedLoader {

    private final TargetRepository targetRepository;

    public TargetSeedLoader(TargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedTargets() {
        seedTargetIfNotExists("opencode", "scripts", ".opencode/prompts/agents", ".opencode/instructions", "opencode");
        seedTargetIfNotExists("copilot", "scripts", ".github/prompts/agents", ".github/instructions", "copilot");
        seedTargetIfNotExists("claude", "scripts", ".claude/prompts/agents", ".claude/instructions", "claude");
    }

    private void seedTargetIfNotExists(String name, String scriptsPath, String agentsPath, String instructionsPath, String cli) {
        if (targetRepository.findByName(name).isEmpty()) {
            Target target = new Target();
            target.setName(name);
            target.setScriptsPath(scriptsPath);
            target.setAgentsPath(agentsPath);
            target.setInstructionsPath(instructionsPath);
            target.setCli(cli);
            targetRepository.save(target);
            System.out.println("Created default target: " + name);
        }
    }
}