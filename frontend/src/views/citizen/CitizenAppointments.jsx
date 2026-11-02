import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { departments, appointmentSlots } from '../../data/mockLabData';
import {
  CalendarDaysIcon,
  ClockIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  PrinterIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function CitizenAppointments({ lang: propLang, addNewBooking, onAddNewBooking }) {
  const { currentUser, activeUHID, activeMember } = useAuth();
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';

  // Smart Lazy Initialization: load from localStorage if clean, otherwise initialize empty
  const [bookings, setBookings] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('labsetu_user_bookings')
        : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter(item => !item?.isMock && !['Ramesh Sharma', 'APT-10824', 'APT-10790', 'APT-10650'].includes(item?.patientName) && !['APT-10824', 'APT-10790', 'APT-10650'].includes(item?.id));
          return clean;
        }
      }
    } catch {}
    return [];
  });

  const appointments = bookings;
  const setAppointments = (nextVal) => {
    setBookings((prev) => {
      const updated = typeof nextVal === 'function' ? nextVal(prev) : nextVal;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('labsetu_user_bookings', JSON.stringify(updated));
        }
      } catch {
        // Safe failover
      }
      return updated;
    });
  };

  // Safe State Updater: instantly purge any object where isMock === true and prepend new appointment
  const handleAddNewBooking = (newAppointment) => {
    if (!newAppointment) return;
    setBookings((prev) => {
      const prevArray = Array.isArray(prev) ? prev : [];
      const filtered = prevArray.filter((item) => !item?.isMock);

      const aptId = newAppointment.aptId || newAppointment.id || `APT-${Date.now().toString().slice(-7)}`;
      const formattedAppt = {
        id: aptId,
        aptId: aptId,
        patientName: newAppointment.patientName || '',
        mobile: newAppointment.mobile || '',
        department: newAppointment.department || 'dept-pathology',
        date: newAppointment.date || '',
        slot: newAppointment.slot || 'slot-10am',
        status: newAppointment.status || 'Confirmed',
        stage: newAppointment.stage !== undefined ? newAppointment.stage : 1,
        createdAt: newAppointment.createdAt || new Date().toISOString(),
        prep: newAppointment.prep || 'Standard laboratory visit.',
        ...newAppointment
      };
      formattedAppt.id = formattedAppt.id || aptId;
      formattedAppt.aptId = formattedAppt.aptId || formattedAppt.id;
      delete formattedAppt.isMock;

      const updatedBookings = [formattedAppt, ...filtered];
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('labsetu_user_bookings', JSON.stringify(updatedBookings));
        }
      } catch {
        // Safe failover for quota/incognito mode
      }
      return updatedBookings;
    });
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((row) => {
          const s = (row.tracking_status || row.status || '').toLowerCase();
          let stage = 1;
          if (s.includes('ready') || s.includes('signed') || s.includes('completed')) {
            stage = 4;
          } else if (s.includes('processing') || s.includes('transit') || s.includes('lab')) {
            stage = 3;
          } else if (s.includes('collected') || s.includes('sample') || s.includes('assigned') || s.includes('phlebotomist')) {
            stage = 2;
          }

          return {
            id: row.id,
            rawId: row.id,
            patientName: row.patient_name || currentUser?.name || 'Patient',
            mobile: row.patient_phone || currentUser?.phone || '—',
            department: row.purpose || 'dept-pathology',
            date: row.appointment_date || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : ''),
            slot: row.time_slot || row.slot || 'slot-10am',
            status: row.tracking_status || row.status || 'Confirmed',
            stage,
            uhid: row.uhid || currentUser?.uhid,
            prep: row.preparation_instructions || 'Standard laboratory visit.',
            createdAt: row.created_at
          };
        });
        setBookings(mapped);
      }
    } catch (err) {
      console.warn('[CitizenAppointments] fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();

    if (typeof onAddNewBooking === 'function') {
      onAddNewBooking(handleAddNewBooking);
    }
    if (typeof addNewBooking === 'function') {
      addNewBooking(handleAddNewBooking);
    }
    const handleCustomAdd = (e) => {
      if (e?.detail) handleAddNewBooking(e.detail);
    };
    window.addEventListener('labsetu:addNewBooking', handleCustomAdd);

    // Live Supabase Realtime synchronization for authority updates
    const channel = supabase.channel('patient-tracker-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        if (payload.new) {
          const updatedRow = payload.new;
          setBookings((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const index = list.findIndex(b => 
              b.id === updatedRow.id || 
              b.rawId === updatedRow.id || 
              (updatedRow.notes && updatedRow.notes.includes(b.id))
            );
            if (index !== -1) {
              const current = list[index];
              const s = (updatedRow.tracking_status || updatedRow.status || '').toLowerCase();
              let newStage = current.stage;
              let newStatus = updatedRow.tracking_status || updatedRow.status || current.status;
              if (s.includes('ready') || s.includes('signed') || s.includes('completed')) {
                newStage = 4;
                newStatus = 'Report Ready';
              } else if (s.includes('processing') || s.includes('transit') || s.includes('lab')) {
                newStage = 3;
                newStatus = 'In Lab Processing';
              } else if (s.includes('collected') || s.includes('sample') || s.includes('assigned') || s.includes('phlebotomist')) {
                newStage = 2;
                newStatus = 'Sample Collected';
              } else if (s.includes('confirmed') || s.includes('scheduled') || s.includes('placed')) {
                newStage = 1;
                newStatus = 'Confirmed';
              }
              const updated = {
                ...current,
                status: newStatus,
                tracking_status: newStatus,
                stage: newStage
              };
              const copy = [...list];
              copy[index] = updated;
              try {
                if (window.localStorage) {
                  window.localStorage.setItem('labsetu_user_bookings', JSON.stringify(copy));
                }
              } catch {}
              return copy;
            }
            fetchAppointments();
            return list;
          });
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('labsetu:addNewBooking', handleCustomAdd);
      supabase.removeChannel(channel);
    };
  }, [onAddNewBooking, addNewBooking]);
  const [filter, setFilter] = useState('all');
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('slot-10am');
  const [notice, setNotice] = useState('');
  const [printingApptId, setPrintingApptId] = useState(null);

  const handlePrintSlip = (apptId) => {
    setPrintingApptId(apptId);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const filteredAppts = (appointments || []).filter(a => {
    if (activeMember && activeMember.relation !== 'Self') {
      const matchName = a.patientName && a.patientName.toLowerCase().includes(activeMember.name.toLowerCase());
      const matchUhid = a.uhid && (a.uhid === activeUHID || a.uhid === activeMember.uhid);
      if (!matchName && !matchUhid) return false;
    }
    if (filter === 'all') return true;
    if (filter === 'confirmed') return a.status === 'Confirmed' || a.status === 'Sample Collected';
    if (filter === 'reportReady') return a.status === 'Report Ready';
    if (filter === 'cancelled') return a.status === 'Cancelled';
    return true;
  });

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await supabase
          .from('appointments')
          .update({
            status: 'Cancelled',
            tracking_status: 'Cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase cancel booking error:', err);
      }
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'Cancelled', stage: 0 } : a));
      setNotice('Booking cancelled according to laboratory cancellation policy.');
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleSaveReschedule = (e) => {
    e.preventDefault();
    if (!newDate) return;
    setAppointments(appointments.map(a => a.id === rescheduleItem.id ? {
      ...a,
      date: newDate,
      slot: newSlot,
      status: 'Confirmed',
      stage: 1
    } : a));
    setRescheduleItem(null);
    setNotice(`Appointment rescheduled to ${newDate} successfully.`);
    setTimeout(() => setNotice(''), 3500);
  };

  const stages = [
    { label: 'Confirmed', desc: 'Booking accepted' },
    { label: 'Sample Collected', desc: 'Phlebotomy complete' },
    { label: 'Processing', desc: 'Analyzer running' },
    { label: 'Report Ready', desc: 'Verified & released' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>
            {lang === 'hi' ? 'मेरी बुकिंग एवं जांच स्थिति' : 'My Bookings & Sample Tracking'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            {lang === 'hi' 
              ? 'कलेक्शन, लैबोरेटरी प्रोसेसिंग और रिपोर्ट रेडी स्थिति का रीयल-टाइम 4-चरणीय ट्रैकर'
              : 'Real-time 4-stage tracking from appointment confirmation to final report publication'}
          </p>
          {activeMember && activeMember.relation !== 'Self' && (
            <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', color: '#065f46' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
              <span>{lang === 'hi' ? 'दिखाए जा रहे रिकॉर्ड' : 'Showing Bookings for'}: <strong>{activeMember.name}</strong> ({activeMember.relation} · {activeUHID})</span>
            </div>
          )}
        </div>
        <Link 
          to="/portal/appointments/book"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#15803d',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}
        >
          <PlusIcon style={{ width: '18px' }} /> {lang === 'hi' ? 'नई जांच बुक करें' : 'Book New Diagnostic Visit'}
        </Link>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All Bookings (${(appointments || []).length})` },
          { id: 'confirmed', label: `Active / In-Progress (${(appointments || []).filter(a => a.status === 'Confirmed' || a.status === 'Sample Collected').length})` },
          { id: 'reportReady', label: `Report Ready (${(appointments || []).filter(a => a.status === 'Report Ready').length})` },
          { id: 'cancelled', label: `Cancelled (${(appointments || []).filter(a => a.status === 'Cancelled').length})` }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: filter === t.id ? '#dcfce7' : 'transparent',
              color: filter === t.id ? '#15803d' : '#475569',
              fontWeight: filter === t.id ? '700' : '500',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      {filteredAppts.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <CalendarDaysIcon style={{ width: '40px', margin: '0 auto 0.75rem auto', color: '#94a3b8' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No bookings found</h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>You have no diagnostic visits matching this filter.</p>
          <Link
            to="/portal/appointments/book"
            style={{
              display: 'inline-block',
              backgroundColor: '#15803d',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.55rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            Schedule a Visit
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredAppts.map(appt => {
            const dept = departments.find(d => d.id === appt.department);
            const slotObj = appointmentSlots.find(s => s.id === appt.slot);
            const ts = (appt.tracking_status || appt.status || '').toLowerCase();
            const currentStage = appt.stage || (
              (ts.includes('ready') || ts.includes('signed') || ts.includes('completed')) ? 4 :
              (ts.includes('processing') || ts.includes('transit') || ts.includes('lab')) ? 3 :
              (ts.includes('collected') || ts.includes('sample') || ts.includes('assigned') || ts.includes('phlebotomist')) ? 2 : 1
            );

            return (
              <div 
                key={appt.id}
                className={`appointment-card ${printingApptId === appt.id ? 'print-target' : ''}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#15803d',
                      backgroundColor: '#f0fdf4',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {appt.id}
                    </span>
                    <h3 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '1.2rem', color: '#0f172a' }}>
                      {dept?.name || 'Diagnostic Pathology Lab'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      Patient: <strong style={{ color: '#334155' }}>{appt.patientName}</strong> · Mobile: {appt.mobile}
                    </p>
                  </div>

                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    backgroundColor: appt.status === 'Confirmed' ? '#dcfce7' : appt.status === 'Report Ready' ? '#dbeafe' : appt.status === 'Sample Collected' ? '#fef3c7' : '#fee2e2',
                    color: appt.status === 'Confirmed' ? '#15803d' : appt.status === 'Report Ready' ? '#1e40af' : appt.status === 'Sample Collected' ? '#92400e' : '#b91c1c'
                  }}>
                    {appt.status}
                  </span>
                </div>

                {/* 4-Stage Live Tracking Stepper */}
                {appt.status !== 'Cancelled' && (
                  <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Diagnostic Specimen Progress Tracker:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      {stages.map((stg, sIdx) => {
                        const stepNum = sIdx + 1;
                        const isDone = currentStage >= stepNum;
                        return (
                          <div key={stg.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isDone ? '#15803d' : '#cbd5e1',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              marginBottom: '0.35rem'
                            }}>
                              {isDone ? '✓' : stepNum}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: isDone ? '700' : '500', color: isDone ? '#0f172a' : '#94a3b8' }}>
                              {stg.label}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                              {stg.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date & Time Info */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CalendarDaysIcon style={{ width: '18px', color: '#15803d' }} />
                    <span>Date: <strong>{appt.date}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ClockIcon style={{ width: '18px', color: '#15803d' }} />
                    <span>Slot: <strong>{slotObj?.label || '10:00 AM - 11:00 AM'}</strong></span>
                  </div>
                </div>

                {appt.preparation_instructions && (
                  <div style={{ fontSize: '0.8rem', color: '#854d0e', background: '#fef9c3', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #fde047' }}>
                    ℹ️ <strong>Preparation Guidelines:</strong> {appt.preparation_instructions}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => handlePrintSlip(appt.id)}
                    style={{
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    <PrinterIcon style={{ width: '15px' }} /> Print Appointment Slip
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {appt.status === 'Report Ready' ? (
                      <Link
                        to="/portal/reports"
                        style={{
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        Download Report PDF →
                      </Link>
                    ) : appt.status !== 'Cancelled' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleItem(appt);
                            setNewDate(appt.date);
                            setNewSlot(appt.slot);
                          }}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.8rem',
                            color: '#1e293b',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Reschedule Visit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(appt.id)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.8rem',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel Booking
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Reschedule Appointment ({rescheduleItem.id})</h3>
              <button onClick={() => setRescheduleItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Select New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Select Time Slot
                </label>
                <select
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  {appointmentSlots.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleItem(null)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
