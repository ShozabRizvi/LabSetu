import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

/**
 * Route protection acting as an absolute firewall:
 * Access to protected routes is mathematically locked behind a verified Supabase session.
 * On every route change, supabase.auth.getSession() is queried.
 * If the session is null, the user is instantly redirected to /login. No exceptions.
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { authorityUser, patientUser, currentUser, loading: authContextLoading } = useAuth();
  const location = useLocation();

  const [verifyingSession, setVerifyingSession] = useState(true);
  const [supabaseSession, setSupabaseSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSessionFirewall() {
      try {
        setVerifyingSession(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error || !session || !session.user) {
          setSupabaseSession(null);
        } else {
          setSupabaseSession(session);
        }
      } catch (err) {
        if (isMounted) setSupabaseSession(null);
      } finally {
        if (isMounted) setVerifyingSession(false);
      }
    }

    checkSessionFirewall();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (authContextLoading || verifyingSession) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'inherit',
        color: '#15803d',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #dcfce7',
            borderTop: '4px solid #15803d',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', fontWeight: '500' }}>Verifying security session...</p>
        </div>
      </div>
    );
  }

  const defaultRole = allowedRoles?.includes('citizen') ? 'citizen' : 'authority';

  // Absolute Firewall: Mathematically locked behind a verified Supabase session object
  if (!supabaseSession || !supabaseSession.user) {
    return <Navigate to={`/login?role=${defaultRole}`} state={{ from: location, defaultRole }} replace />;
  }

  // Determine the active user for the role boundary
  let activeUser = currentUser;
  if (allowedRoles?.includes('authority') && !allowedRoles?.includes('citizen')) {
    activeUser = authorityUser;
  } else if (allowedRoles?.includes('citizen') && !allowedRoles?.includes('authority')) {
    activeUser = patientUser;
  }

  if (!activeUser) {
    return <Navigate to={`/login?role=${defaultRole}`} state={{ from: location, defaultRole }} replace />;
  }

  // Cross-portal role enforcement
  if (allowedRoles && !allowedRoles.includes(activeUser.role)) {
    if (activeUser.role === 'citizen') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    return <Navigate to="/app/getting-started" replace />;
  }

  return children;
}

/**
 * Public only route (e.g., login / signup).
 * Authenticated users are prevented from seeing login/signup screens.
 */
export function PublicOnlyRoute({ children }) {
  const { authorityUser, patientUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  const params = new URLSearchParams(location.search);
  const targetRole = params.get('role');
  if (targetRole === 'authority' && authorityUser) {
    return <Navigate to="/app/getting-started" replace />;
  }
  if (targetRole === 'citizen' && patientUser) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return children;
}
