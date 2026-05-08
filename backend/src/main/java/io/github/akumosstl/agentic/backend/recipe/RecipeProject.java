package io.github.akumosstl.agentic.backend.recipe;

import java.util.List;

public class RecipeProject {
    private String id;
    private String name;
    private String description;
    private String path;
    private String target;
    private String status;
    private String readme;
    private List<String> agents;
    private List<String> scripts;

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReadme() { return readme; }
    public void setReadme(String readme) { this.readme = readme; }

    public List<String> getAgents() { return agents; }
    public void setAgents(List<String> agents) { this.agents = agents; }

    public List<String> getScripts() { return scripts; }
    public void setScripts(List<String> scripts) { this.scripts = scripts; }
}
