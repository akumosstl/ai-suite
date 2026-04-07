package io.github.akumosstl.agentic.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "targets")
public class Target {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "skills_path")
    private String skillsPath;

    @Column(name = "commands_path")
    private String commandsPath;

    @Column(name = "scripts_path")
    private String scriptsPath;

    @Column(name = "agents_path")
    private String agentsPath;

    @Column(name = "global_path")
    private String globalPath;

    public Target() {
    }

    public Target(String name, String skillsPath, String commandsPath, String scriptsPath, String agentsPath, String globalPath) {
        this.name = name;
        this.skillsPath = skillsPath;
        this.commandsPath = commandsPath;
        this.scriptsPath = scriptsPath;
        this.agentsPath = agentsPath;
        this.globalPath = globalPath;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSkillsPath() {
        return skillsPath;
    }

    public void setSkillsPath(String skillsPath) {
        this.skillsPath = skillsPath;
    }

    public String getCommandsPath() {
        return commandsPath;
    }

    public void setCommandsPath(String commandsPath) {
        this.commandsPath = commandsPath;
    }

    public String getScriptsPath() {
        return scriptsPath;
    }

    public void setScriptsPath(String scriptsPath) {
        this.scriptsPath = scriptsPath;
    }

    public String getAgentsPath() {
        return agentsPath;
    }

    public void setAgentsPath(String agentsPath) {
        this.agentsPath = agentsPath;
    }

    public String getGlobalPath() {
        return globalPath;
    }

    public void setGlobalPath(String globalPath) {
        this.globalPath = globalPath;
    }
}
