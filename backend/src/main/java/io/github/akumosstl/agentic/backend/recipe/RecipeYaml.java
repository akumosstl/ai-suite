package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeYaml {
    private RecipeHeader recipe;
    private Map<String, Object> parameters;
    private Map<String, String> env;
    private List<RecipeTarget> targets;
    private List<RecipeProject> projects;
    private List<RecipeAgent> agents;
    private List<RecipeScript> scripts;
    private List<RecipeTemplate> templates;
    private List<RecipePipeline> pipelines;
    private List<RecipeTask> tasks;
    @JsonProperty("project_path")
    private String projectPath;

    public RecipeHeader getRecipe() { return recipe; }
    public void setRecipe(RecipeHeader recipe) { this.recipe = recipe; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public Map<String, String> getEnv() { return env; }
    public void setEnv(Map<String, String> env) { this.env = env; }

    public List<RecipeTarget> getTargets() { return targets; }
    public void setTargets(List<RecipeTarget> targets) { this.targets = targets; }

    public List<RecipeProject> getProjects() { return projects; }
    public void setProjects(List<RecipeProject> projects) { this.projects = projects; }

    public List<RecipeAgent> getAgents() { return agents; }
    public void setAgents(List<RecipeAgent> agents) { this.agents = agents; }

    public List<RecipeScript> getScripts() { return scripts; }
    public void setScripts(List<RecipeScript> scripts) { this.scripts = scripts; }

    public List<RecipeTemplate> getTemplates() { return templates; }
    public void setTemplates(List<RecipeTemplate> templates) { this.templates = templates; }

    public List<RecipePipeline> getPipelines() { return pipelines; }
    public void setPipelines(List<RecipePipeline> pipelines) { this.pipelines = pipelines; }

    public List<RecipeTask> getTasks() { return tasks; }
    public void setTasks(List<RecipeTask> tasks) { this.tasks = tasks; }

    @JsonProperty("project_path")
    public String getProjectPath() { return projectPath; }
    @JsonProperty("project_path")
    public void setProjectPath(String projectPath) { this.projectPath = projectPath; }
}
