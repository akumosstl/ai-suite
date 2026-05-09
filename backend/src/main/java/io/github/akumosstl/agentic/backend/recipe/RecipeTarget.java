package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeTarget {
    private String name;
    @JsonProperty("agents_path")
    private String agentsPath;
    @JsonProperty("scripts_path")
    private String scriptsPath;
    private String cli;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAgentsPath() { return agentsPath; }
    public void setAgentsPath(String agentsPath) { this.agentsPath = agentsPath; }

    public String getScriptsPath() { return scriptsPath; }
    public void setScriptsPath(String scriptsPath) { this.scriptsPath = scriptsPath; }

    public String getCli() { return cli; }
    public void setCli(String cli) { this.cli = cli; }
}
