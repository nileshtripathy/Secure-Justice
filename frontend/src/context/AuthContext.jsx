import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load
  useEffect(() => {
    const restore = async () => {
      if (localStorage.getItem('token')) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  // Axios interceptor fires this when the server says the token is no longer valid
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const setSession = useCallback((data) => {
    const { token, ...profile } = data;
    localStorage.setItem('token', token);
    setUser(profile);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setSession(res.data);
  }, [setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, setSession, loading }),
    [user, login, logout, setSession, loading]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
