package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Agent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    List<Agent> findTop10ByOrderByCreatedAtDesc();
    List<Agent> findByCategory(String category);
    List<Agent> findByScope(String scope);
    
    @Query("SELECT a FROM Agent a WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(a.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.prompt) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:namespace IS NULL OR :namespace = '' OR LOWER(a.category) = LOWER(:namespace)) " +
           "ORDER BY a.createdAt DESC")
    Page<Agent> searchAgents(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT a.category FROM Agent a WHERE a.category IS NOT NULL AND a.category <> '' ORDER BY a.category")
    List<String> findDistinctCategories();
}