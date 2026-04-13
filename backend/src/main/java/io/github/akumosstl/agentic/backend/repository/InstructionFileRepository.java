package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.InstructionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstructionFileRepository extends JpaRepository<InstructionFile, Long> {
    List<InstructionFile> findByInstructionId(Long instructionId);
    void deleteByInstructionId(Long instructionId);
}