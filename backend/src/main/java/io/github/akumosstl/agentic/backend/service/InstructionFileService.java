package io.github.akumosstl.agentic.backend.service;

import io.github.akumosstl.agentic.backend.model.Instruction;
import io.github.akumosstl.agentic.backend.model.InstructionFile;
import io.github.akumosstl.agentic.backend.repository.InstructionFileRepository;
import io.github.akumosstl.agentic.backend.repository.InstructionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class InstructionFileService {
    
    private final InstructionFileRepository instructionFileRepository;
    private final InstructionRepository instructionRepository;
    
    public InstructionFileService(InstructionFileRepository instructionFileRepository, InstructionRepository instructionRepository) {
        this.instructionFileRepository = instructionFileRepository;
        this.instructionRepository = instructionRepository;
    }
    
    public List<InstructionFile> getFilesByInstructionId(Long instructionId) {
        return instructionFileRepository.findByInstructionId(instructionId);
    }
    
    @Transactional
    public InstructionFile addFile(Long instructionId, String path, String fileName, String content) {
        Instruction instruction = instructionRepository.findById(instructionId)
            .orElseThrow(() -> new RuntimeException("Instruction not found"));
        
        InstructionFile instructionFile = new InstructionFile(path, fileName, content, instruction);
        InstructionFile savedFile = instructionFileRepository.save(instructionFile);
        
        saveFileToFilesystem(instruction, path, fileName, content);
        
        return savedFile;
    }
    
    private void saveFileToFilesystem(Instruction instruction, String filePath, String fileName, String content) {
        try {
            String projectPath = getProjectPath(instruction);
            if (projectPath == null || projectPath.isEmpty()) {
                System.out.println("No project path found for instruction: " + instruction.getName());
                return;
            }
            
            String fullPath = projectPath + "/.opencode/instructions/" + filePath + "/" + fileName;
            Path file = Paths.get(fullPath);
            
            Path directory = file.getParent();
            if (directory != null) {
                Files.createDirectories(directory);
            }
            
            Files.write(file, content.getBytes());
            System.out.println("File saved to filesystem: " + fullPath);
        } catch (IOException e) {
            System.err.println("Error saving file to filesystem: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private String getProjectPath(Instruction instruction) {
        if (instruction.getProjects() != null && !instruction.getProjects().isEmpty()) {
            return instruction.getProjects().get(0).getPath();
        }
        return null;
    }
    
    @Transactional
    public void deleteFile(Long id) {
        instructionFileRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteFilesByInstructionId(Long instructionId) {
        instructionFileRepository.deleteByInstructionId(instructionId);
    }
    
    @Transactional
    public InstructionFile updateFile(Long id, String path, String fileName, String content) {
        InstructionFile instructionFile = instructionFileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("File not found"));
        
        if (path != null) instructionFile.setPath(path);
        if (fileName != null) instructionFile.setFileName(fileName);
        if (content != null) instructionFile.setContent(content);
        
        return instructionFileRepository.save(instructionFile);
    }
}