package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.model.InstructionFile;
import io.github.akumosstl.agentic.backend.repository.InstructionFileRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InstructionFileService {
    
    private final InstructionFileRepository instructionFileRepository;
    private final InstructionRepository instructionRepository;
    
    public InstructionFileService(InstructionFileRepository instructionFileRepository, InstructionRepository instructionRepository) {
        this.instructionFileRepository = instructionFileRepository;
        this.instructionRepository = instructionRepository;
    }
    
    public List<InstructionFile> getFilesByInstructionId(Long instructionId) {
        return instructionFileRepository.findByInstructionId(instructionId);
    }
    
    @Transactional
    public InstructionFile addFile(Long instructionId, String path, String fileName, String content) {
        Instruction instruction = instructionRepository.findById(instructionId)
            .orElseThrow(() -> new RuntimeException("Instruction not found"));
        
        InstructionFile instructionFile = new InstructionFile(path, fileName, content, instruction);
        return instructionFileRepository.save(instructionFile);
    }
    
    @Transactional
    public void deleteFile(Long id) {
        instructionFileRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteFilesByInstructionId(Long instructionId) {
        instructionFileRepository.deleteByInstructionId(instructionId);
    }
}