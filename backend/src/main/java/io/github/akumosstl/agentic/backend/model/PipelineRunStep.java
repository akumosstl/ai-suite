package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entidade que representa uma etapa executada dentro de um PipelineRun.
 * <p>
 * Armazena os dados de execução de uma etapa específica, incluindo
 * entrada, saída, agente/script utilizado e status.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@Entity
@Table(name = "pipeline_run_step")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipelineRunStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pipeline_run_id", nullable = false)
    @JsonIgnore
    private PipelineRun pipelineRun;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "name")
    private String name;

    @Column(name = "agent_name")
    private String agentName;

    @Column(name = "agent_namespace")
    private String agentNamespace;

    @Column(name = "script_name")
    private String scriptName;

    @Column(name = "script_namespace")
    private String scriptNamespace;

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

    public PipelineRunStep() {
    }

    public PipelineRunStep(Integer stepOrder) {
        this.stepOrder = stepOrder;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PipelineRun getPipelineRun() {
        return pipelineRun;
    }

    public void setPipelineRun(PipelineRun pipelineRun) {
        this.pipelineRun = pipelineRun;
    }

    public Integer getStepOrder() {
        return stepOrder;
    }

    public void setStepOrder(Integer stepOrder) {
        this.stepOrder = stepOrder;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public String getAgentNamespace() {
        return agentNamespace;
    }

    public void setAgentNamespace(String agentNamespace) {
        this.agentNamespace = agentNamespace;
    }

    public String getScriptName() {
        return scriptName;
    }

    public void setScriptName(String scriptName) {
        this.scriptName = scriptName;
    }

    public String getScriptNamespace() {
        return scriptNamespace;
    }

    public void setScriptNamespace(String scriptNamespace) {
        this.scriptNamespace = scriptNamespace;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getInputContent() {
        return inputContent;
    }

    public void setInputContent(String inputContent) {
        this.inputContent = inputContent;
    }

    public String getInputType() {
        return inputType;
    }

    public void setInputType(String inputType) {
        this.inputType = inputType;
    }

    public String getOutputContent() {
        return outputContent;
    }

    public void setOutputContent(String outputContent) {
        this.outputContent = outputContent;
    }

    public String getOutputType() {
        return outputType;
    }

    public void setOutputType(String outputType) {
        this.outputType = outputType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getAgentCategory() {
        return agentNamespace;
    }

    public String getScriptCategory() {
        return scriptNamespace;
    }
}
