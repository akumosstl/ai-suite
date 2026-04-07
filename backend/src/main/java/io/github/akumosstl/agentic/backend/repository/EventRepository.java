package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByPhase(String phase);
}