import React from 'react';
import './ErrorBoundary.css';
import logo from '../../assets/logo.png';
import { ArrowPathIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Keep error trace available for diagnostics without breaking UI
    if (import.meta.env?.DEV) {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" role="alert">
          <div className="error-boundary-card">
            <div className="error-boundary-logo-wrap">
              <img src={logo} alt="LabSetu Logo" className="error-boundary-logo" />
            </div>

            <div className="error-boundary-header">
              <div className="error-boundary-badge">
                <ExclamationTriangleIcon style={{ width: 16 }} /> Runtime Recovery
              </div>
              <h1>Application Encountered an Issue</h1>
              <p>
                LabSetu protected your session state. You can reload this view or return to the main dashboard safely without losing stored clinical records.
              </p>
            </div>

            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Technical Details</summary>
                <pre>{this.state.error?.toString()}</pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button 
                type="button" 
                className="error-boundary-btn primary"
                onClick={this.handleReload}
              >
                <ArrowPathIcon style={{ width: 16 }} /> Reload Application
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
