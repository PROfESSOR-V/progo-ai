import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';

export default function ChatInput({
  onSend,
  onFilesSelected,
  isLoading,
  pendingFiles,
  onRemovePendingFile,
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Expose setInput for external use (suggestion clicks)
  ChatInput.setInputValue = (val) => setInput(val);

  return (
    <div className="w-full">
      {/* Pending files chips */}
      {pendingFiles && pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 animate-fade-in">
          {pendingFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg text-xs"
            >
              <FileText size={12} />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => onRemovePendingFile(i)}
                className="hover:text-red-400 transition-colors ml-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end bg-[#1a1a1a] rounded-2xl border border-white/10 focus-within:border-white/20 shadow-lg transition-colors"
      >
        {/* File attach */}
        <label className="p-3 pb-3.5 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors shrink-0">
          <Paperclip size={18} />
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Progo AI..."
          rows={1}
          className="flex-1 bg-transparent py-3.5 pr-2 outline-none text-white placeholder-gray-500 resize-none max-h-[200px] text-[15px] leading-relaxed"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 m-2 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <Send size={16} />
        </button>
      </form>

      <p className="text-center text-[11px] text-gray-600 mt-2">
        Progo AI can make mistakes. Consider verifying important information.
      </p>
    </div>
  );
}
