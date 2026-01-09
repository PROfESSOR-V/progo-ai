# embedding_generator.py
from typing import List, Dict
from openai import OpenAI

client = OpenAI()


class EmbeddingGenerator:
    def __init__(self, model: str = "text-embedding-3-small", batch_size: int = 64):
        self.model = model
        self.batch_size = batch_size

    def generate_embeddings(self, chunks: List[Dict]) -> List[Dict]:
        """
        Convert chunks into embeddings.
        """
        embeddings: List[Dict] = []

        for i in range(0, len(chunks), self.batch_size):
            batch = chunks[i:i + self.batch_size]
            texts = [c["text"] for c in batch]

            response = client.embeddings.create(
                model=self.model,
                input=texts
            )

            for chunk, vector in zip(batch, response.data):
                embeddings.append({
                    "chunk_id": chunk["chunk_id"],
                    "document_id": chunk["document_id"],
                    "embedding": vector.embedding,
                    "model": self.model,
                    "dimension": len(vector.embedding)
                })

        return embeddings
