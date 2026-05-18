package com.example.backend.controller;

import com.example.backend.model.ChatSession;
import com.example.backend.model.FileMetadata;
import com.example.backend.repository.ChatSessionRepository;
import com.example.backend.repository.FileMetadataRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;



import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Value("${rag.data.dir}")
    private String uploadDir;

    @Value("${rag.python.path}")
    private String pythonPath;

    @Value("${rag.script.path}")
    private String scriptPath;

    private final ChatSessionRepository sessionRepository;
    private final FileMetadataRepository fileMetadataRepository;

    public UploadController(ChatSessionRepository sessionRepository, FileMetadataRepository fileMetadataRepository) {
        this.sessionRepository = sessionRepository;
        this.fileMetadataRepository = fileMetadataRepository;
    }

    @PostConstruct
    public void init() {
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }


    @PostMapping
    public ResponseEntity<Map<String, String>> uploadAndIngestFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "mode", defaultValue = "qna") String mode,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            Authentication authentication) {
        
        String userId = (String) authentication.getPrincipal();
        
        Map<String, String> response = new HashMap<>();
        if (files == null || files.length == 0) {
            response.put("error", "No files selected");
            return ResponseEntity.badRequest().body(response);
        }

        // Use existing session if sessionId is provided, otherwise create a new one
        ChatSession session;
        if (sessionId != null && !sessionId.isEmpty()) {
            session = sessionRepository.findById(sessionId).orElseGet(() -> {
                ChatSession newSession = new ChatSession("New Context Session", mode, userId);
                return sessionRepository.save(newSession);
            });
        } else {
            session = new ChatSession("New Context Session", mode, userId);
            session = sessionRepository.save(session);
        }

        String effectiveSessionId = session.getId();
        System.out.println("[UPLOAD] userId=" + userId + " sessionId=" + effectiveSessionId + " mode=" + mode + " fileCount=" + files.length);
        List<String> ctxFiles = session.getContextFiles() != null 
            ? new ArrayList<>(session.getContextFiles()) 
            : new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                
                String fileId = UUID.randomUUID().toString();
                Path dest = Paths.get(uploadDir, file.getOriginalFilename());
                Files.write(dest, file.getBytes());

                // Store file metadata with sessionId for session-scoped association
                FileMetadata metadata = new FileMetadata(fileId, userId, effectiveSessionId, file.getOriginalFilename(), mode);
                fileMetadataRepository.save(metadata);

                ProcessBuilder pb = new ProcessBuilder(
                        pythonPath,
                        scriptPath,
                        dest.toString(),
                        userId,
                        fileId
                );
                pb.directory(new File(scriptPath).getParentFile());
                pb.inheritIO();
                Process process = pb.start();
                int exitCode = process.waitFor();
                
                if (exitCode != 0) {
                    System.err.println("Ingestion script failed for " + file.getOriginalFilename() + ". Exit code: " + exitCode);
                } else {
                    ctxFiles.add(file.getOriginalFilename());
                    System.out.println("[UPLOAD] Successfully ingested: " + file.getOriginalFilename() + " fileId=" + fileId + " sessionId=" + effectiveSessionId);
                }
            }

            // Update the session's context files with the newly uploaded files
            session.setContextFiles(ctxFiles);
            sessionRepository.save(session);

            response.put("message", "Files uploaded and successfully ingested into Pinecone");
            response.put("sessionId", effectiveSessionId);
            return ResponseEntity.ok(response);

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            response.put("error", "Failed to upload or ingest file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get files for a specific session
     */
    @GetMapping("/files/{sessionId}")
    public ResponseEntity<List<String>> listSessionFiles(
            @PathVariable String sessionId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<FileMetadata> sessionFiles = fileMetadataRepository.findByUserIdAndSessionId(userId, sessionId);
        
        List<String> fileNames = sessionFiles.stream()
                .map(FileMetadata::getFilename)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(fileNames);
    }

    /**
     * Get all files for the user (backwards compatibility)
     */
    @GetMapping("/files")
    public ResponseEntity<List<String>> listUploadedFiles(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<FileMetadata> userFiles = fileMetadataRepository.findByUserId(userId);
        
        List<String> fileNames = userFiles.stream()
                .map(FileMetadata::getFilename)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(fileNames);
    }
}
