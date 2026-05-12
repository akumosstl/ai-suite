package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entidade que representa uma etapa (step) dentro de um Pipeline.
 * <p>
 * Cada etapa pode executar um agente ou um script e possui ordem de execução.
 * Armazena dados de entrada, saída e configurações de execução.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@Entity
@Table(name = "pipeline_step",
        uniqueConstraints = @UniqueConstraint(columnNames = {"pipeline_id", "step_order"}))
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipelineStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pipeline_id", nullable = false)
    @JsonIgnore
    private Pipeline pipeline;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id", nullable = true)
    private Agent agent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "script_id")
    private Script script;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "name")
    private String name;

    @Column(name = "status", nullable = false)
    private String status = "pending"; // "pending", "running", "completed", "failed"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "input_content", columnDefinition = "TEXT")
    private String inputContent;

    @Column(name = "input_type")
    private String inputType;

    @Column(name = "output_content", columnDefinition = "TEXT")
    private String outputContent;

    @Column(name = "output_type")
    private String outputType;

    @Column(name = "step_output", columnDefinition = "TEXT")
    private String stepOutput;

    @Column(name = "step_output_type")
    private String stepOutputType;

    @Column(name = "cli")
    private String cli;

    @Column(name = "parameters")
    private String parameters;

    @Column(name = "arguments")
    private String arguments;

    @Column(name = "type")
    private String type; // "agent" or "script"

    @Column(name = "runtime")
    private String runtime; // "cmd", "node", "java", "py", "custom" - only for script type

    public PipelineStep() {
    }

    public PipelineStep(Pipeline pipeline, Agent agent, Integer stepOrder) {
        this.pipeline = pipeline;
        this.agent = agent;
        this.stepOrder = stepOrder;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "pending";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pipeline getPipeline() {
        return pipeline;
    }

    public void setPipeline(Pipeline pipeline) {
        this.pipeline = pipeline;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("pipelineId")
    public Long getPipelineId() {
        return pipeline != null ? pipeline.getId() : null;
    }

    public Agent getAgent() {
        return agent;
    }

    public void setAgent(Agent agent) {
        this.agent = agent;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("agentId")
    public Long getAgentId() {
        return agent != null ? agent.getId() : null;
    }

    public Script getScript() {
        return script;
    }

    public void setScript(Script script) {
        this.script = script;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("scriptId")
    public Long getScriptId() {
        return script != null ? script.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("scriptNamespace")
    public String getScriptNamespace() {
        return script != null ? script.getNamespace() : null;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getStepOutput() {
        return stepOutput;
    }

    public void setStepOutput(String stepOutput) {
        this.stepOutput = stepOutput;
    }

    public String getStepOutputType() {
        return stepOutputType;
    }

    public void setStepOutputType(String stepOutputType) {
        this.stepOutputType = stepOutputType;
    }

    public String getCli() {
        return cli;
    }

    public void setCli(String cli) {
        this.cli = cli;
    }

    public String getParameters() {
        return parameters;
    }

    public void setParameters(String parameters) {
        this.parameters = parameters;
    }

    public String getArguments() {
        return arguments;
    }

    public void setArguments(String arguments) {
        this.arguments = arguments;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRuntime() {
        return runtime;
    }

    public void setRuntime(String runtime) {
        this.runtime = runtime;
    }
}