package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.RecipeTaskResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecipeTaskResultRepository extends JpaRepository<RecipeTaskResult, Long> {
    List<RecipeTaskResult> findByRecipe_IdOrderByTaskId(Long recipeId);
    List<RecipeTaskResult> findByRecipe_IdAndStatus(Long recipeId, String status);
}
