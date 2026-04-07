package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.SkillFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillFileRepository extends JpaRepository<SkillFile, Long> {
    List<SkillFile> findBySkillId(Long skillId);
    void deleteBySkillId(Long skillId);
}
