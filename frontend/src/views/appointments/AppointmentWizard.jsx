import React, { useMemo, useState } from 'react';
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, UserCircleIcon, BuildingOffice2Icon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';
import { useAuth } from '../../context/AuthContext';
import { appointmentSlots, departments } from '../../data/mockLabData';
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
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState({
    name: currentUser?.name || '',
    mobile: currentUser?.phone || ''
  });
  const [verified, setVerified] = useState(false);
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState(dateValue(1));
  const [slot, setSlot] = useState('');
  const [reference, setReference] = useState('');
  const [notice, setNotice] = useState('');
  const selectedDepartment = departments.find((item) => item.id === department);
  const availableSlots = useMemo(() => appointmentSlots.filter((item) => !appointments.some((a) => a.date === date && a.slot === item.id && a.department === department)), [appointments, date, department]);

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
    setStep(0); 
    setPatient({ name: currentUser?.name || '', mobile: currentUser?.phone || '' }); 
    setVerified(false); 
    setDepartment(''); 
    setDate(dateValue(1)); 
    setSlot(''); 
    setReference(''); 
    setNotice(''); 
  };

  return (
    <main className="appt-page">
      <div className="appt-heading">
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
        <div className="appt-stepper">
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
              <div className="appt-success-icon">
                <CheckCircleIcon />
              </div>
              <span className="appt-eyebrow">BOOKING CONFIRMATION</span>
              <h2>{reference ? 'Appointment confirmed!' : 'Review appointment'}</h2>
              <p>{reference ? 'Your appointment has been successfully scheduled and booked.' : 'Review your details before confirming.'}</p>
              
              <div className="appt-slip">
                <div>
                  <span>Booking reference</span>
                  <strong>{reference || 'Will be generated on confirmation'}</strong>
                </div>
                <div>
                  <span>Patient</span>
                  <strong>{patient.name || demoPatient.name}</strong>
                </div>
                <div>
                  <span>Mobile</span>
                  <strong>{patient.mobile}</strong>
                </div>
                <div>
                  <span>Department</span>
                  <strong>{selectedDepartment?.name}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{date}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{appointmentSlots.find((item) => item.id === slot)?.label}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong className="appt-status">{reference ? 'Confirmed' : 'Pending'}</strong>
                </div>
              </div>

              <div className="appt-actions">
                {!reference && <button className="appt-primary" onClick={confirm}>Confirm booking</button>}
                <button className="appt-secondary" onClick={restart}>Book another appointment</button>
                <button className="appt-secondary" onClick={() => window.print()}>Print slip</button>
              </div>
            </div>
          )}

          {notice && <p className="appt-notice" role="status">{notice}</p>}
        </div>
      </section>
    </main>
  );
}
