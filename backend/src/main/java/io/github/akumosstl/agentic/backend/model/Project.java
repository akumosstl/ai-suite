package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 2000)
    private String description;
    
    @Column(length = 1000)
    private String path;
    
    @Column(length = 500)
    private String target;
    
    @Column(name = "target_id")
    private Long targetId;
    
    @Column(name = "status")
    private String status; // "active", "completed", "archived"
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    @JsonIgnore
    private List<Pipeline> pipelines = new ArrayList<>();
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "project_skills",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private List<Skill> skills = new ArrayList<>();
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "project_commands",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "command_id")
    )
    private List<Command> commands = new ArrayList<>();
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "project_scripts",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "script_id")
    )
    private List<Script> scripts = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "active";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public Project() {}
    
    public Project(String name, String description) {
        this.name = name;
        this.description = description;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<Pipeline> getPipelines() { return pipelines; }
    public void setPipelines(List<Pipeline> pipelines) { this.pipelines = pipelines; }
    
    public List<Skill> getSkills() { return skills; }
    public void setSkills(List<Skill> skills) { this.skills = skills; }
    
    public List<Command> getCommands() { return commands; }
    public void setCommands(List<Command> commands) { this.commands = commands; }
    
    public List<Script> getScripts() { return scripts; }
    public void setScripts(List<Script> scripts) { this.scripts = scripts; }
    
    public void addSkill(Skill skill) {
        skills.add(skill);
    }
    
    public void removeSkill(Skill skill) {
        skills.remove(skill);
    }
    
    public void addCommand(Command command) {
        commands.add(command);
    }
    
    public void removeCommand(Command command) {
        commands.remove(command);
    }
    
    public void addScript(Script script) {
        scripts.add(script);
    }
    
    public void removeScript(Script script) {
        scripts.remove(script);
    }
    
    public void addPipeline(Pipeline pipeline) {
        pipelines.add(pipeline);
        pipeline.setProject(this);
    }
    
    public void removePipeline(Pipeline pipeline) {
        pipelines.remove(pipeline);
        pipeline.setProject(null);
    }
}
