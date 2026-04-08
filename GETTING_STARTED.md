# 🚀 Progo-AI RAG Project - Getting Started Guide

## Quick Start (3 Steps)

### **Step 1: Activate Virtual Environment**
```bash
cd "/media/professor/New Volume/progo-ai"
source venv/bin/activate
```

### **Step 2: Process Your PDF (One-time setup)**
```bash
./venv/bin/python3 main.py
```

You should see:
```
==================================================
🚀 RAG Pipeline with Pinecone
==================================================
✓ Connected to Pinecone index: ragtest

📄 Loading PDF: ...API Setup Guide.pdf
   ✓ Extracted 19 pages

📦 Generating chunks...
   ✓ Created 11 chunks

🔗 Generating embeddings...
   ✓ Generated 11 embeddings

📤 Storing embeddings in Pinecone...
   ✓ Uploaded 11/11

✅ RAG Pipeline Complete!
```

### **Step 3: Ask Questions!**

**Option A: Ask a single question directly**
```bash
./venv/bin/python3 query_interface.py "What is Order Push API?"
```

**Option B: Interactive mode (ask multiple questions)**
```bash
./venv/bin/python3 query_interface.py
```

Then type your questions:
```
❓ Your Question: What parameters does push-order need?
[Gets detailed answer from your API docs...]

❓ Your Question: How do I authenticate?
[Another answer...]

❓ Your Question: exit
👋 Thank you for using RAG Query Interface!
```

---

## 📝 Example Questions You Can Ask

### About Order Push API
```bash
./venv/bin/python3 query_interface.py "What is Order Push API?"
./venv/bin/python3 query_interface.py "What are the required parameters for push-order?"
./venv/bin/python3 query_interface.py "Show me an example request for push-order"
```

### About Authentication
```bash
./venv/bin/python3 query_interface.py "How do I authenticate with the API?"
./venv/bin/python3 query_interface.py "Where can I get my API keys?"
./venv/bin/python3 query_interface.py "What headers are required?"
```

### About Other APIs
```bash
./venv/bin/python3 query_interface.py "What APIs are available?"
./venv/bin/python3 query_interface.py "How do I get warehouse IDs?"
./venv/bin/python3 query_interface.py "What is the Info API endpoint?"
```

---

## 🔄 Full Project Flow

```
Your PDF (API Setup Guide.pdf)
          ↓
   main.py runs:
   - Loads PDF (19 pages)
   - Creates 11 smart chunks
   - Generates embeddings
   - Stores in Pinecone
          ↓
   query_interface.py:
   - Takes your question
   - Searches Pinecone for relevant chunks
   - Uses OpenAI LLM to answer
   - Returns formatted answer
```

---

## 📂 Project Structure

```
progo-ai/
├── main.py                    # Pipeline orchestrator
├── query_interface.py         # Interactive query system
├── pdf_loader.py              # PDF extraction
├── chunk_generator.py         # Text chunking
├── embedding_generator.py     # OpenAI embeddings
├── requirements.txt           # Dependencies
├── .env                       # API keys (DO NOT SHARE!)
├── data/
│   └── API Setup Guide.pdf    # Your documentation
└── venv/                      # Virtual environment
```

---

## 🛠️ Environment Setup Check

Before running, verify your `.env` file has these:

```bash
cat .env
```

Should show:
```
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
PINECONE_ENV=us-east-1
PINECONE_INDEX=ragtest
```

---

## ⚡ Common Commands

| Task | Command |
|------|---------|
| **Activate env** | `source venv/bin/activate` |
| **Process PDF** | `./venv/bin/python3 main.py` |
| **Ask a question** | `./venv/bin/python3 query_interface.py "Your question?"` |
| **Interactive mode** | `./venv/bin/python3 query_interface.py` |
| **Deactivate env** | `deactivate` |

---

## 🎯 What Happens When You Ask a Question

**Example: "What is Order Push API?"**

1. **Question Processing** → Converted to vector embedding
2. **Pinecone Search** → Finds 3 most relevant documentation chunks
3. **Context Extraction** → Retrieves the actual text from matched chunks
4. **LLM Processing** → OpenAI reads question + context together
5. **Answer Generation** → Creates detailed, formatted response
6. **Output** → Shows answer with relevance information

---

## 💡 Tips

✅ **First time?** Run `main.py` once to process the PDF
✅ **Multiple questions?** Use interactive mode (no arguments)
✅ **Quick answers?** Pass question as argument
✅ **Long questions?** Use quotes: `"What is...?"`
✅ **Special characters?** Quotes handle them: `'What\'s the status?'`

---

## 🆘 Troubleshooting

**Problem: "No module named 'dotenv'"**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Problem: "OPENAI_API_KEY not found"**
```bash
# Check .env exists and has the key
cat .env
```

**Problem: "Pinecone connection failed"**
```bash
# Verify Pinecone credentials in .env
# Check internet connection
# Verify index name is correct
```

**Problem: "Rate limit exceeded"**
```bash
# Wait a few seconds and try again
# OpenAI has rate limits for API calls
```

---

## 📊 System Status

- ✅ PDF Processing: Ready
- ✅ Embeddings: Generated (11 chunks)
- ✅ Pinecone: Connected
- ✅ OpenAI LLM: Connected
- ✅ Query Interface: Ready

**Everything is set up and ready to use!** 🎉
