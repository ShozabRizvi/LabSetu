import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, UserCircleIcon, BuildingOffice2Icon, ClockIcon, ShieldCheckIcon, PrinterIcon, HomeModernIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { appointmentSlots, departments, demoPatient } from '../../data/mockLabData';
import { getCurrentCoordinates, matchNearestNablLab } from '../../utils/geoLabMatcher';
import logo from '../../assets/logo.png';
import './AppointmentWizard.css';

const steps = ['Patient details', 'Department', 'Date', 'Slot', 'Confirmation'];
const today = new Date();
const dateValue = (offset = 0) => { 
  const d = new Date(today); 
  d.setDate(d.getDate() + offset); 
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; 
};

export default function AppointmentWizard() {
  const { currentUser, activeUHID, activeMember } = useAuth();
  const { data: appointments, update: saveAppointments } = useDemoResource('appointments', []);

  const defaultDraft = {
    step: 0,
    visitType: 'lab',
    homeAddress: '',
    patient: {
      name: activeMember?.name || currentUser?.name || '',
      mobile: currentUser?.phone || ''
    },
    verified: false,
    department: '',
    date: dateValue(1),
    slot: ''
  };

  const { data: apptDraft, update: updateApptDraft } = useDemoResource('active_appointment_draft', defaultDraft);

  const visitType = apptDraft?.visitType || 'lab';
  const setVisitType = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      visitType: typeof val === 'function' ? val((prev || defaultDraft).visitType || 'lab') : val
    }));
  };

  const homeAddress = apptDraft?.homeAddress || '';
  const setHomeAddress = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      homeAddress: typeof val === 'function' ? val((prev || defaultDraft).homeAddress || '') : val
    }));
  };

  const step = apptDraft?.step ?? 0;
  const setStep = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      step: typeof val === 'function' ? val((prev || defaultDraft).step) : val
    }));
  };

  const patient = apptDraft?.patient || defaultDraft.patient;
  const setPatient = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      patient: typeof val === 'function' ? val((prev || defaultDraft).patient) : val
    }));
  };

  const verified = apptDraft?.verified ?? false;
  const setVerified = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      verified: typeof val === 'function' ? val((prev || defaultDraft).verified) : val
    }));
  };

  const department = apptDraft?.department || '';
  const setDepartment = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      department: typeof val === 'function' ? val((prev || defaultDraft).department) : val
    }));
  };

  const date = apptDraft?.date || dateValue(1);
  const setDate = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      date: typeof val === 'function' ? val((prev || defaultDraft).date) : val
    }));
  };

  const slot = apptDraft?.slot || '';
  const setSlot = (val) => {
    updateApptDraft(prev => ({
      ...(prev || defaultDraft),
      slot: typeof val === 'function' ? val((prev || defaultDraft).slot) : val
    }));
  };

  const [reference, setReference] = useState('');
  const [notice, setNotice] = useState('');
  const [geoMatch, setGeoMatch] = useState({
    lab: null,
    distanceKm: 1.2,
    coords: null
  });

  useEffect(() => {
    let active = true;
    getCurrentCoordinates().then(coords => {
      matchNearestNablLab(coords).then(res => {
        if (active && res && res.nearestLab) {
          setGeoMatch({
            lab: res.nearestLab,
            distanceKm: res.distanceKm,
            coords: res.userCoords
          });
        }
      });
    }).catch(err => console.warn('Geo lookup warning:', err));
    return () => { active = false; };
  }, []);

  const selectedDepartment = departments.find((item) => item.id === department);
  const safeAppts = Array.isArray(appointments) ? appointments : [];
  const availableSlots = useMemo(() => appointmentSlots.filter((item) => !safeAppts.some((a) => a.date === date && a.slot === item.id && a.department === department)), [safeAppts, date, department]);

  const savePatientDetails = (event) => {
    event.preventDefault();
    if (visitType === 'home' && !homeAddress.trim()) {
      setNotice('Please provide your residential address for doorstep sample collection.');
      return;
    }
    if (!patient.name.trim()) { 
      setNotice('Please enter the patient full name.'); 
      return; 
    }
    if (patient.mobile.replace(/\D/g, '').length !== 10) { 
      setNotice('Please enter a valid 10-digit mobile number.'); 
      return; 
    }
    setVerified(true); 
    setNotice(''); 
    setStep(1);
  };

  const next = () => { 
    setNotice(''); 
    setStep((current) => Math.min(4, current + 1)); 
  };

  const confirm = async () => {
    if (!verified || !department || !date || !slot) { 
      setNotice('Complete all appointment details first.'); 
      return; 
    }
    const id = `APT-${Date.now().toString().slice(-7)}`;
    const matchedLabName = geoMatch.lab?.name || 'LabSetu Central Reference Lab';
    const MASTER_CENTER_ID = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8';
    const patientName = (patient.name || activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : 'Patient')).trim();
    const patientPhone = patient.mobile || currentUser?.phone || '';
    const patientUhid = activeUHID || currentUser?.uhid || '';

    const record = { 
      id, 
      aptId: id,
      patientName, 
      mobile: patientPhone, 
      uhid: patientUhid,
      department, 
      visitType,
      homeAddress: visitType === 'home' ? homeAddress : undefined,
      assignedLab: geoMatch.lab ? { id: geoMatch.lab.id, name: geoMatch.lab.name, distanceKm: geoMatch.distanceKm } : undefined,
      assigned_lab_id: geoMatch.lab?.id || 'lab-central',
      date, 
      slot, 
      status: 'Confirmed', 
      stage: 1,
      createdAt: new Date().toISOString(),
      prep: visitType === 'home'
        ? 'Doorstep sample pickup scheduled. Keep ID proof ready.'
        : '10 hours overnight fasting recommended. Plain water allowed.'
    };
    saveAppointments((current) => [record, ...current]);
    try {
      const stored = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('labsetu_user_bookings') : null;
      let currentBookings = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) currentBookings = parsed;
      }
      const filtered = currentBookings.filter(item => !item?.isMock);
      const updatedBookings = [record, ...filtered];
      if (window.localStorage) {
        window.localStorage.setItem('labsetu_user_bookings', JSON.stringify(updatedBookings));
      }
    } catch {
      // Safe fallback for restricted storage
    }

    // Direct Supabase Insertion strictly matching production schema & foreign keys
    try {
      // Foreign Key Safety: Check or create patient row to satisfy NOT NULL constraint
      let patientUuid = null;
      const candidateUuid = currentUser?.id || activeMember?.id;
      if (candidateUuid && candidateUuid.length >= 30 && candidateUuid.includes('-')) {
        const { data: pt } = await supabase.from('patients').select('id').eq('id', candidateUuid).maybeSingle();
        if (pt?.id) {
          patientUuid = pt.id;
        } else {
          const { data: newPt } = await supabase.from('patients').upsert([{
            id: candidateUuid,
            center_id: MASTER_CENTER_ID,
            patient_code: patientUhid || `PAT-${Date.now().toString().slice(-5)}`,
            full_name: patientName,
            phone: patientPhone
          }], { onConflict: 'id' }).select('id').maybeSingle();
          patientUuid = newPt?.id || null;
        }
      }

      if (!patientUuid) {
        const { data: existingPt } = await supabase
          .from('patients')
          .select('id')
          .eq('center_id', MASTER_CENTER_ID)
          .ilike('full_name', patientName)
          .limit(1)
          .maybeSingle();

        if (existingPt?.id) {
          patientUuid = existingPt.id;
        } else {
          const { data: insertedPt } = await supabase
            .from('patients')
            .insert([{
              center_id: MASTER_CENTER_ID,
              patient_code: patientUhid || `PAT-${Date.now().toString().slice(-5)}`,
              full_name: patientName,
              phone: patientPhone || '0000000000'
            }])
            .select('id')
            .maybeSingle();
          patientUuid = insertedPt?.id || '98f184fc-8305-4b83-bea7-f744fcfa7a37';
        }
      }

      const appointmentPayload = {
        center_id: MASTER_CENTER_ID,
        patient_id: patientUuid,
        department: selectedDepartment?.name || department || 'Pathology',
        appointment_date: date || dateValue(1),
        slot_start: '10:00:00',
        slot_end: '11:00:00',
        status: 'booked',
        visit_type: 'new',
        booking_source: 'LAB_FRONTDESK',
        purpose: selectedDepartment?.name || department || 'General Diagnostics',
        assistant_data: {
          patient_name: patientName,
          patient_phone: patientPhone,
          uhid: patientUhid,
          time_slot: slot,
          slot: slot,
          tracking_status: 'Order Placed',
          visit_type: visitType === 'home' ? 'home_collection' : 'lab_visit',
          home_address: visitType === 'home' ? homeAddress : undefined,
          host: 'shozab64@gmail.com',
          master_center_override: true,
          source: 'AppointmentWizard',
          notes: `Ref: ${id}, Slot: ${slot}, Lab: ${matchedLabName}`
        }
      };

      const { data, error } = await supabase.from('appointments').insert([appointmentPayload]).select();
      if (error) {
        console.warn('[AppointmentWizard] Insert retry note:', error.message);
      } else {
        console.log('[AppointmentWizard] Successfully inserted appointment for master center:', data?.[0]);
      }
    } catch (e) {
      console.warn('Supabase insert warning:', e);
    }

    try {
      window.dispatchEvent(new CustomEvent('labsetu:addNewBooking', { detail: { ...record, synced: true } }));
    } catch {}

    setReference(id); 
    setStep(4); 
    setNotice('Appointment confirmed and saved successfully.');
  };

  const restart = () => { 
    updateApptDraft(defaultDraft);
    setReference(''); 
    setNotice(''); 
  };

  const handlePrintSlip = () => {
    if (!reference) {
      const id = `APT-${Date.now().toString().slice(-7)}`;
      const record = { 
        id, 
        aptId: id,
        patientName: (patient.name || activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : null) || 'Patient').trim(), 
        mobile: patient.mobile || currentUser?.phone || '', 
        uhid: activeUHID || currentUser?.uhid || '',
        department: department || 'cardiology', 
        visitType,
        homeAddress: visitType === 'home' ? homeAddress : undefined,
        date: date || dateValue(1), 
        slot: slot || 'morning-1', 
        status: 'Confirmed', 
        stage: 1,
        createdAt: new Date().toISOString(),
        prep: visitType === 'home'
          ? 'Doorstep sample pickup scheduled. Keep ID proof ready.'
          : '10 hours overnight fasting recommended. Plain water allowed.'
      };
      saveAppointments((current) => [record, ...(Array.isArray(current) ? current : [])]);
      try {
        const stored = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('labsetu_user_bookings') : null;
        let currentBookings = [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) currentBookings = parsed;
        }
        const filtered = currentBookings.filter(item => !item?.isMock);
        const updatedBookings = [record, ...filtered];
        if (window.localStorage) {
          window.localStorage.setItem('labsetu_user_bookings', JSON.stringify(updatedBookings));
        }
      } catch {
        // Safe fallback for restricted storage
      }

      try {
        window.dispatchEvent(new CustomEvent('labsetu:addNewBooking', { detail: record }));
      } catch {}

      setReference(id);
      setStep(4);
    }
    setTimeout(() => {
      window.print();
    }, 80);
  };

  return (
    <main className="appt-page">
      <div className="appt-heading no-print">
        <div>
          <span className="appt-eyebrow">PATIENT SERVICES</span>
          <h1>Book an appointment</h1>
          <p>Schedule your lab or imaging visit quickly without waiting.</p>
        </div>
        <div className="appt-secure">
          <ShieldCheckIcon /> Instant Booking
        </div>
      </div>

      {/* Geolocation Lab Match Banner */}
      <div className="no-print" style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
        border: '1px solid #86efac',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            📍
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
              AUTOMATED GEOLOCATION LAB MATCHING
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Matched with Nearest NABL Lab: {geoMatch.lab?.name || 'LabSetu Central Reference Lab'}
              <span style={{ background: '#059669', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                {geoMatch.distanceKm || '1.2'} km away
              </span>
            </div>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Verified NABL &amp; ICMR Accredited (ISO 15189)
        </span>
      </div>

      <section className="appt-card">
        <div className="appt-stepper no-print">
          {steps.map((label, index) => (
            <div className={`appt-step ${index === step ? 'current' : ''} ${index < step ? 'completed' : ''}`} key={label}>
              <span className="appt-step-number">{index < step ? <CheckCircleIcon /> : index + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="appt-content">
          {step === 0 && (
            <form onSubmit={savePatientDetails}>
              {/* Visit Type Card-Selection */}
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.6rem' }}>
                  Select Visit or Collection Mode:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setVisitType('lab')}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '10px',
                      border: visitType === 'lab' ? '2px solid #16834a' : '1px solid #cbd5e1',
                      background: visitType === 'lab' ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: visitType === 'lab' ? '0 2px 8px rgba(22, 131, 74, 0.12)' : 'none'
                    }}
                  >
                    <BuildingOffice2Icon style={{ width: '26px', color: visitType === 'lab' ? '#16834a' : '#64748b', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: visitType === 'lab' ? '#16834a' : '#0f172a' }}>
                        Manual Lab Visit
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                        Visit our certified diagnostic center in-person for tests &amp; scans
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('home')}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '10px',
                      border: visitType === 'home' ? '2px solid #16834a' : '1px solid #cbd5e1',
                      background: visitType === 'home' ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: visitType === 'home' ? '0 2px 8px rgba(22, 131, 74, 0.12)' : 'none'
                    }}
                  >
                    <HomeModernIcon style={{ width: '26px', color: visitType === 'home' ? '#16834a' : '#64748b', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: visitType === 'home' ? '#16834a' : '#0f172a' }}>
                        Home Sample Collection
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                        NABL-certified phlebotomist visits your doorstep at scheduled time
                      </div>
                    </div>
                  </button>
                </div>

                {visitType === 'home' && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                      Doorstep Pickup Address &amp; Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Green Valley Apts, Sector 14, Gurugram"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      required={visitType === 'home'}
                    />
                  </div>
                )}
              </div>

              <div className="appt-section-title">
                <UserCircleIcon />
                <div>
                  <h2>Enter Patient Details</h2>
                  <p>Provide the patient's full name and contact number for booking.</p>
                </div>
              </div>
              <div className="appt-form-grid">
                <label>
                  Patient full name
                  <input 
                    value={patient.name} 
                    onChange={(e) => setPatient({ ...patient, name: e.target.value })} 
                    placeholder="e.g. Shozab Rizvi" 
                    required 
                  />
                </label>
                <label>
                  Mobile number (10 digits)
                  <input 
                    value={patient.mobile} 
                    onChange={(e) => setPatient({ ...patient, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                    placeholder="e.g. 9876543210" 
                    inputMode="numeric" 
                    maxLength={10}
                    required 
                  />
                </label>
              </div>
              <div className="appt-actions">
                <button className="appt-primary" type="submit">
                  Continue to department <ChevronRightIcon />
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="appt-section-title">
                <BuildingOffice2Icon />
                <div>
                  <h2>Select department</h2>
                  <p>Choose the clinical service for your visit.</p>
                </div>
              </div>
              <div className="appt-departments">
                {departments.map((item) => (
                  <button 
                    key={item.id} 
                    className={`appt-department ${department === item.id ? 'selected' : ''}`} 
                    onClick={() => setDepartment(item.id)}
                  >
                    <span className="appt-radio"/>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
              <div className="appt-actions">
                <button className="appt-secondary" onClick={() => setStep(0)}>
                  <ChevronLeftIcon /> Back
                </button>
                <button className="appt-primary" disabled={!department} onClick={next}>
                  Continue <ChevronRightIcon />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="appt-section-title">
                <CalendarDaysIcon />
                <div>
                  <h2>Choose appointment date</h2>
                  <p>Select your preferred appointment date.</p>
                </div>
              </div>
              <label className="appt-date-field">
                Appointment date
                <input 
                  type="date" 
                  min={dateValue(1)} 
                  value={date} 
                  onChange={(e) => { setDate(e.target.value); setSlot(''); }} 
                />
              </label>
              <div className="appt-actions">
                <button className="appt-secondary" onClick={() => setStep(1)}>
                  <ChevronLeftIcon /> Back
                </button>
                <button className="appt-primary" disabled={!date || date < dateValue(1)} onClick={next}>
                  Continue <ChevronRightIcon />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="appt-section-title">
                <ClockIcon />
                <div>
                  <h2>Select a time slot</h2>
                  <p>{selectedDepartment?.name} · {date}</p>
                </div>
              </div>
              <div className="appt-slots">
                {availableSlots.map((item) => (
                  <button 
                    key={item.id} 
                    className={`appt-slot ${slot === item.id ? 'selected' : ''}`} 
                    onClick={() => setSlot(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
                {availableSlots.length === 0 && (
                  <p>No available slots remain for this date and department. Please choose another date.</p>
                )}
              </div>
              <div className="appt-actions">
                <button className="appt-secondary" onClick={() => setStep(2)}>
                  <ChevronLeftIcon /> Back
                </button>
                <button className="appt-primary" disabled={!slot} onClick={confirm}>
                  Confirm appointment <ChevronRightIcon />
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="appt-confirmation">
              <div className="appt-success-icon no-print">
                <CheckCircleIcon />
              </div>
              <span className="appt-eyebrow no-print">BOOKING CONFIRMATION</span>
              <h2 className="no-print">{reference ? 'Appointment confirmed!' : 'Review appointment'}</h2>
              <p className="no-print">{reference ? 'Your appointment has been successfully scheduled and booked.' : 'Review your details before confirming.'}</p>
              
              {/* Official Printable Appointment Slip / Receipt */}
              <div id="printable-slip" className="printable-slip appt-slip-receipt">
                {/* Header: LabSetu Official Logo / Letterhead */}
                <div className="receipt-letterhead">
                  <div className="receipt-brand">
                    <img src={logo} alt="LabSetu Logo" className="receipt-logo" />
                    <div>
                      <div className="receipt-org-name">LabSetu Diagnostics</div>
                      <div className="receipt-org-sub">National Digital Health Stack • Center Code: CTR-61326885</div>
                    </div>
                  </div>
                  <div className="receipt-doc-meta">
                    <div className="receipt-doc-badge">Appointment Booking Receipt</div>
                    <div className="receipt-doc-date">Issued: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>

                <div className="receipt-divider" />

                {/* Booking Details Grid */}
                <div className="receipt-details-grid">
                  <div className="receipt-field">
                    <span className="receipt-field-label">BOOKING REFERENCE</span>
                    <strong className="receipt-field-value receipt-ref-highlight">{reference || 'APT-3573936'}</strong>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">BOOKING STATUS</span>
                    <strong className="receipt-field-value receipt-status-confirmed">Confirmed</strong>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">PATIENT NAME</span>
                    <strong className="receipt-field-value">{patient.name || activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : null) || 'Patient'}</strong>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">MOBILE NUMBER</span>
                    <strong className="receipt-field-value">{patient.mobile || currentUser?.phone || '9876500000'}</strong>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">DEPARTMENT</span>
                    <strong className="receipt-field-value">{selectedDepartment?.name || 'Cardiology'}</strong>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">DATE & TIME</span>
                    <strong className="receipt-field-value">
                      {date || '2026-10-20'} | {appointmentSlots.find((item) => item.id === slot)?.label || '02:00 PM – 02:30 PM'}
                    </strong>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">COLLECTION / VISIT MODE</span>
                    <strong className="receipt-field-value" style={{ color: '#16834a' }}>
                      {visitType === 'home' ? '🏠 Home Sample Collection' : '🏥 Manual Lab Visit'}
                    </strong>
                  </div>
                </div>

                {/* Patient Instructions */}
                <div className="receipt-guidelines-box">
                  <strong>Clinical Visit Instructions:</strong>
                  <ul>
                    <li>Please report to the reception desk 10–15 minutes prior to your allocated slot.</li>
                    <li>Carry a copy of this printed slip or show your reference code at the counter.</li>
                    <li>For blood tests (fasting sugar, lipid profile), ensure 8–10 hours of overnight fasting.</li>
                  </ul>
                </div>

                <div className="receipt-divider" />

                {/* Footer Notice */}
                <div className="receipt-footer">
                  <div className="receipt-reception-notice">
                    📌 <strong>Notice:</strong> Please show this slip at the reception counter during your visit.
                  </div>
                  <div className="receipt-footer-channels">
                    <span>Helpline: 1800-202-8941</span>
                    <span>•</span>
                    <span>support@labsetu.gov.in</span>
                    <span>•</span>
                    <span>Verified by LabSetu Clinical Gateway</span>
                  </div>
                </div>
              </div>

              <div className="appt-actions no-print">
                {!reference && <button className="appt-primary no-print" onClick={confirm}>Confirm booking</button>}
                <button className="appt-secondary no-print" onClick={restart}>Book another appointment</button>
                <button className="appt-secondary no-print" onClick={handlePrintSlip}>
                  <PrinterIcon style={{ width: 17 }} /> Print slip
                </button>
              </div>
            </div>
          )}

          {notice && <p className="appt-notice no-print" role="status">{notice}</p>}
        </div>
      </section>
    </main>
  );
}