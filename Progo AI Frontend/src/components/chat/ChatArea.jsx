import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import ModeSetupScreen from './ModeSetupScreen';
import { Sparkles } from 'lucide-react';

// Modes that require setup before chatting
const SETUP_MODES = ['qna', 'interview', 'quiz', 'dsa'];

export default function ChatArea({
  messages,
  isLoading,
  onSuggestionClick,
  mode,
  onSetupComplete,
  onFilesSelected,
  pendingFiles,
  onRemovePendingFile,
  isUploading,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // No messages yet — show mode-specific screen
  if (messages.length === 0 && !isLoading) {
    if (SETUP_MODES.includes(mode)) {
      return (
        <ModeSetupScreen
          mode={mode}
          onSetupComplete={onSetupComplete}
          onFilesSelected={onFilesSelected}
          pendingFiles={pendingFiles}
          onRemovePendingFile={onRemovePendingFile}
          isUploading={isUploading}
        />
      );
    }
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="pb-40">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} index={idx} />
        ))}

        {isLoading && (
          <div className="w-full py-5 px-4 md:px-0 bg-white/[0.02] animate-fade-in">
            <div className="max-w-3xl mx-auto flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="pt-2">
                <div className="text-xs font-medium text-gray-500 mb-2">Progo AI</div>
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
