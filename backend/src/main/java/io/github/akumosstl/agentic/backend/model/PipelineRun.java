package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidade que representa uma execução de um Pipeline.
 * 
 * Armazena o registro de uma execução específica de pipeline, incluindo
 * status, tempos de início e conclusão, e as etapas executadas.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Entity
@Table(name = "pipeline_run")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipelineRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pipeline_id", nullable = false)
    @JsonIgnore
    private Pipeline pipeline;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "pipelineRun", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    private List<PipelineRunStep> steps = new ArrayList<>();
    
    @Column(name = "execution_id", unique = true)
    private String executionId;
    
    @Column(name = "thread_name")
    private String threadName;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startedAt = LocalDateTime.now();
        if (status == null) {
            status = "running";
        }
        if (executionId == null) {
            executionId = UUID.randomUUID().toString();
        }
    }
    
    public PipelineRun() {}
    
    public PipelineRun(Pipeline pipeline) {
        this.pipeline = pipeline;
        this.status = "running";
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Pipeline getPipeline() { return pipeline; }
    public void setPipeline(Pipeline pipeline) { this.pipeline = pipeline; }
    
    @com.fasterxml.jackson.annotation.JsonProperty("pipelineId")
    public Long getPipelineId() {
        return pipeline != null ? pipeline.getId() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonProperty("pipelineName")
    public String getPipelineName() {
        return pipeline != null ? pipeline.getName() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    public Long getProjectId() {
        return pipeline != null && pipeline.getProject() != null ? pipeline.getProject().getId() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonProperty("projectName")
    public String getProjectName() {
        return pipeline != null && pipeline.getProject() != null ? pipeline.getProject().getName() : null;
    }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public List<PipelineRunStep> getSteps() { return steps; }
    public void setSteps(List<PipelineRunStep> steps) { this.steps = steps; }
    
    public String getExecutionId() { return executionId; }
    public void setExecutionId(String executionId) { this.executionId = executionId; }
    
    public String getThreadName() { return threadName; }
    public void setThreadName(String threadName) { this.threadName = threadName; }
    
    public void addStep(PipelineRunStep step) {
        steps.add(step);
        step.setPipelineRun(this);
    }
}
