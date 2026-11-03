import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Global Unified Footer Component for LabSetu
 * Synchronized across Authority Portal (MainLayout), Citizen Portal (CitizenLayout),
 * and Authentication screens (Registration / Sign In / Sign Up).
 */
export default function Footer({ onLegalClick, lang = 'en', className = '' }) {
  const isHindi = lang === 'hi';

  const handleClick = (e, type) => {
    if (typeof onLegalClick === 'function') {
      e.preventDefault();
      onLegalClick(type);
    }
  };

  return (
    <footer className={`app-global-footer ${className}`.trim()}>
      <div className="footer-links-row">
        {onLegalClick ? (
          <a
            href="/terms"
            onClick={(e) => handleClick(e, 'terms')}
            className="footer-link"
          >
            {isHindi ? 'नियम व शर्तें' : 'Terms & Conditions'}
          </a>
        ) : (
          <Link
            to="/portal/privacy"
            className="footer-link"
          >
            {isHindi ? 'नियम व शर्तें' : 'Terms & Conditions'}
          </Link>
        )}

        <span className="footer-bullet">•</span>

        {onLegalClick ? (
          <a
            href="/privacy"
            onClick={(e) => handleClick(e, 'privacy')}
            className="footer-link"
          >
            {isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}
          </a>
        ) : (
          <Link
            to="/portal/privacy"
            className="footer-link"
          >
            {isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}
          </Link>
        )}

        <span className="footer-bullet">•</span>

        {onLegalClick ? (
          <a
            href="/refund"
            onClick={(e) => handleClick(e, 'refund')}
            className="footer-link"
          >
            {isHindi ? 'रिफंड व रद्दीकरण नीति' : 'Refund Policy'}
          </a>
        ) : (
          <Link
            to="/portal/support"
            className="footer-link"
          >
            {isHindi ? 'रिफंड व रद्दीकरण नीति' : 'Refund Policy'}
          </Link>
        )}
      </div>

      <p className="footer-copyright">
        &copy; 2026 LabSetu Healthcare Systems. All rights reserved.
      </p>
    </footer>
  );
}
