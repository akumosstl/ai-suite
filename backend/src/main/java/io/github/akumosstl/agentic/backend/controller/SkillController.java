package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.service.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Habilidades (Skills).
 * 
 * Fornece endpoints para criar, listar, atualizar e excluir skills.
 * Suporta paginação, busca e filtragem por categoria.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = "*")
public class SkillController {
    
    @Autowired
    private SkillService skillService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentSkills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Skill> skills = skillService.getRecentSkills(page, size);
        long totalElements = skillService.countAllSkills();
        
        Map<String, Object> response = new HashMap<>();
        response.put("skills", skills);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Skill> getTop10Skills() {
        return skillService.getTop10RecentSkills();
    }
    
    @GetMapping("/{id}")
    public Skill getSkill(@PathVariable Long id) {
        return skillService.getSkillById(id);
    }
    
    @PostMapping
    public Skill createSkill(@RequestBody Skill skill) {
        return skillService.createSkill(skill);
    }
    
    @PutMapping("/{id}")
    public Skill updateSkill(@PathVariable Long id, @RequestBody Skill skillDetails) {
        return skillService.updateSkill(id, skillDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSkill(@PathVariable Long id) {
        try {
            skillService.deleteSkill(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Skill deleted successfully");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/category/{category}")
    public List<Skill> getSkillsByCategory(@PathVariable String category) {
        return skillService.getSkillsByCategory(category);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchSkills(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Skill> skills = skillService.searchSkills(term, namespace, page, size);
        long totalElements = skillService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("skills", skills);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctNamespaces() {
        return skillService.getDistinctNamespaces();
    }
}
