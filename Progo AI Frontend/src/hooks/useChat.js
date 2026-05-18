import { useState, useCallback } from 'react';
import client, { API_BASE_URL } from '../api/client';

export function useChat() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    try {
      const res = await client.get('/api/chat/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions', err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  const fetchSessionMessages = useCallback(async (sessionId) => {
    try {
      const res = await client.get(`/api/chat/sessions/${sessionId}`);
      setMessages(res.data.messages || []);
      setMode(res.data.mode || 'simple');
    } catch (err) {
      console.error('Error fetching session', err);
    }
  }, []);

  const selectSession = useCallback((sessionId) => {
    setCurrentSessionId(sessionId);
    if (sessionId) {
      fetchSessionMessages(sessionId);
    } else {
      setMessages([]);
    }
  }, [fetchSessionMessages]);

  const startNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    setMode('simple');
  }, []);

  /**
   * Send a message to a specific session by ID.
   * Use this when you have a known sessionId that may not yet be in React state
   * (e.g., right after an upload returns a new sessionId).
   */
  const sendMessageToSession = useCallback(async (text, targetSessionId) => {
    if (!text.trim() || isLoading) return;

    // Ensure we track this session going forward
    if (targetSessionId) {
      setCurrentSessionId(targetSessionId);
    }

    const userMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const effectiveSessionId = targetSessionId || currentSessionId;

    try {
      const payload = { message: text.trim(), mode };
      const url = effectiveSessionId
        ? `${API_BASE_URL}/api/chat/${effectiveSessionId}/message`
        : `${API_BASE_URL}/api/chat/message`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Network response was not ok');

      // Add empty assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsLoading(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
            const block = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 2);
            
            let event = 'message';
            let dataStr = '';
            
            const lines = block.split('\n');
            for (const line of lines) {
                if (line.startsWith('event:')) {
                    event = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                    dataStr = line.substring(5).trim();
                }
            }
            
            if (dataStr) {
                if (event === 'metadata') {
                    try {
                        const meta = JSON.parse(dataStr);
                        if (meta.sessionId) {
                            setCurrentSessionId(meta.sessionId);
                            fetchSessions();
                        }
                    } catch(e) {}
                } else if (event === 'message') {
                    try {
                        const data = JSON.parse(dataStr);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastIdx = newMessages.length - 1;
                            newMessages[lastIdx] = { 
                                ...newMessages[lastIdx], 
                                content: newMessages[lastIdx].content + data.content 
                            };
                            return newMessages;
                        });
                    } catch(e) {}
                }
            }
            boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (err) {
      console.error('Error sending message', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ Something went wrong. Please try again.' },
      ]);
      setIsLoading(false);
    }
  }, [currentSessionId, mode, isLoading, fetchSessions]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const payload = { message: text.trim(), mode };
      const url = currentSessionId 
        ? `${API_BASE_URL}/api/chat/${currentSessionId}/message`
        : `${API_BASE_URL}/api/chat/message`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Network response was not ok');

      // Add empty assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsLoading(false); // Disable loading spinner so typing indicator hides and text appears

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
            const block = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 2);
            
            let event = 'message';
            let dataStr = '';
            
            const lines = block.split('\n');
            for (const line of lines) {
                if (line.startsWith('event:')) {
                    event = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                    dataStr = line.substring(5).trim();
                }
            }
            
            if (dataStr) {
                if (event === 'metadata') {
                    try {
                        const meta = JSON.parse(dataStr);
                        if (!currentSessionId && meta.sessionId) {
                            setCurrentSessionId(meta.sessionId);
                            fetchSessions();
                        }
                    } catch(e) {}
                } else if (event === 'message') {
                    try {
                        const data = JSON.parse(dataStr);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastIdx = newMessages.length - 1;
                            newMessages[lastIdx] = { 
                                ...newMessages[lastIdx], 
                                content: newMessages[lastIdx].content + data.content 
                            };
                            return newMessages;
                        });
                    } catch(e) {}
                }
            }
            boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (err) {
      console.error('Error sending message', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ Something went wrong. Please try again.' },
      ]);
      setIsLoading(false);
    }
  }, [currentSessionId, mode, isLoading, fetchSessions]);

  /**
   * Send a setup context message (for Interview, Quiz, DSA modes)
   * Prefixes the message with [SETUP_CONTEXT] so the backend knows
   * to store it as the session's setup context.
   */
  const sendSetupMessage = useCallback(async (setupText) => {
    const prefixed = `[SETUP_CONTEXT] ${setupText}`;
    return sendMessage(prefixed);
  }, [sendMessage]);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await client.delete(`/api/chat/sessions/${sessionId}`);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session', err);
    }
  }, [currentSessionId]);

  const renameSession = useCallback(async (sessionId, newTitle) => {
    try {
      await client.put(`/api/chat/sessions/${sessionId}/title`, { title: newTitle });
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error('Error renaming session', err);
    }
  }, []);

  return {
    sessions,
    currentSessionId,
    messages,
    mode,
    isLoading,
    isSessionsLoading,
    setMode,
    fetchSessions,
    selectSession,
    startNewChat,
    sendMessage,
    sendMessageToSession,
    sendSetupMessage,
    deleteSession,
    renameSession,
  };
}
