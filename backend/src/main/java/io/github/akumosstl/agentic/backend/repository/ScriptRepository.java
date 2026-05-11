package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Script;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScriptRepository extends JpaRepository<Script, Long> {
    List<Script> findByNamespace(String namespace);

    Optional<Script> findByNameAndNamespace(String name, String namespace);

    @Query("SELECT s FROM Script s WHERE " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(s.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(s.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:namespace IS NULL OR :namespace = '' OR LOWER(s.namespace) = LOWER(:namespace)) " +
            "ORDER BY s.createdAt DESC")
    Page<Script> searchScripts(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT s.namespace FROM Script s WHERE s.namespace IS NOT NULL AND s.namespace <> '' ORDER BY s.namespace")
    List<String> findDistinctNamespaces();

    @Query("SELECT DISTINCT s.category FROM Script s WHERE s.category IS NOT NULL AND s.category <> '' ORDER BY s.category")
    List<String> findDistinctCategories();
}
