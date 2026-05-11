package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Target;
import io.github.akumosstl.agentic.backend.service.TargetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/targets")
public class TargetController {

    private final TargetService targetService;

    public TargetController(TargetService targetService) {
        this.targetService = targetService;
    }

    @GetMapping
    public List<Target> getAllTargets() {
        return targetService.getAllTargets();
    }

    @GetMapping("/{id}")
    public Target getTargetById(@PathVariable Long id) {
        return targetService.getTargetById(id);
    }

    @PostMapping
    public Target createTarget(@RequestBody Target target) {
        return targetService.createTarget(target);
    }

    @PutMapping("/{id}")
    public Target updateTarget(@PathVariable Long id, @RequestBody Target target) {
        return targetService.updateTarget(id, target);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTarget(@PathVariable Long id) {
        try {
            targetService.deleteTarget(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}
