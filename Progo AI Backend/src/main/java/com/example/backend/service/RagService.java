package com.example.backend.service;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatSession;
import com.example.backend.repository.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public RagService(ChatSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    // ─────────────────────────────────────────────
    // MAIN ENTRY POINT
    // ─────────────────────────────────────────────

    public SseEmitter processChatStream(String sessionId, String message, String mode, String userId) {
        SseEmitter emitter = new SseEmitter(600000L); // 10 minutes timeout

        executorService.submit(() -> {
            try {
                ChatSession session = fetchOrCreateSession(sessionId, mode, userId);

                if (!userId.equals(session.getUserId())) {
                    emitter.completeWithError(new IllegalArgumentException("Unauthorized session access"));
                    return;
                }

                // Store setup context from first message if applicable
                boolean isSetupMessage = message.startsWith("[SETUP_CONTEXT]");
                if (isSetupMessage && session.getMessages().isEmpty()) {
                    String setupContent = message.substring("[SETUP_CONTEXT]".length()).trim();
                    session.setSetupContext(setupContent);
                }

                // Determine if RAG search is needed
                String effectiveMode = session.getMode();
                boolean needsRag = needsRagSearch(effectiveMode, session);

                String contextText = "";
                if (needsRag) {
                    contextText = enhancedSearch(message, session.getContextFiles(), userId);
                }

                // Add user message to history
                session.getMessages().add(new ChatMessage("user", message));

                // Auto-generate title from first message
                if (session.getMessages().size() <= 2 && "New Session".equals(session.getTitle())) {
                    try {
                        String autoTitle = generateSessionTitle(message, effectiveMode);
                        session.setTitle(autoTitle);
                    } catch (Exception e) {
                        session.setTitle(message.length() > 40 ? message.substring(0, 40) + "..." : message);
                    }
                }
                
                // Save session so it has an ID and title populated before sending metadata
                session = sessionRepository.save(session);

                // Send metadata event
                Map<String, String> meta = new HashMap<>();
                meta.put("sessionId", session.getId());
                meta.put("title", session.getTitle());
                emitter.send(SseEmitter.event().name("metadata").data(meta));

                // Call OpenAI with stream
                String fullResponse = getOpenAiChatStream(session, contextText, emitter);

                // Add AI response to history
                session.getMessages().add(new ChatMessage("assistant", fullResponse));
                sessionRepository.save(session);

                emitter.complete();
            } catch (Exception e) {
                e.printStackTrace();
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    public String processChat(String sessionId, String message, String mode, String userId) {
        ChatSession session = fetchOrCreateSession(sessionId, mode, userId);

        if (!userId.equals(session.getUserId())) {
            throw new IllegalArgumentException("Unauthorized session access");
        }

        // Store setup context from first message if applicable
        boolean isSetupMessage = message.startsWith("[SETUP_CONTEXT]");
        if (isSetupMessage && session.getMessages().isEmpty()) {
            String setupContent = message.substring("[SETUP_CONTEXT]".length()).trim();
            session.setSetupContext(setupContent);
        }

        // Determine if RAG search is needed
        String effectiveMode = session.getMode();
        boolean needsRag = needsRagSearch(effectiveMode, session);

        String contextText = "";
        if (needsRag) {
            // Enhanced RAG pipeline with HyDE + re-ranking
            contextText = enhancedSearch(message, session.getContextFiles(), userId);
        }

        // Add user message to history
        session.getMessages().add(new ChatMessage("user", message));

        // Build prompt and query OpenAI Chat Completion
        String aiResponse = getOpenAiChatCompletion(session, contextText);

        // Add AI response to history
        session.getMessages().add(new ChatMessage("assistant", aiResponse));

        // Auto-generate title from first message
        if (session.getMessages().size() <= 2 && "New Session".equals(session.getTitle())) {
            try {
                String autoTitle = generateSessionTitle(message, effectiveMode);
                session.setTitle(autoTitle);
            } catch (Exception e) {
                session.setTitle(message.length() > 40 ? message.substring(0, 40) + "..." : message);
            }
        }

        sessionRepository.save(session);
        return aiResponse;
    }

    private boolean needsRagSearch(String mode, ChatSession session) {
        // Simple and DSA modes never use RAG
        if ("simple".equalsIgnoreCase(mode) || "dsa".equalsIgnoreCase(mode)) {
            return false;
        }
        // Q&A mode requires context files
        if ("qna".equalsIgnoreCase(mode)) {
            List<String> files = session.getContextFiles();
            return files != null && !files.isEmpty();
        }
        // Interview and Quiz can optionally use RAG if files exist
        List<String> files = session.getContextFiles();
        return files != null && !files.isEmpty();
    }

    // ─────────────────────────────────────────────
    // ENHANCED SEARCH PIPELINE (HyDE + Re-ranking)
    // ─────────────────────────────────────────────

    /**
     * Production-grade retrieval pipeline:
     * 1. Expand the user's query for better coverage
     * 2. Generate a hypothetical answer (HyDE)
     * 3. Embed both original + HyDE
     * 4. Query Pinecone with both embeddings (top-8 each)
     * 5. Deduplicate results
     * 6. Re-rank by cosine similarity to original query
     * 7. Return top 5 most relevant chunks
     */
    private String enhancedSearch(String query, List<String> contextFiles, String userId) {
        try {
            // Step 1: Expand the query
            String expandedQuery = expandQuery(query);

            // Step 2: Generate HyDE (hypothetical document)
            String hypotheticalAnswer = generateHypotheticalAnswer(query);

            // Step 3: Embed original query + HyDE document
            List<Double> queryEmbedding = getOpenAiEmbedding(query + " " + expandedQuery);
            List<Double> hydeEmbedding = getOpenAiEmbedding(hypotheticalAnswer);

            // Step 4: Query Pinecone with both embeddings
            List<ScoredChunk> queryResults = queryPineconeWithScores(queryEmbedding, contextFiles, userId, 8);
            List<ScoredChunk> hydeResults = queryPineconeWithScores(hydeEmbedding, contextFiles, userId, 8);

            // Step 5: Deduplicate — merge results, keeping highest score
            Map<String, ScoredChunk> merged = new LinkedHashMap<>();
            for (ScoredChunk chunk : queryResults) {
                merged.merge(chunk.id, chunk, (existing, incoming) ->
                    existing.score >= incoming.score ? existing : incoming);
            }
            for (ScoredChunk chunk : hydeResults) {
                merged.merge(chunk.id, chunk, (existing, incoming) ->
                    existing.score >= incoming.score ? existing : incoming);
            }

            // Step 6: Re-rank by computing fresh similarity against original query embedding
            List<ScoredChunk> allChunks = new ArrayList<>(merged.values());
            List<ScoredChunk> reranked = rerankChunks(allChunks, queryEmbedding);

            // Step 7: Take top 5 and assemble context
            List<String> topChunks = reranked.stream()
                .limit(5)
                .map(c -> c.text)
                .collect(Collectors.toList());

            return String.join("\n\n---\n\n", topChunks);

        } catch (Exception e) {
            // Fallback to simple search if enhanced pipeline fails
            System.err.println("Enhanced search failed, falling back to simple: " + e.getMessage());
            List<Double> embedding = getOpenAiEmbedding(query);
            List<ScoredChunk> results = queryPineconeWithScores(embedding, contextFiles, userId, 5);
            return results.stream().map(c -> c.text).collect(Collectors.joining("\n\n"));
        }
    }

    /**
     * Query expansion: LLM generates a richer version of the query
     * for better semantic coverage in vector search
     */
    private String expandQuery(String query) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
            "You are a search query expander. Given a user's question, generate a more detailed " +
            "version that includes synonyms, related terms, and rephrased versions. " +
            "Return ONLY the expanded query, nothing else. Keep it under 100 words."));
        messages.add(Map.of("role", "user", "content", query));

        return callOpenAiChat(messages, 0.3, 150);
    }

    /**
     * HyDE: Generate a hypothetical answer document.
     * Instead of searching for the question, we search for what
     * the answer would look like — this finds semantically closer matches.
     */
    private String generateHypotheticalAnswer(String query) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
            "You are a technical document writer. Given a question, write a short paragraph (50-100 words) " +
            "that would be the ideal answer found in documentation. Write it as if it were " +
            "extracted from a technical document. Do NOT say 'the answer is' — just write the content directly."));
        messages.add(Map.of("role", "user", "content", query));

        return callOpenAiChat(messages, 0.5, 200);
    }

    /**
     * Re-rank chunks by computing text embedding similarity to the original query.
     * Uses the chunk's Pinecone score weighted with text-level relevance.
     */
    private List<ScoredChunk> rerankChunks(List<ScoredChunk> chunks, List<Double> queryEmbedding) {
        if (chunks.isEmpty()) return chunks;

        // Compute embedding for each chunk text and calculate cosine similarity
        for (ScoredChunk chunk : chunks) {
            try {
                List<Double> chunkEmbedding = getOpenAiEmbedding(
                    chunk.text.length() > 500 ? chunk.text.substring(0, 500) : chunk.text
                );
                double cosineSim = cosineSimilarity(queryEmbedding, chunkEmbedding);
                // Weighted score: 40% original Pinecone score + 60% re-rank similarity
                chunk.rerankScore = 0.4 * chunk.score + 0.6 * cosineSim;
            } catch (Exception e) {
                chunk.rerankScore = chunk.score; // fallback to original
            }
        }

        chunks.sort((a, b) -> Double.compare(b.rerankScore, a.rerankScore));
        return chunks;
    }

    private double cosineSimilarity(List<Double> a, List<Double> b) {
        if (a.size() != b.size()) return 0.0;
        double dotProduct = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.size(); i++) {
            dotProduct += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }
        double denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator == 0 ? 0.0 : dotProduct / denominator;
    }

    // ─────────────────────────────────────────────
    // MODE-SPECIFIC SYSTEM PROMPTS
    // ─────────────────────────────────────────────

    private String getSystemPromptForMode(ChatSession session) {
        String mode = session.getMode();
        String setupCtx = session.getSetupContext();
        Map<String, Object> state = session.getState();
        int msgCount = session.getMessages().size();

        switch (mode != null ? mode.toLowerCase() : "simple") {

            case "simple":
                return "You are Progo AI, a helpful, knowledgeable, and friendly assistant. " +
                       "Answer the user's questions clearly and thoroughly. " +
                       "Use markdown formatting when appropriate (headings, bold, code blocks, lists, tables). " +
                       "If asked about topics you don't know, say so honestly.";

            case "qna":
                return "You are Progo AI operating in strict Document Q&A mode. " +
                       "You MUST answer ONLY based on the provided documentation context. " +
                       "Rules:\n" +
                       "- If the answer exists in the context, provide it with specific references\n" +
                       "- If the answer is NOT in the context, explicitly say: 'This information is not found in the uploaded documents.'\n" +
                       "- NEVER make up information or answer from your general knowledge\n" +
                       "- Quote relevant passages from the documents when possible\n" +
                       "- Use markdown formatting for clarity\n" +
                       "- If the question is ambiguous, ask for clarification";

            case "interview":
                return buildInterviewPrompt(setupCtx, state, msgCount);

            case "quiz":
                return buildQuizPrompt(setupCtx, state, msgCount);

            case "dsa":
                return buildDSAPrompt(setupCtx, state, msgCount);

            default:
                return "You are Progo AI, a helpful assistant. Use markdown formatting.";
        }
    }

    private String buildInterviewPrompt(String jobDescription, Map<String, Object> state, int msgCount) {
        String stateStr = state.isEmpty() ? "" : "\nINTERNAL STATE: " + state.toString();

        return "You are an expert AI Mock Interviewer conducting a structured technical interview.\n\n" +
               "JOB DESCRIPTION:\n" + (jobDescription != null ? jobDescription : "General software engineering role") + "\n\n" +
               "INTERVIEW PROTOCOL (follow this strictly):\n\n" +
               "**Stage 1 — Introduction (Message 1-2):**\n" +
               "- Greet the candidate warmly\n" +
               "- Briefly describe the interview structure\n" +
               "- Ask a simple icebreaker: 'Tell me about yourself and your experience'\n\n" +
               "**Stage 2 — Warm-up (Message 3-4):**\n" +
               "- Ask 1-2 easy conceptual questions related to the JD\n" +
               "- Evaluate answers: rate them (Good/Average/Needs Improvement)\n\n" +
               "**Stage 3 — Technical Deep-Dive (Message 5-10):**\n" +
               "- Ask progressively harder technical questions based on the JD\n" +
               "- After each answer: explicitly evaluate, provide correct answer if wrong, then ask next\n" +
               "- Adapt difficulty: if candidate answers well → harder questions; if struggling → easier\n\n" +
               "**Stage 4 — Scenario-Based (Message 11-14):**\n" +
               "- Present 1-2 real-world scenarios from the JD domain\n" +
               "- Ask how they would approach/solve it\n" +
               "- Evaluate their problem-solving approach\n\n" +
               "**Stage 5 — Wrap-up (Message 15+):**\n" +
               "- Provide overall performance summary\n" +
               "- Score: X/10 with breakdown by category\n" +
               "- List top 3 strengths and top 3 areas for improvement\n" +
               "- Suggest specific resources for weak areas\n\n" +
               "RULES:\n" +
               "- Ask ONE question at a time, wait for response\n" +
               "- Always evaluate the previous answer before asking the next question\n" +
               "- Track score internally across the conversation\n" +
               "- Use markdown formatting (bold for key terms, code blocks for technical examples)\n" +
               "- Be encouraging but honest\n" +
               stateStr;
    }

    private String buildQuizPrompt(String quizTopic, Map<String, Object> state, int msgCount) {
        String stateStr = state.isEmpty() ? "" : "\nINTERNAL STATE: " + state.toString();

        return "You are Progo AI Quiz Master conducting an interactive quiz session.\n\n" +
               "QUIZ TOPIC/CONTEXT:\n" + (quizTopic != null ? quizTopic : "General knowledge") + "\n\n" +
               "QUIZ PROTOCOL:\n\n" +
               "1. **Generate ONE question at a time** as a Multiple Choice Question with 4 options (A/B/C/D)\n" +
               "2. **Format each question** like this:\n" +
               "   ### Question N\n" +
               "   [Question text]\n\n" +
               "   A) Option A\n" +
               "   B) Option B\n" +
               "   C) Option C\n" +
               "   D) Option D\n\n" +
               "3. **After user answers:**\n" +
               "   - Show ✅ Correct! or ❌ Incorrect (correct answer was X)\n" +
               "   - Provide a brief explanation (2-3 sentences)\n" +
               "   - Show running score: 'Score: X/Y (Z%)'\n" +
               "   - Then ask the next question\n\n" +
               "4. **Difficulty progression:** Start easy, increase difficulty based on performance\n" +
               "5. **After every 5 questions:** Show a mini progress report\n" +
               "6. **After 10 questions or if user says 'stop':** Show final scorecard with:\n" +
               "   - Total score with percentage\n" +
               "   - Performance breakdown by subtopic\n" +
               "   - Topics to review\n\n" +
               "RULES:\n" +
               "- Only ONE question per message\n" +
               "- Wait for the user's answer before proceeding\n" +
               "- Keep score accurately\n" +
               "- Use markdown formatting\n" +
               stateStr;
    }

    private String buildDSAPrompt(String code, Map<String, Object> state, int msgCount) {
        String stateStr = state.isEmpty() ? "" : "\nINTERNAL STATE: " + state.toString();

        return "You are Progo AI DSA (Data Structures & Algorithms) Expert and Code Analyst.\n\n" +
               "USER'S CODE:\n```\n" + (code != null ? code : "No code provided yet") + "\n```\n\n" +
               "ANALYSIS PROTOCOL (perform on first interaction):\n\n" +
               "1. **Code Understanding:**\n" +
               "   - Identify what the code does (purpose and algorithm used)\n" +
               "   - Identify the programming language\n\n" +
               "2. **Complexity Analysis:**\n" +
               "   - **Time Complexity:** Provide Big-O with detailed step-by-step reasoning\n" +
               "   - **Space Complexity:** Provide Big-O with reasoning\n" +
               "   - Show complexity breakdown for each significant block/loop\n\n" +
               "3. **Code Review:**\n" +
               "   - Identify bugs or edge cases not handled\n" +
               "   - Point out potential runtime errors\n" +
               "   - Suggest coding style improvements\n\n" +
               "4. **Optimized Approach:**\n" +
               "   - Suggest a more efficient algorithm (if one exists)\n" +
               "   - Provide the optimized code with comments\n" +
               "   - Compare old vs new complexity\n\n" +
               "5. **Follow-up Discussion:**\n" +
               "   - Answer any doubts about the code or approach\n" +
               "   - Explain alternative approaches if asked\n" +
               "   - Provide related DSA concepts and problems\n\n" +
               "RULES:\n" +
               "- Always use markdown with proper code blocks (specify language)\n" +
               "- Show complexity in a clear table format\n" +
               "- Be thorough but concise\n" +
               "- If asked about a different problem, analyze that instead\n" +
               stateStr;
    }

    // ─────────────────────────────────────────────
    // SESSION MANAGEMENT
    // ─────────────────────────────────────────────

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

    private String generateSessionTitle(String firstMessage, String mode) {
        // Clean setup prefix
        String cleanMessage = firstMessage.startsWith("[SETUP_CONTEXT]")
            ? firstMessage.substring("[SETUP_CONTEXT]".length()).trim()
            : firstMessage;

        // Mode-specific title hints
        String modeHint = "";
        switch (mode.toLowerCase()) {
            case "interview": modeHint = " (this is a job description for mock interview)"; break;
            case "quiz": modeHint = " (this is a quiz topic)"; break;
            case "dsa": modeHint = " (this is code for DSA analysis)"; break;
        }

        String truncated = cleanMessage.length() > 200 ? cleanMessage.substring(0, 200) : cleanMessage;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
            "Generate a very short title (max 6 words) for a conversation" + modeHint +
            ". Return ONLY the title, nothing else. No quotes."));
        messages.add(Map.of("role", "user", "content", truncated));

        return callOpenAiChat(messages, 0.7, 20).trim();
    }

    // ─────────────────────────────────────────────
    // OPENAI API METHODS
    // ─────────────────────────────────────────────

    private String callOpenAiChat(List<Map<String, String>> messages, double temperature, int maxTokens) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");
        body.put("messages", messages);
        body.put("temperature", temperature);
        body.put("max_tokens", maxTokens);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions", request, Map.class);

        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> firstChoice = choices.get(0);
        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
        return (String) message.get("content");
    }

    private List<Double> getOpenAiEmbedding(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        // Truncate very long texts to avoid token limits
        String truncated = text.length() > 8000 ? text.substring(0, 8000) : text;

        Map<String, Object> body = new HashMap<>();
        body.put("input", truncated);
        body.put("model", "text-embedding-3-small");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/embeddings", request, Map.class);

        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
        return (List<Double>) data.get(0).get("embedding");
    }

    private String getOpenAiChatStream(ChatSession session, String context, SseEmitter emitter) throws Exception {
        List<Map<String, String>> messages = new ArrayList<>();

        String systemPrompt = getSystemPromptForMode(session);
        if (!context.isEmpty()) {
            systemPrompt += "\n\nRELEVANT DOCUMENTATION CONTEXT:\n" + context;
        }
        messages.add(Map.of("role", "system", "content", systemPrompt));

        List<ChatMessage> history = session.getMessages();
        int start = Math.max(0, history.size() - 10);
        for (int i = start; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");
        body.put("messages", messages);
        body.put("temperature", 0.7);
        body.put("stream", true);

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openaiApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<java.util.stream.Stream<String>> response = client.send(request, HttpResponse.BodyHandlers.ofLines());

        StringBuilder fullText = new StringBuilder();

        try {
            var iterator = response.body().iterator();
            while (iterator.hasNext()) {
                String line = iterator.next();
                if (line.startsWith("data: ")) {
                    String data = line.substring(6);
                    if ("[DONE]".equals(data)) {
                        break;
                    }
                    try {
                        JsonNode node = objectMapper.readTree(data);
                        JsonNode delta = node.path("choices").path(0).path("delta");
                        if (delta.has("content")) {
                            String content = delta.get("content").asText();
                            fullText.append(content);
                            Map<String, String> chunk = Map.of("content", content);
                            emitter.send(SseEmitter.event().name("message").data(chunk));
                        }
                    } catch (Exception e) {
                        // Ignore parse errors on partial chunks
                    }
                }
            }
        } catch (Exception e) {
            // If the connection is closed prematurely by OpenAI after we got some data, it's fine.
            e.printStackTrace();
        }

        return fullText.toString();
    }

    private String getOpenAiChatCompletion(ChatSession session, String context) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt
        String systemPrompt = getSystemPromptForMode(session);
        if (!context.isEmpty()) {
            systemPrompt += "\n\nRELEVANT DOCUMENTATION CONTEXT:\n" + context;
        }
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Conversation history (last 10 messages for deeper context)
        List<ChatMessage> history = session.getMessages();
        int start = Math.max(0, history.size() - 10);
        for (int i = start; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
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

    // ─────────────────────────────────────────────
    // PINECONE METHODS
    // ─────────────────────────────────────────────

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

    private List<ScoredChunk> queryPineconeWithScores(List<Double> embedding, List<String> contextFiles, String userId, int topK) {
        String host = getPineconeHost();
        String url = "https://" + host + "/query";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Api-Key", pineconeApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("vector", embedding);
        body.put("topK", topK);
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

        List<ScoredChunk> chunks = new ArrayList<>();
        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> matches = (List<Map<String, Object>>) responseBody.get("matches");
        if (matches != null) {
            for (Map<String, Object> match : matches) {
                String id = (String) match.get("id");
                double score = ((Number) match.get("score")).doubleValue();
                Map<String, Object> metadata = (Map<String, Object>) match.get("metadata");
                if (metadata != null && metadata.containsKey("text")) {
                    String text = (String) metadata.get("text");
                    chunks.add(new ScoredChunk(id, text, score));
                }
            }
        }
        return chunks;
    }

    // ─────────────────────────────────────────────
    // INNER CLASS for scored chunks
    // ─────────────────────────────────────────────

    private static class ScoredChunk {
        String id;
        String text;
        double score;
        double rerankScore;

        ScoredChunk(String id, String text, double score) {
            this.id = id;
            this.text = text;
            this.score = score;
            this.rerankScore = score;
        }
    }
}
