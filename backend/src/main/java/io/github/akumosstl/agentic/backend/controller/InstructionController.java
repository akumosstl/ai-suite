package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.service.InstructionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/instructions")
@CrossOrigin(origins = "*")
public class InstructionController {
    
    @Autowired
    private InstructionService instructionService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentInstructions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Instruction> instructions = instructionService.getRecentInstructions(page, size);
        long totalElements = instructionService.countAllInstructions();
        
        Map<String, Object> response = new HashMap<>();
        response.put("instructions", instructions);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Instruction> getTop10Instructions() {
        return instructionService.getTop10RecentInstructions();
    }
    
    @GetMapping("/{id}")
    public Instruction getInstruction(@PathVariable Long id) {
        return instructionService.getInstructionById(id);
    }
    
    @PostMapping
    public Instruction createInstruction(@RequestBody Instruction instruction) {
        return instructionService.createInstruction(instruction);
    }
    
    @PutMapping("/{id}")
    public Instruction updateInstruction(@PathVariable Long id, @RequestBody Instruction instructionDetails) {
        return instructionService.updateInstruction(id, instructionDetails);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteInstruction(@PathVariable Long id) {
        instructionService.deleteInstruction(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Instruction deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/category/{category}")
    public List<Instruction> getInstructionsByCategory(@PathVariable String category) {
        return instructionService.getInstructionsByCategory(category);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchInstructions(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Instruction> instructions = instructionService.searchInstructions(term, namespace, page, size);
        long totalElements = instructionService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("instructions", instructions);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/namespaces")
    public List<String> getDistinctNamespaces() {
        return instructionService.getDistinctNamespaces();
    }
}