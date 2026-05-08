package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Recipe;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecipeRepository extends org.springframework.data.jpa.repository.JpaRepository<Recipe, Long> {
    List<Recipe> findTop20ByOrderByCreatedAtDesc();
    List<Recipe> findByStatus(String status);
}
