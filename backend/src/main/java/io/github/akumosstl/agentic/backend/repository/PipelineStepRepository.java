package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.PipelineStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineStepRepository extends JpaRepository<PipelineStep, Long> {
    
    List<PipelineStep> findByPipeline_Id(Long pipelineId);
    
    List<PipelineStep> findByPipeline_IdOrderByStepOrderAsc(Long pipelineId);
    
    Optional<PipelineStep> findByPipeline_IdAndStepOrder(Long pipelineId, Integer stepOrder);
    
    List<PipelineStep> findByAgent_Id(Long agentId);
    
    List<PipelineStep> findByScript_Id(Long scriptId);

    void deleteByPipeline_Id(Long pipelineId);
    
    long countByPipeline_Id(Long pipelineId);
    
    // Find the next step order for a pipeline
    default Integer getNextStepOrder(Long pipelineId) {
        List<PipelineStep> steps = findByPipeline_IdOrderByStepOrderAsc(pipelineId);
        if (steps.isEmpty()) {
            return 1;
        }
        return steps.get(steps.size() - 1).getStepOrder() + 1;
    }
}