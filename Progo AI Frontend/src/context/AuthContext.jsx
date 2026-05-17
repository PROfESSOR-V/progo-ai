import { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('jwt') || null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  const login = useCallback(async (userIdInput, password) => {
    const res = await client.post('/api/auth/login', { userId: userIdInput, password });
    const { token: jwt, userId: uid } = res.data;
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('userId', uid);
    setToken(jwt);
    setUserId(uid);
    return res.data;
  }, []);

  const register = useCallback(async (userIdInput, password) => {
    const res = await client.post('/api/auth/register', { userId: userIdInput, password });
    const { token: jwt, userId: uid } = res.data;
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('userId', uid);
    setToken(jwt);
    setUserId(uid);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, userId, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
