# ProGO AI

**ProGO AI** is a production-style **agentic document and code intelligence platform** that semantically indexes documents and GitHub repositories using embeddings and vector databases, enabling source-grounded Q&A, summarization, quiz generation, and code understanding.

This project is designed with **real-world system architecture principles**: modular ingestion pipelines, metadata provenance, cost-efficient vector retrieval, and agent-driven reasoning.

---

## 🚀 Key Features

* 📄 **Document Intelligence**
  Upload PDFs, DOCX, PPT, or TXT files and generate summaries, quizzes, and answers with page-level source attribution.

* 🧠 **Agentic RAG Architecture**
  Planner → Retriever → Generator workflows that dynamically decide how to process user goals instead of fixed prompt chains.

* 🧩 **Semantic Chunking Pipeline**
  Converts documents into token-bounded semantic chunks with deterministic document and chunk IDs.

* 🧬 **Vector-Based Retrieval**
  Uses Pinecone vector database for low-latency semantic search with metadata filtering.

* 💻 **GitHub Codebase Intelligence**
  Indexes GitHub repositories at function/class level and enables code-aware Q&A with file and line-number provenance.

* 🔒 **Hallucination Control**
  Every LLM response is grounded in retrieved chunks and returned with explicit sources.

* 💸 **Cost-Efficient Design**
  Batch embeddings, chunk-level retrieval, and optional pre-summarization significantly reduce LLM token usage.

---

## 🏗️ High-Level Architecture

```
Document / GitHub Repo
        ↓
 Parsing & Extraction
        ↓
 Semantic Chunking
        ↓
 Embedding Generation
        ↓
 Pinecone Vector DB
        ↓
 Agent Orchestrator
        ↓
 LLM (Answers with Sources)
```

---

## 🔧 Core Components

### 1. Ingestion Layer

* Parses PDFs, documents, and repositories
* Extracts structured text and metadata
* Handles large files via batching and limits

### 2. Chunking Layer

* Token-aware chunking with overlap
* Page-level (documents) and line-level (code) provenance
* Deterministic chunk IDs for reproducibility

### 3. Embedding Layer

* Converts chunks into embeddings
* Supports batch processing
* Provider-agnostic design

### 4. Vector Store

* Pinecone used as vector database
* Metadata-based filtering (document_id, chunk_id)
* Fast semantic retrieval at scale

### 5. Agent Orchestrator

* Planner decides execution strategy
* Retriever fetches relevant chunks
* Generator produces summaries, quizzes, or answers
* Ensures all outputs are source-grounded

---

## 🧠 Agentic Workflow Example

```
User Goal: "Create a quiz from this PDF"

Agent Planner
   ↓
Retrieve key chunks
   ↓
Generate structured summary
   ↓
Generate quiz questions
   ↓
Validate coverage & sources
```

This makes ProGO AI **agentic**, not just a simple RAG chatbot.

---

## 🛠️ Tech Stack

* **Language:** Python
* **Backend:** FastAPI
* **Embeddings:** OpenAI Embeddings
* **Vector Database:** Pinecone
* **Document Parsing:** PyMuPDF
* **Code Access:** GitHub OAuth / GitHub API
* **Architecture:** Agentic RAG, Vector Search
* **APIs:** REST

---

## 📊 Why ProGO AI Is Different

| Typical RAG Chatbot | ProGO AI                   |
| ------------------- | -------------------------- |
| Prompt + retrieval  | Agent-driven workflows     |
| No provenance       | Page/file-line attribution |
| Full-doc prompts    | Chunk-level retrieval      |
| High token cost     | Cost-optimized embeddings  |
| Static behavior     | Dynamic planning           |

---

## 🔐 Security & Privacy

* Read-only GitHub access
* Secrets scanning before indexing
* No document text stored in vector DB
* Full deletion support for documents and embeddings

---

## 📈 Use Cases

* Study material summarization and quizzes
* Codebase onboarding and exploration
* Technical documentation understanding
* AI-assisted code reviews and explanations
* Knowledge assistants for internal teams

---

## 🧪 Project Status

* Core ingestion and embedding pipeline implemented
* Pinecone vector search integrated
* Agentic orchestration in progress
* GitHub codebase indexing supported

---

## 📌 Future Enhancements

* Incremental reindexing using GitHub webhooks
* Database connectors with explicit user consent
* Adaptive quiz difficulty
* Multi-document reasoning
* On-prem / local model support

---

## 🤝 Contribution

This project is currently under active development. Contributions, suggestions, and reviews are welcome.

---

## 📜 License

This project is licensed under the MIT License.

---

**ProGO AI** — Built to understand documents and code the way engineers do.
