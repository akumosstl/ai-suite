package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.Target;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TargetRepository extends JpaRepository<Target, Long> {
    Optional<Target> findByName(String name);
}
