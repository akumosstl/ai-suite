package io.github.akumosstl.agentic.backend.model;

import jakarta.persistence.*;

@Entity
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String description;
    private String phase; // "any", "PHASE_1", etc.
    
    private double moraleChange;
    private double progressChange;
    private double budgetChange;
    
    // We'll store choices as JSON string for simplicity
    private String choicesJson;
    
    public Event() {}
    
    public Event(String description, String phase, double moraleChange, double progressChange, double budgetChange, String choicesJson) {
        this.description = description;
        this.phase = phase;
        this.moraleChange = moraleChange;
        this.progressChange = progressChange;
        this.budgetChange = budgetChange;
        this.choicesJson = choicesJson;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }
    
    public double getMoraleChange() { return moraleChange; }
    public void setMoraleChange(double moraleChange) { this.moraleChange = moraleChange; }
    
    public double getProgressChange() { return progressChange; }
    public void setProgressChange(double progressChange) { this.progressChange = progressChange; }
    
    public double getBudgetChange() { return budgetChange; }
    public void setBudgetChange(double budgetChange) { this.budgetChange = budgetChange; }
    
    public String getChoicesJson() { return choicesJson; }
    public void setChoicesJson(String choicesJson) { this.choicesJson = choicesJson; }
}