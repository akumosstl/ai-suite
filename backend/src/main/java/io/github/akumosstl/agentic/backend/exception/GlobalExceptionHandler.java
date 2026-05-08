package io.github.akumosstl.agentic.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FileAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleFileAlreadyExists(FileAlreadyExistsException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", "FILE_ALREADY_EXISTS");
        response.put("message", ex.getMessage());
        response.put("fileName", ex.getFileName());
        response.put("filePath", ex.getFilePath());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}