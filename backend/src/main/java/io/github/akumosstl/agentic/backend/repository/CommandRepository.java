package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Command;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommandRepository extends JpaRepository<Command, Long> {
    List<Command> findTop10ByOrderByCreatedAtDesc();
    List<Command> findByNamespace(String namespace);
    List<Command> findByCategory(String category);
    Optional<Command> findByNameAndNamespace(String name, String namespace);
    
    @Query("SELECT c FROM Command c WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(c.command) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:namespace IS NULL OR :namespace = '' OR LOWER(c.namespace) = LOWER(:namespace)) " +
           "ORDER BY c.createdAt DESC")
    Page<Command> searchCommands(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT c.namespace FROM Command c WHERE c.namespace IS NOT NULL AND c.namespace <> '' ORDER BY c.namespace")
    List<String> findDistinctNamespaces();
    
    @Query("SELECT DISTINCT c.category FROM Command c WHERE c.category IS NOT NULL AND c.category <> '' ORDER BY c.category")
    List<String> findDistinctCategories();
}