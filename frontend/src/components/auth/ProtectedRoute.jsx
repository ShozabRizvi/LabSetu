import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route protection for authenticated users by role.
 * - If not authenticated: redirects to /login
 * - If role does not match allowedRoles: redirects to their respective authorized home
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role, loading } = useAuth();
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

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the appropriate home for their role
    if (role === 'citizen') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    return <Navigate to="/app/getting-started" replace />;
  }

  return children;
}

/**
 * Public only route (e.g., login / signup). If already logged in, redirect to respective role dashboard.
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    if (role === 'citizen') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    return <Navigate to="/app/getting-started" replace />;
  }

  return children;
}
