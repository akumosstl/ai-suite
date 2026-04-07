package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TargetService {

    private final TargetRepository targetRepository;

    public TargetService(TargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    public List<Target> getAllTargets() {
        return targetRepository.findAll();
    }

    public Target getTargetById(Long id) {
        return targetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Target not found with id: " + id));
    }

    public Target getTargetByName(String name) {
        return targetRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Target not found with name: " + name));
    }

    @Transactional
    public Target createTarget(Target target) {
        return targetRepository.save(target);
    }

    @Transactional
    public Target updateTarget(Long id, Target targetDetails) {
        Target target = getTargetById(id);
        target.setName(targetDetails.getName());
        target.setSkillsPath(targetDetails.getSkillsPath());
        target.setCommandsPath(targetDetails.getCommandsPath());
        target.setScriptsPath(targetDetails.getScriptsPath());
        target.setAgentsPath(targetDetails.getAgentsPath());
        target.setGlobalPath(targetDetails.getGlobalPath());
        return targetRepository.save(target);
    }

    @Transactional
    public void deleteTarget(Long id) {
        Target target = getTargetById(id);
        targetRepository.delete(target);
    }
}
