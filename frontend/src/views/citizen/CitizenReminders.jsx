import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import {
  BellAlertIcon,
  ClockIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenReminders({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const defaultReminders = [
    {
      id: 1,
      title: 'Fasting Blood Sugar Test Preparation',
      test: 'Fasting Blood Sugar (FBS)',
      date: 'Tomorrow, 07:30 AM',
      type: 'Preparation',
      instructions: 'Maintain 8 to 10 hours overnight fasting. You may sip plain water. Hold morning anti-diabetic medication until sample is drawn.',
      completed: false
    },
    {
      id: 2,
      title: 'HbA1c 3-Month Glycemic Monitoring',
      test: 'HbA1c Glycosylated Hemoglobin',
      date: 'Due in 6 weeks (01 Dec 2026)',
      type: 'Follow-up',
      instructions: 'Periodic 90-day assessment as advised by your endocrinologist to monitor glycemic control.',
      completed: false
    },
    {
      id: 3,
      title: 'Ultrasound Whole Abdomen Preparation',
      test: 'Abdomen USG',
      date: '24 Oct 2026, 11:00 AM',
      type: 'Preparation',
      instructions: 'Fast for 6 hours before scan. Drink 4 to 5 glasses of plain water 1 hour prior to scan; do not void bladder so it is well distended.',
      completed: false
    }
  ];

  const { data: reminders, update: setReminders } = useDemoResource('labsetu_reminders', defaultReminders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTest, setNewTest] = useState('Lipid Profile');
  const [newDate, setNewDate] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [notice, setNotice] = useState('');

  const toggleCompleted = (id) => {
    setReminders((reminders || []).map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = {
      id: Date.now(),
      title: newTitle.trim(),
      test: newTest,
      date: newDate || 'Upcoming',
      type: 'Custom Alert',
      instructions: newInstructions || 'Follow standard preparation guidelines.',
      completed: false
    };
    setReminders([...(reminders || []), created]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDate('');
    setNewInstructions('');
    setNotice(lang === 'hi' ? 'स्मरणपत्र (रिमाइंडर) सेट किया गया।' : 'Reminder alert scheduled successfully.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BellAlertIcon style={{ width: '26px', color: '#15803d' }} />
            {lang === 'hi' ? 'जांच तैयारी निर्देश व स्मरणपत्र (रिमाइंडर)' : 'Test Preparation & Health Reminders'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi'
              ? 'सटीक रिपोर्ट के लिए लैब-स्वीकृत उपवास (फास्टिंग) नियम और फॉलो-अप अलर्ट'
              : 'Lab-certified fasting protocols, medication guidelines, and follow-up clinical checks'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <PlusIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'नया रिमाइंडर जोड़ें' : 'Add Health Reminder'}
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Lab-approved Preparation Protocols Summary */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <InformationCircleIcon style={{ width: '20px', color: '#15803d' }} />
          {lang === 'hi' ? 'मानक लैब तैयारी नियम:' : 'Standard NABL Test Preparation Rules:'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#334155' }}>
          <div style={{ background: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#15803d' }}>Fasting Blood Tests:</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>Fasting Sugar, Lipid Profile, and Insulin require 10-12 hours overnight fast. Black coffee, tea, and juice are strictly avoided; only plain water permitted.</p>
          </div>
          <div style={{ background: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#15803d' }}>Thyroid Hormones:</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>If taking thyroid supplements (Thyroxine), take blood sample early morning in a fasting state BEFORE taking your daily pill, unless directed otherwise by your physician.</p>
          </div>
          <div style={{ background: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#15803d' }}>Urine Specimen:</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>Collect mid-stream clean-catch morning urine sample in sterile container provided by the phlebotomist.</p>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(reminders || []).map((r) => (
          <div
            key={r.id}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              opacity: r.completed ? 0.65 : 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <input
              type="checkbox"
              checked={r.completed}
              onChange={() => toggleCompleted(r.id)}
              style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer' }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', textDecoration: r.completed ? 'line-through' : 'none' }}>
                  {r.title}
                </h4>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '4px', background: r.type === 'Preparation' ? '#fef3c7' : '#dbeafe', color: r.type === 'Preparation' ? '#92400e' : '#1e40af' }}>
                  {r.type}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: '500', margin: '0.25rem 0' }}>
                {r.test} · 🕒 {r.date}
              </div>

              <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                {r.instructions}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Set New Health Reminder</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Reminder Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8-Hour Fasting Start Alert"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Related Diagnostic Test
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fasting Blood Glucose / Vitamin B12"
                  value={newTest}
                  onChange={(e) => setNewTest(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Target Date &amp; Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow 08:00 AM or 15 Nov 2026"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Preparation Guidance / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Drink 1 glass water, hold morning medicine..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
