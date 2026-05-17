import React, { useState, useEffect } from 'react';
import { Server, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function ServerWakeupScreen() {
  const [loadingText, setLoadingText] = useState('Initializing Progo AI Core...');
  const [progress, setProgress] = useState(0);

  // Cycle through some cool technical-sounding loading texts
  useEffect(() => {
    const texts = [
      'Waking up backend servers...',
      'Establishing secure connection...',
      'Loading AI models into memory...',
      'Synchronizing vector databases...',
      'Readying the neural engine...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fake progress bar that moves slowly
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        // Asymptotically approach 99%
        if (p < 99) {
          const increment = Math.max(0.5, (99 - p) * 0.05);
          return p + increment;
        }
        return p;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden z-50">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
        
        {/* Orbital Animation Container */}
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
          {/* Outer rotating ring (dashed) */}
          <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/30 animate-[spin_10s_linear_infinite]"></div>
          
          {/* Inner rotating ring */}
          <div className="absolute inset-4 rounded-full border border-purple-500/40 border-t-purple-400 animate-[spin_4s_linear_infinite]"></div>
          
          {/* Core glowing orb */}
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Server className="w-10 h-10 text-blue-400 animate-pulse" />
          </div>
          
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -ml-1.5 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          </div>
          <div className="absolute inset-2 animate-[spin_5s_linear_infinite_reverse]">
            <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
          </div>
        </div>

        {/* Brand & Status Text */}
        <h1 className="text-3xl font-light text-white mb-2 tracking-wide">
          Progo <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI</span>
        </h1>
        
        <p className="text-gray-400 text-sm h-6 mb-8 text-center animate-pulse tracking-wide">
          {loadingText}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-white/5 rounded-full h-1.5 mb-8 overflow-hidden backdrop-blur-sm border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        {/* Feature Highlights while waiting */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-xs text-gray-400">Intelligent</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Zap className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-xs text-gray-400">Fast RAG</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-green-400 mb-2" />
            <span className="text-xs text-gray-400">Secure</span>
          </div>
        </div>

      </div>
    </div>
  );
}
