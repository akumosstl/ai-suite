package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Project;
import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.repository.ProjectRepository;
import io.github.akumosstl.agentic.backend.repository.TargetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TargetService {

    private final TargetRepository targetRepository;
    private final ProjectRepository projectRepository;

    public TargetService(TargetRepository targetRepository, ProjectRepository projectRepository) {
        this.targetRepository = targetRepository;
        this.projectRepository = projectRepository;
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
    public Target findOrCreateTarget(String name, String agentsPath, String scriptsPath, String cli) {
        return targetRepository.findByName(name).orElseGet(() -> {
            Target t = new Target();
            t.setName(name);
            t.setAgentsPath(agentsPath != null ? agentsPath : "");
            t.setScriptsPath(scriptsPath != null ? scriptsPath : "");
            t.setCli(cli != null ? cli : "");
            return targetRepository.save(t);
        });
    }

    @Transactional
    public Target updateTarget(Long id, Target targetDetails) {
        Target target = getTargetById(id);
    target.setName(targetDetails.getName());
    target.setAgentsPath(targetDetails.getAgentsPath());
    target.setScriptsPath(targetDetails.getScriptsPath());
    target.setCli(targetDetails.getCli());
        return targetRepository.save(target);
    }

    public boolean isTargetLinkedToProjects(Long id) {
        List<Project> projects = projectRepository.findByTargetId(id);
        return !projects.isEmpty();
    }

    public List<Project> getProjectsUsingTarget(Long id) {
        return projectRepository.findByTargetId(id);
    }

    @Transactional
    public void deleteTarget(Long id) {
        if (isTargetLinkedToProjects(id)) {
            List<Project> projects = getProjectsUsingTarget(id);
            String projectNames = projects.stream()
                    .map(Project::getName)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("unknown");
            throw new RuntimeException("Cannot delete target. It is being used by project(s): " + projectNames);
        }
        Target target = getTargetById(id);
        targetRepository.delete(target);
    }
}
