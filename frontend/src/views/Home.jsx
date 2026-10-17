import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentChartBarIcon,
  HomeModernIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './Home.css';

export default function Home() {
  const { currentUser, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="home-container">
      {/* Top Header Navbar */}
      <header className="home-header">
        <div className="home-header-left">
          <Link to="/" className="home-logo-link">
            <img src={logo} alt="LabSetu Logo" className="home-logo" />
            <span className="home-brand">
              Lab<span className="home-brand-accent">Setu</span>
            </span>
          </Link>
          <span className="home-tagline-badge">Unified Diagnostic Network</span>
        </div>

        <nav className="home-nav-links">
          <Link to="/portal/tests" className="home-nav-link">Find Tests</Link>
          <Link to="/portal/labs" className="home-nav-link">Participating Labs</Link>
          <Link to="/portal/home-collection" className="home-nav-link">Home Collection</Link>
          <Link to="/portal/explainer" className="home-nav-link">AI Report Explainer</Link>
        </nav>

        <div className="home-header-actions">
          {currentUser ? (
            <Link
              to={role === 'citizen' ? '/portal/dashboard' : '/app/getting-started'}
              className="home-btn home-btn-primary"
            >
              <UserCircleIcon style={{ width: '18px' }} /> Go to Dashboard ({currentUser.name})
            </Link>
          ) : (
            <>
              <Link to="/login" className="home-btn home-btn-secondary" id="nav-login-btn">
                Log In
              </Link>
              <Link to="/signup" className="home-btn home-btn-primary" id="nav-signup-btn">
                Register Free
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="home-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon style={{ width: '24px', height: '24px' }} />
            ) : (
              <Bars3Icon style={{ width: '24px', height: '24px' }} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Drawer */}
      {isMobileMenuOpen && (
        <div className="home-mobile-drawer">
          <nav className="home-mobile-nav">
            <Link to="/portal/tests" className="home-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              Find Tests
            </Link>
            <Link to="/portal/labs" className="home-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              Participating Labs
            </Link>
            <Link to="/portal/home-collection" className="home-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              Home Collection
            </Link>
            <Link to="/portal/explainer" className="home-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              AI Report Explainer
            </Link>
          </nav>
          <div className="home-mobile-auth-actions">
            {currentUser ? (
              <Link
                to={role === 'citizen' ? '/portal/dashboard' : '/app/getting-started'}
                className="home-btn home-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserCircleIcon style={{ width: '18px' }} /> Dashboard ({currentUser.name})
              </Link>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <Link
                  to="/login"
                  className="home-btn home-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="home-btn home-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-pill">
            <CheckBadgeIcon style={{ width: '18px', color: '#15803d' }} />
            <span>NABL &amp; ICMR Accredited Diagnostic Partners Across India</span>
          </div>

          <h1 className="home-hero-title">
            Your Health Diagnostics,<br />
            <span className="home-text-gradient">Transparent &amp; Accessible.</span>
          </h1>

          <p className="home-hero-subtitle">
            Compare verified test rates across premier laboratories, schedule doorstep sample collections, 
            receive real-time clinical reports, and understand your health indicators with AI guidance in Hindi and English.
          </p>

          <div className="home-hero-cta-group">
            <Link to="/login" className="home-cta-btn home-cta-primary">
              Patient Portal Login <ArrowRightIcon style={{ width: '18px' }} />
            </Link>
            <Link to="/signup" className="home-cta-btn home-cta-outline">
              Authority &amp; Lab Sign In
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="home-stats-strip">
            <div className="home-stat-item">
              <strong>500+</strong>
              <span>Verified Tests</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat-item">
              <strong>40+</strong>
              <span>Accredited Labs</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat-item">
              <strong>100%</strong>
              <span>Secure Digital Reports</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat-item">
              <strong>60 Mins</strong>
              <span>Doorstep Phlebotomy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Role Choice Cards Section */}
      <section className="home-roles-section">
        <div className="home-section-header">
          <span className="home-section-eyebrow">CHOOSE YOUR PORTAL</span>
          <h2>Designed for Citizens and Diagnostic Facilities</h2>
          <p>Role-based access protects patient clinical privacy while giving lab teams operational control.</p>
        </div>

        <div className="home-roles-grid">
          {/* Patient Card */}
          <div className="home-role-card">
            <div className="home-role-icon-box patient-icon-bg">
              <UserCircleIcon style={{ width: '32px', color: '#15803d' }} />
            </div>
            <span className="home-role-badge patient-badge">For Patients &amp; Families</span>
            <h3>Citizen Health Portal</h3>
            <p>
              Search tests, compare lab charges, schedule clinic visits or home sample pickup, 
              view released reports, and explain blood parameters using AI.
            </p>
            <ul className="home-role-features">
              <li>✓ Verified lab price comparison</li>
              <li>✓ Safe doorstep sample collection</li>
              <li>✓ Released reports with instant PDF download</li>
              <li>✓ Bilingual AI Report Explainer (Hindi / English)</li>
              <li>✓ Family profiles &amp; preparation reminders</li>
            </ul>
            <div className="home-role-btn-wrap">
              <Link to="/login" state={{ defaultRole: 'citizen' }} className="home-role-btn primary">
                Enter as Patient / Citizen →
              </Link>
            </div>
          </div>

          {/* Authority Card */}
          <div className="home-role-card">
            <div className="home-role-icon-box authority-icon-bg">
              <BuildingOffice2Icon style={{ width: '32px', color: '#1d4ed8' }} />
            </div>
            <span className="home-role-badge authority-badge">For Labs &amp; Hospitals</span>
            <h3>Authority &amp; LIMS Portal</h3>
            <p>
              Manage diagnostic worklists, generate billing invoices, configure test ratelists, 
              enter biochemical results, and publish verified digital signatures.
            </p>
            <ul className="home-role-features">
              <li>✓ Complete diagnostic workflow &amp; billing</li>
              <li>✓ USG, Digital X-Ray &amp; Pathology modules</li>
              <li>✓ Automatic SMS &amp; WhatsApp report dispatch</li>
              <li>✓ Doctor portal &amp; revenue share tracking</li>
              <li>✓ Immutable activity ledger &amp; data export</li>
            </ul>
            <div className="home-role-btn-wrap">
              <Link to="/login" state={{ defaultRole: 'authority' }} className="home-role-btn secondary">
                Enter as Lab Authority →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="home-features-section">
        <div className="home-section-header">
          <span className="home-section-eyebrow">CORE CAPABILITIES</span>
          <h2>Advanced Features in LabSetu</h2>
        </div>

        <div className="home-features-grid">
          <div className="home-feature-card">
            <HomeModernIcon className="home-feature-icon" />
            <h4>Doorstep Home Collection</h4>
            <p>Certified phlebotomists collect blood &amp; urine specimens in cold-chain containers with live status updates.</p>
          </div>

          <div className="home-feature-card">
            <SparklesIcon className="home-feature-icon" />
            <h4>AI Diagnostic Explainer</h4>
            <p>Educational breakdowns of biological markers in clear, non-jargon Hindi or English without prescribing medicines.</p>
          </div>

          <div className="home-feature-card">
            <ShieldCheckIcon className="home-feature-icon" />
            <h4>Granular Consent &amp; Privacy</h4>
            <p>Your health data belongs to you. Control who can view reports with complete audit trail visibility.</p>
          </div>

          <div className="home-feature-card">
            <ClockIcon className="home-feature-icon" />
            <h4>Preparation &amp; Fasting Alerts</h4>
            <p>Lab-approved fasting guidelines and medication timing notifications sent prior to blood draws.</p>
          </div>

          <div className="home-feature-card">
            <DocumentChartBarIcon className="home-feature-icon" />
            <h4>Health Record Export</h4>
            <p>Download your complete diagnostic history as standard encrypted health summaries whenever required.</p>
          </div>

          <div className="home-feature-card">
            <BuildingOffice2Icon className="home-feature-icon" />
            <h4>Multi-Center Networking</h4>
            <p>Interconnected specimen routing between collection centers, processing hubs, and specialist radiologists.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-left">
            <div className="home-footer-brand">
              <img src={logo} alt="LabSetu" className="home-footer-logo" />
              <span>LabSetu Healthcare Information Management</span>
            </div>
            <p>© 2026 LabSetu Technologies. Adhering to NABL diagnostic data security protocols.</p>
          </div>
          <div className="home-footer-links">
            <Link to="/login">Login</Link>
            <Link to="/signup">Register</Link>
            <Link to="/forgot-password">Reset Password</Link>
            <Link to="/portal/tests">Diagnostic Tests</Link>
            <Link to="/portal/explainer">Report Explainer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
