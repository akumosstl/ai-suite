package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade que representa um Pipeline de execução.
 * <p>
 * Um pipeline é uma sequência de etapas (steps) que são executadas em ordem.
 * Cada pipeline pertence a um projeto e possui um status que indica seu estado atual.
 *
 * @author Sistema Agentic
 * @version 1.0
 */
@Entity
@Table(name = "pipeline")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Pipeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nome do pipeline
     */
    @Column(nullable = false)
    private String name;

    /**
     * Descrição do pipeline
     */
    @Column(length = 2000)
    private String description;

    /**
     * Status atual do pipeline: "pending", "running", "completed", "failed"
     */
    @Column(name = "status")
    private String status;

    /**
     * Projeto associado ao pipeline
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;

    /**
     * Data de criação
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Data da última atualização
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Extensão do arquivo de saída
     */
    @Column(name = "output_extension")
    private String outputExtension;

    /**
     * Tipo do pipeline
     */
    @Column(name = "type")
    private String type;

    /**
     * Lista de etapas do pipeline
     */
    @OneToMany(mappedBy = "pipeline", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stepOrder ASC")
    @JsonIgnore
    private List<PipelineStep> steps = new ArrayList<>();

    /**
     * Lista de execuções do pipeline
     */
    @OneToMany(mappedBy = "pipeline", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("createdAt DESC")
    @JsonIgnore
    private List<PipelineRun> pipelineRuns = new ArrayList<>();

    public Pipeline() {
    }

    public Pipeline(String name, String description, Project project) {
        this.name = name;
        this.description = description;
        this.project = project;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    public Long getProjectId() {
        return project != null ? project.getId() : null;
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

    public String getOutputExtension() {
        return outputExtension;
    }

    public void setOutputExtension(String outputExtension) {
        this.outputExtension = outputExtension;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<PipelineRun> getPipelineRuns() {
        return pipelineRuns;
    }

    public void setPipelineRuns(List<PipelineRun> pipelineRuns) {
        this.pipelineRuns = pipelineRuns;
    }

    public List<PipelineStep> getSteps() {
        return steps;
    }

    public void setSteps(List<PipelineStep> steps) {
        this.steps = steps;
    }
}
