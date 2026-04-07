package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findTop10ByOrderByCreatedAtDesc();
    
    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT p FROM Project p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', ?1, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', ?1, '%'))")
    Page<Project> searchProjects(String searchTerm, Pageable pageable);
    
    List<Project> findByStatus(String status);
}
