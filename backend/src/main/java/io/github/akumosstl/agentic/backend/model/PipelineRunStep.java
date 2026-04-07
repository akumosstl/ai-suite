package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_run_step")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipelineRunStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_run_id", nullable = false)
    @JsonIgnore
    private PipelineRun pipelineRun;
    
    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;
    
    @Column(name = "agent_name")
    private String agentName;
    
    @Column(name = "agent_category")
    private String agentCategory;
    
    @Column(name = "script_name")
    private String scriptName;
    
    @Column(name = "script_category")
    private String scriptCategory;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "input_content", columnDefinition = "TEXT")
    private String inputContent;
    
    @Column(name = "input_type")
    private String inputType;
    
    @Column(name = "output_content", columnDefinition = "TEXT")
    private String outputContent;
    
    @Column(name = "output_type")
    private String outputType;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public PipelineRunStep() {}
    
    public PipelineRunStep(Integer stepOrder) {
        this.stepOrder = stepOrder;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public PipelineRun getPipelineRun() { return pipelineRun; }
    public void setPipelineRun(PipelineRun pipelineRun) { this.pipelineRun = pipelineRun; }
    
    public Integer getStepOrder() { return stepOrder; }
    public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }
    
    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }
    
    public String getAgentCategory() { return agentCategory; }
    public void setAgentCategory(String agentCategory) { this.agentCategory = agentCategory; }
    
    public String getScriptName() { return scriptName; }
    public void setScriptName(String scriptName) { this.scriptName = scriptName; }
    
    public String getScriptCategory() { return scriptCategory; }
    public void setScriptCategory(String scriptCategory) { this.scriptCategory = scriptCategory; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getInputContent() { return inputContent; }
    public void setInputContent(String inputContent) { this.inputContent = inputContent; }
    
    public String getInputType() { return inputType; }
    public void setInputType(String inputType) { this.inputType = inputType; }
    
    public String getOutputContent() { return outputContent; }
    public void setOutputContent(String outputContent) { this.outputContent = outputContent; }
    
    public String getOutputType() { return outputType; }
    public void setOutputType(String outputType) { this.outputType = outputType; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
