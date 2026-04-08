# RAG Project Setup

This is a Retrieval Augmented Generation (RAG) project that processes PDFs into embeddings and stores them in Pinecone for semantic search.

## Quick Start

### 1. Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 2. Ensure PDF is in Place
Place your PDF in: `data/API Setup Guide.pdf`

### 3. Run the Pipeline
\`\`\`bash
python main.py
\`\`\`

## Project Structure

- **pdf_loader.py** - Loads and extracts text from PDFs
- **chunk_generator.py** - Creates token-bounded chunks from documents
- **embedding_generator.py** - Generates embeddings using OpenAI
- **main.py** - Orchestrates the complete RAG pipeline
- **data/** - Directory for input PDFs

## What It Does

1. **Loads PDF** - Extracts text from all pages
2. **Generates Chunks** - Creates token-bounded chunks with overlap
3. **Creates Embeddings** - Converts text chunks to vector embeddings (OpenAI API)
4. **Stores in Pinecone** - Saves embeddings to vector database
5. **Enables Queries** - Search similar content semantically

## Environment Variables

Required in `.env` file:
- `OPENAI_API_KEY` - Your OpenAI API key
- `PINECONE_API_KEY` - Your Pinecone API key
- `PINECONE_ENV` - Pinecone region (e.g., us-east-1)
- `PINECONE_INDEX` - Index name (e.g., ragtest)

## Usage Example

The main.py script includes an example query. You can also use it interactively:

\`\`\`python
from main import RAGPipeline

pipeline = RAGPipeline()
results = pipeline.query("Your question here", top_k=3)
\`\`\`
