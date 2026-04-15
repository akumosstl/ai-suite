package io.github.akumosstl.agentic.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade que representa um Agente no sistema.
 * 
 * Um agente é uma unidade autonomous que pode executar tarefas dentro de um pipeline.
 * Cada agente possui um nome, categoria, descrição, prompt de instruções
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Agent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /** Nome único do agente */
    @Column(nullable = false)
    private String name;
    
    /** Namespace para organicação de agentes */
    private String namespace;
    
    /** Categoria do agente */
    private String category;
    
    /** Descrição das funcionalidades do agente */
    @Column(length = 500)
    private String description;
    
    /** Prompt de instruções do agente */
    @Column(length = 5000)
    private String prompt;

    /** Caminho do arquivo de definição do agente */
    private String path;
    
    /** Data de criação do registro */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    /** Data da última atualização */
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
    
    public Agent() {}
    
    public Agent(String name, String description, String prompt) {
        this.name = name;
        this.description = description;
        this.prompt = prompt;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getNamespace() { return namespace; }
    public void setNamespace(String namespace) { this.namespace = namespace; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}