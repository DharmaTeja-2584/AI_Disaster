import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides auth state globally
 *
 * Exposes:
 *   user       — decoded user object (or null)
 *   token      — JWT string (or null)
 *   loading    — true while restoring session from localStorage
 *   login()    — authenticate and store session
 *   register() — create account and store session
 *   logout()   — clear session
 *   isAuthenticated — boolean
 */
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // ── Persist session ────────────────────────────────────────────────────────
  const persistSession = useCallback((userData, tokenData) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user',  JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const response = await loginUser({ email, password });
    const payload = response.data.data || response.data;
    const jwt = payload.token;
    const userData = payload.user;
    persistSession(userData, jwt);
    return userData;
  }, [persistSession]);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const response = await registerUser(formData);
    const payload = response.data.data || response.data;
    const jwt = payload.token;
    const userData = payload.user;
    persistSession(userData, jwt);
    return userData;
  }, [persistSession]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    role: user?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth hook
 * Usage: const { user, login, logout, isAuthenticated, role } = useAuth();
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
