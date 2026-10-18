import React, { useState } from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function TestCounts() {
  const allCounts = [
    { id: 1, name: 'Complete Blood Count (CBC)', category: 'Haematology', count: 48, revenue: 16800 },
    { id: 2, name: 'Lipid Profile', category: 'Biochemistry', count: 24, revenue: 15600 },
    { id: 3, name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', count: 35, revenue: 4200 },
    { id: 4, name: 'Thyroid Profile (T3, T4, TSH)', category: 'Biochemistry', count: 19, revenue: 11400 },
    { id: 5, name: 'Liver Function Test (LFT)', category: 'Biochemistry', count: 22, revenue: 16500 },
    { id: 6, name: 'Kidney Function Test (KFT)', category: 'Biochemistry', count: 21, revenue: 14700 },
    { id: 7, name: 'Urine Routine & Microscopic', category: 'Clinical Pathology', count: 31, revenue: 6200 },
    { id: 8, name: 'HbA1c Glycosylated Hemoglobin', category: 'Biochemistry', count: 18, revenue: 9000 },
    { id: 9, name: 'Vitamin D (25-OH)', category: 'Biochemistry', count: 14, revenue: 14000 },
    { id: 10, name: 'Dengue NS1 Antigen', category: 'Serology', count: 9, revenue: 7200 }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-10-17');

  const filteredCounts = allCounts.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTests = filteredCounts.reduce((acc, t) => acc + t.count, 0);
  const totalRevenue = filteredCounts.reduce((acc, t) => acc + t.revenue, 0);

  const shiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{ justifyContent: 'space-between' }}>
        <h2>Daily Test Volume & Counts</h2>
        <button
          onClick={() => window.print()}
          className="lab-btn lab-btn-blue"
          style={{ background: 'transparent', color: '#334155', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <PrinterIcon style={{ width: '16px' }} /> Print Daily Summary
        </button>
      </div>

      <div className="lab-controls-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => shiftDate(-1)}
            style={{ padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
          >
            <ChevronLeftIcon style={{ width: '16px' }} />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="lab-input"
            style={{ width: '160px' }}
          />
          <button
            onClick={() => shiftDate(1)}
            style={{ padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
          >
            <ChevronRightIcon style={{ width: '16px' }} />
          </button>
        </div>

        <div className="lab-search-input-wrapper" style={{ maxWidth: '300px' }}>
          <MagnifyingGlassIcon className="lab-search-icon" />
          <input
            type="text"
            placeholder="Search test name or category..."
            className="lab-input"
            style={{ width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <span style={{ color: '#64748b' }}>Total Tests: <strong style={{ color: '#0f172a' }}>{totalTests}</strong></span>
          <span style={{ color: '#64748b' }}>Est. Volume: <strong style={{ color: '#15803d' }}>₹ {totalRevenue.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>S.NO</th>
            <th>TEST NAME</th>
            <th>DEPARTMENT</th>
            <th>COMPLETED COUNT</th>
            <th>VOLUME ESTIMATE</th>
          </tr>
        </thead>
        <tbody>
          {filteredCounts.map((t, idx) => (
            <tr key={t.id} className="lab-hover-interactive">
              <td>{idx + 1}</td>
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{t.name}</td>
              <td style={{ color: '#64748b' }}>{t.category}</td>
              <td>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                  {t.count}
                </span>
              </td>
              <td style={{ fontWeight: '500', color: '#15803d' }}>
                ₹ {t.revenue.toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
          {filteredCounts.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No tests match "{searchQuery}".
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
