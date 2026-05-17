import { useMemo } from 'react';
import SessionItem from './SessionItem';

function getDateCategory(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'Previous 7 Days';
  if (date >= monthAgo) return 'Previous 30 Days';
  return 'Older';
}

const categoryOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];

export default function ChatHistory({ sessions, currentSessionId, onSelectSession, onRename, onDelete }) {
  const groupedSessions = useMemo(() => {
    const groups = {};
    sessions.forEach(session => {
      const category = getDateCategory(session.createdAt);
      if (!groups[category]) groups[category] = [];
      groups[category].push(session);
    });
    return groups;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-gray-600">No conversations yet</p>
        <p className="text-xs text-gray-700 mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categoryOrder.map(category => {
        const group = groupedSessions[category];
        if (!group || group.length === 0) return null;

        return (
          <div key={category}>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1.5">
              {category}
            </div>
            <div className="space-y-0.5">
              {group.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => onSelectSession(session.id)}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
