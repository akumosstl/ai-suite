package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.RecipeFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeFileRepository extends org.springframework.data.jpa.repository.JpaRepository<RecipeFile, Long> {
    Page<RecipeFile> findAll(Pageable pageable);
    Page<RecipeFile> findByNameContainingIgnoreCase(String term, Pageable pageable);
    List<RecipeFile> findTop20ByOrderByUpdatedAtDesc();
}
