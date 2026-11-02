import React from 'react';
import './ErrorBoundary.css';
import logo from '../../assets/logo.png';
import { logger } from '../../utils/logger';
import { ArrowPathIcon, HomeIcon, ExclamationTriangleIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorLocation: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Extract exact source file and line number from stack trace
    let errorLocation = 'Unknown source location';
    if (error?.stack) {
      const match = error.stack.match(/(?:at\s+.*\((.*?:\d+:\d+)\)|at\s+(.*?:\d+:\d+))/);
      if (match) {
        errorLocation = match[1] || match[2] || 'Unknown location';
      }
    }

    this.setState({ errorInfo, errorLocation });

    // Route directly into unified domain-tagged logger
    logger.ui(error, {
      ...errorInfo,
      errorLocation,
      source: 'GlobalErrorBoundary'
    });
  }

  handleRetry = () => {
    // Soft recovery for Hot Module Replacement (HMR) state corruption
    this.setState({ hasError: false, error: null, errorInfo: null, errorLocation: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearHmrAndReload = () => {
    try {
      sessionStorage.clear();
      // Keep primary auth credentials, clear volatile session state
      localStorage.removeItem('active_appointment_draft');
      localStorage.removeItem('active_billing_workflow');
    } catch {}
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorName = this.state.error?.name || 'Runtime Exception';
      const errorMessage = this.state.error?.message || String(this.state.error);

      return (
        <div className="error-boundary-container" role="alert">
          <div className="error-boundary-card" style={{ maxWidth: '640px' }}>
            <div className="error-boundary-logo-wrap">
              <img src={logo} alt="LabSetu Logo" className="error-boundary-logo" />
            </div>

            <div className="error-boundary-header">
              <div className="error-boundary-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                <ExclamationTriangleIcon style={{ width: 16 }} />
                [UI_RUNTIME_ERROR] Diagnostic Intercept
              </div>
              <h1>Application Runtime Issue Detected</h1>
              <p>
                A component exception was caught by the LabSetu Error Boundary. The system protected your active authentication state and medical database records.
              </p>
            </div>

            {/* Structured Stack Trace & File Location Banner */}
            <div style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: '#334155'
            }}>
              <div style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CodeBracketIcon style={{ width: '16px' }} />
                {errorName}: {errorMessage}
              </div>

              {this.state.errorLocation && (
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                  Location: <strong>{this.state.errorLocation}</strong>
                </div>
              )}

              <details className="error-boundary-details" style={{ margin: 0 }}>
                <summary style={{ cursor: 'pointer', color: '#059669', fontWeight: '600' }}>
                  View Full Stack Trace &amp; Component Hierarchy
                </summary>
                <pre style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#1e293b',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  {this.state.error?.stack || errorMessage}
                  {this.state.errorInfo?.componentStack && `\n\nComponent Hierarchy:${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            </div>

            <div className="error-boundary-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="error-boundary-btn primary"
                onClick={this.handleRetry}
                style={{ background: '#059669', border: 'none', color: 'white' }}
              >
                <ArrowPathIcon style={{ width: 16 }} /> Retry Component (HMR Recovery)
              </button>

              <button 
                type="button" 
                className="error-boundary-btn secondary"
                onClick={this.handleClearHmrAndReload}
              >
                Clear Cache &amp; Reload
              </button>

              <button 
                type="button" 
                className="error-boundary-btn secondary"
                onClick={this.handleGoHome}
              >
                <HomeIcon style={{ width: 16 }} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
