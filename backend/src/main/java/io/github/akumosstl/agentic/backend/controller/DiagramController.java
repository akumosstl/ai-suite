package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Diagram;
import io.github.akumosstl.agentic.backend.repository.DiagramRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/diagrams")
@CrossOrigin(origins = "*")
public class DiagramController {

    @Autowired
    private DiagramRepository diagramRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listDiagrams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Diagram> result = diagramRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        return ResponseEntity.ok(Map.of(
                "diagrams", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchDiagrams(
            @RequestParam(required = false, defaultValue = "") String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Diagram> result;
        if (term == null || term.isBlank()) {
            result = diagramRepository.findAll(
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        } else {
            result = diagramRepository.findByNameContainingIgnoreCase(term,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        }
        return ResponseEntity.ok(Map.of(
                "diagrams", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Diagram> getDiagram(@PathVariable Long id) {
        return diagramRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createDiagram(@RequestBody Diagram diagram) {
        if (diagram.getName() == null || diagram.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        }
        if (diagram.getContent() == null || diagram.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content is required"));
        }
        Diagram saved = diagramRepository.save(diagram);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDiagram(@PathVariable Long id, @RequestBody Diagram diagram) {
        return diagramRepository.findById(id).map(existing -> {
            existing.setName(diagram.getName());
            existing.setDescription(diagram.getDescription());
            existing.setContent(diagram.getContent());
            Diagram saved = diagramRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDiagram(@PathVariable Long id) {
        if (!diagramRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        diagramRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Diagram deleted successfully"));
    }
}
