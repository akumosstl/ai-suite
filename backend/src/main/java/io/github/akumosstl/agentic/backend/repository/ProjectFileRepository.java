package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByProjectId(Long projectId);
    Optional<ProjectFile> findByProjectIdAndFileName(Long projectId, String fileName);
    void deleteByProjectId(Long projectId);
}