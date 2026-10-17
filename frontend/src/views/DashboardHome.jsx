import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronDownIcon,
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import './DashboardHome.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDemoResource from '../hooks/useDemoResource';
import { demoDashboardData, demoActivitiesData } from '../data/mockLabData';

export default function DashboardHome() {
  const { currentUser } = useAuth();
  const { data } = useDemoResource('dashboard', demoDashboardData);
  const { data: activities } = useDemoResource('labsetu_activities', demoActivitiesData);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | 'refund'

  useEffect(() => {
    document.title = 'LabSetu - Authority Dashboard';
  }, []);

  const money = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const transactions = data?.recentTransactions || [];
  const recentActivities = (activities || []).slice(0, 3);

  return (
    <div className="dashboard-home-container">
      {/* Welcome Hero Banner - Matches Citizen Dashboard */}
      <div className="dashboard-hero-banner">
        <div className="hero-text">
          <h1>Welcome, {currentUser?.name || 'Dr. Shozab Rizvi'} 👋</h1>
          <p>
            LabSetu Authority Operations Console · Lab #{currentUser?.labId || '61326885'} · {currentUser?.centerName || 'LabSetu Diagnostics'}
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/app/cases/new-bill" className="hero-btn primary">
            + New Bill
          </Link>
          <Link to="/app/business/due-reports" className="hero-btn secondary">
            Due Reports
          </Link>
          <Link to="/app/setup/center-details" className="hero-btn secondary">
            Center Details
          </Link>
        </div>
      </div>

      <div className="dashboard-home-grid">
        {/* Left Column */}
        <div className="dashboard-home-left">

          {/* Quick Access Cards */}
          <div className="dashboard-home-quick-access">

            <Link
              to="/app/manage/employee-login"
              className="dashboard-home-qa-card"
            >
              <div className="dashboard-home-qa-icon-wrapper green-bg">
                <UserIcon className="dashboard-home-qa-icon green-text" />
              </div>
              <span className="dashboard-home-qa-text">
                Employee logins
                <strong>{data?.employeeLogins ?? 0}</strong>
              </span>
            </Link>

            <Link
              to="/app/manage/browser-security"
              className="dashboard-home-qa-card"
            >
              <div className="dashboard-home-qa-icon-wrapper blue-bg">
                <ShieldCheckIcon className="dashboard-home-qa-icon blue-text" />
              </div>
              <span className="dashboard-home-qa-text">
                Browser security
              </span>
            </Link>

            <Link
              to="/app/manage/doctor-access"
              className="dashboard-home-qa-card"
            >
              <div className="dashboard-home-qa-icon-wrapper purple-bg">
                <UserGroupIcon className="dashboard-home-qa-icon purple-text" />
              </div>
              <span className="dashboard-home-qa-text">
                Doctor portal
              </span>
            </Link>

          </div>

          {/* Payments and Recent Transactions */}
          <div className="dashboard-home-status-row">

            {/* Payments Due */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <div>
                  <h3 className="dashboard-home-card-title">
                    Payments due
                  </h3>
                  <p className="dashboard-home-card-subtitle">
                    Outstanding balance
                  </p>
                </div>

                <Link
                  to="/app/business/due-reports"
                  className="dashboard-home-view-all"
                >
                  View all
                </Link>
              </div>

              <div className="dashboard-home-card-body centered">
                <div className="dashboard-home-status-icon-box">
                  {Number(data?.paymentsDue || 0) > 0 ? (
                    <DocumentTextIcon className="dashboard-home-status-icon" />
                  ) : (
                    <CheckCircleIcon className="dashboard-home-status-icon" />
                  )}
                </div>

                <p className="dashboard-home-status-text">
                  {money(data?.paymentsDue)}
                </p>

                <p className="dashboard-home-status-subtext">
                  Total patient dues pending
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <div>
                  <h3 className="dashboard-home-card-title">
                    Recent transactions
                  </h3>
                  <p className="dashboard-home-card-subtitle">
                    Latest bill records
                  </p>
                </div>

                <Link
                  to="/app/cases/transactions"
                  className="dashboard-home-view-all"
                >
                  View all »
                </Link>
              </div>

              <div className="dashboard-home-card-body">
                <div className="labsetu-transactions">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 4).map((tx) => (
                      <div
                        className="labsetu-transaction"
                        key={tx.id}
                      >
                        <div>
                          <strong>{tx.patient}</strong>
                          <span>
                            {tx.description} · {tx.time}
                          </span>
                        </div>

                        <div className="labsetu-amount">
                          <strong>{money(tx.amount)}</strong>
                          <span
                            className={
                              tx.status === 'Paid'
                                ? 'labsetu-paid'
                                : 'labsetu-due'
                            }
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-home-card-body centered">
                      <div className="dashboard-home-status-icon-box">
                        <DocumentTextIcon className="dashboard-home-status-icon" />
                      </div>

                      <p className="dashboard-home-status-text">
                        No transactions found.
                      </p>

                      <p className="dashboard-home-status-subtext">
                        Get started by adding a new case.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Setup Guide and Recent Activities */}
          <div className="dashboard-home-status-row">

            {/* Setup Guide */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <h3 className="dashboard-home-card-title">
                  Setup guide
                </h3>

                <Link
                  to="/app/setup/kyc"
                  className="dashboard-home-view-all"
                >
                  Open setup »
                </Link>
              </div>

              <div className="dashboard-home-card-body labsetu-setup-links">
                <Link to="/app/setup/kyc">
                  KYC verification
                </Link>

                <Link to="/app/setup/center-details">
                  Center details
                </Link>

                <Link to="/app/setup/ratelist">
                  Ratelist
                </Link>

                <Link to="/app/setup/letterhead">
                  Letterhead
                </Link>

                <Link to="/app/setup/sms">
                  SMS templates
                </Link>

                <Link to="/app/setup/panels">
                  Test panels
                </Link>

                <Link to="/app/setup/proofread">
                  Proofread settings
                </Link>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <h3 className="dashboard-home-card-title">
                  Recent activities
                </h3>

                <Link
                  to="/app/business/activities"
                  className="dashboard-home-view-all"
                >
                  View all »
                </Link>
              </div>

              <div className="dashboard-home-card-body">
                {recentActivities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recentActivities.map((act) => (
                      <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{act.activity}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>by {act.user}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{act.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-home-card-body centered">
                    <div className="dashboard-home-status-icon-box">
                      <ClockIcon className="dashboard-home-status-icon" />
                    </div>
                    <p className="dashboard-home-status-text">
                      No recent activities recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-home-right">

          {/* SMS Credits */}
          <Link
            to="/app/setup/sms"
            className="dashboard-home-card dashboard-home-sms-card"
          >
            <span className="dashboard-home-sms-text">
              SMS Credits
            </span>

            <span className="dashboard-home-sms-badge">
              {data?.smsCredits ?? 100}
            </span>

            <ChevronDownIcon className="dashboard-home-sms-icon" />
          </Link>

          {/* Legal Links */}
          <div className="dashboard-home-legal-links">
            <button
              onClick={() => setLegalModal('terms')}
              style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
            >
              Terms &amp; Conditions
            </button>
            <button
              onClick={() => setLegalModal('privacy')}
              style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setLegalModal('refund')}
              style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
            >
              Refund Policy
            </button>
          </div>

        </div>
      </div>

      {/* Legal Information Modal */}
      {legalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                {legalModal === 'terms' && 'Terms & Conditions'}
                {legalModal === 'privacy' && 'Privacy Policy'}
                {legalModal === 'refund' && 'Refund & Cancellation Policy'}
              </h3>
              <button onClick={() => setLegalModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
              {legalModal === 'terms' && (
                <>
                  <p>Welcome to LabSetu Diagnostic Laboratory Information Management System (LIMS).</p>
                  <p>1. <strong>Authorized Usage:</strong> This portal is provided for certified laboratory staff, clinical pathologists, and authorized medical administrators. User credentials must remain confidential.</p>
                  <p>2. <strong>Data Compliance:</strong> Clinical findings, pathology specimen records, and diagnostic values must adhere to National Accreditation Board for Testing and Calibration Laboratories (NABL) guidelines.</p>
                  <p>3. <strong>Audit Trail:</strong> All record alterations, billing adjustments, and report print operations are recorded in an immutable audit ledger.</p>
                </>
              )}
              {legalModal === 'privacy' && (
                <>
                  <p>LabSetu takes patient medical confidentiality and diagnostic data privacy with utmost priority.</p>
                  <p>1. <strong>Protected Health Information:</strong> All patient identifiers (UHID, mobile number, clinical history) are protected and transmitted via encrypted channels.</p>
                  <p>2. <strong>Patient Consent:</strong> SMS reports and WhatsApp notifications are dispatched only with patient verification and explicit authorization.</p>
                  <p>3. <strong>Third-party Disclosures:</strong> Diagnostic data is never sold, leased, or disclosed to unauthorized marketing third parties.</p>
                </>
              )}
              {legalModal === 'refund' && (
                <>
                  <p>LabSetu Diagnostic Billing & Refund Standards:</p>
                  <p>1. <strong>Pre-collection Cancellation:</strong> Patients may cancel diagnostic appointments before phlebotomy specimen collection with a 100% refund.</p>
                  <p>2. <strong>Processing Status:</strong> Once biological samples have entered centrifugation, biochemical analyzer processing, or imaging acquisition, bill adjustments require authorized medical supervisor approval.</p>
                  <p>3. <strong>Settlement:</strong> Approved refunds are credited back to the original source payment method within 3–5 working days.</p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setLegalModal(null)} className="setup-btn-blue">
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
