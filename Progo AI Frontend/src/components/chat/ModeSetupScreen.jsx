import { useState, useRef } from 'react';
import {
  FileText, Upload, UserCheck, HelpCircle, Code2,
  ArrowRight, Sparkles, X
} from 'lucide-react';

const modeConfig = {
  qna: {
    icon: FileText,
    title: 'Document Q&A',
    subtitle: 'Upload your PDF or JSON files to get answers strictly from document content',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-500/20',
    type: 'file', // requires file upload
    placeholder: '',
    buttonText: 'Extract & Start Session',
  },
  interview: {
    icon: UserCheck,
    title: 'Mock Interview',
    subtitle: 'Paste the full Job Description below. The AI will conduct a structured mock interview with scoring.',
    gradient: 'from-emerald-500 to-teal-500',
    shadowColor: 'shadow-emerald-500/20',
    type: 'text',
    placeholder: 'Paste the complete Job Description here...\n\nExample:\nJob Title: Senior Backend Engineer\nCompany: TechCorp\nRequirements:\n- 5+ years experience with Java/Spring Boot\n- Strong knowledge of microservices architecture\n- Experience with AWS, Docker, Kubernetes\n...',
    buttonText: 'Start Interview',
  },
  quiz: {
    icon: HelpCircle,
    title: 'Quiz Mode',
    subtitle: 'Describe what you want to be quizzed on. The AI will generate MCQs, track your score, and adapt difficulty.',
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/20',
    type: 'text',
    placeholder: 'Describe the quiz topic and scope...\n\nExamples:\n• "Data Structures and Algorithms - focus on trees and graphs"\n• "React.js fundamentals including hooks and state management"\n• "Operating Systems concepts - processes, threads, memory"',
    buttonText: 'Start Quiz',
  },
  dsa: {
    icon: Code2,
    title: 'DSA Code Analysis',
    subtitle: 'Paste your code below. The AI will analyze complexity, identify issues, and suggest optimized approaches.',
    gradient: 'from-purple-500 to-pink-500',
    shadowColor: 'shadow-purple-500/20',
    type: 'code',
    placeholder: '// Paste your code here\n\nfunction example(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] + arr[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}',
    buttonText: 'Analyze Code',
  },
};

const languages = [
  'JavaScript', 'Python', 'Java', 'C++', 'C', 'TypeScript',
  'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'
];

export default function ModeSetupScreen({ mode, onSetupComplete, onFilesSelected, pendingFiles, onRemovePendingFile, isUploading }) {
  const [textInput, setTextInput] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const fileInputRef = useRef(null);
  const config = modeConfig[mode];

  if (!config) return null;

  const Icon = config.icon;

  const handleSubmit = () => {
    if (config.type === 'file') {
      // For Q&A, App.jsx handles the actual upload, but we need to signal it to start
      onSetupComplete('');
      return;
    }
    if (!textInput.trim()) return;

    let setupText = textInput.trim();
    if (config.type === 'code') {
      setupText = `[Language: ${language}]\n\n${setupText}`;
    }
    onSetupComplete(setupText);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-3 md:px-4 animate-fade-in overflow-y-auto py-6 md:py-10">
      {/* Mode Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 shadow-xl ${config.shadowColor}`}>
        <Icon size={28} className="text-white" />
      </div>

      <h1 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">{config.title}</h1>
      <p className="text-gray-500 max-w-lg mb-6 md:mb-8 text-xs md:text-sm leading-relaxed text-center px-2">
        {config.subtitle}
      </p>

      {/* Setup Form */}
      <div className="w-full max-w-2xl px-1">
        {config.type === 'file' ? (
          /* File Upload UI for Q&A */
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all ${
                isUploading
                  ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                  : 'border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 cursor-pointer'
              }`}
            >
              <Upload size={32} className="text-gray-400" />
              <span className="text-sm text-gray-400">
                Click to select PDF, JSON, or text files
              </span>
              <span className="text-xs text-gray-600">
                Supports: .pdf, .json, .txt, .doc, .docx
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.json,.txt,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Pending files */}
            {pendingFiles && pendingFiles.length > 0 && (
              <div className="space-y-2">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/5 px-4 py-2.5 rounded-xl text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <FileText size={14} className="text-indigo-400" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-gray-600">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button onClick={() => onRemovePendingFile(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Text/Code Input */
          <div className="space-y-3">
            {config.type === 'code' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 text-sm text-gray-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  {languages.map(l => (
                    <option key={l} value={l} className="bg-[#1a1a1a]">{l}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              rows={config.type === 'code' ? 12 : 8}
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30 resize-none transition-all text-sm leading-relaxed ${
                config.type === 'code' ? 'font-mono' : ''
              }`}
            />

            <p className="text-[11px] text-gray-600 text-right">
              Press Ctrl+Enter to submit
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={
            config.type === 'file'
              ? (!pendingFiles || pendingFiles.length === 0 || isUploading)
              : !textInput.trim()
          }
          className={`w-full mt-4 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed group bg-gradient-to-r ${config.gradient} hover:opacity-90 shadow-lg ${config.shadowColor}`}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Vectorizing...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {config.buttonText}
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
