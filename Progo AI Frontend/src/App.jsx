import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Plus, Send, Menu, Settings, FileText, UploadCloud, X } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/chat';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt') || null);
  const [authMode, setAuthMode] = useState('login');
  const [authId, setAuthId] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('qna');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeContext, setActiveContext] = useState([]);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchSessions();
      fetchFiles();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (currentSessionId) {
      fetchSessionDetails(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error("Error fetching sessions", err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/upload/files`);
      const unique = [...new Set(res.data)];
      setUploadedFiles(unique);
      setActiveContext(unique);
    } catch (err) {
      console.error("Error fetching files", err);
    }
  };

  const toggleContextFile = (fileName) => {
    setActiveContext(prev =>
      prev.includes(fileName)
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const fetchSessionDetails = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/sessions/${id}`);
      setMessages(res.data.messages || []);
      setMode(res.data.mode || 'qna');
    } catch (err) {
      console.error("Error fetching session", err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleFileSelection = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== indexToRemove));
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('mode', mode);

    try {
      const res = await axios.post('http://localhost:8080/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message || 'Files processed and stored into Pinecone successfully!');
      setSelectedFiles([]);
      fetchFiles();
      fetchSessions();
      if (res.data.sessionId) {
        setCurrentSessionId(res.data.sessionId);
      }
    } catch (err) {
      console.error("Error uploading file", err);
      alert('Failed to process the documents.');
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    // Optimistic UI
    const tempMessages = [...messages, { role: 'user', content: userText }];
    setMessages(tempMessages);
    setIsLoading(true);

    try {
      const payload = {
        sessionId: currentSessionId,
        message: userText,
        mode: mode
      };
      
      const res = await axios.post(`${API_BASE}/${currentSessionId}/message`, payload);
      
      setMessages([...tempMessages, { role: 'assistant', content: res.data.reply }]);
      
      // Refresh sessions to get new session ID if it was null
      fetchSessions();
      
      // If we didn't have a session, we reload latest to select it
      // This is a bit naive, realistically the API should return the new sessionId
      // For now, if currentSessionId is null, we fetchSessions and pick the newest
      if (!currentSessionId) {
        const fetchRes = await axios.get(`${API_BASE}/sessions`);
        if (fetchRes.data.length > 0) {
          setCurrentSessionId(fetchRes.data[0].id);
        }
      }

    } catch (err) {
      console.error("Error sending message", err);
      setMessages([...tempMessages, { role: 'assistant', content: '❌ Error connecting to server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`http://localhost:8080${endpoint}`, { userId: authId, password: authPassword });
      const { token } = res.data;
      localStorage.setItem('jwt', token);
      setToken(token);
    } catch (err) {
      alert(err.response?.data || "Authentication failed");
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setToken(null);
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#212121] text-gray-100">
        <div className="bg-[#2f2f2f] p-8 rounded-xl shadow-xl w-[400px]">
          <h2 className="text-2xl font-bold mb-6 text-center">{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="User ID (min 5 chars)" className="w-full bg-[#212121] py-3 px-4 rounded text-white" />
            <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Password" className="w-full bg-[#212121] py-3 px-4 rounded text-white" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-medium">{authMode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-400">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setAuthMode(authMode==='login'?'register':'login')} className="text-blue-400 hover:underline">{authMode === 'login' ? 'Sign up' : 'Login'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-gray-100">
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} flex-shrink-0 transition-all duration-300 bg-[#171717] overflow-hidden flex flex-col`}>
        <div className="p-3">
          <button 
            onClick={handleNewChat}
            className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-[#202123] transition-colors border border-white/20 text-sm"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-xs text-gray-500 font-medium mb-3 px-2">Recent</div>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-md transition-colors text-sm text-left truncate ${
                currentSessionId === s.id ? 'bg-[#343541]' : 'hover:bg-[#202123]'
              }`}
            >
              <MessageSquare size={16} className="shrink-0 text-gray-400" />
              <span className="truncate">{s.title} ({s.mode})</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/10 shrink-0">
           <button onClick={logout} className="w-full p-2 text-sm text-red-400 hover:bg-white/5 rounded">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121] relative">
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-md text-gray-400"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 max-w-md overflow-x-auto scrollbar-hide py-1">
              {uploadedFiles.length > 0 ? (
                <>
                  <span className="font-semibold text-gray-300 shrink-0">Context:</span>
                  {uploadedFiles.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => toggleContextFile(f)}
                      className={`flex items-center gap-1 px-2 py-1 rounded shrink-0 transition-colors cursor-pointer ${activeContext.includes(f) ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-gray-500 line-through opacity-60'}`}
                    >
                      <FileText size={12}/>{f}
                    </button>
                  ))}
                </>
              ) : (
                <span className="text-gray-500">No context files loaded</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Settings size={16} className="text-gray-400"/>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              disabled={activeContext.length === 0 || (currentSessionId !== null && messages.length > 0)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="qna" className="bg-[#212121]">Q&A Mode</option>
              <option value="interview" className="bg-[#212121]">Interview Prep</option>
              <option value="quiz" className="bg-[#212121]">Quiz Practice</option>
              <option value="exam" className="bg-[#212121]">Exam Prep</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <UploadCloud size={32} className="text-blue-400" />
              </div>
              <h1 className="text-3xl font-semibold mb-2">Upload Context Document</h1>
              <p className="text-gray-400 max-w-md mb-8">
                To start a new AI session, please upload a document first. The AI will read it and provide tailored answers based on its contents.
              </p>
              
              <label 
                className={`flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-all font-medium ${isUploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-900/50 hover:-translate-y-1'}`}
              >
                <Plus size={20} /> Select Files
                <input type="file" multiple onChange={handleFileSelection} disabled={isUploading} className="hidden" />
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-6 w-full max-w-md bg-[#2f2f2f] rounded-xl p-4 shadow-xl border border-white/10 text-left">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Ready to Upload ({selectedFiles.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-4 scrollbar-hide">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-gray-400 bg-[#212121] px-3 py-2 rounded">
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <FileText size={14} className="shrink-0 text-blue-400" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => removeSelectedFile(i)}
                          disabled={isUploading}
                          className="p-1 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleBulkUpload}
                    disabled={isUploading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {isUploading ? <><UploadCloud size={16} className="animate-spin" /> Uploading & Processing...</> : <><UploadCloud size={16} /> Upload All & Start Session</>}
                  </button>
                </div>
              )}

              {uploadedFiles.length > 0 && selectedFiles.length === 0 && (
                 <p className="mt-6 text-sm text-gray-500">Context is globally loaded. Use the bar below to chat.</p>
              )}
            </div>
          ) : (
            <div className="pb-32">
              {messages.map((m, idx) => (
                <div key={idx} className={`w-full py-6 px-4 md:px-0 ${m.role === 'assistant' ? 'bg-[#2f2f2f]' : ''}`}>
                  <div className="max-w-3xl mx-auto flex gap-4 md:gap-6">
                    <div className="w-8 h-8 rounded-sm shrink-0 flex items-center justify-center text-sm font-bold mt-1">
                      {m.role === 'assistant' ? (
                        <div className="bg-green-600 text-white w-full h-full flex items-center justify-center rounded-sm">AI</div>
                      ) : (
                        <div className="bg-blue-600 text-white w-full h-full flex items-center justify-center rounded-sm">Me</div>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="w-full py-6 bg-[#2f2f2f]">
                  <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 px-4 md:px-0">
                    <div className="w-8 h-8 rounded-sm bg-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-1">AI</div>
                    <div className="flex items-center gap-1 mt-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={sendMessage} className="relative flex items-center bg-[#2f2f2f] rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.1)] focus-within:ring-1 focus-within:ring-white/20">
              <label 
                className={`absolute left-2 p-2 rounded-lg cursor-pointer transition-colors ${isUploading ? 'text-green-400 opacity-50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Select Documents"
              >
                <Plus size={20} className={isUploading ? 'animate-spin' : ''} />
                <input type="file" multiple onChange={handleFileSelection} disabled={isUploading} className="hidden" />
              </label>
              
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={activeContext.length === 0}
                placeholder={activeContext.length === 0 ? "Upload a document to start chatting..." : "Message Progo AI..."} 
                className="w-full bg-transparent py-4 pl-12 pr-12 outline-none text-white placeholder-gray-400 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim() || activeContext.length === 0}
                className="absolute right-2 p-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="text-center text-xs text-gray-500 mt-2">
              Progo AI RAG can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
