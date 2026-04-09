package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Template;
import io.github.akumosstl.agentic.backend.repository.TemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TemplateService {
    
    @Autowired
    private TemplateRepository templateRepository;
    
    public List<Template> getRecentTemplates(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Template> templatePage = templateRepository.findAll(pageable);
        return templatePage.getContent();
    }
    
    public List<Template> getTemplatesByType(String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Template> templatePage = templateRepository.findByType(type, pageable);
        return templatePage.getContent();
    }
    
    public List<Template> getTemplatesByType(String type) {
        return templateRepository.findByTypeOrderByCreatedAtDesc(type);
    }
    
    public Template getTemplateById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
    }
    
    public Template createTemplate(Template template) {
        return templateRepository.save(template);
    }
    
    public Template updateTemplate(Long id, Template templateDetails) {
        Template template = getTemplateById(id);
        template.setName(templateDetails.getName());
        template.setDescription(templateDetails.getDescription());
        template.setTemplate(templateDetails.getTemplate());
        template.setType(templateDetails.getType());
        return templateRepository.save(template);
    }
    
    public void deleteTemplate(Long id) {
        templateRepository.deleteById(id);
    }
    
    public List<Template> searchTemplatesByType(String type, String searchTerm) {
        return templateRepository.findByTypeAndNameContainingIgnoreCase(type, searchTerm);
    }
    
    public long countTemplatesByType(String type) {
        return templateRepository.count();
    }
}
