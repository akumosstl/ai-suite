package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.PipelineRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
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

    List<PipelineRun> findByStatusNot(String status);

    @Query("SELECT r FROM PipelineRun r WHERE r.status IS NULL OR r.status != 'running'")
    List<PipelineRun> findAllNonRunningRuns();

    @Modifying
    @Query(value = "DELETE FROM pipeline_run_step WHERE pipeline_run_id IN (SELECT id FROM pipeline_run WHERE status != 'running' OR status IS NULL)", nativeQuery = true)
    void deleteStepsByNonRunningRuns();

    @Modifying
    @Query(value = "DELETE FROM pipeline_run WHERE status != 'running' OR status IS NULL", nativeQuery = true)
    int deleteAllNonRunningRunsNative();

    Page<PipelineRun> findByPipeline_Project_NameContainingIgnoreCase(String projectName, Pageable pageable);
    
    @Modifying
    @Query(value = "DELETE FROM pipeline_run_step WHERE pipeline_run_id IN (SELECT id FROM pipeline_run WHERE pipeline_id = :pipelineId)", nativeQuery = true)
    void deleteStepsByPipelineId(Long pipelineId);
    
    @Modifying
    @Query(value = "DELETE FROM pipeline_run WHERE pipeline_id = :pipelineId", nativeQuery = true)
    void deleteByPipelineId(Long pipelineId);
}
