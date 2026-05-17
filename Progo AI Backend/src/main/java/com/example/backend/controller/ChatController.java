package com.example.backend.controller;

import com.example.backend.model.ChatSession;
import com.example.backend.repository.ChatSessionRepository;
import com.example.backend.service.RagService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RagService ragService;
    private final ChatSessionRepository sessionRepository;

    public ChatController(RagService ragService, ChatSessionRepository sessionRepository) {
        this.ragService = ragService;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Send a message to an existing session
     */
    @PostMapping(value = "/{sessionId}/message", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String message = payload.get("message");
        String mode = payload.getOrDefault("mode", "qna");
        String userId = (String) authentication.getPrincipal();

        return ragService.processChatStream(sessionId, message, mode, userId);
    }

    /**
     * Send a message without a session — creates a new session automatically
     */
    @PostMapping(value = "/message", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendNewMessage(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String message = payload.get("message");
        String mode = payload.getOrDefault("mode", "qna");
        String userId = (String) authentication.getPrincipal();

        return ragService.processChatStream(null, message, mode, userId);
    }

    /**
     * Get all sessions for the authenticated user
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSession>> getSessions(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(sessionRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    /**
     * Get a specific session by ID
     */
    @GetMapping("/sessions/{id}")
    public ResponseEntity<ChatSession> getSession(@PathVariable String id) {
        return sessionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a session
     */
    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return sessionRepository.findById(id)
                .filter(session -> userId.equals(session.getUserId()))
                .map(session -> {
                    sessionRepository.delete(session);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Rename a session
     */
    @PutMapping("/sessions/{id}/title")
    public ResponseEntity<ChatSession> renameSession(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String newTitle = payload.get("title");
        return sessionRepository.findById(id)
                .filter(session -> userId.equals(session.getUserId()))
                .map(session -> {
                    session.setTitle(newTitle);
                    return ResponseEntity.ok(sessionRepository.save(session));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
