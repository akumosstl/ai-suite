package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Pipeline;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
    
    List<Pipeline> findByProject_IdAndStatus(Long projectId, String status);
    
    List<Pipeline> findByStatus(String status);
    
    List<Pipeline> findAll();
}
