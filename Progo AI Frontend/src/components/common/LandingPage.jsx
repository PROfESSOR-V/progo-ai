import React from 'react';
import { Sparkles, Zap, ShieldCheck, ArrowRight, FileText, Cpu, MessageSquare } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl w-full mx-auto">
        <div className="text-2xl font-light tracking-wide">
          Progo <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI</span>
        </div>
        <button 
          onClick={onGetStarted}
          className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl w-full mx-auto px-6 py-12 md:py-24">
        
        {/* Hero Section */}
        <div className="text-center mb-24 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Contextual AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Your Documents. <br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Perfectly Understood.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-light">
            Progo AI instantly processes your PDFs, Word documents, and spreadsheets into a lightning-fast vector database, allowing you to ask complex questions and get precise, cited answers in seconds.
          </p>
          <button 
            onClick={onGetStarted}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-white/10 border border-white/20 rounded-full overflow-hidden transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span>Start Chatting</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature Grid (Why & How) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card 1 */}
          <div className="flex flex-col p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Multi-Format Ready</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upload PDFs, Word docs, Excel files, and JSON. Our advanced chunking pipeline structures your unstructured data automatically.
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="flex flex-col p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Blazing Fast Vector RAG</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Powered by Pinecone vector databases, Progo AI fetches the exact context needed for your query with sub-millisecond latency.
            </p>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Intelligent Synthesis</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Driven by OpenAI's latest models, get highly accurate, context-aware answers complete with document citations and sources.
            </p>
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-gray-500 text-xs font-light">
        &copy; {new Date().getFullYear()} Progo AI. All rights reserved.
      </footer>
    </div>
  );
}
