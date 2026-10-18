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
  const getStoredItem = (key) => {
    try {
      const saved = sessionStorage.getItem(key) || localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  // Synchronous initialization with isolated sessions to prevent cross-portal tab bleeding
  const [authorityUser, setAuthorityUser] = useState(() => {
    const authSession = getStoredItem('labsetu_authority_session');
    if (authSession && authSession.role === 'authority') return authSession;
    const legacy = getStoredItem('labsetu_auth');
    if (legacy && legacy.role === 'authority') return legacy;
    return null;
  });

  const [patientUser, setPatientUser] = useState(() => {
    const patientSession = getStoredItem('labsetu_patient_session');
    if (patientSession && patientSession.role === 'citizen') return patientSession;
    const legacy = getStoredItem('labsetu_auth');
    if (legacy && legacy.role === 'citizen') return legacy;
    return null;
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
      const authRole = typeof window !== 'undefined' && window.location.pathname.startsWith('/portal') ? 'patient' : 'authority';
      const scopedToken = sessionStorage.getItem(`labsetu_${authRole}_token`) || localStorage.getItem(`labsetu_${authRole}_token`);
      const fallbackToken = sessionStorage.getItem('labsetu_token') || localStorage.getItem('labsetu_token');
      if (scopedToken || fallbackToken) {
        apiClient.setToken(scopedToken || fallbackToken);
      }

      // Hydrate authority session
      const savedAuth = getStoredItem('labsetu_authority_session') || (getStoredItem('labsetu_auth')?.role === 'authority' ? getStoredItem('labsetu_auth') : null);
      if (savedAuth) {
        setAuthorityUser(savedAuth);
      }

      // Hydrate patient session
      const savedPatient = getStoredItem('labsetu_patient_session') || (getStoredItem('labsetu_auth')?.role === 'citizen' ? getStoredItem('labsetu_auth') : null);
      if (savedPatient) {
        setPatientUser(savedPatient);
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

  // Determine active currentUser based on route / portal context
  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/portal')) return patientUser;
      if (path.startsWith('/app')) return authorityUser;
    }
    return authorityUser || patientUser || null;
  };

  const currentUser = getCurrentUser();

  const login = async (identifier, password, role) => {
    const res = await authService.login(identifier, password, role);
    if (res.success && res.user) {
      const user = res.user;
      const sessionKey = user.role === 'authority' ? 'labsetu_authority_session' : 'labsetu_patient_session';
      const tokenKey = user.role === 'authority' ? 'labsetu_authority_token' : 'labsetu_patient_token';

      if (user.role === 'authority') {
        setAuthorityUser(user);
      } else {
        setPatientUser(user);
      }

      sessionStorage.setItem(sessionKey, JSON.stringify(user));
      localStorage.setItem(sessionKey, JSON.stringify(user));
      sessionStorage.setItem('labsetu_auth', JSON.stringify(user));
      localStorage.setItem('labsetu_auth', JSON.stringify(user));

      if (res.token) {
        sessionStorage.setItem(tokenKey, res.token);
        localStorage.setItem(tokenKey, res.token);
        sessionStorage.setItem('labsetu_token', res.token);
        localStorage.setItem('labsetu_token', res.token);
        apiClient.setToken(res.token);
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

  const logout = async (roleToLogout) => {
    let target = roleToLogout;
    if (!target && typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/portal')) target = 'citizen';
      else if (window.location.pathname.startsWith('/app')) target = 'authority';
    }

    if (target === 'authority' || !target) {
      setAuthorityUser(null);
      sessionStorage.removeItem('labsetu_authority_session');
      localStorage.removeItem('labsetu_authority_session');
      sessionStorage.removeItem('labsetu_authority_token');
      localStorage.removeItem('labsetu_authority_token');
    }
    if (target === 'citizen' || !target) {
      setPatientUser(null);
      sessionStorage.removeItem('labsetu_patient_session');
      localStorage.removeItem('labsetu_patient_session');
      sessionStorage.removeItem('labsetu_patient_token');
      localStorage.removeItem('labsetu_patient_token');
    }

    sessionStorage.removeItem('labsetu_auth');
    sessionStorage.removeItem('labsetu_token');
    localStorage.removeItem('labsetu_auth');
    localStorage.removeItem('labsetu_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');

    await authService.logout();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      authorityUser,
      patientUser,
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
