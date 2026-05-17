import { Sparkles, MessageSquare, BookOpen, BrainCircuit, GraduationCap } from 'lucide-react';

const suggestions = [
  { text: 'Explain how machine learning works', icon: BrainCircuit },
  { text: 'Write a Python function to sort a list', icon: MessageSquare },
  { text: 'Help me prepare for a technical interview', icon: GraduationCap },
  { text: 'Summarize the key concepts of REST APIs', icon: BookOpen },
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
        <Sparkles size={28} className="text-white" />
      </div>

      <h1 className="text-3xl font-bold mb-2 tracking-tight">
        How can I help you today?
      </h1>
      <p className="text-gray-500 max-w-md mb-10 text-sm leading-relaxed">
        You're in Simple mode — ask me anything freely.
        Switch modes above for Q&A, Interview, Quiz, or DSA analysis.
      </p>

      {/* Suggestion Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 text-left transition-all hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Icon size={18} className="text-gray-500 group-hover:text-indigo-400 transition-colors mt-0.5 shrink-0" />
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {suggestion.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
