package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.repository.AgentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgentService {
    
    @Autowired
    private AgentRepository agentRepository;
    
    public List<Agent> getRecentAgents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Agent> agentPage = agentRepository.findAll(pageable);
        return agentPage.getContent();
    }
    
    public List<Agent> getTop10RecentAgents() {
        return agentRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Agent getAgentById(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
    }
    
    public Agent createAgent(Agent agent) {
        return agentRepository.save(agent);
    }
    
    public Agent updateAgent(Long id, Agent agentDetails) {
        Agent agent = getAgentById(id);
        agent.setName(agentDetails.getName());
        agent.setCategory(agentDetails.getCategory());
        agent.setDescription(agentDetails.getDescription());
        agent.setPrompt(agentDetails.getPrompt());
        agent.setScope(agentDetails.getScope());
        return agentRepository.save(agent);
    }
    
    public void deleteAgent(Long id) {
        agentRepository.deleteById(id);
    }
    
    public List<Agent> getAgentsByCategory(String category) {
        return agentRepository.findByCategory(category);
    }
    
    public List<Agent> getAgentsByScope(String scope) {
        return agentRepository.findByScope(scope);
    }
    
    public List<Agent> searchAgents(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Agent> agentPage = agentRepository.searchAgents(searchTerm, namespace, pageable);
        return agentPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return agentRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return agentRepository.searchAgents(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllAgents() {
        return agentRepository.count();
    }

    public List<String> getDistinctCategories() {
        return agentRepository.findDistinctCategories();
    }
}