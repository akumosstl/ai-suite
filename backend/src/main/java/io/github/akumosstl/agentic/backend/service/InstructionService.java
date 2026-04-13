package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InstructionService {
    
    @Autowired
    private InstructionRepository instructionRepository;
    
    public List<Instruction> getRecentInstructions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Instruction> instructionPage = instructionRepository.findAll(pageable);
        return instructionPage.getContent();
    }
    
    public List<Instruction> getTop10RecentInstructions() {
        return instructionRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Instruction getInstructionById(Long id) {
        return instructionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instruction not found"));
    }
    
    public Instruction createInstruction(Instruction instruction) {
        return instructionRepository.save(instruction);
    }
    
    public Instruction updateInstruction(Long id, Instruction instructionDetails) {
        Instruction instruction = getInstructionById(id);
        instruction.setName(instructionDetails.getName());
        instruction.setNamespace(instructionDetails.getNamespace());
        instruction.setPath(instructionDetails.getPath());
        instruction.setDescription(instructionDetails.getDescription());
        instruction.setInstructions(instructionDetails.getInstructions());
        return instructionRepository.save(instruction);
    }
    
    public void deleteInstruction(Long id) {
        Instruction instruction = getInstructionById(id);
        instructionRepository.deleteById(id);
    }
    
    public List<Instruction> getInstructionsByNamespace(String namespace) {
        return instructionRepository.findByNamespace(namespace);
    }
    
    public List<Instruction> getInstructionsByCategory(String category) {
        return instructionRepository.findByCategory(category);
    }
    
    public List<Instruction> searchInstructions(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Instruction> instructionPage = instructionRepository.searchInstructions(searchTerm, namespace, pageable);
        return instructionPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return instructionRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return instructionRepository.searchInstructions(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllInstructions() {
        return instructionRepository.count();
    }

    public List<String> getDistinctNamespaces() {
        return instructionRepository.findDistinctNamespaces();
    }
    
    public List<String> getDistinctCategories() {
        return instructionRepository.findDistinctCategories();
    }
}