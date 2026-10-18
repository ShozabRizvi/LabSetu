import React, { useMemo, useState } from 'react';
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, UserCircleIcon, BuildingOffice2Icon, ClockIcon, ShieldCheckIcon, PrinterIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';
import { useAuth } from '../../context/AuthContext';
import { appointmentSlots, departments, demoPatient } from '../../data/mockLabData';
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
  const { currentUser } = useAuth();
  const { data: appointments, update: saveAppointments } = useDemoResource('appointments', []);

  const defaultDraft = {
    step: 0,
    patient: {
      name: currentUser?.name || '',
      mobile: currentUser?.phone || ''
    },
    verified: false,
    department: '',
    date: dateValue(1),
    slot: ''
  };

  const { data: apptDraft, update: updateApptDraft } = useDemoResource('active_appointment_draft', defaultDraft);

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
  const selectedDepartment = departments.find((item) => item.id === department);
  const safeAppts = Array.isArray(appointments) ? appointments : [];
  const availableSlots = useMemo(() => appointmentSlots.filter((item) => !safeAppts.some((a) => a.date === date && a.slot === item.id && a.department === department)), [safeAppts, date, department]);

  const savePatientDetails = (event) => {
    event.preventDefault();
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

  const confirm = () => {
    if (!verified || !department || !date || !slot) { 
      setNotice('Complete all appointment details first.'); 
      return; 
    }
    const id = `APT-${Date.now().toString().slice(-7)}`;
    const record = { 
      id, 
      patientName: patient.name.trim(), 
      mobile: patient.mobile, 
      department, 
      date, 
      slot, 
      status: 'Confirmed', 
      createdAt: new Date().toISOString() 
    };
    saveAppointments((current) => [record, ...current]);
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
        patientName: (patient.name || currentUser?.name || demoPatient?.name || 'rshozab64').trim(), 
        mobile: patient.mobile || currentUser?.phone || '9876500000', 
        department: department || 'cardiology', 
        date: date || dateValue(1), 
        slot: slot || 'morning-1', 
        status: 'Confirmed', 
        createdAt: new Date().toISOString() 
      };
      saveAppointments((current) => [record, ...(Array.isArray(current) ? current : [])]);
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
                    <strong className="receipt-field-value">{patient.name || currentUser?.name || demoPatient?.name || 'rshozab64'}</strong>
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
