import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
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
  const { lang: contextLang, t } = useTranslation();
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

  // Modal Scrolling Lock: Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [isModalOpen]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // State Reset on Close: Clear form state whenever modal is dismissed
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      category: 'Report Status',
      subject: '',
      description: ''
    });
  };

  const faqs = [
    {
      q: lang === 'hi' ? 'सैंपल लेने के कितनी देर बाद जांच रिपोर्ट मिलती है?' : 'How soon are test reports published after sample collection?',
      a: lang === 'hi' ? 'सीबीसी, यूरिन और ब्लड शुगर जैसी सामान्य जांच रिपोर्ट 3 से 6 घंटे में जारी हो जाती हैं। विटामिन डी, एचबीए1सी और थायरॉइड जैसी विशेष जांचों में 12 से 24 घंटे लगते हैं।' : 'Routine investigations such as Complete Blood Count (CBC), Urine Analysis, and Blood Sugar are typically released within 3 to 6 hours. Specialized panels like Vitamin D, HbA1c, and Thyroid are published within 12 to 24 hours.'
    },
    {
      q: lang === 'hi' ? 'मैं अपनी डिजिटल प्रमाणित रिपोर्ट कैसे डाउनलोड या शेयर कर सकता हूँ?' : 'How do I download or share my certified digital report?',
      a: lang === 'hi' ? 'बाएं मेनू से "मेरी रिपोर्ट्स" पर जाएं। क्यूआर कोड से प्रमाणित प्रतिलिपि सुरक्षित करने के लिए "रिपोर्ट देखें" या "डाउनलोड पीडीएफ" पर क्लिक करें।' : 'Navigate to "My Reports" from the left menu. Click "View Report" or "Download PDF" to save an authenticated digital copy with QR code verification.'
    },
    {
      q: lang === 'hi' ? 'क्या मैं अपनी अपॉइंटमेंट या होम कलेक्शन का समय बदल सकता हूँ?' : 'Can I cancel or reschedule my appointment or home pickup?',
      a: lang === 'hi' ? 'हाँ, निर्धारित समय से 2 घंटे पहले तक "मेरी बुकिंग्स" या "होम कलेक्शन" से पूरा रिफंड या समय में बदलाव किया जा सकता है।' : 'Yes. Appointments and doorstep collection can be rescheduled or cancelled with full refund up to 2 hours before the scheduled time slot from "My Bookings" or "Home Collection".'
    },
    {
      q: lang === 'hi' ? 'क्या टेस्ट की दरें मानकीकृत और पारदर्शी हैं?' : 'Are the test rates verified and standardized?',
      a: lang === 'hi' ? 'हाँ, सभी मान्यता प्राप्त प्रयोगशालाएं लैबसेतु के निर्धारित अधिकतम दर नियमों का पालन करती हैं, बिना किसी अतिरिक्त शुल्क के।' : 'Yes. All participating diagnostic laboratories adhere to the transparent maximum rate ceiling published in LabSetu without hidden phlebotomy surcharges.'
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
    handleCloseModal();
    setNotice(lang === 'hi' ? `${t('support.ticketLogged')}${created.id}` : `Support ticket registered: ${created.id}`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChatBubbleLeftRightIcon style={{ width: '26px', color: '#15803d' }} />
            {t('support.pageTitle')}
          </h1>
          <p className="citizen-page-subtitle">
            {t('support.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95 mb-6"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#059669',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: '1.5rem'
          }}
        >
          <PlusIcon className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
          <span>{t('support.raiseTicket')}</span>
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
          {t('support.yourTickets')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(tickets || []).map(item => (
            <div key={item.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {item.id}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                    {t('support.category')}: <strong>{item.category}</strong> · {item.date}
                  </span>
                  <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{item.subject}</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  background: item.status.includes('Resolved') ? '#dcfce7' : '#fef3c7',
                  color: item.status.includes('Resolved') ? '#15803d' : '#92400e'
                }}>
                  {item.status.includes('Resolved') ? t('support.resolved') : (item.status.includes('Under Review') ? t('support.underReview') : t('support.open'))}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem', color: '#334155', borderLeft: '3px solid #15803d', marginTop: '0.75rem' }}>
                <strong>Staff Note:</strong> {item.response}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
      <div>
        <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <QuestionMarkCircleIcon style={{ width: '22px', color: '#15803d' }} />
          {t('support.faqTitle')}
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

      {/* Modern Professional Support Ticket Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 overflow-hidden"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '32rem',
              padding: '1.5rem',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '1.25rem'
              }}
            >
              <h3
                id="ticket-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              >
                {t('support.createModalTitle')}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}
                aria-label="Close dialog"
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket}>
              {/* Category Dropdown */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.4rem'
                  }}
                >
                  {t('support.category')}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Report Status">{t('support.categories.reportStatus')}</option>
                  <option value="Home Collection">{t('support.categories.homeCollection')}</option>
                  <option value="Billing Issue">{t('support.categories.billingIssue')}</option>
                  <option value="Phlebotomist Delay">{t('support.categories.phlebotomistDelay')}</option>
                  <option value="Doctor Access">{t('support.categories.doctorAccess')}</option>
                  <option value="General Support">{t('support.categories.general')}</option>
                </select>
              </div>

              {/* Subject Line */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.4rem'
                  }}
                >
                  {t('support.subject')}
                </label>
                <input
                  type="text"
                  placeholder={t('support.subjectPlaceholder')}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* Description Textarea */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.4rem'
                  }}
                >
                  {t('support.description')}
                </label>
                <textarea
                  rows={4}
                  placeholder={t('support.descPlaceholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  style={{
                    width: '100%',
                    minHeight: '6rem',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: '1.5'
                  }}
                  required
                />
              </div>

              {/* Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-gray-600 hover:bg-gray-100 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('support.cancel')}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    padding: '0.5rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer'
                  }}
                >
                  {t('support.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
