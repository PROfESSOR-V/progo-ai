#!/usr/bin/env python3
"""
Main script to run the complete RAG pipeline:
1. Load PDF
2. Generate chunks
3. Generate embeddings
4. Store in Pinecone with chunk text metadata
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from pdf_loader import load_pdf
from chunk_generator import ChunkGenerator
from embedding_generator import EmbeddingGenerator

# Load environment variables
load_dotenv()

# Import Pinecone
try:
    from pinecone import Pinecone
except ImportError:
    print("Error: pinecone not installed. Run: pip install pinecone")
    sys.exit(1)


class RAGPipeline:
    def __init__(self):
        """Initialize the RAG pipeline with Pinecone connection."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX", "ragtest")
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in .env file")
        if not self.pinecone_api_key:
            raise ValueError("PINECONE_API_KEY not found in .env file")
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = self.pc.Index(self.index_name)
        
        # Initialize components
        self.chunk_generator = ChunkGenerator(max_tokens=500, overlap=50)
        self.embedding_generator = EmbeddingGenerator()
        
        print(f"✓ Connected to Pinecone index: {self.index_name}")

    def process_pdf(self, pdf_path: str) -> dict:
        """
        Load PDF, generate chunks, and embeddings.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dictionary with processing results
        """
        if not Path(pdf_path).exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        print(f"\n📄 Loading PDF: {pdf_path}")
        document = load_pdf(pdf_path)
        print(f"   ✓ Extracted {document['page_count']} pages")
        
        print(f"\n📦 Generating chunks...")
        chunks = self.chunk_generator.generate_chunks(document)
        print(f"   ✓ Created {len(chunks)} chunks")
        
        print(f"\n🔗 Generating embeddings...")
        embeddings = self.embedding_generator.generate_embeddings(chunks)
        print(f"   ✓ Generated {len(embeddings)} embeddings")
        
        return {
            "document": document,
            "chunks": chunks,
            "embeddings": embeddings
        }

    def store_in_pinecone(self, chunks: list, embeddings: list):
        """
        Store embeddings in Pinecone index with chunk text in metadata.
        
        Args:
            chunks: List of chunk dictionaries
            embeddings: List of embedding dictionaries
        """
        print(f"\n📤 Storing embeddings in Pinecone...")
        
        # Create a lookup for chunks by ID
        chunks_by_id = {chunk["chunk_id"]: chunk for chunk in chunks}
        
        vectors_to_upsert = []
        for emb in embeddings:
            chunk_id = emb["chunk_id"]
            chunk = chunks_by_id.get(chunk_id, {})
            
            vectors_to_upsert.append((
                chunk_id,
                emb["embedding"],
                {
                    "document_id": emb["document_id"],
                    "text": chunk.get("text", ""),
                    "page_start": chunk.get("page_start", 0),
                    "page_end": chunk.get("page_end", 0),
                    "source_type": chunk.get("source_type", "unknown")
                }
            ))
        
        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            self.index.upsert(vectors=batch)
            uploaded = min(i + batch_size, len(vectors_to_upsert))
            print(f"   ✓ Uploaded {uploaded}/{len(vectors_to_upsert)}")

    def run(self, pdf_path: str):
        """
        Run the complete RAG pipeline.
        
        Args:
            pdf_path: Path to PDF file
        """
        try:
            # Process PDF
            results = self.process_pdf(pdf_path)
            
            # Store in Pinecone
            self.store_in_pinecone(results["chunks"], results["embeddings"])
            
            print("\n" + "="*50)
            print("✅ RAG Pipeline Complete!")
            print("="*50)
            print(f"\nDocument: {results['document']['source_name']}")
            print(f"Pages: {results['document']['page_count']}")
            print(f"Chunks: {len(results['chunks'])}")
            print(f"Embeddings stored: {len(results['embeddings'])}")
            print("\n" + "="*50)
            print("🚀 Next Steps:")
            print("="*50)
            print("Run the query interface:\n")
            print("  ./venv/bin/python3 query_interface.py")
            print("\nOr ask a direct question:\n")
            print("  ./venv/bin/python3 query_interface.py 'What is Order Push API?'")
            print("="*50 + "\n")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """Main entry point."""
    pdf_path = "/media/professor/New Volume/progo-ai/data/API Setup Guide.pdf"
    
    print("\n" + "="*50)
    print("🚀 RAG Pipeline with Pinecone")
    print("="*50)
    
    # Initialize and run pipeline
    pipeline = RAGPipeline()
    pipeline.run(pdf_path)


if __name__ == "__main__":
    main()
