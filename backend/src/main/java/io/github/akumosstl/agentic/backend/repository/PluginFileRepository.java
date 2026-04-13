package io.github.akumosstl.agentic.backend.repository;

import io.github.akumosstl.agentic.backend.model.PluginFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PluginFileRepository extends JpaRepository<PluginFile, Long> {
    List<PluginFile> findByPluginId(Long pluginId);
    void deleteByPluginId(Long pluginId);
}