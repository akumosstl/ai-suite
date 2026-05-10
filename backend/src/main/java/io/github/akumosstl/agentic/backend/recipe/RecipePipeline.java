package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipePipeline {
    private String id;
    private String project;
    @JsonProperty("project_name")
    private String projectName;
    private String name;
    private String description;
    private String type;
    @JsonProperty("output_extension")
    private String outputExtension;
    private List<RecipeStep> steps;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getOutputExtension() { return outputExtension; }
    public void setOutputExtension(String outputExtension) { this.outputExtension = outputExtension; }

    public List<RecipeStep> getSteps() { return steps; }
    public void setSteps(List<RecipeStep> steps) { this.steps = steps; }
}
