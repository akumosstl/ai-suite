package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Plugin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PluginRepository extends JpaRepository<Plugin, Long> {
    List<Plugin> findTop10ByOrderByCreatedAtDesc();
    List<Plugin> findByNamespace(String namespace);
    List<Plugin> findByCategory(String category);
    Optional<Plugin> findByNameAndNamespace(String name, String namespace);
    
    @Query("SELECT p FROM Plugin p WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.instructions) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:namespace IS NULL OR :namespace = '' OR LOWER(p.namespace) = LOWER(:namespace)) " +
           "ORDER BY p.createdAt DESC")
    Page<Plugin> searchPlugins(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT p.namespace FROM Plugin p WHERE p.namespace IS NOT NULL AND p.namespace <> '' ORDER BY p.namespace")
    List<String> findDistinctNamespaces();
    
    @Query("SELECT DISTINCT p.category FROM Plugin p WHERE p.category IS NOT NULL AND p.category <> '' ORDER BY p.category")
    List<String> findDistinctCategories();
}