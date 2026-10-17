import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { demoAvailableTests } from '../../data/mockLabData';
import {
  MagnifyingGlassIcon,
  BeakerIcon,
  ClockIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  HomeModernIcon,
  XMarkIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export default function CitizenTests({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [comparingTest, setComparingTest] = useState(null);

  const categories = ['All', 'Haematology', 'Biochemistry', 'Radiology / USG', 'Radiology', 'Special Diagnostics'];

  const filtered = demoAvailableTests.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesQ = !query.trim() || 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.code.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>
          {lang === 'hi' ? 'जांच एवं टेस्ट डायरेक्टरी' : 'Diagnostic Tests & Price Directory'}
        </h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          {lang === 'hi'
            ? 'पारदर्शी मूल्य, लैब तैयारी नियम, सैंपल आवश्यकताएं और सभी टेस्ट की बुकिंग'
            : 'Explore verified transparent pricing, test preparation protocols, and instant slot reservations'}
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'टेस्ट का नाम या कोड खोजें (उदा. CBC, लिपिड, थायरॉइड)...' : 'Search test name or code (e.g. Lipid, CBC, HbA1c, Thyroid)...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.25rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedCategory === c ? '#15803d' : '#cbd5e1',
                backgroundColor: selectedCategory === c ? '#dcfce7' : '#ffffff',
                color: selectedCategory === c ? '#15803d' : '#475569',
                fontSize: '0.8rem',
                fontWeight: selectedCategory === c ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filtered.map(t => (
          <div
            key={t.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.725rem',
                  fontWeight: '700',
                  color: '#15803d',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '4px'
                }}>
                  {t.code}
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                  ₹{t.price}
                </span>
              </div>

              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
                {t.name}
              </h3>
              <div style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Department: {t.category}
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                marginBottom: '1rem'
              }}>
                <div>🧪 <strong>Specimen:</strong> {t.sample}</div>
                <div>🍽️ <strong>Preparation:</strong> {t.fasting}</div>
                <div>⏱️ <strong>Reporting TAT:</strong> {t.tat}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/portal/appointments/book')}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <CalendarDaysIcon style={{ width: '15px' }} />
                  In-Lab Visit
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/portal/home-collection')}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <HomeModernIcon style={{ width: '15px' }} />
                  Home Pickup
                </button>
              </div>

              <button
                type="button"
                onClick={() => setComparingTest(t)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.78rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  textDecoration: 'underline'
                }}
              >
                Compare verified prices across partner labs →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compare Lab Prices Modal */}
      {comparingTest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Compare Prices: {comparingTest.name}</h3>
                <small style={{ color: '#64748b' }}>Standard Base Reference: ₹{comparingTest.price}</small>
              </div>
              <button onClick={() => setComparingTest(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { lab: 'LabSetu Central Reference Lab', price: comparingTest.price, dist: '1.2 km', nabl: true, slot: 'Today, 03:30 PM' },
                { lab: 'MaxPath Precision Laboratories', price: Math.round(comparingTest.price * 1.1), dist: '2.8 km', nabl: true, slot: 'Today, 04:15 PM' },
                { lab: 'Apollo Diagnostic Regional Hub', price: Math.round(comparingTest.price * 1.05), dist: '4.1 km', nabl: true, slot: 'Tomorrow, 08:00 AM' },
                { lab: 'Sanjeevani Path Lab', price: Math.max(100, Math.round(comparingTest.price * 0.85)), dist: '0.8 km', nabl: false, slot: 'Today, 02:45 PM' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.lab}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {item.dist} · {item.nabl ? 'NABL Accredited' : 'Registered'} · Next slot: {item.slot}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#15803d' }}>₹{item.price}</div>
                    <button
                      onClick={() => {
                        setComparingTest(null);
                        navigate('/portal/appointments/book');
                      }}
                      style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.2rem' }}
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setComparingTest(null)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
