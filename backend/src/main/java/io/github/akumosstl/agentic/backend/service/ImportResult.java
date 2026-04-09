package io.github.akumosstl.agentic.backend.service;

import java.util.ArrayList;
import java.util.List;

public class ImportResult {
    private int importedCount = 0;
    private int skippedCount = 0;
    private int totalProcessed = 0;
    private List<ImportDetail> details = new ArrayList<>();

    public void incrementImported() {
        this.importedCount++;
    }

    public void incrementSkipped() {
        this.skippedCount++;
    }

    public void incrementTotal() {
        this.totalProcessed++;
    }

    public void addDetail(String type, String name, boolean success, String message) {
        this.details.add(new ImportDetail(type, name, success, message));
        if (!success) {
            incrementSkipped();
        }
    }

    public int getImportedCount() {
        return importedCount;
    }

    public int getSkippedCount() {
        return skippedCount;
    }

    public int getTotalProcessed() {
        return totalProcessed;
    }

    public List<ImportDetail> getDetails() {
        return details;
    }

    public static class ImportDetail {
        private String type;
        private String name;
        private boolean success;
        private String message;

        public ImportDetail(String type, String name, boolean success, String message) {
            this.type = type;
            this.name = name;
            this.success = success;
            this.message = message;
        }

        public String getType() { return type; }
        public String getName() { return name; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
