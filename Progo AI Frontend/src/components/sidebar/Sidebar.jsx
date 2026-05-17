import { Plus, Sparkles, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatHistory from './ChatHistory';

export default function Sidebar({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onRename,
  onDelete,
}) {
  const { userId, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed md:relative z-50 md:z-auto h-full flex flex-col bg-[#141414] border-r border-white/5 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-[280px]' : 'w-0 md:w-0'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Progo AI</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-2 shrink-0">
          <button
            id="new-chat-btn"
            onClick={onNewChat}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-sm text-gray-300 hover:text-white transition-all group"
          >
            <Plus size={16} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          <ChatHistory
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={onSelectSession}
            onRename={onRename}
            onDelete={onDelete}
          />
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 text-xs font-bold text-white uppercase">
                {userId?.charAt(0) || 'U'}
              </div>
              <span className="text-sm text-gray-300 truncate">{userId || 'User'}</span>
            </div>
            <button
              id="logout-btn"
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
