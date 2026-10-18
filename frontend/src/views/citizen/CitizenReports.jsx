import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { demoCitizenReports } from '../../data/mockLabData';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
  XMarkIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ensureArray } from '../../utils/arrayUtils';

export default function CitizenReports({ lang: propLang }) {
  const { currentUser } = useAuth();
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'comparison' | 'ocr'
  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // OCR verification state
  const [ocrSampleSelected, setOcrSampleSelected] = useState('cbc-sample');
  const [ocrValidated, setOcrValidated] = useState(false);
  const [ocrNotice, setOcrNotice] = useState('');

  const [ocrExtractedData, setOcrExtractedData] = useState({
    docType: 'External Lab Slip (City Diagnostics)',
    date: '2026-10-02',
    labName: 'City Pathology & Research Center',
    patient: 'Ramesh Sharma (42M)',
    values: [
      { name: 'Hemoglobin (Hb)', rawOcr: '13.9 g/dL', verifiedValue: '13.9', unit: 'g/dL', status: 'Matches Source' },
      { name: 'Total Leukocyte Count (WBC)', rawOcr: '7,400 /uL', verifiedValue: '7,400', unit: '/cu mm', status: 'Matches Source' },
      { name: 'Fasting Blood Glucose', rawOcr: '98 mg/dL', verifiedValue: '98', unit: 'mg/dL', status: 'Matches Source' },
      { name: 'Platelet Count', rawOcr: '2.30 L/cu mm', verifiedValue: '2.30', unit: 'Lakh/cu mm', status: 'Needs Verification' }
    ]
  });

  // Longitudinal parameter comparison dataset
  const trendData = [
    {
      parameter: 'HbA1c (Glycosylated Hemoglobin)',
      unit: '%',
      refRange: '< 5.7% Normal, 5.7-6.4% Prediabetes',
      history: [
        { date: '10 Jun 2026', value: 7.2, status: 'Elevated' },
        { date: '14 Sep 2026', value: 6.8, status: 'Borderline' }
      ],
      trend: 'Improving (Down by -0.4%)',
      trendClass: 'positive'
    },
    {
      parameter: 'Hemoglobin (Hb)',
      unit: 'g/dL',
      refRange: '13.0 - 17.0 g/dL',
      history: [
        { date: '10 Aug 2026', value: 13.2, status: 'Normal' },
        { date: '12 Sep 2026', value: 13.8, status: 'Normal' },
        { date: '12 Oct 2026', value: 14.2, status: 'Normal' }
      ],
      trend: 'Stable & Healthy (+1.0 g/dL)',
      trendClass: 'positive'
    },
    {
      parameter: 'Fasting Blood Sugar (FBS)',
      unit: 'mg/dL',
      refRange: '70 - 100 mg/dL (Normal)',
      history: [
        { date: '10 Aug 2026', value: 110, status: 'Borderline' },
        { date: '28 Aug 2026', value: 102, status: 'Borderline' },
        { date: '12 Oct 2026', value: 94, status: 'Normal' }
      ],
      trend: 'Returned to Optimal Normal Range',
      trendClass: 'positive'
    },
    {
      parameter: 'Total Cholesterol',
      unit: 'mg/dL',
      refRange: '< 200 mg/dL Desirable',
      history: [
        { date: '10 Jun 2026', value: 242, status: 'High' },
        { date: '28 Aug 2026', value: 218, status: 'Borderline' },
        { date: '10 Oct 2026', value: 192, status: 'Normal' }
      ],
      trend: 'Under Healthy Control (-50 mg/dL)',
      trendClass: 'positive'
    }
  ];

  useEffect(() => {
    if (initialSearch) {
      setQuery(initialSearch);
    }
  }, [initialSearch]);

  const categories = ['All', 'Haematology', 'Biochemistry', 'Endocrinology'];

  const filteredReports = ensureArray(demoCitizenReports).filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesQuery = !query.trim() || 
      r.testName?.toLowerCase().includes(query.toLowerCase()) ||
      r.id?.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    if (uploadedFile) {
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsPrescriptionModalOpen(false);
        setUploadedFile(null);
        alert(lang === 'hi' 
          ? 'प्रिस्क्रिप्शन सफलतापूर्वक सबमिट किया गया! हमारी लैब टीम 30 मिनट में आपसे संपर्क करेगी।' 
          : 'Prescription submitted! Our lab team will call you within 30 minutes with test quotations.');
      }, 1200);
    }
  };

  const handleVerifyOcr = () => {
    setOcrValidated(true);
    setOcrNotice(lang === 'hi'
      ? 'ओसीआर डेटा सफलतापूर्वक सत्यापित किया गया और आपके स्वास्थ्य रिकॉर्ड में जोड़ा गया।'
      : 'OCR values successfully verified against source document and synced to diagnostic tracker.');
    setTimeout(() => setOcrNotice(''), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>
            {lang === 'hi' ? 'मेरी नैदानिक ​​लैब रिपोर्ट्स' : 'My Diagnostic Lab Reports'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            {lang === 'hi' 
              ? 'प्रमाणित पैथोलॉजी, बायोकेमिस्ट्री एवं रेडियोलॉजी रिपोर्ट देखें, डाउनलोड करें और ट्रैक करें'
              : 'Securely view, download, explain and compare release-verified diagnostic findings'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/portal/explainer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              border: '1px solid #ddd6fe',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <SparklesIcon style={{ width: '18px' }} />
            {lang === 'hi' ? 'एआई एक्सप्लेनर खोलें' : 'AI Report Explainer'}
          </button>
          <button
            type="button"
            onClick={() => setIsPrescriptionModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <CloudArrowUpIcon style={{ width: '18px' }} />
            {lang === 'hi' ? 'प्रिस्क्रिप्शन अपलोड करें' : 'Upload Prescription'}
          </button>
        </div>
      </div>

      {/* Feature Nav Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'reports' ? '#dcfce7' : 'transparent',
            color: activeTab === 'reports' ? '#15803d' : '#64748b',
            fontWeight: activeTab === 'reports' ? '700' : '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <DocumentChartBarIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'जारी की गई रिपोर्ट्स' : 'Released Lab Reports'} ({demoCitizenReports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comparison')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'comparison' ? '#dcfce7' : 'transparent',
            color: activeTab === 'comparison' ? '#15803d' : '#64748b',
            fontWeight: activeTab === 'comparison' ? '700' : '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <ArrowTrendingUpIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'रिपोर्ट इतिहास व तुलना' : 'Report History & Trends'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ocr')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'ocr' ? '#dcfce7' : 'transparent',
            color: activeTab === 'ocr' ? '#15803d' : '#64748b',
            fontWeight: activeTab === 'ocr' ? '700' : '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <DocumentMagnifyingGlassIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'ओसीआर सत्यापन (OCR Verification)' : 'OCR Document Verification'}
        </button>
      </div>

      {/* TAB 1: ALL REPORTS */}
      {activeTab === 'reports' && (
        <>
          {/* Filter and Search Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={lang === 'hi' ? 'नाम या रिपोर्ट आईडी से खोजें...' : 'Search report by test name or ID (e.g. CBC, REP-8941)...'}
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

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? '#15803d' : '#cbd5e1',
                    backgroundColor: selectedCategory === cat ? '#dcfce7' : '#ffffff',
                    color: selectedCategory === cat ? '#15803d' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: selectedCategory === cat ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>REPORT ID</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>TEST / INVESTIGATION</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>CATEGORY</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>COLLECTION DATE</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>STATUS</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>REPORTING DOCTOR</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr 
                      key={report.id} 
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '600', 
                          color: '#15803d',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {report.id}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>
                        {report.testName}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {report.category}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {report.date}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: report.status === 'Ready' ? '#dcfce7' : '#fef3c7',
                          color: report.status === 'Ready' ? '#15803d' : '#b45309'
                        }}>
                          {report.status === 'Ready' ? '✓ Ready' : '⏳ In Lab Processing'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569', fontSize: '0.8rem' }}>
                        {report.doctor}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#1e293b',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <EyeIcon style={{ width: '15px' }} />
                            View
                          </button>
                          {report.status === 'Ready' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReport(report);
                                setTimeout(() => window.print(), 300);
                              }}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #86efac',
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <ArrowDownTrayIcon style={{ width: '15px' }} />
                              PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No diagnostic reports found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: LONGITUDINAL COMPARISON */}
      {activeTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowTrendingUpIcon style={{ width: '20px', color: '#15803d' }} />
              {lang === 'hi' ? 'बायोमार्कर्स का समय के साथ तुलनात्मक अध्ययन' : 'Historical Diagnostic Parameter Trends & Comparisons'}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Track how your vital health indices evolve across multiple laboratory visits over 3-12 months.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            {trendData.map((t, idx) => (
              <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: '#0f172a', fontSize: '1rem' }}>{t.parameter}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reference: {t.refRange}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: '700' }}>
                    {t.trend}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {t.history.map((h, hIdx) => (
                    <div key={hIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>📅 {h.date}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{h.value} {t.unit}</strong>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          background: h.status === 'Normal' ? '#dcfce7' : (h.status === 'Borderline' ? '#fef3c7' : '#fee2e2'),
                          color: h.status === 'Normal' ? '#15803d' : (h.status === 'Borderline' ? '#b45309' : '#dc2626')
                        }}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OCR DOCUMENT VERIFICATION */}
      {activeTab === 'ocr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '1rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#854d0e', fontWeight: '700', fontSize: '0.95rem' }}>
              <ShieldCheckIcon style={{ width: '22px', color: '#ca8a04' }} />
              Clinical Safety Rule: Validate OCR against Original Source Document
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#713f12' }}>
              All optical character recognition (OCR) extractions from external prescriptions or paper reports must be verified by a human before updating trends or clinical records.
            </p>
          </div>

          {ocrNotice && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem', borderRadius: '8px', border: '1px solid #86efac' }}>
              ✓ {ocrNotice}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Left: Source Document Simulation */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#0f172a' }}>1. Scanned Source Document</h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>External lab slip submitted for automated parameter extraction</p>

              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                <DocumentMagnifyingGlassIcon style={{ width: '42px', color: '#15803d', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{ocrExtractedData.docType}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Facility: <strong>{ocrExtractedData.labName}</strong> · Date: {ocrExtractedData.date}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#15803d', background: '#dcfce7', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
                  OCR Confidence Score: 98.4%
                </div>
              </div>
            </div>

            {/* Right: Extracted Parameters to verify */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>2. OCR Extracted Parameters</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Editable for correction</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ocrExtractedData.values.map((v, idx) => (
                  <div key={idx} style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{v.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '600' }}>{v.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Detected: {v.rawOcr}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>→</span>
                      <input
                        type="text"
                        defaultValue={v.verifiedValue}
                        style={{ width: '80px', padding: '0.2rem 0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleVerifyOcr}
                  disabled={ocrValidated}
                  style={{
                    backgroundColor: ocrValidated ? '#94a3b8' : '#15803d',
                    color: 'white',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: ocrValidated ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <CheckCircleIcon style={{ width: '18px' }} />
                  {ocrValidated ? 'Verified & Stored' : 'Confirm & Sync Verified OCR Values'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <div className="citizen-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="report-modal-card" onClick={e => e.stopPropagation()}>
            <div className="report-modal-header">
              <div>
                <h2>{selectedReport.testName}</h2>
                <span className="report-id-chip">Report ID: {selectedReport.id}</span>
              </div>
              <button 
                type="button" 
                className="citizen-modal-close" 
                onClick={() => setSelectedReport(null)}
              >
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <div className="report-modal-body">
              <div className="report-meta-grid">
                <div><span>Patient:</span> <strong>{currentUser?.name || 'Ramesh Sharma'}</strong></div>
                <div><span>UHID:</span> <strong>{currentUser?.uhid || 'UHID-2026-8901'}</strong></div>
                <div><span>Date of Collection:</span> <strong>{selectedReport.date}</strong></div>
                <div><span>Reporting Doctor:</span> <strong>{selectedReport.doctor}</strong></div>
              </div>

              {selectedReport.parameters.length > 0 ? (
                <div className="clinical-table-wrap">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>INVESTIGATION</th>
                        <th>OBSERVED VALUE</th>
                        <th>UNIT</th>
                        <th>BIOLOGICAL REFERENCE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.parameters.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.name}</strong></td>
                          <td><span className="param-value">{p.value}</span></td>
                          <td>{p.unit}</td>
                          <td>{p.reference}</td>
                          <td>
                            <span className={`clinical-badge ${p.status.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="processing-banner">
                  <ClockIcon style={{ width: '24px' }} />
                  <div>
                    <strong>Sample Processing in Laboratory</strong>
                    <p>{selectedReport.doctorRemark}</p>
                  </div>
                </div>
              )}

              {selectedReport.doctorRemark && selectedReport.parameters.length > 0 && (
                <div className="doctor-remarks">
                  <strong>Consultant Pathologist Impression:</strong>
                  <p>{selectedReport.doctorRemark}</p>
                </div>
              )}
            </div>

            <div className="report-modal-footer">
              <button 
                type="button" 
                className="report-action-btn primary"
                onClick={() => window.print()}
              >
                <PrinterIcon style={{ width: '18px' }} /> Print / Download PDF
              </button>
              <button
                type="button"
                className="report-action-btn"
                style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none' }}
                onClick={() => {
                  setSelectedReport(null);
                  navigate('/portal/explainer');
                }}
              >
                <SparklesIcon style={{ width: '18px' }} /> Explain with AI
              </button>
              <button 
                type="button" 
                className="report-action-btn secondary"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Prescription Modal */}
      {isPrescriptionModalOpen && (
        <div className="citizen-modal-backdrop" onClick={() => setIsPrescriptionModalOpen(false)}>
          <div className="citizen-modal-card" onClick={e => e.stopPropagation()}>
            <div className="citizen-modal-header">
              <h3>Upload Prescription</h3>
              <button 
                type="button" 
                className="citizen-modal-close" 
                onClick={() => setIsPrescriptionModalOpen(false)}
              >
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handlePrescriptionSubmit} className="citizen-modal-body">
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                Upload a photo or scanned copy of your doctor's prescription. Our certified laboratory team will extract required diagnostics and coordinate your sample collection.
              </p>

              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '2rem 1rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}>
                <CloudArrowUpIcon style={{ width: '36px', color: '#15803d', margin: '0 auto 0.5rem auto' }} />
                <label style={{ display: 'block', cursor: 'pointer', fontWeight: '600', color: '#15803d', fontSize: '0.875rem' }}>
                  Click to select prescription file
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => setUploadedFile(e.target.files?.[0]?.name || 'prescription_scan.pdf')}
                  />
                </label>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG or PDF up to 10MB</span>
                {uploadedFile && (
                  <div style={{ marginTop: '0.75rem', color: '#15803d', fontWeight: '600', fontSize: '0.85rem' }}>
                    ✓ Selected: {uploadedFile}
                  </div>
                )}
              </div>

              {uploadSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: '0.875rem' }}>
                  <CheckCircleIcon style={{ width: '18px' }} /> Uploaded successfully! Processing...
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFile}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: uploadedFile ? '#15803d' : '#94a3b8',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed'
                  }}
                >
                  Submit Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
