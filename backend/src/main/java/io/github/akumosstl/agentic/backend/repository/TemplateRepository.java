package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Template;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {
    List<Template> findByTypeOrderByCreatedAtDesc(String type);
    
    Page<Template> findByType(String type, Pageable pageable);
    
    List<Template> findByTypeAndNameContainingIgnoreCase(String type, String name);
    
    Optional<Template> findByNameAndType(String name, String type);
}
