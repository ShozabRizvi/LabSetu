import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function NotFound() {
  const { currentUser, role } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" title="LabSetu Home">
            <img src={logo} alt="LabSetu Logo" style={{ maxWidth: '84px', height: 'auto', display: 'block' }} />
          </Link>
        </div>

        <span style={{
          display: 'inline-block',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          fontSize: '0.85rem',
          fontWeight: '700',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          letterSpacing: '0.05em',
          marginBottom: '1rem'
        }}>
          ERROR 404
        </span>

        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 0.75rem 0'
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#64748b',
          lineHeight: '1.5',
          margin: '0 0 2rem 0'
        }}>
          The medical report, diagnostic workspace, or page you were looking for doesn't exist, may have moved, or requires appropriate authorization.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {currentUser ? (
            <Link
              to={role === 'citizen' ? '/portal/dashboard' : '/app/getting-started'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                transition: 'background-color 0.15s ease'
              }}
            >
              {role === 'citizen' ? <UserCircleIcon style={{ width: '18px' }} /> : <ShieldCheckIcon style={{ width: '18px' }} />}
              Go to Your Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px'
              }}
            >
              Sign In to LabSetu
            </Link>
          )}

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.95rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <HomeIcon style={{ width: '18px' }} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
