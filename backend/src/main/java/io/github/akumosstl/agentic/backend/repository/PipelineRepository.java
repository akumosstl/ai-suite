package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositório JPA para a entidade Pipeline.
 * 
 * Fornece métodos de acesso ao banco de dados para a entidade Pipeline,
 * incluindo buscas por projeto e status.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    
    List<Pipeline> findTop10ByProject_IdOrderByCreatedAtDesc(Long projectId);
    
    Page<Pipeline> findByProject_IdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
    
    List<Pipeline> findByProject_IdOrderByCreatedAtDesc(Long projectId);
    
    List<Pipeline> findByProject_IdAndStatus(Long projectId, String status);
    
    List<Pipeline> findByStatus(String status);
    
    List<Pipeline> findAll();
    
    @Modifying
    @Query(value = "DELETE FROM pipeline_step WHERE pipeline_id = :pipelineId", nativeQuery = true)
    void deleteStepsByPipelineId(Long pipelineId);
    
    @Modifying
    @Query(value = "DELETE FROM pipeline WHERE id = :pipelineId", nativeQuery = true)
    void deleteByIdNative(Long pipelineId);
    
    @Modifying
    @Query(value = "DELETE FROM pipeline WHERE project_id = :projectId", nativeQuery = true)
    void deleteByProjectId(Long projectId);
    
    @Modifying
    @Query(value = "DELETE FROM pipeline_step WHERE pipeline_id IN (SELECT id FROM pipeline WHERE project_id = :projectId)", nativeQuery = true)
    void deleteStepsByProjectId(Long projectId);
}
