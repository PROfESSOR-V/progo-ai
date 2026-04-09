#!/usr/bin/env python3
"""
Main script to run the complete RAG pipeline:
1. Load multiple document types
2. Generate chunks
3. Generate embeddings
4. Store in Pinecone with chunk text metadata
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from document_loader import load_document
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

    def process_document(self, file_path: str) -> dict:
        if not Path(file_path).exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        print(f"\n📄 Loading Document: {file_path}")
        document = load_document(file_path)
        print(f"   ✓ Extracted content from {document['source_type']}")
        
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

    def store_in_pinecone(self, chunks: list, embeddings: list, user_id: str = "unknown", file_id: str = "unknown"):
        print(f"\n📤 Storing embeddings in Pinecone...")
        
        chunks_by_id = {chunk["chunk_id"]: chunk for chunk in chunks}
        vectors_to_upsert = []
        
        for emb in embeddings:
            chunk_id = emb["chunk_id"]
            chunk = chunks_by_id.get(chunk_id, {})
            
            vectors_to_upsert.append((
                chunk_id,
                emb["embedding"],
                {
                    "user_id": user_id,
                    "file_id": file_id,
                    "document_id": emb["document_id"],
                    "text": chunk.get("text", ""),
                    "page_start": chunk.get("page_start", 0),
                    "page_end": chunk.get("page_end", 0),
                    "source_type": chunk.get("source_type", "unknown"),
                    "source_name": chunk.get("source_name", "unknown")
                }
            ))
        
        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            self.index.upsert(vectors=batch)
            uploaded = min(i + batch_size, len(vectors_to_upsert))
            print(f"   ✓ Uploaded {uploaded}/{len(vectors_to_upsert)}")

    def run_directory(self, dir_path: str):
        try:
            folder = Path(dir_path)
            supported_exts = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.json']
            
            files_to_process = [f for f in folder.glob("**/*") if f.is_file() and f.suffix.lower() in supported_exts]
            
            if not files_to_process:
                print(f"No valid documents found in {dir_path}")
                return
            
            print(f"Found {len(files_to_process)} valid documents to process.")
            
            for f in files_to_process:
                try:
                    results = self.process_document(str(f))
                    self.store_in_pinecone(results["chunks"], results["embeddings"])
                    print(f"✅ Processed {f.name} successfully.")
                except Exception as ex:
                    print(f"❌ Failed to process {f.name}: {ex}")

            print("\n" + "="*50)
            print("✅ RAG Pipeline Complete!")
            print("="*50)
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    print("\n" + "="*50)
    print("🚀 Progo-AI Multi-Format RAG Pipeline")
    print("="*50)
    
    pipeline = RAGPipeline()
    
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
        user_id = sys.argv[2] if len(sys.argv) > 2 else "unknown"
        file_id = sys.argv[3] if len(sys.argv) > 3 else "unknown"
        if os.path.isfile(target_path):
            try:
                results = pipeline.process_document(target_path)
                pipeline.store_in_pinecone(results["chunks"], results["embeddings"], user_id, file_id)
                print(f"✅ Processed {target_path} successfully.")
            except Exception as e:
                print(f"❌ Failed to process {target_path}: {e}")
                sys.exit(1)
        elif os.path.isdir(target_path):
            pipeline.run_directory(target_path)
    else:
        # Default behavior
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
        pipeline.run_directory(data_dir)


if __name__ == "__main__":
    main()
