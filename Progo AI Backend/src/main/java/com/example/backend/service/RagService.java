package com.example.backend.service;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatSession;
import com.example.backend.repository.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class RagService {

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${pinecone.api.key}")
    private String pineconeApiKey;

    @Value("${pinecone.index}")
    private String pineconeIndex;

    @Value("${pinecone.index.host:}")
    private String pineconeIndexHost;

    private final ChatSessionRepository sessionRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public RagService(ChatSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public String processChat(String sessionId, String message, String mode, String userId) {
        ChatSession session = fetchOrCreateSession(sessionId, mode, userId);

        if (!userId.equals(session.getUserId())) {
            throw new IllegalArgumentException("Unauthorized session access");
        }

        // 1. Get embedding for user message
        List<Double> queryEmbedding = getOpenAiEmbedding(message);

        // 2. Query Pinecone
        List<String> contextChunks = queryPinecone(queryEmbedding, session.getContextFiles(), userId);
        String contextText = String.join("\n\n", contextChunks);

        // 3. Add user message to history
        session.getMessages().add(new ChatMessage("user", message));

        // 4. Build prompt and query OpenAI Chat Completion
        String aiResponse = getOpenAiChatCompletion(session, contextText);

        // 5. Add AI response to history and save
        session.getMessages().add(new ChatMessage("assistant", aiResponse));
        sessionRepository.save(session);

        return aiResponse;
    }

    private ChatSession fetchOrCreateSession(String sessionId, String mode, String userId) {
        if (sessionId != null && !sessionId.isEmpty()) {
            return sessionRepository.findById(sessionId).orElseGet(() -> {
                ChatSession newSession = new ChatSession("New Session", mode, userId);
                newSession.setId(sessionId);
                return sessionRepository.save(newSession);
            });
        }
        return sessionRepository.save(new ChatSession("New Session", mode, userId));
    }

    private List<Double> getOpenAiEmbedding(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("input", text);
        body.put("model", "text-embedding-3-small");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/embeddings", request, Map.class);

        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
        return (List<Double>) data.get(0).get("embedding");
    }

    private String getPineconeHost() {
        if (pineconeIndexHost != null && !pineconeIndexHost.isEmpty()) {
            return pineconeIndexHost;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("Api-Key", pineconeApiKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.pinecone.io/indexes/" + pineconeIndex, HttpMethod.GET, request, Map.class);
        Map<String, Object> body = response.getBody();
        return (String) body.get("host");
    }

    private List<String> queryPinecone(List<Double> embedding, List<String> contextFiles, String userId) {
        String host = getPineconeHost();
        String url = "https://" + host + "/query";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Api-Key", pineconeApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("vector", embedding);
        body.put("topK", 3);
        body.put("includeMetadata", true);

        Map<String, Object> filter = new HashMap<>();
        filter.put("user_id", userId);

        if (contextFiles != null && !contextFiles.isEmpty()) {
            Map<String, Object> inClause = new HashMap<>();
            inClause.put("$in", contextFiles);
            filter.put("source_name", inClause);
        }
        body.put("filter", filter);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        List<String> chunks = new ArrayList<>();
        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> matches = (List<Map<String, Object>>) responseBody.get("matches");
        if (matches != null) {
            for (Map<String, Object> match : matches) {
                Map<String, Object> metadata = (Map<String, Object>) match.get("metadata");
                if (metadata != null && metadata.containsKey("text")) {
                    chunks.add((String) metadata.get("text"));
                }
            }
        }
        return chunks;
    }

    private String getSystemPromptForMode(ChatSession session) {
        String mode = session.getMode();
        Map<String, Object> state = session.getState();
        String stateStr = state.isEmpty() ? "No current internal state." : "INTERNAL SYSTEM STATE: " + state.toString();

        if ("interview".equalsIgnoreCase(mode)) {
            return "You are an expert interviewer evaluating the candidate based on the documentation context. Ask technical questions. " +
                   stateStr + "\nWait for the user to answer, explicitly evaluate their previous answer, then ask the next question adapter to their difficulty.";
        } else if ("quiz".equalsIgnoreCase(mode)) {
            return "You are a precise Quiz master. Using the provided context, generate multiple-choice questions (A/B/C/D). " +
                   stateStr + "\nValidate user answers and implicitly keep track of their score in your memory, letting the user know their progress.";
        } else if ("exam".equalsIgnoreCase(mode)) {
            return "You are an examiner helping with exam preparation. Based on the context, provide exam-style scenarios. " + stateStr;
        } else {
            // Default Q&A
            return "You are a helpful assistant. Use the provided context to answer the user's question accurately. If the answer is not in the context, say so.";
        }
    }

    private String getOpenAiChatCompletion(ChatSession session, String context) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        List<Map<String, String>> messages = new ArrayList<>();

        String systemPrompt = getSystemPromptForMode(session);
        systemPrompt += "\n\nRELEVANT DOCUMENTATION CONTEXT:\n" + (context.isEmpty() ? "No context found." : context);

        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        List<ChatMessage> history = session.getMessages();
        int start = Math.max(0, history.size() - 8); // Send only the last 8 messages mapping to user's "5-10" requirement
        for (int i = start; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            Map<String, String> m = new HashMap<>();
            m.put("role", msg.getRole());
            m.put("content", msg.getContent());
            messages.add(m);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");
        body.put("messages", messages);
        body.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions", request, Map.class);

        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> firstChoice = choices.get(0);
        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
        return (String) message.get("content");
    }
}
