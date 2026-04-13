package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InstructionFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String path;
    
    @Column(name = "file_name", nullable = false)
    private String fileName;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instruction_id", nullable = false)
    @JsonIgnore
    private Instruction instruction;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public InstructionFile() {}
    
    public InstructionFile(String path, String fileName, String content, Instruction instruction) {
        this.path = path;
        this.fileName = fileName;
        this.content = content;
        this.instruction = instruction;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Instruction getInstruction() { return instruction; }
    public void setInstruction(Instruction instruction) { this.instruction = instruction; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}