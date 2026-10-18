import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route protection for authenticated users by role.
 * - If not authenticated: redirects to /login
 * - If role does not match allowedRoles: redirects to their respective authorized home
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { authorityUser, patientUser, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'inherit',
        color: '#15803d'
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
          <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>Loading LabSetu...</p>
        </div>
      </div>
    );
  }

  // Determine the active session user for the requested role boundary
  let activeUser = currentUser;
  if (allowedRoles?.includes('authority') && !allowedRoles?.includes('citizen')) {
    activeUser = authorityUser;
  } else if (allowedRoles?.includes('citizen') && !allowedRoles?.includes('authority')) {
    activeUser = patientUser;
  }

  if (!activeUser) {
    const defaultRole = allowedRoles?.includes('citizen') ? 'citizen' : 'authority';
    return <Navigate to={`/login?role=${defaultRole}`} state={{ from: location, defaultRole }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(activeUser.role)) {
    // Redirect to the appropriate home for their role
    if (activeUser.role === 'citizen') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    return <Navigate to="/app/getting-started" replace />;
  }

  return children;
}

/**
 * Public only route (e.g., login / signup).
 */
export function PublicOnlyRoute({ children }) {
  const { authorityUser, patientUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  // If user navigates explicitly to /login or /signup, allow them to view and switch accounts
  // Only redirect if no query role is specified and user is already at the root
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
