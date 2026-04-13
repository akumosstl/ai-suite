package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Tool;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ToolRepository extends JpaRepository<Tool, Long> {
    List<Tool> findTop10ByOrderByCreatedAtDesc();
    List<Tool> findByNamespace(String namespace);
    List<Tool> findByCategory(String category);
    Optional<Tool> findByNameAndNamespace(String name, String namespace);
    
    @Query("SELECT t FROM Tool t WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(t.instructions) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:namespace IS NULL OR :namespace = '' OR LOWER(t.namespace) = LOWER(:namespace)) " +
           "ORDER BY t.createdAt DESC")
    Page<Tool> searchTools(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT t.namespace FROM Tool t WHERE t.namespace IS NOT NULL AND t.namespace <> '' ORDER BY t.namespace")
    List<String> findDistinctNamespaces();
    
    @Query("SELECT DISTINCT t.category FROM Tool t WHERE t.category IS NOT NULL AND t.category <> '' ORDER BY t.category")
    List<String> findDistinctCategories();
}