import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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

  // Synchronous initialization strictly from verified stored session, never fake users
  const [authorityUser, setAuthorityUser] = useState(() => {
    const authSession = getStoredItem('labsetu_authority_session');
    if (authSession && authSession.role === 'authority') {
      const cleanName = (authSession.name && !authSession.name.includes('@')) ? authSession.name : 'Dr. Shozab Rizvi';
      return { ...authSession, name: cleanName };
    }
    return null;
  });

  const [patientUser, setPatientUser] = useState(() => {
    const patientSession = getStoredItem('labsetu_patient_session');
    if (patientSession && patientSession.role === 'citizen') {
      const cleanName = (patientSession.name && !patientSession.name.includes('@')) ? patientSession.name : 'Patient';
      const cleanUhid = (patientSession.uhid && patientSession.uhid !== 'Pending')
        ? patientSession.uhid
        : (patientSession.id ? `UHID-${patientSession.id.substring(0, 4)}-${new Date().getFullYear()}` : '');
      return { ...patientSession, name: cleanName, uhid: cleanUhid };
    }
    return null;
  });

  const [activeUHID, setActiveUHIDState] = useState(() => {
    try {
      const stored = localStorage.getItem('labsetu_active_uhid') || sessionStorage.getItem('labsetu_active_uhid');
      if (stored === 'Pending') {
        localStorage.removeItem('labsetu_active_uhid');
        sessionStorage.removeItem('labsetu_active_uhid');
        return null;
      }
      return stored || null;
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
          localStorage.removeItem('labsetu_token');
          sessionStorage.clear();
          return;
        }

        // Restore active token
        if (session.access_token) {
          apiClient.setToken(session.access_token);
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
          logger.auth('AuthContext database profile hydration warning', { error: dbErr?.message || dbErr });
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

        const userRole = sessionUser.user_metadata?.role || (profileRow?.role === 'admin' ? 'authority' : 'citizen');
        const rawResolvedName = profileRow?.display_name || profileRow?.full_name || patientRow?.full_name || sessionUser.user_metadata?.full_name;
        const resolvedName = (rawResolvedName && !rawResolvedName.includes('@')) ? rawResolvedName : (userRole === 'authority' ? 'Dr. Shozab Rizvi' : 'Patient');
        
        // Rigidly map UHID from database query response (profiles or patients table)
        const dbUhid = (profileRow?.uhid && profileRow.uhid !== 'Pending')
          ? profileRow.uhid
          : (patientRow?.patient_code && patientRow.patient_code !== 'Pending')
            ? patientRow.patient_code
            : null;
        const resolvedUhid = dbUhid || (userRole === 'citizen' && userId ? `UHID-${userId.substring(0, 4)}-${new Date().getFullYear()}` : '');

        const resolvedLabId = profileRow?.lab_id || 'LAB-1001';

        if (userRole === 'authority') {
          const updatedAuth = {
            id: userId,
            email: userEmail,
            role: 'authority',
            name: resolvedName,
            phone: profileRow?.phone || '',
            centerName: 'LabSetu Diagnostics',
            labId: resolvedLabId
          };
          if (isMounted) setAuthorityUser(updatedAuth);
          sessionStorage.setItem('labsetu_authority_session', JSON.stringify(updatedAuth));
          localStorage.setItem('labsetu_authority_session', JSON.stringify(updatedAuth));
          sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedAuth));
          localStorage.setItem('labsetu_auth', JSON.stringify(updatedAuth));
        } else {
          const rawGender = profileRow?.gender || (patientRow?.sex ? (patientRow.sex.charAt(0).toUpperCase() + patientRow.sex.slice(1)) : '');
          const rawAge = (profileRow?.age !== undefined && profileRow?.age !== null) ? profileRow.age : (patientRow?.age_years !== undefined && patientRow?.age_years !== null ? patientRow.age_years : undefined);
          const updatedPatient = {
            id: userId,
            email: userEmail,
            role: 'citizen',
            name: resolvedName,
            uhid: resolvedUhid,
            phone: profileRow?.phone || patientRow?.phone || '',
            address: profileRow?.address || patientRow?.address || '',
            bloodGroup: profileRow?.blood_group || patientRow?.blood_group || '',
            gender: rawGender,
            age: rawAge,
            emergencyContact: profileRow?.emergency_contact || patientRow?.emergency_contact || '',
            securityQuestion: profileRow?.security_question || profileRow?.security_question_1 || patientRow?.security_question || '',
            securityAnswer: profileRow?.security_answer || profileRow?.security_answer_1 || patientRow?.security_answer || ''
          };
          if (isMounted) setPatientUser(updatedPatient);
          sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedPatient));
          localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedPatient));
          sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedPatient));
          localStorage.setItem('labsetu_auth', JSON.stringify(updatedPatient));
        }
      } catch (e) {
        logger.auth('AuthContext session hydration error', { error: e?.message || e, stack: e?.stack });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateAuth();

    // Listen to real-time auth state changes and dynamically fetch profiles table
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        let profile = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (data) profile = data;
        } catch (err) {
          logger.auth('AuthContext onAuthStateChange profile fetch error', { error: err?.message || err });
        }

        const isAuthRole = session.user.user_metadata?.role === 'authority' || profile?.role === 'admin';

        const rawAuthName = profile?.display_name || profile?.full_name || session.user.user_metadata?.full_name;
        const cleanAuthName = (rawAuthName && !rawAuthName.includes('@')) ? rawAuthName : (isAuthRole ? 'Dr. Shozab Rizvi' : 'Patient');

        const dbUhid = (profile?.uhid && profile.uhid !== 'Pending') ? profile.uhid : null;
        const resolvedUhid = dbUhid || (isAuthRole ? undefined : (session.user?.id ? `UHID-${session.user.id.substring(0, 4)}-${new Date().getFullYear()}` : ''));

        const resolvedUser = {
          ...session.user,
          id: session.user.id,
          email: session.user.email,
          role: isAuthRole ? 'authority' : 'citizen',
          name: cleanAuthName,
          uhid: resolvedUhid,
          labId: profile?.lab_id || (isAuthRole ? 'LAB-1001' : undefined),
          centerName: 'LabSetu Diagnostics',
          phone: profile?.phone || '',
          address: profile?.address || '',
          bloodGroup: profile?.blood_group || '',
          gender: profile?.gender || '',
          age: profile?.age !== undefined && profile?.age !== null ? profile.age : undefined,
          emergencyContact: profile?.emergency_contact || '',
          securityQuestion: profile?.security_question || profile?.security_question_1 || '',
          securityAnswer: profile?.security_answer || profile?.security_answer_1 || ''
        };

        if (isAuthRole) {
          setAuthorityUser(prev => ({ ...(prev || {}), ...resolvedUser }));
          sessionStorage.setItem('labsetu_authority_session', JSON.stringify(resolvedUser));
          localStorage.setItem('labsetu_authority_session', JSON.stringify(resolvedUser));
        } else {
          setPatientUser(prev => ({ ...(prev || {}), ...resolvedUser }));
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
        localStorage.removeItem('labsetu_token');
        sessionStorage.clear();
      }
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

      if (res.session.access_token) {
        sessionStorage.setItem(tokenKey, res.session.access_token);
        localStorage.setItem(tokenKey, res.session.access_token);
        sessionStorage.setItem('labsetu_token', res.session.access_token);
        localStorage.setItem('labsetu_token', res.session.access_token);
        apiClient.setToken(res.session.access_token);
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
      logger.auth('AuthContext logout Supabase signOut error', { error: e?.message || e });
    }

    await authService.logout();
  };

  const currentEffectiveUHID = (activeUHID && activeUHID !== 'Pending')
    ? activeUHID
    : (patientUser?.uhid && patientUser.uhid !== 'Pending')
      ? patientUser.uhid
      : (currentUser?.uhid && currentUser.uhid !== 'Pending')
        ? currentUser.uhid
        : '';

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
