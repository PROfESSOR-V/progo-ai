# Progo AI Project Report

## 1. Background
Progo AI is an advanced, multi-format Retrieval-Augmented Generation (RAG) application. It is designed to ingest and process various document formats (such as PDFs, DOCX, XLSX, and JSON), generate text embeddings, and index them in a vector database (Pinecone) for semantic search. The system offers an intelligent conversational interface backed by OpenAI's Large Language Models (LLMs) to accurately answer user questions and provide contextually relevant information directly extracted from the uploaded documentation. 

The project has evolved to include a comprehensive full-stack architecture, featuring a Spring Boot backend for user authentication and session management, alongside a modern React-based chat UI frontend.

## 2. System Architecture
The project follows a robust, multi-tier system architecture:

*   **Frontend (Presentation Layer):** A responsive, single-page application built with React and Vite. It provides a ChatGPT-like user interface for document uploading, session management, and chatting.
*   **Backend API (Application Layer):** A Java Spring Boot application that exposes RESTful endpoints for the frontend. It manages user authentication (JWT-based), chat session persistence (using MongoDB), and routes document upload tasks and queries.
*   **RAG Engine (Data Processing & AI Layer):** A Python-based pipeline that handles the heavy lifting of the RAG architecture. It performs text extraction, token-based chunking, embedding generation using OpenAI's embedding models, and vector storage in Pinecone.
*   **External Services:**
    *   **OpenAI API:** Used for generating vector embeddings (`text-embedding-3-small`) and for conversational generation (`gpt-4o-mini`).
    *   **Pinecone:** The vector database used to store text chunk embeddings and retrieve the most relevant document sections via cosine similarity search.

## 3. System Design
The system's modular design ensures clear separation of concerns:

*   **Document Loaders (`document_loader.py`):** Dedicated parsers for different file types. It normalizes extracted text into standard page arrays and computes stable document hashes (SHA-256).
*   **Chunk Generator (`chunk_generator.py`):** Uses strict token bounds with overlap to maintain contextual continuity across text splits.
*   **Embedding Generator (`embedding_generator.py`):** Batches text chunks and communicates with the OpenAI API to map natural language to high-dimensional vector spaces.
*   **Pipeline Orchestrator (`main.py`):** Coordinates the end-to-end ingestion process from reading a local directory to pushing vectors to Pinecone.
*   **Query Interface (`query_interface.py`):** Performs vector similarity searches against Pinecone using user queries, structures the prompt with retrieved context, and communicates with the LLM to synthesize an answer.
*   **Web API (Spring Boot):** Intercepts frontend requests (`/api/chat`, `/api/upload`, `/api/auth`), verifies user identity, and coordinates database states.

## 4. Flow of Project

### Data Ingestion Flow:
1.  **Upload:** User uploads document(s) via the React UI or places them in the `data/` directory.
2.  **Extraction:** The system reads the files based on their extension (e.g., PyMuPDF for PDFs, pandas for Excel).
3.  **Chunking:** The extracted text is converted into tokens and split into chunks of up to 500 tokens, with a 50-token overlap.
4.  **Embedding:** Chunks are sent to OpenAI to generate vector embeddings.
5.  **Storage:** Embeddings, along with associated metadata (text content, source file name, page numbers), are upserted into the Pinecone vector database.

### Query and Generation Flow:
1.  **User Input:** The user types a question in the chat UI or CLI.
2.  **Query Embedding:** The question is converted into a vector embedding.
3.  **Semantic Search:** The system queries Pinecone to retrieve the top *K* (default 3) most relevant chunks based on vector similarity.
4.  **Context Augmentation:** The retrieved chunks are concatenated to form a rich context window.
5.  **Answer Generation:** A system prompt combining the context and the user's question is sent to the `gpt-4o-mini` LLM.
6.  **Response:** The synthesized answer is returned to the user interface.

