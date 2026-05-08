package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class RecipeTask {
    private String id;
    private String type;
    private String resource;
    private String ref;
    @JsonProperty("depends_on")
    private List<String> dependsOn;
    @JsonProperty("pipeline_ref")
    private String pipelineRef;
    @JsonProperty("pipeline_id")
    private Long pipelineId;
    @JsonProperty("pipeline_name")
    private String pipelineName;
    private String project;
    private Integer repeat;
    private RecipeRetry retry;
    private RecipeLoop loop;
    private Boolean wait;
    @JsonProperty("stop_on_failure")
    private Boolean stopOnFailure;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getRef() { return ref; }
    public void setRef(String ref) { this.ref = ref; }

    public List<String> getDependsOn() { return dependsOn; }
    public void setDependsOn(List<String> dependsOn) { this.dependsOn = dependsOn; }

    public String getPipelineRef() { return pipelineRef; }
    public void setPipelineRef(String pipelineRef) { this.pipelineRef = pipelineRef; }

    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

    public String getPipelineName() { return pipelineName; }
    public void setPipelineName(String pipelineName) { this.pipelineName = pipelineName; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public Integer getRepeat() { return repeat; }
    public void setRepeat(Integer repeat) { this.repeat = repeat; }

    public RecipeRetry getRetry() { return retry; }
    public void setRetry(RecipeRetry retry) { this.retry = retry; }

    public RecipeLoop getLoop() { return loop; }
    public void setLoop(RecipeLoop loop) { this.loop = loop; }

    public Boolean getWait() { return wait; }
    public void setWait(Boolean wait) { this.wait = wait; }

    public Boolean getStopOnFailure() { return stopOnFailure; }
    public void setStopOnFailure(Boolean stopOnFailure) { this.stopOnFailure = stopOnFailure; }
}
