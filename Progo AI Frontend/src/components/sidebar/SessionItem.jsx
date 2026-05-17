import { useState } from 'react';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';

export default function SessionItem({ session, isActive, onClick, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(session.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (showConfirmDelete) {
      onDelete(session.id);
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRename}
          autoFocus
          className="flex-1 bg-white/10 text-sm text-white px-2 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
        <button
          onClick={handleRename}
          className="p-1 text-green-400 hover:bg-green-400/10 rounded transition-colors"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => { setEditTitle(session.title); setIsEditing(false); }}
          className="p-1 text-gray-400 hover:bg-white/10 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowConfirmDelete(false); }}
      className={`group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg transition-all text-sm text-left ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      <MessageSquare size={15} className="shrink-0 opacity-60" />
      <span className="flex-1 truncate">{session.title || 'Untitled'}</span>

      {isHovered && (
        <div className="flex items-center gap-0.5 shrink-0 animate-fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Rename"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className={`p-1 rounded transition-colors ${
              showConfirmDelete
                ? 'text-red-400 bg-red-400/10'
                : 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
            }`}
            title={showConfirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </button>
  );
}
