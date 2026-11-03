import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const getStoredItem = (key) => {
    try {
      const saved = sessionStorage.getItem(key) || localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const persistAccessToken = (token, role) => {
    if (!token) return;
    const tokenKey = role === 'authority' ? 'labsetu_authority_token' : 'labsetu_patient_token';
    sessionStorage.setItem(tokenKey, token);
    localStorage.setItem(tokenKey, token);
    apiClient.setToken(token);
  };
  const clearAccessTokens = () => {
    for (const key of ['labsetu_authority_token', 'labsetu_patient_token', 'labsetu_token']) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
    apiClient.setToken(null);
  };

  // Synchronous initialization strictly from verified stored session, never fake users
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

  const [activeUHID, setActiveUHIDState] = useState(() => {
    try {
      return localStorage.getItem('labsetu_active_uhid') || sessionStorage.getItem('labsetu_active_uhid') || null;
    } catch {
      return null;
    }
  });

  const [activeMember, setActiveMember] = useState(() => {
    try {
      const saved = localStorage.getItem('labsetu_active_member') || sessionStorage.getItem('labsetu_active_member');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setActiveUHID = (uhid) => {
    setActiveUHIDState(uhid);
    try {
      if (uhid) {
        localStorage.setItem('labsetu_active_uhid', uhid);
        sessionStorage.setItem('labsetu_active_uhid', uhid);
      } else {
        localStorage.removeItem('labsetu_active_uhid');
        sessionStorage.removeItem('labsetu_active_uhid');
      }
    } catch {}
  };

  const switchActiveProfile = (member) => {
    if (!member) return;
    const uhid = member.uhid || member.patient_code;
    setActiveUHIDState(uhid);
    setActiveMember(member);
    try {
      if (uhid) {
        localStorage.setItem('labsetu_active_uhid', uhid);
        sessionStorage.setItem('labsetu_active_uhid', uhid);
      }
      localStorage.setItem('labsetu_active_member', JSON.stringify(member));
      sessionStorage.setItem('labsetu_active_member', JSON.stringify(member));
    } catch {}
  };

  const [loading, setLoading] = useState(true);

  // Initialize and re-hydrate session strictly from Supabase Database Auth on mount
  useEffect(() => {
    let isMounted = true;
    const hydrateAuth = async () => {
      try {
        // Query active Supabase Auth session directly from the client
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        const session = sessionData?.session;
        const sessionUser = session?.user;

        if (sessionErr || !session || !sessionUser) {
          // No active Supabase session: purge any stale local state immediately
          if (isMounted) {
            setAuthorityUser(null);
            setPatientUser(null);
          }
          localStorage.removeItem('labsetu_authority_session');
          localStorage.removeItem('labsetu_patient_session');
          localStorage.removeItem('labsetu_auth');
          clearAccessTokens();
          sessionStorage.clear();
          return;
        }

        const userId = sessionUser.id;
        const userEmail = sessionUser.email;

        // Query profiles table strictly by authenticated user ID
        let profileRow = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (data) profileRow = data;
        } catch (dbErr) {
          console.warn('[AuthContext] Database hydration warning:', dbErr);
        }

        let patientRow = null;
        try {
          const { data } = await supabase
            .from('patients')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (data) patientRow = data;
        } catch {}

        const userRole = ['authority', 'admin', 'staff'].includes(sessionUser.app_metadata?.role) ? 'authority' : 'citizen';
        const resolvedName = profileRow?.display_name || profileRow?.full_name || patientRow?.full_name || sessionUser.user_metadata?.full_name || 'Patient';
        const resolvedUhid = profileRow?.uhid || patientRow?.patient_code || 'Pending';
        persistAccessToken(session.access_token, userRole);

        if (userRole === 'authority') {
          const updatedAuth = {
            id: userId,
            email: userEmail,
            role: 'authority',
            name: resolvedName || 'Dr. Shozab Rizvi',
            phone: profileRow?.phone || '',
            centerName: 'LabSetu Diagnostics',
            labId: '61326885'
          };
          if (isMounted) { setPatientUser(null); setAuthorityUser(updatedAuth); }
          sessionStorage.removeItem('labsetu_patient_session'); localStorage.removeItem('labsetu_patient_session');
          sessionStorage.setItem('labsetu_authority_session', JSON.stringify(updatedAuth));
          localStorage.setItem('labsetu_authority_session', JSON.stringify(updatedAuth));
          sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedAuth));
          localStorage.setItem('labsetu_auth', JSON.stringify(updatedAuth));
        } else {
          const updatedPatient = {
            id: userId,
            email: userEmail,
            role: 'citizen',
            name: resolvedName,
            uhid: resolvedUhid,
            phone: profileRow?.phone || patientRow?.phone || '',
            address: patientRow?.address || '',
            bloodGroup: patientRow?.blood_group || '',
            gender: patientRow?.sex ? (patientRow.sex.charAt(0).toUpperCase() + patientRow.sex.slice(1)) : '',
            age: patientRow?.age_years !== undefined && patientRow?.age_years !== null ? patientRow.age_years : undefined,
            emergencyContact: patientRow?.emergency_contact || ''
          };
          if (isMounted) { setAuthorityUser(null); setPatientUser(updatedPatient); }
          sessionStorage.removeItem('labsetu_authority_session'); localStorage.removeItem('labsetu_authority_session');
          sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedPatient));
          localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedPatient));
          sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedPatient));
          localStorage.setItem('labsetu_auth', JSON.stringify(updatedPatient));
        }
      } catch (e) {
        console.warn('[AuthContext] Session hydration error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateAuth();

    // Listen to real-time auth state changes and dynamically fetch profiles table
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase invokes this callback while holding its auth lock. Defer profile
      // queries until after the callback returns to avoid deadlocking refreshes.
      queueMicrotask(async () => {
        if (!isMounted) return;
        if (session?.user) {
          let profile = null;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, uhid, role')
              .eq('id', session.user.id)
              .maybeSingle();
            if (data) profile = data;
          } catch (err) {
            console.warn('[AuthContext] onAuthStateChange profile fetch error:', err);
          }

          const isAuthRole = ['authority', 'admin', 'staff'].includes(session.user.app_metadata?.role);
          persistAccessToken(session.access_token, isAuthRole ? 'authority' : 'citizen');

          const resolvedUser = {
            ...session.user,
            id: session.user.id,
            email: session.user.email,
            role: isAuthRole ? 'authority' : 'citizen',
            name: profile?.full_name || session.user.user_metadata?.full_name || (isAuthRole ? 'Dr. Shozab Rizvi' : 'Patient'),
            uhid: profile?.uhid || (isAuthRole ? undefined : 'Pending'),
          };

          if (isAuthRole) {
            setPatientUser(null);
            setAuthorityUser(resolvedUser);
            sessionStorage.removeItem('labsetu_patient_session'); localStorage.removeItem('labsetu_patient_session');
            sessionStorage.setItem('labsetu_authority_session', JSON.stringify(resolvedUser));
            localStorage.setItem('labsetu_authority_session', JSON.stringify(resolvedUser));
          } else {
            setAuthorityUser(null);
            setPatientUser(resolvedUser);
            sessionStorage.removeItem('labsetu_authority_session'); localStorage.removeItem('labsetu_authority_session');
            sessionStorage.setItem('labsetu_patient_session', JSON.stringify(resolvedUser));
            localStorage.setItem('labsetu_patient_session', JSON.stringify(resolvedUser));
          }
          sessionStorage.setItem('labsetu_auth', JSON.stringify(resolvedUser));
          localStorage.setItem('labsetu_auth', JSON.stringify(resolvedUser));
        } else if (event === 'SIGNED_OUT') {
          setPatientUser(null);
          setAuthorityUser(null);
          localStorage.removeItem('labsetu_patient_session');
          localStorage.removeItem('labsetu_authority_session');
          localStorage.removeItem('labsetu_auth');
          localStorage.removeItem('labsetu_family_members');
          clearAccessTokens();
          sessionStorage.clear();
        }
      });
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
    if (res.success && res.user && res.session) {
      const user = res.user;
      const sessionKey = user.role === 'authority' ? 'labsetu_authority_session' : 'labsetu_patient_session';

      if (user.role === 'authority') {
        setAuthorityUser(user);
      } else {
        setPatientUser(user);
      }

      sessionStorage.setItem(sessionKey, JSON.stringify(user));
      localStorage.setItem(sessionKey, JSON.stringify(user));
      sessionStorage.setItem('labsetu_auth', JSON.stringify(user));
      localStorage.setItem('labsetu_auth', JSON.stringify(user));

      if (res.session.access_token) {
        persistAccessToken(res.session.access_token, user.role);
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

    // Critical: Explicitly clear cache before calling supabase.auth.signOut()
    localStorage.removeItem('labsetu_patient_session');
    localStorage.removeItem('labsetu_authority_session');
    localStorage.removeItem('labsetu_auth');
    localStorage.removeItem('labsetu_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('labsetu_active_uhid');
    localStorage.removeItem('labsetu_active_member');
    localStorage.removeItem('labsetu_family_members');
    sessionStorage.clear();
    setActiveUHIDState(null);
    setActiveMember(null);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[logout] Supabase signOut error:', e);
    }

    await authService.logout();
  };

  const currentEffectiveUHID = activeUHID || patientUser?.uhid || currentUser?.uhid || '';

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser: updateCurrentUser,
      authorityUser,
      patientUser,
      isAuthenticated: !!currentUser,
      role: currentUser?.role || null,
      loading,
      login,
      signup,
      resetPassword,
      logout,
      updateCurrentUser,
      activeUHID: currentEffectiveUHID,
      rawActiveUHID: activeUHID,
      setActiveUHID,
      activeMember,
      switchActiveProfile
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
