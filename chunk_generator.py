# chunk_generator.py
import uuid
from typing import List, Dict
import tiktoken


class ChunkGenerator:
    def __init__(self, model_name: str = "gpt-4o-mini", max_tokens: int = 500, overlap: int = 50):
        self.tokenizer = tiktoken.encoding_for_model(model_name)
        self.max_tokens = max_tokens
        self.overlap = overlap

    def count_tokens(self, text: str) -> int:
        return len(self.tokenizer.encode(text))

    def generate_chunks(self, document: Dict) -> List[Dict]:
        """
        Convert document pages into token-bounded chunks.
        """
        chunks: List[Dict] = []

        buffer_text = ""
        buffer_start_page = None
        document_id = document["document_id"]

        for page in document["pages"]:
            if buffer_start_page is None:
                buffer_start_page = page["page_number"]

            buffer_text += "\n" + page["text"]

            token_count = self.count_tokens(buffer_text)

            if token_count >= self.max_tokens:
                chunk_text = buffer_text
                chunk_id = str(uuid.uuid4())

                chunks.append({
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "source_type": document["source_type"],
                    "page_start": buffer_start_page,
                    "page_end": page["page_number"],
                    "text": chunk_text.strip(),
                    "token_count": token_count
                })

                # overlap handling
                tokens = self.tokenizer.encode(chunk_text)
                overlap_tokens = tokens[-self.overlap:]
                buffer_text = self.tokenizer.decode(overlap_tokens)
                buffer_start_page = page["page_number"]

        # flush remaining buffer
        if buffer_text.strip():
            chunk_id = str(uuid.uuid4())
            chunks.append({
                "chunk_id": chunk_id,
                "document_id": document_id,
                "source_type": document["source_type"],
                "page_start": buffer_start_page,
                "page_end": document["page_count"],
                "text": buffer_text.strip(),
                "token_count": self.count_tokens(buffer_text)
            })

        return chunks
