package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Script;
import io.github.akumosstl.agentic.backend.repository.ScriptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScriptService {

    @Autowired
    private ScriptRepository scriptRepository;

    public List<Script> getRecentScripts(int page, int size) {
        return scriptRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending())).getContent();
    }

    public long countAllScripts() {
        return scriptRepository.count();
    }

    public Script getScriptById(Long id) {
        return scriptRepository.findById(id).orElseThrow(() -> new RuntimeException("Script not found"));
    }

    public Script createScript(Script script) {
        return scriptRepository.save(script);
    }

    public Script updateScript(Long id, Script scriptDetails) {
        Script script = getScriptById(id);
        script.setName(scriptDetails.getName());
        script.setNamespace(scriptDetails.getNamespace());
        script.setPath(scriptDetails.getPath());
        script.setDescription(scriptDetails.getDescription());
        script.setContent(scriptDetails.getContent());
        script.setScope(scriptDetails.getScope());
        return scriptRepository.save(script);
    }

    public void deleteScript(Long id) {
        scriptRepository.deleteById(id);
    }

    public List<Script> searchScripts(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Script> scriptPage = scriptRepository.searchScripts(searchTerm, namespace, pageable);
        return scriptPage.getContent();
    }

    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return scriptRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return scriptRepository.searchScripts(searchTerm, namespace, pageable).getTotalElements();
    }

    public List<String> getDistinctNamespaces() {
        return scriptRepository.findDistinctNamespaces();
    }
    
    public List<String> getDistinctCategories() {
        return scriptRepository.findDistinctCategories();
    }
    
    public List<Script> getScriptsByNamespace(String namespace) {
        return scriptRepository.findByNamespace(namespace);
    }
}
