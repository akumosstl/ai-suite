package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Pipeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 2000)
    private String description;
    
    @Column(name = "status")
    private String status; // "pending", "running", "completed", "failed"
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "output_extension")
    private String outputExtension;
    
    @Column(name = "type")
    private String type;
    
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
    
    public Pipeline() {}
    
    public Pipeline(String name, String description, Project project) {
        this.name = name;
        this.description = description;
        this.project = project;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    
    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    public Long getProjectId() {
        return project != null ? project.getId() : null;
    }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getOutputExtension() { return outputExtension; }
    public void setOutputExtension(String outputExtension) { this.outputExtension = outputExtension; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
