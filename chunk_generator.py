import uuid
from typing import List, Dict
import tiktoken


class ChunkGenerator:
    def __init__(self, model_name: str = "gpt-4o-mini", max_tokens: int = 500, overlap: int = 50):
        self.tokenizer = tiktoken.encoding_for_model(model_name)
        self.max_tokens = max_tokens
        self.overlap = overlap

    def generate_chunks(self, document: Dict) -> List[Dict]:
        """
        Convert document pages into strict token-bounded chunks.
        """
        chunks: List[Dict] = []
        document_id = document["document_id"]
        source_type = document.get("source_type", "unknown")
        source_name = document.get("source_name", "unknown")

        all_tokens = []
        token_to_page = []
        
        for page in document.get("pages", []):
            page_text = page.get("text", "")
            if not page_text.strip():
                continue
                
            page_num = page.get("page_number", 1)
            page_tokens = self.tokenizer.encode("\n\n" + page_text)
            
            all_tokens.extend(page_tokens)
            token_to_page.extend([page_num] * len(page_tokens))
            
        i = 0
        while i < len(all_tokens):
            end = min(i + self.max_tokens, len(all_tokens))
            chunk_tokens = all_tokens[i:end]
            
            start_page = token_to_page[i] if i < len(token_to_page) else 1
            end_page = token_to_page[end - 1] if end > 0 and (end - 1) < len(token_to_page) else start_page
            
            chunk_text = self.tokenizer.decode(chunk_tokens).strip()
            if chunk_text:
                chunks.append({
                    "chunk_id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "source_type": source_type,
                    "source_name": source_name,
                    "page_start": start_page,
                    "page_end": end_page,
                    "text": chunk_text,
                    "token_count": len(chunk_tokens)
                })
            
            i += (self.max_tokens - self.overlap)
            
        return chunks