## 5. Approach
The primary approach is **Retrieval-Augmented Generation (RAG)**. Instead of fine-tuning a model (which is expensive and static), the system dynamically retrieves facts from a managed knowledge base at runtime. This approach significantly reduces AI hallucinations, allows the system to cite sources, and enables the knowledge base to be updated instantly simply by uploading new files.

## 6. Algorithms Used
*   **Tokenization Algorithm:** Byte-Pair Encoding (BPE) via OpenAI's `tiktoken` for accurate token counting and chunking.
*   **Hashing Algorithm:** SHA-256 is used to generate stable and unique document IDs to avoid duplicate processing.
*   **Semantic Similarity Search:** (Managed by Pinecone) Usually relies on Approximate Nearest Neighbor (ANN) algorithms using Cosine Similarity or Euclidean distance to quickly find the closest vectors in high-dimensional space.
*   **Sliding Window Chunking:** Used to split text with a predefined overlap, ensuring that semantic boundaries (like mid-sentence splits) do not lose context.

## 7. Hardware & Software Components
*   **Hardware (Deployment):** Standard cloud compute instances (e.g., AWS EC2, Heroku, or equivalent) with internet access. No dedicated GPUs are required since heavy ML processing is offloaded to OpenAI's APIs.
*   **Software / Environment:**
    *   OS: Cross-platform (Linux/Windows/macOS)
    *   Containerization (optional, but recommended for consistent deployments)
    *   Virtual Environment for Python dependency isolation (`venv`)
    *   Node.js (for Vite development server and building React)
    *   Java Development Kit (JDK 17)
    *   MongoDB Server (for backend session storage)

## 8. Programming Languages Used
*   **Python (v3.8+):** Core language for AI logic, data extraction, and RAG pipelines.
*   **Java (17):** Used for building the robust, secure Spring Boot backend.
*   **JavaScript (ES6+) / JSX:** Used for building the dynamic React frontend.
*   **CSS / HTML:** For UI styling and structural layout.

## 9. Libraries & Frameworks

### Python (AI/RAG Pipeline)
*   **`openai`:** For accessing embedding and chat completion APIs.
*   **`pinecone`:** Python client for the vector database.
*   **`tiktoken`:** For precise token counting based on OpenAI models.
*   **`PyMuPDF (fitz)`:** High-performance PDF parsing.
*   **`python-docx`:** For reading Word documents.
*   **`pandas` & `openpyxl`:** For parsing Excel spreadsheets.
*   **`python-dotenv`:** For environment variable management.

### Java (Backend)
*   **Spring Boot 3.2.4:** Core application framework (Web, Data MongoDB).
*   **Spring Security:** For securing endpoints.
*   **JJWT (io.jsonwebtoken):** For generating and parsing JSON Web Tokens.
*   **Spring Dotenv:** For loading `.env` configurations.

### JavaScript (Frontend)
*   **React 18 & ReactDOM:** UI library.
*   **Vite:** Fast build tool and development server.
*   **Tailwind CSS & Autoprefixer:** Utility-first CSS framework for rapid styling.
*   **Axios:** Promise-based HTTP client for API requests.
*   **Lucide React:** Iconography library.

## 10. Implementation Details
*   **Security:** API keys (`OPENAI_API_KEY`, `PINECONE_API_KEY`) are kept strictly out of source control using `.env` files. The web app uses JWT (JSON Web Tokens) for securing user sessions, meaning the API is stateless and scalable.
*   **Chunking Strategy:** The `ChunkGenerator` creates overlapping chunks (max 500 tokens, 50 token overlap). This ensures that if a critical piece of information is cut in half by a chunk boundary, the overlap captures the context in the adjacent chunk.
*   **Metadata Integration:** When chunks are sent to Pinecone, they include rich metadata (`user_id`, `file_id`, `page_start`, `source_type`). This allows for future implementation of granular, file-level or user-level search filters (e.g., "Search only in PDF files uploaded by User A").
*   **UI Features:** The React app features an "optimistic UI" update for chat messages, providing a snappy experience. It also includes functional modes (Q&A, Interview, Quiz, Exam) which likely alter the system prompt passed to the LLM to change the format of the output.
