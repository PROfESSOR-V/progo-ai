import { useState, useEffect, useCallback } from 'react';
import { PanelLeft } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useChat } from './hooks/useChat';
import { useFiles } from './hooks/useFiles';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';
import ChatInput from './components/chat/ChatInput';
import FileUploadPanel from './components/files/FileUploadPanel';
import ModeSelector from './components/common/ModeSelector';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingFiles, setPendingFiles] = useState([]);

  const {
    sessions,
    currentSessionId,
    messages,
    mode,
    isLoading,
    setMode,
    fetchSessions,
    selectSession,
    startNewChat,
    sendMessage,
    sendSetupMessage,
    deleteSession,
    renameSession,
  } = useChat();

  const {
    uploadedFiles,
    activeContext,
    isUploading,
    uploadProgress,
    fetchFiles,
    toggleContextFile,
    uploadFiles,
  } = useFiles();

  // Load sessions and files on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      fetchFiles();
    }
  }, [isAuthenticated, fetchSessions, fetchFiles]);

  const handleSend = useCallback(async (text) => {
    // If there are pending files, upload them first
    if (pendingFiles.length > 0) {
      try {
        await uploadFiles(pendingFiles, mode);
        setPendingFiles([]);
      } catch {
        // Upload failed — still send the message
      }
    }
    await sendMessage(text);
  }, [sendMessage, pendingFiles, uploadFiles, mode]);

  const handleSuggestionClick = useCallback((text) => {
    handleSend(text);
  }, [handleSend]);

  const handleFilesSelected = useCallback((files) => {
    setPendingFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemovePendingFile = useCallback((index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleNewChat = useCallback(() => {
    startNewChat();
    setPendingFiles([]);
  }, [startNewChat]);

  /**
   * Handle mode setup completion:
   * - For Q&A mode: upload files first, then start
   * - For Interview/Quiz/DSA: send the setup context as a prefixed message
   */
  const handleSetupComplete = useCallback(async (setupText) => {
    if (mode === 'qna') {
      // Q&A mode: upload pending files first
      if (pendingFiles.length > 0) {
        try {
          await uploadFiles(pendingFiles, mode);
          setPendingFiles([]);
          // After upload, send a starter message
          await sendMessage('I have uploaded my documents. Please summarize what you can see in the context and let me know you are ready for questions.');
        } catch {
          // Upload failed
        }
      }
    } else {
      // Interview, Quiz, DSA: send setup context
      await sendSetupMessage(setupText);
    }
  }, [mode, pendingFiles, uploadFiles, sendMessage, sendSetupMessage]);

  // Show auth screen if not logged in
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d] text-gray-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onNewChat={handleNewChat}
        onRename={renameSession}
        onDelete={deleteSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0 bg-[#0d0d0d]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <h2 className="text-sm font-medium text-gray-300">
              {currentSessionId
                ? sessions.find(s => s.id === currentSessionId)?.title || 'Chat'
                : 'New Chat'}
            </h2>
          </div>

          <ModeSelector
            mode={mode}
            onModeChange={setMode}
            disabled={currentSessionId !== null && messages.length > 0}
          />
        </header>

        {/* File panel — only show for Q&A mode or when files exist */}
        {(mode === 'qna' || uploadedFiles.length > 0) && messages.length > 0 && (
          <FileUploadPanel
            uploadedFiles={uploadedFiles}
            activeContext={activeContext}
            onToggleContext={toggleContextFile}
            onUpload={uploadFiles}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            mode={mode}
          />
        )}

        {/* Chat area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
          mode={mode}
          onSetupComplete={handleSetupComplete}
          onFilesSelected={handleFilesSelected}
          pendingFiles={pendingFiles}
          onRemovePendingFile={handleRemovePendingFile}
          isUploading={isUploading}
        />

        {/* Input area — only show when messages exist (setup done) or in simple mode */}
        {(messages.length > 0 || mode === 'simple') && (
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-8 pb-4 px-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSend={handleSend}
                onFilesSelected={handleFilesSelected}
                isLoading={isLoading}
                pendingFiles={pendingFiles}
                onRemovePendingFile={handleRemovePendingFile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
