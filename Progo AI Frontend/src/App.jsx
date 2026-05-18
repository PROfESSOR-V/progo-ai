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
import ServerWakeupScreen from './components/common/ServerWakeupScreen';
import LandingPage from './components/common/LandingPage';
import { API_BASE_URL } from './api/client';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isServerAwake, setIsServerAwake] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Poll the backend health endpoint
  useEffect(() => {
    if (isServerAwake) return;
    let timeoutId;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (response.ok) {
          setIsServerAwake(true);
        } else {
          timeoutId = setTimeout(checkHealth, 3000);
        }
      } catch (err) {
        timeoutId = setTimeout(checkHealth, 3000);
      }
    };
    checkHealth();
    return () => clearTimeout(timeoutId);
  }, [isServerAwake]);

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
    sendMessageToSession,
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
    clearFiles,
  } = useFiles();

  // Load sessions on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  // Fetch session-specific files when the current session changes
  useEffect(() => {
    if (isAuthenticated && currentSessionId) {
      fetchFiles(currentSessionId);
    } else {
      clearFiles();
    }
  }, [isAuthenticated, currentSessionId, fetchFiles, clearFiles]);

  const handleSend = useCallback(async (text) => {
    // If there are pending files, upload them first
    if (pendingFiles.length > 0) {
      try {
        const result = await uploadFiles(pendingFiles, mode, currentSessionId);
        setPendingFiles([]);
        // If upload created a new session, send message to that session
        const uploadSessionId = result?.sessionId;
        if (uploadSessionId && !currentSessionId) {
          await sendMessageToSession(text, uploadSessionId);
          return;
        }
      } catch {
        // Upload failed — still send the message
      }
    }
    await sendMessage(text);
  }, [sendMessage, sendMessageToSession, pendingFiles, uploadFiles, mode, currentSessionId]);

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
    clearFiles();
  }, [startNewChat, clearFiles]);

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
          const result = await uploadFiles(pendingFiles, mode, currentSessionId);
          setPendingFiles([]);
          // Use the session ID from the upload response to ensure the chat
          // message goes to the SAME session that owns the uploaded files
          const uploadSessionId = result?.sessionId;
          if (uploadSessionId) {
            // Send the starter message to the exact session that has the files
            await sendMessageToSession(
              "I have uploaded my documents. Let's begin Q&A.",
              uploadSessionId
            );
          } else {
            // Fallback: send normally (shouldn't happen)
            await sendMessage("I have uploaded my documents. Let's begin Q&A.");
          }
        } catch {
          // Upload failed
        }
      }
    } else {
      // Interview, Quiz, DSA: send setup context
      await sendSetupMessage(setupText);
    }
  }, [mode, pendingFiles, uploadFiles, currentSessionId, sendMessage, sendMessageToSession, sendSetupMessage]);

  /**
   * Handle inline file upload from the FileUploadPanel (within an active session)
   */
  const handleInlineUpload = useCallback(async (files, uploadMode) => {
    return uploadFiles(files, uploadMode, currentSessionId);
  }, [uploadFiles, currentSessionId]);

  // Show wakeup screen if server is sleeping
  if (!isServerAwake) {
    return <ServerWakeupScreen />;
  }

  // Show landing page if not authenticated and haven't clicked "Get Started"
  if (!isAuthenticated && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  // Show auth screen if not logged in
  if (!isAuthenticated && !showLanding) {
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
        onSelectSession={(id) => {
          selectSession(id);
          // Auto-close sidebar on mobile
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onRename={renameSession}
        onDelete={deleteSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-white/5 shrink-0 bg-[#0d0d0d]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <h2 className="text-xs md:text-sm font-medium text-gray-300 truncate">
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
            onUpload={handleInlineUpload}
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
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-6 md:pt-8 pb-3 md:pb-4 px-3 md:px-4">
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
