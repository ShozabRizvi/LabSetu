import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronDownIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

import './DashboardHome.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDemoResource from '../hooks/useDemoResource';
import { supabase } from '../lib/supabase';
import { demoDashboardData, demoActivitiesData } from '../data/mockLabData';
import { ensureArray } from '../utils/arrayUtils';

export default function DashboardHome() {
  const { currentUser } = useAuth();
  const { data } = useDemoResource('dashboard', demoDashboardData);
  const { data: activities } = useDemoResource('labsetu_activities', demoActivitiesData);
  const [liveAppointments, setLiveAppointments] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [dbDues, setDbDues] = useState(null);

  const fetchLiveAppointments = async () => {
    try {
      const [apptsRes, billsRes] = await Promise.all([
        supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(6).then(r => r).catch(() => ({ data: null })),
        supabase.from('bills').select('due_amount').eq('payment_status', 'due').then(r => r).catch(() => ({ data: null }))
      ]);

      const dbAppts = apptsRes?.data;
      const dbBills = billsRes?.data;

      if (dbAppts && dbAppts.length > 0) {
        setLiveAppointments(dbAppts);
      } else {
        setLiveAppointments([
          {
            id: 'APT-10824',
            notes: 'Patient: Ramesh Sharma, Phone: 9876543210, Type: Home Sample Collection',
            appointment_date: '2026-10-18',
            purpose: 'dept-pathology',
            status: 'Confirmed',
            visit_type: 'home_collection'
          },
          {
            id: 'APT-10790',
            notes: 'Patient: Ramesh Sharma, Phone: 9876543210, Type: Manual Lab Visit',
            appointment_date: '2026-10-17',
            purpose: 'dept-biochemistry',
            status: 'Sample Collected',
            visit_type: 'lab_visit'
          }
        ]);
      }

      if (dbBills && dbBills.length > 0) {
        const sum = dbBills.reduce((acc, b) => acc + (Number(b.due_amount) || 0), 0);
        setDbDues(sum);
      }
    } catch (e) {
      console.warn('Live appointments fallback:', e);
    }
  };

  useEffect(() => {
    document.title = 'LabSetu - Authority Dashboard';
    fetchLiveAppointments();

    const channel = supabase.channel('authority-appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchLiveAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (apptId, nextStatus) => {
    try {
      setUpdatingId(apptId);
      await supabase
        .from('appointments')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', apptId);

      setLiveAppointments(prev =>
        prev.map(a => a.id === apptId ? { ...a, status: nextStatus } : a)
      );

      if (nextStatus === 'Report Signed') {
        await supabase.from('reports').insert({
          title: 'Complete Blood Count & Comprehensive Metabolic Profile',
          status: 'signed',
          generated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Status update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const money = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const transactions = ensureArray(data?.recentTransactions);
  const recentActivities = ensureArray(activities).slice(0, 3);

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

          {/* Real-Time Patient Bookings & Phlebotomy Queue */}
          <div className="dashboard-home-card" style={{ marginBottom: '1.25rem' }}>
            <div className="dashboard-home-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)' }} />
                <h3 className="dashboard-home-card-title" style={{ margin: 0 }}>
                  Live Patient Bookings &amp; Collection Queue
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                REALTIME SYNC ACTIVE
              </span>
            </div>

            <div className="dashboard-home-card-body" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {liveAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{appt.id}</strong>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: appt.visit_type === 'home_collection' ? '#e0f2fe' : '#f1f5f9',
                          color: appt.visit_type === 'home_collection' ? '#0369a1' : '#475569'
                        }}>
                          {appt.visit_type === 'home_collection' ? '🏠 Home Collection' : '🏥 Lab Visit'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {appt.notes || `${appt.purpose || 'General Diagnostics'} · ${appt.appointment_date || 'Today'}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '20px',
                        background: appt.status === 'Report Signed' ? '#dcfce7' : (appt.status === 'Assigned' ? '#fef3c7' : '#e0e7ff'),
                        color: appt.status === 'Report Signed' ? '#15803d' : (appt.status === 'Assigned' ? '#92400e' : '#3730a3')
                      }}>
                        {appt.status || 'Confirmed'}
                      </span>

                      {appt.status !== 'Report Signed' && (
                        <button
                          type="button"
                          disabled={updatingId === appt.id}
                          onClick={() => {
                            const next = appt.status === 'Confirmed' || appt.status === 'scheduled'
                              ? 'Assigned'
                              : (appt.status === 'Assigned' ? 'Sample Collected' : 'Report Signed');
                            handleUpdateStatus(appt.id, next);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#15803d',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {appt.status === 'Confirmed' || appt.status === 'scheduled' ? '→ Assign Phlebotomist' : (appt.status === 'Assigned' ? '→ Mark Sample Picked' : '✓ Sign & Release Report')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  {money(dbDues !== null ? dbDues : data?.paymentsDue)}
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

        </div>
      </div>

    </div>
  );
}
