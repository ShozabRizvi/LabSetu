import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import {
  HomeModernIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ShieldCheckIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenHomeCollection({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const defaultBookings = [
    {
      id: 'HC-9042',
      tests: 'Complete Blood Count (CBC), Fasting Blood Sugar',
      date: '2026-10-18',
      timeSlot: '07:30 AM - 08:30 AM (Fasting)',
      address: 'House #42, Sector 14, Gurugram, Haryana - 122001',
      phlebotomist: 'Suresh Kumar (Vaccinated · NABL Certified)',
      phleboPhone: '+91 98765 43210',
      status: 'Phlebotomist Assigned',
      stage: 1, // 0: Booked, 1: Assigned, 2: Out for Collection, 3: Sample Collected, 4: In Lab Processing
      prep: 'Strict 10-12 hours overnight fasting required. Plain water permitted.'
    },
    {
      id: 'HC-8819',
      tests: 'Lipid Profile, Thyroid Profile (T3, T4, TSH)',
      date: '2026-10-10',
      timeSlot: '08:00 AM - 09:00 AM',
      address: 'House #42, Sector 14, Gurugram, Haryana - 122001',
      phlebotomist: 'Rajesh Sharma',
      phleboPhone: '+91 98111 22334',
      status: 'Completed & Processed',
      stage: 4,
      prep: 'Completed on 10 Oct 2026'
    }
  ];

  const { data: bookings, update: setBookings } = useDemoResource('labsetu_home_collections', defaultBookings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    tests: 'Complete Blood Count (CBC)',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    timeSlot: '07:00 AM - 08:00 AM (Early Fasting)',
    address: 'House #42, Sector 14, Gurugram, Haryana',
    instructions: 'Doorbell is on the right side'
  });

  const handleCreateBooking = (e) => {
    e.preventDefault();
    const created = {
      id: `HC-${Math.floor(1000 + Math.random() * 9000)}`,
      tests: form.tests,
      date: form.date,
      timeSlot: form.timeSlot,
      address: form.address,
      phlebotomist: 'Auto-Assigning Nearby Phlebotomist...',
      phleboPhone: '+91 1800-200-8899',
      status: 'Confirmed & Phlebotomist Dispatched',
      stage: 1,
      prep: 'Overnight fasting required for fasting tests. Please keep ID proof ready.'
    };
    setBookings([created, ...(bookings || [])]);
    setIsModalOpen(false);
    setNotice(lang === 'hi' 
      ? `घर से सैंपल कलेक्शन सफलतापूर्वक बुक किया गया: ${created.id}`
      : `Home collection scheduled successfully: ${created.id}`);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleCancel = (id) => {
    setBookings((bookings || []).filter(b => b.id !== id));
    setNotice(lang === 'hi' ? 'कलेक्शन रद्द कर दिया गया।' : 'Collection booking cancelled.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title">
            {lang === 'hi' ? 'घर से सैंपल कलेक्शन (होम कलेक्शन)' : 'Doorstep Home Sample Collection'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi' 
              ? 'प्रमाणित फ्लेबोटोमिस्ट द्वारा आपके घर से सुरक्षित और स्वच्छ सैंपल कलेक्शन'
              : 'Safe, hygienic sample pickup from your residence by NABL-certified phlebotomists'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <PlusIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'नया कलेक्शन बुक करें' : 'Schedule Doorstep Collection'}
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircleIcon style={{ width: '20px' }} />
          <span>{notice}</span>
        </div>
      )}

      {/* Safety & Protocol Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <ShieldCheckIcon style={{ width: '28px', color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <strong>{lang === 'hi' ? 'लैबसेतु सुरक्षा मानक:' : 'LabSetu Doorstep Safety Standards:'}</strong>{' '}
          {lang === 'hi' 
            ? 'सभी फ्लेबोटोमिस्ट सिंगल-यूज़ वैक्युटेनर सुइयों, सीलबंद बारकोड ट्यूबों और तापमान-नियंत्रित कोल्ड-चेन बैग का उपयोग करते हैं।'
            : 'Phlebotomists utilize sterile single-use vacuum needles, barcode-matched vacutainers, and temperature-monitored cold-chain transport boxes.'}
        </div>
      </div>

      {/* Active Bookings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {(bookings || []).map((b) => (
          <div key={b.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {b.id}
                </span>
                <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.15rem', color: '#0f172a' }}>{b.tests}</h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CalendarDaysIcon style={{ width: '16px' }} /> {b.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ClockIcon style={{ width: '16px' }} /> {b.timeSlot}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: b.stage === 4 ? '#f1f5f9' : '#fef3c7',
                  color: b.stage === 4 ? '#475569' : '#92400e'
                }}>
                  {b.status}
                </span>
              </div>
            </div>

            {/* Stepper Status Milestones */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {['Scheduled', 'Assigned', 'Sample Picked', 'In Lab Processing'].map((step, idx) => (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: b.stage >= idx ? '#15803d' : '#cbd5e1',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      marginBottom: '0.35rem'
                    }}>
                      {b.stage >= idx ? '✓' : idx + 1}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: b.stage >= idx ? '#0f172a' : '#94a3b8', fontWeight: b.stage >= idx ? '600' : '400', textAlign: 'center' }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.875rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <div>
                <strong>{lang === 'hi' ? 'कलेक्शन पता:' : 'Pickup Address:'}</strong>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b' }}>{b.address}</p>
              </div>
              <div>
                <strong>{lang === 'hi' ? 'फ्लेबोटोमिस्ट:' : 'Designated Phlebotomist:'}</strong>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b' }}>{b.phlebotomist} · <a href={`tel:${b.phleboPhone}`} style={{ color: '#15803d', textDecoration: 'none', fontWeight: '500' }}>📞 {b.phleboPhone}</a></p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                ⚠️ <strong>{lang === 'hi' ? 'तैयारी निर्देश:' : 'Test Preparation:'}</strong> {b.prep}
              </span>
              {b.stage < 3 && (
                <button
                  onClick={() => handleCancel(b.id)}
                  style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                {lang === 'hi' ? 'घर से सैंपल कलेक्शन बुक करें' : 'Schedule Doorstep Sample Pickup'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  {lang === 'hi' ? 'जांच / टेस्ट का नाम' : 'Select Tests for Sample Collection'}
                </label>
                <select
                  value={form.tests}
                  onChange={(e) => setForm({ ...form, tests: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC) - ₹350</option>
                  <option value="Fasting Blood Sugar (FBS)">Fasting Blood Sugar (FBS) - ₹120</option>
                  <option value="Lipid Profile Comprehensive">Lipid Profile Comprehensive - ₹650</option>
                  <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH) - ₹550</option>
                  <option value="Liver Function Test (LFT)">Liver Function Test (LFT) - ₹750</option>
                  <option value="Full Body Executive Health Checkup">Full Body Executive Health Checkup - ₹2,499</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {lang === 'hi' ? 'दिनांक' : 'Preferred Date'}
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {lang === 'hi' ? 'समय स्लॉट' : 'Time Window'}
                  </label>
                  <select
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="06:30 AM - 07:30 AM (Early Fasting)">06:30 AM - 07:30 AM (Fasting)</option>
                    <option value="07:30 AM - 08:30 AM (Morning)">07:30 AM - 08:30 AM</option>
                    <option value="08:30 AM - 09:30 AM (Morning)">08:30 AM - 09:30 AM</option>
                    <option value="10:00 AM - 12:00 PM (Mid-Day)">10:00 AM - 12:00 PM</option>
                    <option value="04:00 PM - 06:00 PM (Evening)">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  {lang === 'hi' ? 'पूरा पता और लैंडमार्क' : 'Full Residence Address & Landmark'}
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                ℹ️ Doorstep collection fee: <strong>FREE</strong> for orders above ₹500. A certified phlebotomist will call 15 minutes before arrival.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.55rem 1.15rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Confirm &amp; Book Phlebotomist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
