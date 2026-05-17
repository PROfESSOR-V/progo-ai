package com.example.backend.repository;

import com.example.backend.model.FileMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FileMetadataRepository extends MongoRepository<FileMetadata, String> {
    List<FileMetadata> findByUserId(String userId);
    List<FileMetadata> findBySessionId(String sessionId);
    List<FileMetadata> findByUserIdAndSessionId(String userId, String sessionId);
}
