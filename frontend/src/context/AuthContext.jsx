import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      // Ensure default users always exist (merge with any user-created accounts)
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
              // Ensure existing default users have up-to-date fields (name, centerName, etc.)
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

      const savedAuth = localStorage.getItem('labsetu_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
      } else {
        // Check legacy userEmail
        const legacyEmail = localStorage.getItem('userEmail');
        const legacyRole = localStorage.getItem('userRole') || 'authority';
        if (legacyEmail) {
          const authUser = {
            email: legacyEmail,
            name: legacyRole === 'authority' ? 'Shozab Rizvi' : 'Demo Patient',
            role: legacyRole,
            phone: '9876543210'
          };
          setCurrentUser(authUser);
          localStorage.setItem('labsetu_auth', JSON.stringify(authUser));
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
      localStorage.setItem('labsetu_auth', JSON.stringify(res.user));
      localStorage.setItem('userEmail', res.user.email);
      localStorage.setItem('userRole', res.user.role);
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
    localStorage.removeItem('labsetu_auth');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
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
