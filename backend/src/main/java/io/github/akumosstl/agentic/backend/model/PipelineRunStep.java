package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "script_id")
    private Script script;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "name")
    private String name;

    @Column(name = "type")
    private String type;

    @Column(name = "runtime")
    private String runtime;

    @Column(name = "agent_name")
    private String agentName;

    @Column(name = "agent_namespace")
    private String agentNamespace;

    @Column(name = "agent_prompt", columnDefinition = "TEXT")
    private String agentPrompt;

    @Column(name = "script_name")
    private String scriptName;

    @Column(name = "script_namespace")
    private String scriptNamespace;

    @Column(name = "script_content", columnDefinition = "TEXT")
    private String scriptContent;

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

    @Column(name = "engine")
    private String engine;

    @Column(name = "llm_provider")
    private String llmProvider;

    @Column(name = "llm_model")
    private String llmModel;

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PipelineRun getPipelineRun() { return pipelineRun; }
    public void setPipelineRun(PipelineRun pipelineRun) { this.pipelineRun = pipelineRun; }

    public Agent getAgent() { return agent; }
    public void setAgent(Agent agent) { this.agent = agent; }

    @JsonProperty("agentId")
    public Long getAgentId() { return agent != null ? agent.getId() : null; }

    public Script getScript() { return script; }
    public void setScript(Script script) { this.script = script; }

    @JsonProperty("scriptId")
    public Long getScriptId() { return script != null ? script.getId() : null; }

    public Integer getStepOrder() { return stepOrder; }
    public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRuntime() { return runtime; }
    public void setRuntime(String runtime) { this.runtime = runtime; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getAgentNamespace() { return agentNamespace; }
    public void setAgentNamespace(String agentNamespace) { this.agentNamespace = agentNamespace; }

    public String getAgentPrompt() { return agentPrompt; }
    public void setAgentPrompt(String agentPrompt) { this.agentPrompt = agentPrompt; }

    public String getScriptName() { return scriptName; }
    public void setScriptName(String scriptName) { this.scriptName = scriptName; }

    public String getScriptNamespace() { return scriptNamespace; }
    public void setScriptNamespace(String scriptNamespace) { this.scriptNamespace = scriptNamespace; }

    public String getScriptContent() { return scriptContent; }
    public void setScriptContent(String scriptContent) { this.scriptContent = scriptContent; }

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

    public String getStepOutput() { return stepOutput; }
    public void setStepOutput(String stepOutput) { this.stepOutput = stepOutput; }

    public String getStepOutputType() { return stepOutputType; }
    public void setStepOutputType(String stepOutputType) { this.stepOutputType = stepOutputType; }

    public String getCli() { return cli; }
    public void setCli(String cli) { this.cli = cli; }

    public String getParameters() { return parameters; }
    public void setParameters(String parameters) { this.parameters = parameters; }

    public String getArguments() { return arguments; }
    public void setArguments(String arguments) { this.arguments = arguments; }

    public String getEngine() { return engine; }
    public void setEngine(String engine) { this.engine = engine; }

    public String getLlmProvider() { return llmProvider; }
    public void setLlmProvider(String llmProvider) { this.llmProvider = llmProvider; }

    public String getLlmModel() { return llmModel; }
    public void setLlmModel(String llmModel) { this.llmModel = llmModel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getAgentCategory() { return agentNamespace; }
    public String getScriptCategory() { return scriptNamespace; }
}
