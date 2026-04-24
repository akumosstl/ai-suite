package io.github.akumosstl.agentic.backend.model;

import jakarta.persistence.*;

/**
 * Entidade que representa um Alvo (Target) no sistema.
 * 
 * Um target define as configurações de caminhos para diferentes
 * tipos de recursos (scripts, agents, instructions)
 * e o CLI padrão a ser usado.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Entity
@Table(name = "targets")
public class Target {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

  @Column(name = "agents_path")
  private String agentsPath;

  @Column(name = "scripts_path")
  private String scriptsPath;

  @Column(name = "instructions_path")
  private String instructionsPath;

  @Column(name = "cli")
  private String cli;

    public Target() {
    }

  public Target(String name, String agentsPath, String scriptsPath, String instructionsPath, String cli) {
    this.name = name;
    this.agentsPath = agentsPath;
    this.scriptsPath = scriptsPath;
    this.instructionsPath = instructionsPath;
    this.cli = cli;
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

  public String getAgentsPath() {
    return agentsPath;
  }

  public void setAgentsPath(String agentsPath) {
    this.agentsPath = agentsPath;
  }

  public String getScriptsPath() {
    return scriptsPath;
  }

  public void setScriptsPath(String scriptsPath) {
    this.scriptsPath = scriptsPath;
  }

  public String getInstructionsPath() {
    return instructionsPath;
  }

  public void setInstructionsPath(String instructionsPath) {
    this.instructionsPath = instructionsPath;
  }

  public String getCli() {
    return cli;
  }

  public void setCli(String cli) {
    this.cli = cli;
  }
}