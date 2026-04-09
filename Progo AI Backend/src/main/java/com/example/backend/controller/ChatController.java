package com.example.backend.controller;

import com.example.backend.dto.ChatRequest;
import com.example.backend.model.ChatSession;
import com.example.backend.repository.ChatSessionRepository;
import com.example.backend.service.RagService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


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

    @PostMapping("/{sessionId}/message")
    public ResponseEntity<Map<String, String>> sendMessage(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String message = payload.get("message");
        String mode = payload.getOrDefault("mode", "qna");
        String userId = (String) authentication.getPrincipal();

        String response = ragService.processChat(sessionId, message, mode, userId);
        Map<String, String> body = new HashMap<>();
        body.put("reply", response);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSession>> getSessions() {
        return ResponseEntity.ok(sessionRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<ChatSession> getSession(@PathVariable String id) {
        return sessionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
