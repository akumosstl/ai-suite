package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Skill;
import io.github.akumosstl.agentic.backend.model.SkillFile;
import io.github.akumosstl.agentic.backend.repository.SkillFileRepository;
import io.github.akumosstl.agentic.backend.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SkillFileService {
    
    private final SkillFileRepository skillFileRepository;
    private final SkillRepository skillRepository;
    
    public SkillFileService(SkillFileRepository skillFileRepository, SkillRepository skillRepository) {
        this.skillFileRepository = skillFileRepository;
        this.skillRepository = skillRepository;
    }
    
    public List<SkillFile> getFilesBySkillId(Long skillId) {
        return skillFileRepository.findBySkillId(skillId);
    }
    
    @Transactional
    public SkillFile addFile(Long skillId, String path, String fileName, String content) {
        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new RuntimeException("Skill not found"));
        
        SkillFile skillFile = new SkillFile(path, fileName, content, skill);
        return skillFileRepository.save(skillFile);
    }
    
    @Transactional
    public void deleteFile(Long id) {
        skillFileRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteFilesBySkillId(Long skillId) {
        skillFileRepository.deleteBySkillId(skillId);
    }
}
