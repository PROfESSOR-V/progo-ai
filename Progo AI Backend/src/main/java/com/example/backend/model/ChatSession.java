package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "chat_sessions")
public class ChatSession {
    @Id
    private String id;
    private String title;
    private String mode;
    private String userId;
    private Instant createdAt;
    private List<ChatMessage> messages = new ArrayList<>();
    private List<String> contextFiles = new ArrayList<>();
    private Map<String, Object> state = new HashMap<>();

    public ChatSession() {}

    public ChatSession(String title, String mode, String userId) {
        this.title = title;
        this.mode = mode;
        this.userId = userId;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
    public List<String> getContextFiles() { return contextFiles; }
    public void setContextFiles(List<String> contextFiles) { this.contextFiles = contextFiles; }
    public Map<String, Object> getState() { return state; }
    public void setState(Map<String, Object> state) { this.state = state; }
}
