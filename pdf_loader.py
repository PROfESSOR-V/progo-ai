# pdf_loader.py
import hashlib
from typing import List, Dict
import fitz  # PyMuPDF


def generate_document_id(file_path: str) -> str:
    """Generate stable document ID using file hash"""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()


def load_pdf(file_path: str) -> Dict:
    """
    Extract raw text from PDF with page-level metadata.
    """
    doc = fitz.open(file_path)
    document_id = generate_document_id(file_path)

    pages: List[Dict] = []

    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        text = page.get_text()

        pages.append({
            "page_number": page_index + 1,
            "text": text,
            "char_count": len(text)
        })

    return {
        "document_id": document_id,
        "source_type": "pdf",
        "source_name": file_path.split("/")[-1],
        "page_count": len(pages),
        "pages": pages
    }
