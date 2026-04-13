package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.ToolFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToolFileRepository extends JpaRepository<ToolFile, Long> {
    List<ToolFile> findByToolId(Long toolId);
    void deleteByToolId(Long toolId);
}