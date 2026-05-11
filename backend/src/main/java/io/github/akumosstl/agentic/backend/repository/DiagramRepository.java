package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Diagram;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagramRepository extends org.springframework.data.jpa.repository.JpaRepository<Diagram, Long> {

    Page<Diagram> findAll(Pageable pageable);

    Page<Diagram> findByNameContainingIgnoreCase(String term, Pageable pageable);

    List<Diagram> findTop20ByOrderByUpdatedAtDesc();
}
