import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  UserPlusIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenPrivacy({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const defaultSettings = {
    smsAlerts: true,
    whatsappAlerts: true,
    shareWithTreatingDoctor: true,
    anonymousResearchConsent: false,
    authorizedDoctors: [
      { id: 'doc-1', name: 'Dr. Alok Verma, MD (Medicine)', hospital: 'City Care Hospital', accessGrantedOn: '10 Oct 2026', scope: 'All Diagnostic Reports' },
      { id: 'doc-2', name: 'Dr. Neha Gupta, DNB (Endocrinology)', hospital: 'Metabolic & Diabetes Clinic', accessGrantedOn: '04 Oct 2026', scope: 'HbA1c & Fasting Glucose Only' }
    ],
    accessLogs: [
      { id: 'log-1', entity: 'Dr. Alok Verma (Doctor Portal)', action: 'Viewed Complete Blood Count (CBC) PDF', timestamp: '14 Oct 2026, 11:22 AM', ip: '103.21.54.12' },
      { id: 'log-2', entity: 'Self (Patient Portal)', action: 'Downloaded Report #REP-8941', timestamp: '13 Oct 2026, 06:45 PM', ip: '49.36.128.90' },
      { id: 'log-3', entity: 'LabSetu Verification Service', action: 'QR Code Authenticity Verified', timestamp: '12 Oct 2026, 04:30 PM', ip: 'System' }
    ]
  };

  const { data: settings, update: setSettings } = useDemoResource('labsetu_privacy_settings', defaultSettings);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: '', hospital: '', scope: 'All Diagnostic Reports' });
  const [notice, setNotice] = useState('');

  const handleToggle = (key) => {
    const updated = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(updated);
    setNotice(lang === 'hi' ? 'गोपनीयता सेटिंग अपडेट की गई।' : 'Privacy consent preference updated.');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleRevokeDoctor = (id) => {
    const updated = {
      ...settings,
      authorizedDoctors: (settings.authorizedDoctors || []).filter(d => d.id !== id),
      accessLogs: [
        { id: `log-${Date.now()}`, entity: 'Self (Patient Consent)', action: `Revoked doctor access permission`, timestamp: 'Just now', ip: 'Self' },
        ...(settings.accessLogs || [])
      ]
    };
    setSettings(updated);
    setNotice(lang === 'hi' ? 'चिकित्सक की अनुमति रद्द की गई।' : 'Doctor viewing access revoked.');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!doctorForm.name.trim()) return;
    const newDoc = {
      id: `doc-${Date.now().toString().slice(-4)}`,
      name: doctorForm.name.trim(),
      hospital: doctorForm.hospital || 'Private Practice Clinic',
      accessGrantedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      scope: doctorForm.scope
    };
    const updated = {
      ...settings,
      authorizedDoctors: [...(settings.authorizedDoctors || []), newDoc],
      accessLogs: [
        { id: `log-${Date.now()}`, entity: 'Self (Patient Consent)', action: `Authorized ${newDoc.name}`, timestamp: 'Just now', ip: 'Self' },
        ...(settings.accessLogs || [])
      ]
    };
    setSettings(updated);
    setIsDoctorModalOpen(false);
    setDoctorForm({ name: '', hospital: '', scope: 'All Diagnostic Reports' });
    setNotice(lang === 'hi' ? 'चिकित्सक को रिपोर्ट देखने की अनुमति दी गई।' : `Access granted to ${newDoc.name}.`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleExportData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      patientInfo: {
        uhid: 'UHID-2026-8901',
        name: 'Ramesh Sharma',
        bloodGroup: 'B+',
        demographics: 'Male, 42 years'
      },
      diagnosticSummary: [
        { test: 'Complete Blood Count', date: '12 Oct 2026', result: 'Hemoglobin 14.2 g/dL, Platelets 2.45 L/cumm', lab: 'LabSetu Central Reference Lab' },
        { test: 'Fasting Blood Sugar', date: '12 Oct 2026', result: '94 mg/dL (Normal)', lab: 'LabSetu Central Reference Lab' },
        { test: 'Lipid Profile', date: '10 Oct 2026', result: 'Cholesterol 192 mg/dL, HDL 46 mg/dL, LDL 118 mg/dL', lab: 'MaxPath Laboratories' }
      ],
      consentLedger: settings.accessLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `labsetu-health-records-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setNotice(lang === 'hi' ? 'स्वास्थ्य रिकॉर्ड्स एक्सपोर्ट डाउनलोड शुरू हुआ।' : 'Clinical diagnostic health history downloaded.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheckIcon style={{ width: '28px', color: '#15803d' }} />
            {lang === 'hi' ? 'गोपनीयता, सहमति व डेटा नियंत्रण' : 'Patient Privacy & Consent Controls'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi'
              ? 'आपके मेडिकल रिकॉर्ड पर आपका पूर्ण अधिकार: डॉक्टर एक्सेस नियंत्रित करें और रिकॉर्ड एक्सपोर्ट करें'
              : 'Complete sovereignty over your diagnostic health data: authorize physicians and export clinical records'}
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowDownTrayIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'हेल्थ रिकॉर्ड एक्सपोर्ट करें' : 'Export Selected Health Records'}
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Consent Preferences Box */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LockClosedIcon style={{ width: '20px', color: '#15803d' }} />
          {lang === 'hi' ? 'सहमति और सूचना प्राथमिकताएं' : 'Data Sharing & Notification Consents'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>SMS Notifications &amp; OTP</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Receive instant SMS alerts when tests reach "Report Ready" status</div>
            </div>
            <input
              type="checkbox"
              checked={settings.smsAlerts}
              onChange={() => handleToggle('smsAlerts')}
              style={{ width: '18px', height: '18px' }}
            />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>WhatsApp Digital Report Dispatch</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Send signed PDF report directly to registered WhatsApp number</div>
            </div>
            <input
              type="checkbox"
              checked={settings.whatsappAlerts}
              onChange={() => handleToggle('whatsappAlerts')}
              style={{ width: '18px', height: '18px' }}
            />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Direct Physician Access</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Allow authorized consulting doctors to review diagnostic findings in Doctor Portal</div>
            </div>
            <input
              type="checkbox"
              checked={settings.shareWithTreatingDoctor}
              onChange={() => handleToggle('shareWithTreatingDoctor')}
              style={{ width: '18px', height: '18px' }}
            />
          </label>
        </div>
      </div>

      {/* Authorized Doctors List */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
              {lang === 'hi' ? 'अधिकृत चिकित्सक (डॉक्टर एक्सेस)' : 'Authorized Treating Doctors'}
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              These clinicians have received patient consent to review your released lab reports.
            </p>
          </div>
          <button
            onClick={() => setIsDoctorModalOpen(true)}
            style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UserPlusIcon style={{ width: '16px' }} /> Grant Doctor Access
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(settings.authorizedDoctors || []).map((doc) => (
            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{doc.name}</strong>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {doc.hospital} · Granted: {doc.accessGrantedOn} · Scope: <strong>{doc.scope}</strong>
                </div>
              </div>
              <button
                onClick={() => handleRevokeDoctor(doc.id)}
                style={{ background: 'white', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Revoke Access
              </button>
            </div>
          ))}
          {(settings.authorizedDoctors || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
              No doctors currently authorized. Your diagnostic data remains private to you.
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.5rem' }}>
          {lang === 'hi' ? 'डेटा एक्सेस ऑडिट लेजर' : 'Immutable Access Audit Trail'}
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>
          Real-time forensic record of every viewing or download of your laboratory findings.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(settings.accessLogs || []).map((log) => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{log.entity}</strong>
                <div style={{ color: '#64748b' }}>{log.action}</div>
              </div>
              <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>
                <div>{log.timestamp}</div>
                <div>IP: {log.ip}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grant Doctor Modal */}
      {isDoctorModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Authorize Doctor Access</h3>
              <button onClick={() => setIsDoctorModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleAddDoctor}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Doctor Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Verma, MD"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Hospital / Clinic Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Clinic or Private Practice"
                  value={doctorForm.hospital}
                  onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Consent Scope
                </label>
                <select
                  value={doctorForm.scope}
                  onChange={(e) => setDoctorForm({ ...doctorForm, scope: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="All Diagnostic Reports">All Diagnostic Reports</option>
                  <option value="Latest 30 Days Only">Latest 30 Days Only</option>
                  <option value="Specific Test (Biochemistry Only)">Specific Test (Biochemistry Only)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
