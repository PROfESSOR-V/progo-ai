package com.example.backend.repository;

import com.example.backend.model.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {
    List<ChatSession> findAllByOrderByCreatedAtDesc();
    List<ChatSession> findByUserIdOrderByCreatedAtDesc(String userId);
}
