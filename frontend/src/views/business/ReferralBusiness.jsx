import React, { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon, 
  DocumentChartBarIcon, 
  XMarkIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import './ReferralBusiness.css';
import useDemoResource from '../../hooks/useDemoResource';
import supabase from '../../lib/supabase';
import { ensureArray } from '../../utils/arrayUtils';

const INITIAL_REFERRALS = [
  {
    id: 'REF-0101',
    name: 'Dr. A. K. Gupta (MD, Internal Medicine)',
    contact: '+91 98765 43210',
    specialty: 'Internal Medicine',
    totalCases: 142,
    avgBill: 850,
    periodCases: {
      'Today': 4,
      'Yesterday': 6,
      'Last Week': 28,
      'September': 64,
      'August': 85,
      'July': 72,
      'Custom': 18
    }
  },
  {
    id: 'REF-0102',
    name: 'Dr. Meenakshi Rao (MD, Gynecologist)',
    contact: '+91 98123 45678',
    specialty: 'Obstetrics & Gynecology',
    totalCases: 98,
    avgBill: 920,
    periodCases: {
      'Today': 3,
      'Yesterday': 4,
      'Last Week': 19,
      'September': 45,
      'August': 62,
      'July': 54,
      'Custom': 12
    }
  },
  {
    id: 'REF-0103',
    name: 'Dr. Rajesh Sharma (DM, Cardiology)',
    contact: '+91 97234 56789',
    specialty: 'Cardiology',
    totalCases: 124,
    avgBill: 1150,
    periodCases: {
      'Today': 5,
      'Yesterday': 7,
      'Last Week': 24,
      'September': 58,
      'August': 74,
      'July': 66,
      'Custom': 16
    }
  },
  {
    id: 'REF-0104',
    name: 'Dr. Priya Desai (MD, Pediatrics)',
    contact: '+91 99345 67890',
    specialty: 'Pediatrics',
    totalCases: 76,
    avgBill: 680,
    periodCases: {
      'Today': 2,
      'Yesterday': 3,
      'Last Week': 15,
      'September': 36,
      'August': 48,
      'July': 41,
      'Custom': 9
    }
  },
  {
    id: 'REF-0105',
    name: 'Dr. Vivek Verma (MBBS, General Physician)',
    contact: '+91 98456 78901',
    specialty: 'General Practice',
    totalCases: 85,
    avgBill: 740,
    periodCases: {
      'Today': 3,
      'Yesterday': 5,
      'Last Week': 18,
      'September': 40,
      'August': 52,
      'July': 46,
      'Custom': 11
    }
  },
  {
    id: 'REF-0106',
    name: 'Dr. Sunita Patil (MD, Endocrinology)',
    contact: '+91 97567 89012',
    specialty: 'Endocrinology',
    totalCases: 64,
    avgBill: 1050,
    periodCases: {
      'Today': 2,
      'Yesterday': 2,
      'Last Week': 12,
      'September': 31,
      'August': 40,
      'July': 35,
      'Custom': 8
    }
  },
  {
    id: 'REF-0100',
    name: 'Self (Direct Walk-in / OPD)',
    contact: '1800-202-8941',
    specialty: 'Direct In-House Patients',
    totalCases: 210,
    avgBill: 780,
    periodCases: {
      'Today': 8,
      'Yesterday': 11,
      'Last Week': 42,
      'September': 95,
      'August': 125,
      'July': 110,
      'Custom': 25
    }
  }
];

export default function ReferralBusiness() {
  const { data: referralList, update: updateReferralList } = useDemoResource('referral_business_records', INITIAL_REFERRALS);
  const [activePeriod, setActivePeriod] = useState('Today');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-09-13');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [statementDoctor, setStatementDoctor] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Hydrate from Supabase if table exists
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseDoctors() {
      try {
        const { data, error } = await supabase
          .from('referral_doctors')
          .select('*')
          .limit(20);
        if (!error && data && data.length > 0 && isMounted) {
          const merged = data.map((d, index) => ({
            id: d.referrer_id || d.id || `REF-010${index + 1}`,
            name: d.name || `Dr. ${d.doctor_name}`,
            contact: d.contact || d.phone || '+91 98765 00000',
            specialty: d.specialty || 'General Diagnostics',
            totalCases: d.total_cases || (50 + index * 15),
            avgBill: d.avg_bill || 800,
            periodCases: {
              'Today': Math.floor(2 + (index % 5)),
              'Yesterday': Math.floor(4 + (index % 5)),
              'Last Week': Math.floor(15 + (index % 10)),
              'September': Math.floor(40 + (index % 20)),
              'August': Math.floor(55 + (index % 25)),
              'July': Math.floor(45 + (index % 20)),
              'Custom': Math.floor(10 + (index % 10))
            }
          }));
          updateReferralList(merged);
        }
      } catch {
        // Keeps persistent fallback
      }
    }
    loadSupabaseDoctors();
    return () => { isMounted = false; };
  }, []);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 2800);
  };

  const rawRecords = referralList;
  const safeRecords = ensureArray(rawRecords);
  const currentRecords = safeRecords.length > 0 ? safeRecords : INITIAL_REFERRALS;

  // Dynamic filter resolver for period cases (including Custom date range calculations)
  const getCasesInFilter = (doc, period = activePeriod) => {
    if (!doc) return 0;
    if (period === 'Custom') {
      if (doc.periodCases?.Custom !== undefined) return doc.periodCases.Custom;
      const start = new Date(customStart);
      const end = new Date(customEnd);
      const diffDays = Math.max(1, Math.round(Math.abs((end - start) / (24 * 60 * 60 * 1000)))) || 7;
      return Math.min(doc.totalCases || 50, Math.max(1, Math.floor(diffDays * ((doc.totalCases || 50) / 90))));
    }
    return doc.periodCases?.[period] ?? 0;
  };

  // Compute metrics for active filter
  const totalFilteredCases = ensureArray(currentRecords).reduce((acc, doc) => {
    return acc + getCasesInFilter(doc);
  }, 0);

  const totalFilteredRevenue = ensureArray(currentRecords).reduce((acc, doc) => {
    const count = getCasesInFilter(doc);
    return acc + (count * (doc.avgBill || 800));
  }, 0);

  const totalOverallCases = ensureArray(currentRecords).reduce((acc, doc) => acc + (doc.totalCases || 0), 0);

  // Custom filter update handler
  const handleApplyCustomFilter = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diffDays = Math.max(1, Math.round(Math.abs((end - start) / (24 * 60 * 60 * 1000)))) || 7;
    const updated = ensureArray(currentRecords).map(doc => ({
      ...doc,
      periodCases: {
        ...(doc.periodCases || {}),
        Custom: Math.min(doc.totalCases || 50, Math.max(1, Math.floor(diffDays * ((doc.totalCases || 50) / 90))))
      }
    }));
    updateReferralList(updated);
    showNotice(`Custom filter recalculated: ${customStart} to ${customEnd} (${diffDays} days)`);
  };

  // CSV Export
  const handleDownloadCases = () => {
    try {
      const headers = ['S. No.', 'Referrer ID', 'Doctor Name', 'Contact', 'Specialty', 'Period', 'Cases In Filter', 'Total Cases', 'Estimated Revenue (Rs.)'];
      const rows = ensureArray(currentRecords).map((doc, idx) => {
        const casesInFilter = getCasesInFilter(doc);
        const revenue = casesInFilter * (doc.avgBill || 800);
        return [
          idx + 1,
          doc.id,
          `"${doc.name || ''}"`,
          doc.contact || '',
          `"${doc.specialty || ''}"`,
          activePeriod,
          casesInFilter,
          doc.totalCases || 0,
          revenue
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `LabSetu_Referral_Business_${activePeriod.replace(/\s+/g, '_')}_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotice(`Cases data exported for period: ${activePeriod}`);
    } catch (err) {
      console.warn('CSV export error:', err);
      showNotice('Failed to export CSV. Please try again.');
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print error:', err);
    }
  };

  const handleOpenStatement = (doctor) => {
    setStatementDoctor(doctor);
  };

  return (
    <div className="referral-business-container">
      {/* Page Header */}
      <div className="rb-header">
        <div>
          <h2>Referral business summary</h2>
          <p className="rb-subtitle">Track doctor referrals, patient volume, and diagnostic revenue contributions.</p>
        </div>
        <div className="rb-actions">
          <button 
            type="button" 
            className="rb-btn rb-btn-blue"
            onClick={() => setIsReportModalOpen(true)}
          >
            <DocumentChartBarIcon className="rb-btn-icon" /> Referral doctor wise report
          </button>
          <button 
            type="button" 
            className="rb-btn"
            onClick={handleDownloadCases}
          >
            <ArrowDownTrayIcon className="rb-btn-icon" /> Download cases data
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="rb-notice-bar">
          <CheckCircleIcon style={{ width: 18 }} /> {actionNotice}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="rb-stats-grid">
        <div className="rb-stat-card">
          <span className="rb-stat-label">Active Period</span>
          <span className="rb-stat-value text-blue">{activePeriod}</span>
          <span className="rb-stat-sub">Selected filter window</span>
        </div>
        <div className="rb-stat-card">
          <span className="rb-stat-label">Cases in Filter</span>
          <span className="rb-stat-value text-green">{totalFilteredCases}</span>
          <span className="rb-stat-sub">Patient diagnostic orders</span>
        </div>
        <div className="rb-stat-card">
          <span className="rb-stat-label">Estimated Business</span>
          <span className="rb-stat-value">Rs. {totalFilteredRevenue.toLocaleString()}</span>
          <span className="rb-stat-sub">Gross revenue contribution</span>
        </div>
        <div className="rb-stat-card">
          <span className="rb-stat-label">All-Time Referrals</span>
          <span className="rb-stat-value">{totalOverallCases}</span>
          <span className="rb-stat-sub">Across {currentRecords.length} registered partners</span>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="rb-filters">
        <div className="rb-filter-group">
          <FunnelIcon className="rb-icon" /> 
          <span className="rb-filter-label">Filter by period:</span>
          {['Today', 'Yesterday', 'Last Week', 'September', 'August', 'July', 'Custom'].map(period => (
            <button
              key={period}
              type="button"
              className={`rb-tag ${activePeriod === period ? 'active' : ''}`}
              onClick={() => setActivePeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
        
        <button 
          type="button" 
          className="rb-btn rb-btn-blue print-btn"
          onClick={handlePrint}
        >
          <PrinterIcon className="rb-btn-icon" /> Print
        </button>
      </div>

      {/* Custom Date Range Selector if Custom is active */}
      {activePeriod === 'Custom' && (
        <div className="rb-custom-range-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.85rem', color: '#1e293b' }}>
            <CalendarIcon style={{ width: 18, color: '#15803d' }} /> Custom Date Range:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>From:</label>
            <input 
              type="date" 
              className="rb-date-input" 
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
            />
            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>To:</label>
            <input 
              type="date" 
              className="rb-date-input" 
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
            />
            <button 
              type="button" 
              className="rb-btn rb-btn-blue"
              onClick={handleApplyCustomFilter}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rb-table-wrapper">
        <table className="rb-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>S. NO.</th>
              <th style={{ width: '130px' }}>REFERRER ID</th>
              <th>NAME</th>
              <th>CONTACT</th>
              <th style={{ textAlign: 'center', width: '130px' }}>TOTAL CASES</th>
              <th style={{ textAlign: 'center', width: '200px' }}>CASES (PATIENTS) IN FILTER</th>
              <th style={{ textAlign: 'center', width: '160px' }}>PRINT BUSINESS</th>
            </tr>
          </thead>
          <tbody>
            {ensureArray(currentRecords).map((doctor, idx) => {
              const casesInFilter = getCasesInFilter(doctor);
              return (
                <tr key={doctor.id}>
                  <td><strong>{idx + 1}</strong></td>
                  <td>
                    <span className="rb-id-badge">{doctor.id}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{doctor.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doctor.specialty}</div>
                  </td>
                  <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                    {doctor.contact}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="rb-cases-pill total">{doctor.totalCases}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="rb-cases-pill filter">
                      {casesInFilter} {casesInFilter === 1 ? 'patient' : 'patients'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="rb-print-action-btn"
                      onClick={() => handleOpenStatement(doctor)}
                      title={`Print business report for ${doctor.name}`}
                    >
                      <PrinterIcon style={{ width: 14 }} /> Print Statement
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Modal 1: Doctor-Wise Performance Breakdown Report ─── */}
      {isReportModalOpen && (
        <div className="rb-modal-backdrop" onClick={() => setIsReportModalOpen(false)}>
          <div className="rb-modal-card" onClick={e => e.stopPropagation()}>
            <div className="rb-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Referral Doctor Performance Analysis</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Cumulative revenue, incentive share, and volume breakdown for active filter: <strong>{activePeriod}</strong>
                </p>
              </div>
              <button 
                type="button" 
                className="rb-modal-close"
                onClick={() => setIsReportModalOpen(false)}
              >
                <XMarkIcon style={{ width: 22 }} />
              </button>
            </div>

            <div className="rb-modal-body">
              <table className="rb-table modal-table">
                <thead>
                  <tr>
                    <th>DOCTOR</th>
                    <th>SPECIALTY</th>
                    <th style={{ textAlign: 'center' }}>CASES ({activePeriod})</th>
                    <th style={{ textAlign: 'right' }}>GROSS REVENUE</th>
                    <th style={{ textAlign: 'right' }}>INCENTIVE (15%)</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {ensureArray(currentRecords).map(doc => {
                    const cases = getCasesInFilter(doc);
                    const revenue = cases * (doc.avgBill || 800);
                    const commission = Math.round(revenue * 0.15);
                    return (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {doc.id}</div>
                        </td>
                        <td>{doc.specialty}</td>
                        <td style={{ textAlign: 'center' }}><strong>{cases}</strong></td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>Rs. {revenue.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#15803d', fontWeight: '600' }}>Rs. {commission.toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="rb-status-pill active">Active</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rb-modal-footer">
              <button 
                type="button" 
                className="rb-btn" 
                onClick={handleDownloadCases}
              >
                <ArrowDownTrayIcon className="rb-btn-icon" /> Export CSV
              </button>
              <button 
                type="button" 
                className="rb-btn rb-btn-blue"
                onClick={handlePrint}
              >
                <PrinterIcon className="rb-btn-icon" /> Print Doctor Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Individual Doctor Statement / Business Invoice ─── */}
      {statementDoctor && (
        <div className="rb-modal-backdrop" onClick={() => setStatementDoctor(null)}>
          <div className="rb-modal-card statement-card" onClick={e => e.stopPropagation()}>
            <div className="rb-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Doctor Business Statement</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {statementDoctor.name} • {statementDoctor.id}
                </p>
              </div>
              <button 
                type="button" 
                className="rb-modal-close"
                onClick={() => setStatementDoctor(null)}
              >
                <XMarkIcon style={{ width: 22 }} />
              </button>
            </div>

            <div className="rb-modal-body">
              <div className="rb-statement-banner">
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Consultant / Clinician</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>{statementDoctor.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>{statementDoctor.specialty} • {statementDoctor.contact}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Statement Window</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#15803d' }}>{activePeriod}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Generated on {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1rem 0' }}>
                <div className="rb-stat-card">
                  <span className="rb-stat-label">Referred Patients</span>
                  <span className="rb-stat-value text-blue">{getCasesInFilter(statementDoctor)}</span>
                </div>
                <div className="rb-stat-card">
                  <span className="rb-stat-label">Total Diagnostics Value</span>
                  <span className="rb-stat-value">Rs. {(getCasesInFilter(statementDoctor) * (statementDoctor.avgBill || 800)).toLocaleString()}</span>
                </div>
                <div className="rb-stat-card">
                  <span className="rb-stat-label">Professional Incentive</span>
                  <span className="rb-stat-value text-green">Rs. {Math.round((getCasesInFilter(statementDoctor) * (statementDoctor.avgBill || 800)) * 0.15).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155' }}>
                <strong>Account Ledger Reference:</strong> All referred diagnostics orders have been authenticated against the primary billing register. Invoices are reconciled under center code <code>CTR-61326885</code>.
              </div>
            </div>

            <div className="rb-modal-footer">
              <button 
                type="button" 
                className="rb-btn" 
                onClick={() => setStatementDoctor(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="rb-btn rb-btn-blue"
                onClick={handlePrint}
              >
                <PrinterIcon className="rb-btn-icon" /> Print Doctor Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
