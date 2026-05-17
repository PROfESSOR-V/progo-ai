import { MessageSquare, FileText, UserCheck, HelpCircle, Code2 } from 'lucide-react';

const modes = [
  { value: 'simple', label: 'Simple', icon: MessageSquare, description: 'Free chat with AI, no context needed' },
  { value: 'qna', label: 'Q&A', icon: FileText, description: 'Upload documents, get answers from content only' },
  { value: 'interview', label: 'Interview', icon: UserCheck, description: 'Paste JD for mock interview practice' },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Get quizzed on any topic with scoring' },
  { value: 'dsa', label: 'DSA', icon: Code2, description: 'Paste code for complexity analysis & optimization' },
];

export default function ModeSelector({ mode, onModeChange, disabled }) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
      {modes.map(m => {
        const Icon = m.icon;
        const isActive = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title={m.description}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
