import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronDownIcon
} from '@heroicons/regular/24/outline';

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
      // Fetch all appointments directly from Supabase without center restriction so all patient bookings show up live
      const [apptsRes, billsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase.from('bills').select('due_amount').eq('payment_status', 'due')
      ]);

      if (apptsRes.error) {
        console.error('[DashboardHome] Appointments fetch error:', apptsRes.error.message);
      }

      if (billsRes.error) {
        console.error('[DashboardHome] Bills fetch error:', billsRes.error.message);
      }

      const dbAppts = apptsRes?.data;
      const dbBills = billsRes?.data;

      if (dbAppts && dbAppts.length > 0) {
        setLiveAppointments(dbAppts);
      } else {
        setLiveAppointments([]);
      }

      if (dbBills && dbBills.length > 0) {
        const sum = dbBills.reduce((acc, b) => acc + (Number(b.due_amount) || 0), 0);
        setDbDues(sum);
      } else {
        setDbDues(0);
      }
    } catch (e) {
      console.warn('Live appointments exception:', e);
      setLiveAppointments([]);
    }
  };

  useEffect(() => {
    document.title = 'LabSetu - Authority Dashboard (shozab64@gmail.com)';
    fetchLiveAppointments();

    const channelName = `authority-appointments-realtime-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        console.log('[Realtime] Appointment change detected on LIMS Authority:', payload);
        fetchLiveAppointments();
      }
    );

    channel.subscribe((status) => {
      console.log('[Realtime LIMS] Subscription status:', status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (apptId, nextStatus) => {
    try {
      setUpdatingId(apptId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: nextStatus, 
          tracking_status: nextStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', apptId);

      if (error) {
        console.error('Status update failed:', error);
      }

      setLiveAppointments(prev =>
        prev.map(a => a.id === apptId ? { ...a, status: nextStatus, tracking_status: nextStatus } : a)
      );

      if (nextStatus === 'Report Signed' || nextStatus === 'Report Ready') {
        await supabase.from('reports').insert({
          title: 'Complete Blood Count & Comprehensive Metabolic Profile',
          status: 'signed',
          generated_at: new Date().toISOString(),
          assistant_data: { appointment_id: apptId, host: 'shozab64@gmail.com' }
        });
      }
      fetchLiveAppointments();
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
          <h1>Welcome, Dr. Shozab Rizvi 👋</h1>
          <p>
            LabSetu Authority Operations Console · Host: shozab64@gmail.com · Lab #{currentUser?.labId || '61326885'} · LabSetu Diagnostics
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
        <div className="dashboard-home-left" style={{ width: '100%' }}>
          {/* Real-Time Patient Bookings & Phlebotomy Queue */}
          <div className="dashboard-home-card" style={{ marginBottom: '1.25rem' }}>
            <div className="dashboard-home-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)' }} />
                <h3 className="dashboard-home-card-title" style={{ margin: 0 }}>
                  Live Patient Bookings &amp; Collection Queue (Realtime Supabase Sync)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                SYNC ACTIVE
              </span>
            </div>

            <div className="dashboard-home-card-body" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {liveAppointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                    <p style={{ fontWeight: 500, margin: '0.5rem 0 0 0' }}>No live bookings yet. Book from the patient portal to test real-time sync!</p>
                  </div>
                ) : (
                  liveAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{appt.patient_name || 'Patient'}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({appt.id.slice(0, 8)})</span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: '#e0f2fe',
                            color: '#0369a1'
                          }}>
                            {appt.purpose || 'Pathology'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                          Date: {appt.appointment_date || 'Today'} · Slot: {appt.time_slot || '10:00 AM'} · Phone: {appt.patient_phone || '—'} · UHID: {appt.uhid || '—'}
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
                            padding: '0.3rem 0.6rem',
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

                        <button
                          type="button"
                          disabled={updatingId === appt.id}
                          onClick={() => {
                            const cur = appt.tracking_status || appt.status;
                            const next = cur === 'Order Placed' || cur === 'Confirmed' 
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
                            padding: '0.35rem 0.7rem',
                            borderRadius: '6px',
                            border: '1px solid #15803d',
                            background: '#15803d',
                            color: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          → Advance Stage
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}