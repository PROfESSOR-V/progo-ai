package com.example.backend.dto;

public class ChatRequest {
    private String sessionId;
    private String message;
    private String mode; // interview, quiz, exam, qna

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
}
