package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recipe_task_result")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecipeTaskResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Column(name = "task_type")
    private String taskType;

    private String resource;

    private String ref;

    @Column(nullable = false)
    private String status;

    @Column(name = "result_entity_id")
    private Long resultEntityId;

    @Column(name = "result_details", columnDefinition = "TEXT")
    private String resultDetails;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "attempt_count")
    private Integer attemptCount = 1;

    @Column(name = "iteration_count")
    private Integer iterationCount = 1;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "pending";
        if (attemptCount == null) attemptCount = 1;
        if (iterationCount == null) iterationCount = 1;
    }

    public RecipeTaskResult() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }

    @JsonProperty("recipeId")
    public Long getRecipeId() { return recipe != null ? recipe.getId() : null; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getRef() { return ref; }
    public void setRef(String ref) { this.ref = ref; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getResultEntityId() { return resultEntityId; }
    public void setResultEntityId(Long resultEntityId) { this.resultEntityId = resultEntityId; }

    public String getResultDetails() { return resultDetails; }
    public void setResultDetails(String resultDetails) { this.resultDetails = resultDetails; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Integer getAttemptCount() { return attemptCount; }
    public void setAttemptCount(Integer attemptCount) { this.attemptCount = attemptCount; }

    public Integer getIterationCount() { return iterationCount; }
    public void setIterationCount(Integer iterationCount) { this.iterationCount = iterationCount; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
