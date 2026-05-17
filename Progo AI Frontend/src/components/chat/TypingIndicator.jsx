export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <div
        className="w-2 h-2 bg-gray-400 rounded-full"
        style={{ animation: 'bounce-dot 1.4s infinite ease-in-out both' }}
      />
      <div
        className="w-2 h-2 bg-gray-400 rounded-full"
        style={{ animation: 'bounce-dot 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}
      />
      <div
        className="w-2 h-2 bg-gray-400 rounded-full"
        style={{ animation: 'bounce-dot 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}
      />
    </div>
  );
}
