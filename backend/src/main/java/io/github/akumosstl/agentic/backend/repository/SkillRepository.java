package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Skill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findTop10ByOrderByCreatedAtDesc();
    List<Skill> findByNamespace(String namespace);
    Optional<Skill> findByNameAndNamespace(String name, String namespace);
    
    @Query("SELECT s FROM Skill s WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(s.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(s.instructions) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:namespace IS NULL OR :namespace = '' OR LOWER(s.namespace) = LOWER(:namespace)) " +
           "ORDER BY s.createdAt DESC")
    Page<Skill> searchSkills(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT s.namespace FROM Skill s WHERE s.namespace IS NOT NULL AND s.namespace <> '' ORDER BY s.namespace")
    List<String> findDistinctNamespaces();
    
    @Query("SELECT DISTINCT s.category FROM Skill s WHERE s.category IS NOT NULL AND s.category <> '' ORDER BY s.category")
    List<String> findDistinctCategories();
    
    List<Skill> findByCategory(String category);
}
