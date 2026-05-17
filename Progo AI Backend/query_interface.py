#!/usr/bin/env python3
"""
Interactive RAG Query Interface
Combines Pinecone retrieval with OpenAI LLM to answer questions about API documentation
"""

import os
import sys
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI

# Load environment variables
load_dotenv()


class RAGQueryInterface:
    def __init__(self):
        """Initialize RAG Query Interface with Pinecone and OpenAI."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX", "ragtest")
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in .env file")
        if not self.pinecone_api_key:
            raise ValueError("PINECONE_API_KEY not found in .env file")
        
        # Initialize clients
        self.openai_client = OpenAI(api_key=self.api_key)
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = self.pc.Index(self.index_name)
        
        print("\n" + "="*60)
        print("✅ RAG Query Interface Initialized")
        print("="*60)
        print(f"📌 Pinecone Index: {self.index_name}")
        print(f"🤖 LLM Model: gpt-4o-mini")
        print("="*60)

    def retrieve_context(self, query: str, top_k: int = 3) -> dict:
        """
        Retrieve relevant chunks from Pinecone based on query.
        
        Args:
            query: User's question
            top_k: Number of top results to retrieve
            
        Returns:
            Dictionary with retrieved results
        """
        # Generate query embedding
        query_response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = query_response.data[0].embedding
        
        # Search in Pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        return results

    def generate_answer(self, query: str, context_results) -> str:
        """
        Generate answer using OpenAI LLM with retrieved context.
        
        Args:
            query: User's question
            context_results: Retrieved chunks from Pinecone
            
        Returns:
            LLM-generated answer
        """
        # Extract context text from results
        context_chunks = []
        for i, match in enumerate(context_results["matches"], 1):
            metadata = match.get("metadata", {})
            chunk_text = metadata.get("text", "")
            score = match["score"]
            
            if chunk_text:
                context_chunks.append(f"[Context {i} - Relevance: {score:.1%}]\n{chunk_text}\n")
        
        if not context_chunks:
            context_text = "No relevant documentation found."
        else:
            context_text = "\n".join(context_chunks)
        
        # Prepare prompt with context
        system_prompt = """You are a helpful assistant that answers questions about API documentation.
Use the retrieved context to provide accurate, detailed answers. 
- If the context contains the answer, provide it clearly citing the source
- If the context doesn't contain enough information, clearly state that
- Be specific and reference relevant parameters, endpoints, or methods
- Format code examples properly if relevant"""
        
        user_message = f"""Based on the API documentation sections retrieved below, please answer this question:

QUESTION: {query}

RELEVANT DOCUMENTATION:
{context_text}

Please provide a clear, detailed answer based on the documentation above. If specific information is not in the retrieved context, say so clearly."""
        
        # Call OpenAI API
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        return response.choices[0].message.content

    def query(self, question: str, top_k: int = 3) -> dict:
        """
        Process a user question and return LLM-generated answer with context.
        
        Args:
            question: User's question
            top_k: Number of context chunks to retrieve
            
        Returns:
            Dictionary with question, context, and answer
        """
        # Retrieve context
        context_results = self.retrieve_context(question, top_k)
        
        # Generate answer
        answer = self.generate_answer(question, context_results)
        
        return {
            "question": question,
            "context_matches": len(context_results["matches"]),
            "answer": answer,
            "retrieved_chunks": context_results["matches"]
        }

    def interactive_mode(self):
        """Run interactive query loop."""
        print("\n" + "="*60)
        print("🚀 Interactive RAG Query Mode")
        print("="*60)
        print("💡 Ask questions about the API documentation.")
        print("📝 Type 'exit' or 'quit' to end.\n")
        
        while True:
            try:
                # Get user input
                question = input("❓ Your Question: ").strip()
                
                if question.lower() in ['exit', 'quit', 'q']:
                    print("\n👋 Thank you for using RAG Query Interface!")
                    break
                
                if not question:
                    print("⚠️  Please enter a valid question.\n")
                    continue
                
                # Process query
                result = self.query(question, top_k=3)
                
                # Display results
                print("\n" + "="*60)
                print("📚 ANSWER")
                print("="*60)
                print(result["answer"])
                print("\n" + "="*60)
                print(f"📊 Relevant Context: {result['context_matches']} chunk(s) retrieved")
                print("="*60 + "\n")
                
            except KeyboardInterrupt:
                print("\n\n👋 Session ended by user.")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                traceback.print_exc()
                print()


def main():
    """Main entry point."""
    try:
        # Initialize interface
        interface = RAGQueryInterface()
        
        # Check if question provided as argument
        if len(sys.argv) > 1:
            question = " ".join(sys.argv[1:])
            print(f"\n❓ Question: {question}")
            result = interface.query(question, top_k=3)
            
            print("\n" + "="*60)
            print("📚 ANSWER")
            print("="*60)
            print(result["answer"])
            print("\n" + "="*60)
            print(f"📊 Relevant Context: {result['context_matches']} chunk(s) retrieved")
            print("="*60 + "\n")
        else:
            # Interactive mode
            interface.interactive_mode()
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
