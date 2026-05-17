import hashlib
import json
from typing import List, Dict
import fitz  # PyMuPDF
import pandas as pd
from docx import Document


def generate_document_id(file_path: str) -> str:
    """Generate stable document ID using file hash"""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()


def load_pdf(file_path: str) -> List[Dict]:
    doc = fitz.open(file_path)
    pages = []
    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        text = page.get_text()
        if text.strip():
            pages.append({
                "page_number": page_index + 1,
                "text": text,
                "char_count": len(text)
            })
    return pages

def load_docx(file_path: str) -> List[Dict]:
    doc = Document(file_path)
    pages = []
    # Treat each paragraph as a simulated "page" for chunking simplicity if it's long enough,
    # or chunk by groups of paragraphs. 
    # For simplicity, we can concatenate and treat as one page, or treat each paragraph as a 'page' unit.
    text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    pages.append({
        "page_number": 1,
        "text": text,
        "char_count": len(text)
    })
    return pages

def load_excel(file_path: str) -> List[Dict]:
    # Read all sheets
    xls = pd.ExcelFile(file_path)
    text_content = []
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        text_content.append(f"--- Sheet: {sheet_name} ---")
        # Convert df to string representation (e.g. CSV style or JSON style)
        text_content.append(df.to_string(index=False))
    
    text = "\n".join(text_content)
    return [{
        "page_number": 1,
        "text": text,
        "char_count": len(text)
    }]

def load_json(file_path: str) -> List[Dict]:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Format JSON nicely so LLM can understand it
    text = json.dumps(data, indent=2)
    return [{
        "page_number": 1,
        "text": text,
        "char_count": len(text)
    }]

def load_txt(file_path: str) -> List[Dict]:
    """Load plain text files (.txt)"""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    if not text.strip():
        return []
    return [{
        "page_number": 1,
        "text": text,
        "char_count": len(text)
    }]

def load_document(file_path: str) -> Dict:
    """
    Extract text from supported document types with uniform metadata.
    """
    document_id = generate_document_id(file_path)
    source_name = file_path.split("/")[-1]
    ext = source_name.split('.')[-1].lower()
    
    if ext == 'pdf':
        pages = load_pdf(file_path)
        source_type = 'pdf'
    elif ext in ['docx', 'doc']:
        pages = load_docx(file_path)
        source_type = 'docx'
    elif ext in ['xlsx', 'xls']:
        pages = load_excel(file_path)
        source_type = 'excel'
    elif ext == 'json':
        pages = load_json(file_path)
        source_type = 'json'
    elif ext == 'txt':
        pages = load_txt(file_path)
        source_type = 'txt'
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

    return {
        "document_id": document_id,
        "source_type": source_type,
        "source_name": source_name,
        "page_count": len(pages),
        "pages": pages
    }
