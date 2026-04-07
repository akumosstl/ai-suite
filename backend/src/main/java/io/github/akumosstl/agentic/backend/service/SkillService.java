package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {
    
    @Autowired
    private SkillRepository skillRepository;
    
    public List<Skill> getRecentSkills(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Skill> skillPage = skillRepository.findAll(pageable);
        return skillPage.getContent();
    }
    
    public List<Skill> getTop10RecentSkills() {
        return skillRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Skill getSkillById(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
    }
    
    public Skill createSkill(Skill skill) {
        return skillRepository.save(skill);
    }
    
    public Skill updateSkill(Long id, Skill skillDetails) {
        Skill skill = getSkillById(id);
        skill.setName(skillDetails.getName());
        skill.setNamespace(skillDetails.getNamespace());
        skill.setPath(skillDetails.getPath());
        skill.setDescription(skillDetails.getDescription());
        skill.setInstructions(skillDetails.getInstructions());
        return skillRepository.save(skill);
    }
    
    public void deleteSkill(Long id) {
        skillRepository.deleteById(id);
    }
    
    public List<Skill> getSkillsByNamespace(String namespace) {
        return skillRepository.findByNamespace(namespace);
    }
    
    public List<Skill> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category);
    }
    
    public List<Skill> searchSkills(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Skill> skillPage = skillRepository.searchSkills(searchTerm, namespace, pageable);
        return skillPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return skillRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return skillRepository.searchSkills(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllSkills() {
        return skillRepository.count();
    }

    public List<String> getDistinctNamespaces() {
        return skillRepository.findDistinctNamespaces();
    }
}
