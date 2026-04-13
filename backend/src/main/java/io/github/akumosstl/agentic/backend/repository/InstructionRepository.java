package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Instruction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstructionRepository extends JpaRepository<Instruction, Long> {
    List<Instruction> findTop10ByOrderByCreatedAtDesc();
    List<Instruction> findByNamespace(String namespace);
    List<Instruction> findByCategory(String category);
    Optional<Instruction> findByNameAndNamespace(String name, String namespace);
    
    @Query("SELECT i FROM Instruction i WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(i.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(i.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(i.instructions) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:namespace IS NULL OR :namespace = '' OR LOWER(i.namespace) = LOWER(:namespace)) " +
           "ORDER BY i.createdAt DESC")
    Page<Instruction> searchInstructions(@Param("searchTerm") String searchTerm, @Param("namespace") String namespace, Pageable pageable);

    @Query("SELECT DISTINCT i.namespace FROM Instruction i WHERE i.namespace IS NOT NULL AND i.namespace <> '' ORDER BY i.namespace")
    List<String> findDistinctNamespaces();
    
    @Query("SELECT DISTINCT i.category FROM Instruction i WHERE i.category IS NOT NULL AND i.category <> '' ORDER BY i.category")
    List<String> findDistinctCategories();
}