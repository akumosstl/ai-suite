package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Command;
import io.github.akumosstl.agentic.backend.repository.CommandRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommandService {
    
    @Autowired
    private CommandRepository commandRepository;
    
    public List<Command> getRecentCommands(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Command> commandPage = commandRepository.findAll(pageable);
        return commandPage.getContent();
    }
    
    public List<Command> getTop10RecentCommands() {
        return commandRepository.findTop10ByOrderByCreatedAtDesc();
    }
    
    public Command getCommandById(Long id) {
        return commandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Command not found"));
    }
    
    public Command createCommand(Command command) {
        return commandRepository.save(command);
    }
    
    public Command updateCommand(Long id, Command commandDetails) {
        Command command = getCommandById(id);
        command.setName(commandDetails.getName());
        command.setNamespace(commandDetails.getNamespace());
        command.setPath(commandDetails.getPath());
        command.setDescription(commandDetails.getDescription());
        command.setCommand(commandDetails.getCommand());
        return commandRepository.save(command);
    }
    
    public void deleteCommand(Long id) {
        commandRepository.deleteById(id);
    }
    
    public List<Command> getCommandsByNamespace(String namespace) {
        return commandRepository.findByNamespace(namespace);
    }
    
    public List<Command> getCommandsByCategory(String category) {
        return commandRepository.findByCategory(category);
    }

    public List<Command> searchCommands(String searchTerm, String namespace, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Command> commandPage = commandRepository.searchCommands(searchTerm, namespace, pageable);
        return commandPage.getContent();
    }
    
    public long countSearchResults(String searchTerm, String namespace) {
        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (namespace == null || namespace.trim().isEmpty())) {
            return commandRepository.count();
        }
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        return commandRepository.searchCommands(searchTerm, namespace, pageable).getTotalElements();
    }
    
    public long countAllCommands() {
        return commandRepository.count();
    }

    public List<String> getDistinctNamespaces() {
        return commandRepository.findDistinctNamespaces();
    }
    
    public List<String> getDistinctCategories() {
        return commandRepository.findDistinctCategories();
    }
}