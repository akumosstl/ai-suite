package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Event;
import io.github.akumosstl.agentic.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {
    
    @Autowired
    private EventRepository eventRepository;
    
    @GetMapping
    public List<Event> getEvents(@RequestParam(required = false) String phase) {
        if (phase != null) {
            return eventRepository.findByPhase(phase);
        }
        return eventRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public Event getEvent(@PathVariable Long id) {
        return eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
    }
    
    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return eventRepository.save(event);
    }
}