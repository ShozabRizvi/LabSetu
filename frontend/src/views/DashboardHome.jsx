import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronDownIcon
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
      const masterLabUuid = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8';

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          slot_start,
          status,
          visit_type,
          purpose,
          created_at,
          assistant_data,
          patients (full_name, phone, patient_code)
        `)
        .eq('center_id', masterLabUuid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Dashboard] Fetch Error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mappedBookings = data.map(appt => {
          const ptName = appt.patients?.full_name || appt.assistant_data?.patient_name || 'Walk-in Patient';
          const ptPhone = appt.patients?.phone || appt.assistant_data?.patient_phone || '—';
          const ptUhid = appt.assistant_data?.uhid || appt.patients?.patient_code || '—';
          const timeSlot = appt.assistant_data?.time_slot || appt.assistant_data?.slot || appt.slot_start || '10:00 AM';
          const trackingStatus = appt.assistant_data?.tracking_status || (appt.status === 'confirmed' ? 'Confirmed' : 'Order Placed');
          const visitType = appt.assistant_data?.visit_type || (appt.assistant_data?.home_address ? 'home_collection' : (appt.visit_type || 'lab_visit'));

          return {
            id: appt.id,
            date: appt.appointment_date,
            appointment_date: appt.appointment_date,
            slot: timeSlot,
            status: appt.status || 'booked',
            tracking_status: trackingStatus,
            purpose: appt.purpose || 'General Diagnostics',
            visit_type: visitType,
            patientName: ptName,
            patient_name: ptName,
            mobile: ptPhone,
            patient_phone: ptPhone,
            uhid: ptUhid,
            source: appt.assistant_data?.source || 'Portal',
            notes: appt.assistant_data?.notes || (appt.assistant_data?.home_address ? `Address: ${appt.assistant_data.home_address}` : `${appt.purpose || 'Diagnostics'} · Slot: ${timeSlot}`),
            assistant_data: appt.assistant_data || {}
          };
        });

        setLiveAppointments(mappedBookings);
      } else {
        setLiveAppointments([]);
      }
    } catch (err) {
      console.warn('LIMS Fetch Exception:', err);
    }
  };

  // Component load hone par fetch karein aur Realtime Setup karein
  useEffect(() => {
    fetchLiveAppointments();

    // Instant Realtime synchronization filtered strictly by master center_id
    const channel = supabase.channel('lims-dashboard-sync')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        console.log('New appointment received:', payload);
        fetchLiveAppointments(); // Jaise hi neri entry aaye, data turant fetch ho jaye
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (apptId, nextStatus) => {
    try {
      setUpdatingId(apptId);

      // 1. Current appointment data find karein
      const target = (liveAppointments || []).find(a => a.id === apptId);

      // 2. assistant_data object ko safely merge karein
      const updatedAssistantData = {
        ...(target?.assistant_data || {}),
        tracking_status: nextStatus,
        status_updated_at: new Date().toISOString()
      };

      // 3. Supabase mein root 'status' aur JSONB 'assistant_data' dono ko ek sath update karein
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: nextStatus, // Patient portal ke liye primary status
          tracking_status: nextStatus, // Agar root column exist karta hai
          assistant_data: updatedAssistantData, // Metadata sync ke liye
          updated_at: new Date().toISOString()
        })
        .eq('id', apptId)
        .select();

      if (error) {
        console.error('[Dashboard] Status update database error:', error.message, error.details);
        alert(`Failed to update status: ${error.message}`);
        return;
      }

      console.log('[Dashboard] Status successfully updated in DB:', data);

      // 4. Local state turant update karein taaki UI smooth rahe
      setLiveAppointments(prev =>
        prev.map(a => a.id === apptId ? {
          ...a,
          status: nextStatus,
          tracking_status: nextStatus,
          assistant_data: updatedAssistantData
        } : a)
      );

    } catch (err) {
      console.warn('Status update exception:', err);
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
        <div className="dashboard-home-left">
          <div className="dashboard-home-quick-access">
            <Link to="/app/manage/employee-login" className="dashboard-home-qa-card">
              <div className="dashboard-home-qa-icon-wrapper green-bg">
                <UserIcon className="dashboard-home-qa-icon green-text" />
              </div>
              <span className="dashboard-home-qa-text">
                Employee logins
                <strong>{data?.employeeLogins ?? 0}</strong>
              </span>
            </Link>

            <Link to="/app/manage/browser-security" className="dashboard-home-qa-card">
              <div className="dashboard-home-qa-icon-wrapper blue-bg">
                <ShieldCheckIcon className="dashboard-home-qa-icon blue-text" />
              </div>
              <span className="dashboard-home-qa-text">Browser security</span>
            </Link>

            <Link to="/app/manage/doctor-access" className="dashboard-home-qa-card">
              <div className="dashboard-home-qa-icon-wrapper purple-bg">
                <UserGroupIcon className="dashboard-home-qa-icon purple-text" />
              </div>
              <span className="dashboard-home-qa-text">Doctor portal</span>
            </Link>
          </div>

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
                {liveAppointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                    <span style={{ fontWeight: 500 }}>No live bookings at the moment</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Incoming home collection and lab appointments will appear here in real-time.</span>
                  </div>
                ) : (
                  liveAppointments.map((appt) => (
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
                          <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{appt.patient_name || appt.id}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({appt.id.slice(0, 8)})</span>
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
                          {appt.notes || `${appt.purpose || 'General Diagnostics'} · Date: ${appt.appointment_date || 'Today'} · Phone: ${appt.patient_phone || '—'}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select
                          aria-label={`Update tracking status for ${appt.id}`}
                          disabled={updatingId === appt.id}
                          value={appt.tracking_status || appt.status || 'Order Placed'}
                          onChange={(e) => handleUpdateStatus(appt.id, e.target.value)}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Phlebotomist Assigned">Phlebotomist Assigned</option>
                          <option value="Out for Collection">Out for Collection</option>
                          <option value="Sample Collected">Sample Collected</option>
                          <option value="In Transit to Lab">In Transit</option>
                          <option value="Processing">Processing</option>
                          <option value="Report Ready">Report Ready</option>
                        </select>

                        {appt.status !== 'Report Signed' && appt.status !== 'Report Ready' && (
                          <button
                            type="button"
                            disabled={updatingId === appt.id}
                            onClick={() => {
                              const cur = appt.tracking_status || appt.status;
                              const next = cur === 'Order Placed' || cur === 'Confirmed' || cur === 'scheduled'
                                ? 'Phlebotomist Assigned'
                                : (cur === 'Phlebotomist Assigned' ? 'Out for Collection'
                                  : (cur === 'Out for Collection' ? 'Sample Collected'
                                    : (cur === 'Sample Collected' ? 'In Transit to Lab'
                                      : (cur === 'In Transit to Lab' ? 'Processing' : 'Report Ready'))));
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
                              cursor: 'pointer'
                            }}
                          >
                            → Advance Stage
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-home-status-row">
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <div>
                  <h3 className="dashboard-home-card-title">Payments due</h3>
                  <p className="dashboard-home-card-subtitle">Outstanding balance</p>
                </div>
                <Link to="/app/business/due-reports" className="dashboard-home-view-all">View all</Link>
              </div>

              <div className="dashboard-home-card-body centered">
                <div className="dashboard-home-status-icon-box">
                  {Number(dbDues || 0) > 0 ? (
                    <DocumentTextIcon className="dashboard-home-status-icon" />
                  ) : (
                    <CheckCircleIcon className="dashboard-home-status-icon" />
                  )}
                </div>
                <p className="dashboard-home-status-text">{money(dbDues !== null ? dbDues : data?.paymentsDue)}</p>
                <p className="dashboard-home-status-subtext">Total patient dues pending</p>
              </div>
            </div>

            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <div>
                  <h3 className="dashboard-home-card-title">Recent transactions</h3>
                  <p className="dashboard-home-card-subtitle">Latest bill records</p>
                </div>
                <Link to="/app/cases/transactions" className="dashboard-home-view-all">View all »</Link>
              </div>

              <div className="dashboard-home-card-body">
                <div className="labsetu-transactions">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 4).map((tx) => (
                      <div className="labsetu-transaction" key={tx.id}>
                        <div>
                          <strong>{tx.patient}</strong>
                          <span>{tx.description} · {tx.time}</span>
                        </div>
                        <div className="labsetu-amount">
                          <strong>{money(tx.amount)}</strong>
                          <span className={tx.status === 'Paid' ? 'labsetu-paid' : 'labsetu-due'}>
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
                      <p className="dashboard-home-status-text">No transactions found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-home-right">
          <Link to="/app/setup/sms" className="dashboard-home-card dashboard-home-sms-card">
            <span className="dashboard-home-sms-text">SMS Credits</span>
            <span className="dashboard-home-sms-badge">{data?.smsCredits ?? 100}</span>
            <ChevronDownIcon className="dashboard-home-sms-icon" />
          </Link>
        </div>
      </div>
    </div>
  );
}