import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

const DEFAULT_USERS = [
  {
    email: 'admin@labsetu.com',
    password: 'password123',
    name: 'Dr. Shozab Rizvi',
    role: 'authority',
    phone: '9876543210',
    centerName: 'LabSetu Diagnostics',
    labId: '61326885'
  },
  {
    email: 'patient@labsetu.com',
    password: 'password123',
    name: 'Shozab Rizvi',
    role: 'citizen',
    phone: '9876501234',
    uhid: 'UHID-2026-8901',
    age: 28,
    gender: 'Male',
    bloodGroup: 'B+'
  }
];

export function AuthProvider({ children }) {
  // Synchronous initialization prevents unauthenticated flicker or redirects during page refresh
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('labsetu_auth') || localStorage.getItem('labsetu_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Initialize and re-hydrate session on mount
  useEffect(() => {
    try {
      // Ensure default demo users always exist
      const storedRaw = localStorage.getItem('labsetu_users');
      if (!storedRaw) {
        localStorage.setItem('labsetu_users', JSON.stringify(DEFAULT_USERS));
      } else {
        try {
          const stored = JSON.parse(storedRaw);
          let merged = [...stored];
          for (const def of DEFAULT_USERS) {
            if (!merged.some(u => u.email.toLowerCase() === def.email.toLowerCase())) {
              merged.push(def);
            } else {
              merged = merged.map(u =>
                u.email.toLowerCase() === def.email.toLowerCase()
                  ? { ...u, ...def, password: u.password }
                  : u
              );
            }
          }
          localStorage.setItem('labsetu_users', JSON.stringify(merged));
        } catch {
          localStorage.setItem('labsetu_users', JSON.stringify(DEFAULT_USERS));
        }
      }

      // Restore active authentication token
      const savedToken = sessionStorage.getItem('labsetu_token') || localStorage.getItem('labsetu_token');
      if (savedToken) {
        apiClient.setToken(savedToken);
      }

      // Hydrate / verify authenticated session with repository backend
      const savedAuth = sessionStorage.getItem('labsetu_auth') || localStorage.getItem('labsetu_auth');
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          setCurrentUser(parsed);
          
          // Background re-fetch to ensure active session validity
          authService.getCurrentUser().then(res => {
            if (res.success && res.user) {
              setCurrentUser(res.user);
              sessionStorage.setItem('labsetu_auth', JSON.stringify(res.user));
              localStorage.setItem('labsetu_auth', JSON.stringify(res.user));
            }
          }).catch(() => {
            // Offline / fallback keeps existing persisted session intact
          });
        } catch {
          // Keep current state
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsers = () => {
    try {
      const stored = localStorage.getItem('labsetu_users');
      return stored ? JSON.parse(stored) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  };

  const login = async (identifier, password, role) => {
    const res = await authService.login(identifier, password, role);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      sessionStorage.setItem('labsetu_auth', JSON.stringify(res.user));
      localStorage.setItem('labsetu_auth', JSON.stringify(res.user));
      if (res.token) {
        sessionStorage.setItem('labsetu_token', res.token);
        localStorage.setItem('labsetu_token', res.token);
      }
    }
    return res;
  };

  const signup = async (userData) => {
    return await authService.register(userData);
  };

  const resetPassword = async (email, newPassword) => {
    return await authService.resetPassword(email, newPassword);
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    sessionStorage.removeItem('labsetu_auth');
    sessionStorage.removeItem('labsetu_token');
    localStorage.removeItem('labsetu_auth');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('labsetu_token');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      role: currentUser?.role || null,
      loading,
      login,
      signup,
      resetPassword,
      logout
    }}>
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
