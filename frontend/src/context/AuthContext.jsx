import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import { supabase } from '../lib/supabase';

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
    let isMounted = true;
    const hydrateAuth = async () => {
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

        // Hydrate base sessions from storage
        let savedAuth = getStoredItem('labsetu_authority_session') || (getStoredItem('labsetu_auth')?.role === 'authority' ? getStoredItem('labsetu_auth') : null);
        if (savedAuth && isMounted) {
          setAuthorityUser(savedAuth);
        }

        let savedPatient = getStoredItem('labsetu_patient_session') || (getStoredItem('labsetu_auth')?.role === 'citizen' ? getStoredItem('labsetu_auth') : null);
        if (savedPatient && isMounted) {
          setPatientUser(savedPatient);
        }

        // Hydration Logic: Do not just rely on supabase.auth.getSession().
        // Also fetch the user's row from the profiles table to get their latest updated name & static UHID.
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData?.session;
          const targetUserId = session?.user?.id || savedPatient?.id || savedAuth?.id;
          const targetEmail = session?.user?.email || savedPatient?.email || savedAuth?.email;

          let profileRow = null;
          if (targetUserId) {
            const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle();
            if (data) profileRow = data;
          }
          if (!profileRow && targetEmail) {
            const { data } = await supabase.from('profiles').select('*').eq('email', targetEmail.toLowerCase()).maybeSingle();
            if (data) profileRow = data;
          }

          let patientRow = null;
          if (targetEmail) {
            const { data } = await supabase.from('patients').select('*').eq('email', targetEmail.toLowerCase()).maybeSingle();
            if (data) patientRow = data;
          }

          // Single Source of Truth: Database values override stale local state
          const dbName = profileRow?.display_name || profileRow?.full_name || patientRow?.full_name;
          const dbUhid = profileRow?.uhid || patientRow?.patient_code;

          // OAuth guard: Do not blindly overwrite custom display_name with Google account name on subsequent logins
          const oauthName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name;
          const resolvedName = dbName || oauthName;

          if (savedPatient || (session && (!savedAuth || session?.user?.user_metadata?.role === 'citizen'))) {
            const basePatient = savedPatient || {
              id: session?.user?.id || 'USR-002',
              email: session?.user?.email || 'patient@labsetu.com',
              role: 'citizen',
              phone: session?.user?.user_metadata?.phone || '9876501234'
            };
            const updatedPatient = {
              ...basePatient,
              id: profileRow?.id || patientRow?.id || basePatient.id,
              name: resolvedName || basePatient.name,
              uhid: dbUhid || basePatient.uhid
            };
            if (isMounted) setPatientUser(updatedPatient);
            sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedPatient));
            localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedPatient));
          }

          if (savedAuth || (session && session?.user?.user_metadata?.role === 'authority')) {
            const baseAuth = savedAuth || {
              id: session?.user?.id || 'USR-001',
              email: session?.user?.email || 'admin@labsetu.com',
              role: 'authority',
              phone: session?.user?.user_metadata?.phone || '9876543210'
            };
            const updatedAuth = {
              ...baseAuth,
              id: profileRow?.id || baseAuth.id,
              name: resolvedName || baseAuth.name
            };
            if (isMounted) setAuthorityUser(updatedAuth);
            sessionStorage.setItem('labsetu_authority_session', JSON.stringify(updatedAuth));
            localStorage.setItem('labsetu_authority_session', JSON.stringify(updatedAuth));
          }
        } catch (dbErr) {
          console.warn('[AuthContext] Database hydration warning:', dbErr);
        }
      } catch {
        // ignore parse errors
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateAuth();
    return () => { isMounted = false; };
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
      let user = res.user;

      // Single Source of Truth: Fetch user row from profiles/patients to ensure static UHID & updated name
      try {
        let profileRow = null;
        if (user.id) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (data) profileRow = data;
        }
        if (!profileRow && user.email) {
          const { data } = await supabase.from('profiles').select('*').eq('email', user.email.toLowerCase()).maybeSingle();
          if (data) profileRow = data;
        }

        let patientRow = null;
        if (user.email) {
          const { data } = await supabase.from('patients').select('*').eq('email', user.email.toLowerCase()).maybeSingle();
          if (data) patientRow = data;
        }

        const dbName = profileRow?.display_name || profileRow?.full_name || patientRow?.full_name;
        const dbUhid = profileRow?.uhid || patientRow?.patient_code;

        user = {
          ...user,
          id: profileRow?.id || patientRow?.id || user.id,
          name: dbName || user.name,
          uhid: dbUhid || user.uhid
        };
      } catch (err) {
        console.warn('[login] Supabase profile sync warning:', err);
      }

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

      return { ...res, user };
    }
    return res;
  };

  const updateCurrentUser = (updatedData) => {
    if (updatedData.role === 'authority') {
      setAuthorityUser(prev => ({ ...(prev || {}), ...updatedData }));
      sessionStorage.setItem('labsetu_authority_session', JSON.stringify(updatedData));
      localStorage.setItem('labsetu_authority_session', JSON.stringify(updatedData));
    } else {
      setPatientUser(prev => ({ ...(prev || {}), ...updatedData }));
      sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedData));
      localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedData));
    }
    sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedData));
    localStorage.setItem('labsetu_auth', JSON.stringify(updatedData));
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
      logout,
      updateCurrentUser
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
