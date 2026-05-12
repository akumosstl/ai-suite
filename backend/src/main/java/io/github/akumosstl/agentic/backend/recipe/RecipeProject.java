package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeProject {
    private String id;
    private String name;
    private String description;
    private String path;
    private String target;
    @JsonProperty("target_name")
    private String targetName;
    private String status;
    private String readme;
    private List<String> agents;
    @JsonProperty("agent_names")
    private List<String> agentNames;
    private List<String> scripts;
    @JsonProperty("script_names")
    private List<String> scriptNames;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReadme() { return readme; }
    public void setReadme(String readme) { this.readme = readme; }

    public List<String> getAgents() { return agents; }
    public void setAgents(List<String> agents) { this.agents = agents; }

    public List<String> getAgentNames() { return agentNames; }
    public void setAgentNames(List<String> agentNames) { this.agentNames = agentNames; }

    public List<String> getScripts() { return scripts; }
    public void setScripts(List<String> scripts) { this.scripts = scripts; }

    public List<String> getScriptNames() { return scriptNames; }
    public void setScriptNames(List<String> scriptNames) { this.scriptNames = scriptNames; }
}
