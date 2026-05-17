import React from 'react';
import { Sparkles, Zap, ShieldCheck, ArrowRight, FileText, Cpu, MessageSquare, CheckCircle2, TrendingUp, Lightbulb, Bot, Clock, LayoutGrid } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="h-screen bg-[#0a0a0a] text-gray-100 flex flex-col relative overflow-y-auto overflow-x-hidden selection:bg-indigo-500/30 scroll-smooth">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-blue-600/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-full h-[500px] bg-purple-600/10 rounded-full blur-[150px] translate-y-1/2 pointer-events-none"></div>
      
      {/* Header */}
      <div className="fixed top-3 md:top-6 left-0 right-0 z-50 flex justify-center px-3 md:px-4 pointer-events-none">
        <header className="pointer-events-auto flex items-center justify-between px-4 md:px-8 py-2.5 md:py-3 w-full max-w-5xl rounded-full backdrop-blur-xl bg-[#fff5ee]/10 border border-[#fff5ee]/20 shadow-[0_8px_32px_rgba(255,245,238,0.05)] text-[#fff5ee]">
          <div className="text-lg md:text-2xl font-light tracking-wide cursor-default flex items-center gap-1.5 md:gap-2">
            Progo <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-white transition-colors opacity-80 hover:opacity-100">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors opacity-80 hover:opacity-100">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors opacity-80 hover:opacity-100">Pricing</a>
          </nav>
          <button 
            onClick={onGetStarted}
            className="text-xs md:text-sm font-medium text-white px-4 md:px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10 shadow-sm"
          >
            Sign In
          </button>
        </header>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start w-full pt-24 md:pt-32 pb-16 md:pb-24">
        
        {/* --- Hero Section --- */}
        <section className="flex flex-col items-center justify-center max-w-5xl mx-auto px-4 md:px-6 text-center mb-20 md:mb-40 mt-4 md:mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-400 mb-6 md:mb-8 backdrop-blur-sm animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Future of AI-Powered Workflows</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1] animate-fade-in-up" style={{animationDelay: '100ms'}}>
            Extract Knowledge.<br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Accelerate Intelligence.</span>
          </h1>
          <p className="text-base md:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl leading-relaxed font-light animate-fade-in-up px-2" style={{animationDelay: '200ms'}}>
            Progo AI instantly processes your documents into a lightning-fast vector database. Ask complex questions, conduct mock interviews, and analyze code—all in one intelligent platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 animate-fade-in-up w-full sm:w-auto" style={{animationDelay: '300ms'}}>
            <button 
              onClick={onGetStarted}
              className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-white bg-indigo-600 rounded-full overflow-hidden transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.4)] w-full sm:w-auto"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#how-it-works" className="px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-gray-300 hover:text-white transition-colors">
              Learn More
            </a>
          </div>
        </section>

        {/* --- What & Why Section --- */}
        <section id="features" className="w-full max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-40">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Why Choose Progo AI?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-2">We combine the power of advanced Retrieval-Augmented Generation (RAG) with a suite of specialized AI modes designed for professionals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
            <div className="flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Format RAG Pipeline</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Seamlessly upload PDFs, DOCX, and JSON files. Our automated chunking pipeline extracts structure and meaning, bypassing the tedious manual processing of your unstructured data.
              </p>
            </div>
            
            <div className="flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Blazing Fast Vector DB</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Powered by Pinecone vector databases, Progo AI fetches the exact context needed for your query with sub-millisecond latency. No waiting, just instant, hyper-relevant retrieval.
              </p>
            </div>

            <div className="flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Intelligent Synthesis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Driven by OpenAI's latest flagship models, get highly accurate, context-aware answers complete with document citations, ensuring 100% verifiability and zero hallucinations.
              </p>
            </div>
          </div>
        </section>

        {/* --- How it Works Section --- */}
        <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-40">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">How Progo AI Works</h2>
              <p className="text-gray-400 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">We've simplified the complexities of artificial intelligence into three intuitive steps. From raw data to actionable insights in seconds.</p>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">1</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Extract & Vectorize</h4>
                    <p className="text-sm text-gray-500">Upload your documents. We instantly extract the text, create semantic embeddings, and store them securely in our vector database.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">2</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Select Your Mode</h4>
                    <p className="text-sm text-gray-500">Choose between Document Q&A, Mock Interviews (paste a JD), Interactive Quizzes, or DSA Code Analysis.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">3</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Chat & Synthesize</h4>
                    <p className="text-sm text-gray-500">Interact with the AI. It retrieves the most relevant context behind the scenes to generate perfect, tailored responses.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full h-[250px] md:h-[400px] bg-gradient-to-tr from-white/[0.05] to-white/[0.01] rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"></div>
              
              <div className="relative z-10 w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite] border-dashed"></div>
                <div className="absolute inset-4 border-2 border-transparent border-t-purple-500/50 rounded-full animate-[spin_4s_linear_infinite]"></div>
                <Bot className="w-16 h-16 text-indigo-400 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* --- Future Innovations & AI Influence --- */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-40 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl -z-10"></div>
          <div className="p-6 md:p-12 border border-white/5 rounded-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center">The AI Influence & Future Roadmap</h2>
            
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                  <TrendingUp className="text-emerald-400" />
                  Transforming Workflows
                </h3>
                <p className="text-gray-400 leading-relaxed mb-4 text-sm">
                  Artificial Intelligence is no longer just a novelty; it's a fundamental shift in how professionals process information. By leveraging context-aware LLMs, Progo AI reduces the time spent searching through documentation by up to 90%.
                </p>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Our Mock Interview and Code Analysis tools represent the next step in adaptive learning—providing personalized, immediate feedback that was previously only available through expensive human mentorship.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                  <Lightbulb className="text-amber-400" />
                  Coming Soon
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm"><strong className="text-gray-200">Voice Interfaces:</strong> Conduct mock interviews via live two-way voice chat.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm"><strong className="text-gray-200">Web Scraping Integration:</strong> Chat with any live website or Notion workspace instantly.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm"><strong className="text-gray-200">Advanced Agentic Workflows:</strong> AI agents that execute complex multi-step reasoning tasks on your data.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- Pricing Structure --- */}
        <section id="pricing" className="w-full max-w-5xl mx-auto px-4 md:px-6 mb-20 md:mb-32">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-gray-400 text-sm md:text-base">Start for free, upgrade when you need more power.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Hobby</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">/ forever</span>
                </div>
                <p className="text-gray-400 text-sm mt-4">Perfect for trying out the platform and exploring AI capabilities.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gray-500" /> 100 Messages per month</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gray-500" /> 3 Document uploads (Max 5MB each)</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gray-500" /> Standard GPT-4o-mini access</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gray-500" /> Community Support</li>
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors">
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/40 to-indigo-900/10 border border-indigo-500/30 relative flex flex-col">
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-indigo-500 text-xs font-bold rounded-full shadow-lg">
                MOST POPULAR
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-gray-500">/ month</span>
                </div>
                <p className="text-gray-400 text-sm mt-4">For professionals needing serious analytical power and unlimited context.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited Messages</li>
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited Document Uploads (Max 50MB)</li>
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Priority access to advanced models</li>
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Detailed Interview & Code Analytics</li>
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 md:py-8 border-t border-white/5 text-center text-gray-500 text-xs md:text-sm flex flex-col md:flex-row items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full gap-3 md:gap-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-gray-300">Progo AI</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Progo AI Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
