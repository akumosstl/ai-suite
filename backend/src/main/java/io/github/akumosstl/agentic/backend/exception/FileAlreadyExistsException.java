package io.github.akumosstl.agentic.backend.exception;

public class FileAlreadyExistsException extends RuntimeException {
    
    private final String fileName;
    private final String filePath;

    public FileAlreadyExistsException(String fileName, String filePath) {
        super("File already exists: " + fileName + " at path: " + filePath);
        this.fileName = fileName;
        this.filePath = filePath;
    }

    public FileAlreadyExistsException(String message) {
        super(message);
        this.fileName = null;
        this.filePath = null;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFilePath() {
        return filePath;
    }
}