import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenSupport({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const defaultTickets = [
    {
      id: 'TKT-1042',
      category: 'Report Status',
      subject: 'Inquiry regarding Vitamin D3 report release time',
      status: 'Resolved',
      date: '12 Oct 2026',
      response: 'Your Vitamin D3 test has been verified and the signed PDF report was published to your portal on 12 Oct at 04:30 PM.'
    },
    {
      id: 'TKT-1089',
      category: 'Home Collection',
      subject: 'Phlebotomist morning arrival timing confirmation',
      status: 'Open · In Progress',
      date: 'Today, 08:15 AM',
      response: 'Our customer support coordinator has assigned phlebotomist Suresh Kumar. Arrival window confirmed between 07:30 AM - 08:30 AM.'
    }
  ];

  const { data: tickets, update: setTickets } = useDemoResource('labsetu_support_tickets', defaultTickets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    category: 'Report Status',
    subject: '',
    description: ''
  });

  const faqs = [
    {
      q: 'How soon are test reports published after sample collection?',
      a: 'Routine investigations such as Complete Blood Count (CBC), Urine Analysis, and Blood Sugar are typically released within 3 to 6 hours. Specialized panels like Vitamin D, HbA1c, and Thyroid are published within 12 to 24 hours.'
    },
    {
      q: 'How do I download or share my certified digital report?',
      a: 'Navigate to "My Reports" from the left menu. Click "View Report" or "Download PDF" to save an authenticated digital copy with QR code verification.'
    },
    {
      q: 'Can I cancel or reschedule my appointment or home pickup?',
      a: 'Yes. Appointments and doorstep collection can be rescheduled or cancelled with full refund up to 2 hours before the scheduled time slot from "My Bookings" or "Home Collection".'
    },
    {
      q: 'Are the test rates verified and standardized?',
      a: 'Yes. All participating diagnostic laboratories adhere to the transparent maximum rate ceiling published in LabSetu without hidden phlebotomy surcharges.'
    }
  ];

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    const created = {
      id: `TKT-${Math.floor(1100 + Math.random() * 8900)}`,
      category: form.category,
      subject: form.subject.trim(),
      status: 'Open · Under Review',
      date: 'Just now',
      response: 'Ticket logged. A support coordinator will examine your query within 30 minutes.'
    };
    setTickets([created, ...(tickets || [])]);
    setIsModalOpen(false);
    setForm({ category: 'Report Status', subject: '', description: '' });
    setNotice(lang === 'hi' ? `शिकायत / टिकट दर्ज की गई: ${created.id}` : `Support ticket registered: ${created.id}`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChatBubbleLeftRightIcon style={{ width: '26px', color: '#15803d' }} />
            {lang === 'hi' ? 'मदद एवं शिकायत निवारण (सपोर्ट)' : 'Patient Help & Grievance Support'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi'
              ? 'रिपोर्ट में देरी, बिलिंग या होम कलेक्शन संबंधी सहायता प्राप्त करें'
              : 'Direct customer service assistance for diagnostic reports, billing, or phlebotomy'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <PlusIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'नई सहायता टिकट बनाएं' : 'Raise Support Ticket'}
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Emergency Helpline Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneIcon style={{ width: '22px', color: '#15803d' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600' }}>Toll-Free Patient Helpline</div>
            <a href="tel:18002008899" style={{ fontSize: '1.15rem', fontWeight: '700', color: '#15803d', textDecoration: 'none' }}>1800-200-8899</a>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mon-Sun: 06:30 AM - 10:00 PM</div>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EnvelopeIcon style={{ width: '22px', color: '#1d4ed8' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '600' }}>Email Support & Grievance</div>
            <a href="mailto:support@labsetu.com" style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1d4ed8', textDecoration: 'none' }}>support@labsetu.com</a>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Response within 2 business hours</div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '1rem' }}>
          {lang === 'hi' ? 'आपकी सहायता टिकट एवं स्थिति' : 'Your Support Tickets & Status'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(tickets || []).map(t => (
            <div key={t.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {t.id}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                    Category: <strong>{t.category}</strong> · {t.date}
                  </span>
                  <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{t.subject}</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  background: t.status.includes('Resolved') ? '#dcfce7' : '#fef3c7',
                  color: t.status.includes('Resolved') ? '#15803d' : '#92400e'
                }}>
                  {t.status}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem', color: '#334155', borderLeft: '3px solid #15803d', marginTop: '0.75rem' }}>
                <strong>Staff Note:</strong> {t.response}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
      <div>
        <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <QuestionMarkCircleIcon style={{ width: '22px', color: '#15803d' }} />
          {lang === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQ)' : 'Frequently Asked Patient Questions'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: '#0f172a'
                }}
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUpIcon style={{ width: '18px', color: '#64748b' }} /> : <ChevronDownIcon style={{ width: '18px', color: '#64748b' }} />}
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 1.25rem 1.25rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, borderTop: '1px solid #f1f5f9' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Raise a Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Report Status">Report Status &amp; Download</option>
                  <option value="Home Collection">Home Sample Pickup Issue</option>
                  <option value="Billing & Refund">Billing / Invoice Query</option>
                  <option value="Doctor Access">Doctor Portal Record Sharing</option>
                  <option value="General Support">Other General Inquiry</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Subject / Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. CBC report missing hemoglobin index"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide registration number, appointment date, or specific concern..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
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
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
