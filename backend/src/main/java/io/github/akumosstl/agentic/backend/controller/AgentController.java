package io.github.akumosstl.agentic.backend.controller;

import io.github.akumosstl.agentic.backend.model.Agent;
import io.github.akumosstl.agentic.backend.service.AgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciamento de Agentes.
 * 
 * Fornece endpoints para criar, listar, atualizar e excluir agentes.
 * Suporta paginação, busca e filtragem por categoria e escopo.
 * 
 * @author Sistema Agentic
 * @version 1.0
 */
@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*")
public class AgentController {
    
    @Autowired
    private AgentService agentService;
    
    /**
     * Lista agentes recentes com paginação.
     * 
     * @param page Número da página (inicia em 0)
     * @param size Quantidade de elementos por página
     * @return Mapa contendo lista de agentes e informações de paginação
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Agent> agents = agentService.getRecentAgents(page, size);
        long totalElements = agentService.countAllAgents();
        
        Map<String, Object> response = new HashMap<>();
        response.put("agents", agents);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top10")
    public List<Agent> getTop10Agents() {
        return agentService.getTop10RecentAgents();
    }
    
    /**
     * Busca um agente pelo ID.
     * 
     * @param id ID do agente
     * @return Agente encontrado
     */
    @GetMapping("/{id}")
    public Agent getAgent(@PathVariable Long id) {
        return agentService.getAgentById(id);
    }
    
    /**
     * Cria um novo agente.
     * 
     * @param agent Dados do agente a ser criado
     * @param projectId ID do projeto opcional para associar o agente
     * @return Agente criado
     */
    @PostMapping
    public Agent createAgent(@RequestBody Agent agent, @RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            return agentService.createAgent(agent, projectId);
        }
        return agentService.createAgent(agent);
    }
    
    /**
     * Atualiza um agente existente.
     * 
     * @param id ID do agente
     * @param agentDetails Novos dados do agente
     * @return Agente atualizado
     */
    @PutMapping("/{id}")
    public Agent updateAgent(@PathVariable Long id, @RequestBody Agent agentDetails) {
        return agentService.updateAgent(id, agentDetails);
    }
    
    /**
     * Exclui um agente.
     * 
     * @param id ID do agente
     * @return Response com mensagem de sucesso
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Agent deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Lista agentes por categoria.
     * 
     * @param category Categoria a filtrar
     * @return Lista de agentes da categoria
     */
    @GetMapping("/category/{category}")
    public List<Agent> getAgentsByCategory(@PathVariable String category) {
        return agentService.getAgentsByCategory(category);
    }

    /**
     * Busca agentes por termo e namespace.
     * 
     * @param term Termo de busca
     * @param namespace Namespace opcional
     * @param page Número da página
     * @param size Tamanho da página
     * @return Resultados da busca com paginação
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchAgents(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String namespace,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Agent> agents = agentService.searchAgents(term, namespace, page, size);
        long totalElements = agentService.countSearchResults(term, namespace);
        
        Map<String, Object> response = new HashMap<>();
        response.put("agents", agents);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("searchTerm", term);
        response.put("namespace", namespace);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Lista namespaces distintos de agentes.
     * 
     * @return Lista de categorias/namespaces
     */
    @GetMapping("/namespaces")
    public List<String> getDistinctCategories() {
        return agentService.getDistinctCategories();
    }
}