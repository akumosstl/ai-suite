package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.PipelineRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineRunRepository extends JpaRepository<PipelineRun, Long> {
    
    List<PipelineRun> findTop20ByPipeline_IdOrderByCreatedAtDesc(Long pipelineId);
    
    List<PipelineRun> findByPipeline_IdOrderByCreatedAtDesc(Long pipelineId);
    
    Page<PipelineRun> findByPipeline_IdOrderByCreatedAtDesc(Long pipelineId, Pageable pageable);
    
    List<PipelineRun> findByPipeline_Project_IdOrderByCreatedAtDesc(Long projectId);
    
    List<PipelineRun> findTop20ByPipeline_Project_IdOrderByCreatedAtDesc(Long projectId);
    
    List<PipelineRun> findByStatus(String status);
}
