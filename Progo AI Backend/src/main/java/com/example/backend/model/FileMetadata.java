package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "files")
public class FileMetadata {
    @Id
    private String id;
    private String fileId;
    private String userId;
    private String sessionId;
    private String filename;
    private String selectedMode;
    private Instant uploadTime;

    public FileMetadata() {}

    public FileMetadata(String fileId, String userId, String sessionId, String filename, String selectedMode) {
        this.fileId = fileId;
        this.userId = userId;
        this.sessionId = sessionId;
        this.filename = filename;
        this.selectedMode = selectedMode;
        this.uploadTime = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFileId() { return fileId; }
    public void setFileId(String fileId) { this.fileId = fileId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getSelectedMode() { return selectedMode; }
    public void setSelectedMode(String selectedMode) { this.selectedMode = selectedMode; }
    public Instant getUploadTime() { return uploadTime; }
    public void setUploadTime(Instant uploadTime) { this.uploadTime = uploadTime; }
}
