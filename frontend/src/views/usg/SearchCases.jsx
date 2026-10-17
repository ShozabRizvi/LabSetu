import React, { useState } from 'react';
import '../cases/OutsourceCases.css';
import { MagnifyingGlassIcon, EyeIcon, XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function SearchCasesUSG() {
  const allCases = [
    { id: 'U-098', date: '2026-10-15', patient: 'Mike Doe', age: '52/M', investigations: 'Abdomen USG', sonologist: 'Dr. John Smith', status: 'Completed', findings: 'Grade 1 fatty liver. Gallbladder, pancreas, spleen, both kidneys within normal anatomical limits.' },
    { id: 'U-099', date: '2026-10-15', patient: 'Sarah Connor', age: '29/F', investigations: 'Fetal USG (Target Scan)', sonologist: 'Dr. Emily Davis', status: 'Completed', findings: 'Single live intrauterine gestation of approximately 20 weeks 4 days. Normal fetal anatomy and liquor volume.' },
    { id: 'U-100', date: '2026-10-16', patient: 'Peter Parker', age: '24/M', investigations: 'KUB USG', sonologist: 'Dr. John Smith', status: 'Completed', findings: 'No renal or ureteric calculus seen. Bladder wall thickness within normal parameters. Pre and post-void volumes normal.' },
    { id: 'U-101', date: '2026-10-17', patient: 'John Smith', age: '45/M', investigations: 'Abdomen USG', sonologist: 'Dr. John Smith', status: 'New', findings: 'Preliminary order placed. Pending examination.' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const filteredCases = allCases.filter(c =>
    c.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.investigations.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="cases-container">
      <h2>Search cases (USG)</h2>
      <div className="cases-date-picker" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="cases-date-input" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', width: '320px' }}>
          <MagnifyingGlassIcon style={{ width: '18px', marginRight: '0.5rem', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search by patient name, reg. ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%' }}
          />
        </div>
        <button
          onClick={() => {}}
          style={{ padding: '0.5rem 1rem', background: '#15803d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
        >
          Filter ({filteredCases.length})
        </button>
      </div>

      <table className="cases-table">
        <thead>
          <tr>
            <th>Reg. No.</th>
            <th>Date</th>
            <th>Patient</th>
            <th>Investigations</th>
            <th>Sonologist</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCases.map(c => (
            <tr key={c.id}>
              <td style={{ fontWeight: '600', color: '#15803d' }}>{c.id}</td>
              <td>{c.date}</td>
              <td>
                <div style={{ fontWeight: '500' }}>{c.patient}</div>
                <small style={{ color: '#64748b' }}>{c.age}</small>
              </td>
              <td>{c.investigations}</td>
              <td>{c.sonologist}</td>
              <td>
                <span className={c.status === 'Completed' ? 'status-final' : 'status-new'}>
                  {c.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => setSelectedCase(c)}
                  style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                >
                  <EyeIcon style={{ width: '16px' }} /> View Report
                </button>
              </td>
            </tr>
          ))}
          {filteredCases.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No records found matching "{searchQuery}".
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Case Details Modal */}
      {selectedCase && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>USG Scan: {selectedCase.id}</h3>
                <small style={{ color: '#64748b' }}>{selectedCase.patient} ({selectedCase.age})</small>
              </div>
              <button onClick={() => setSelectedCase(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.5rem' }}><strong>Investigation:</strong> {selectedCase.investigations}</div>
              <div style={{ marginBottom: '0.5rem' }}><strong>Exam Date:</strong> {selectedCase.date}</div>
              <div style={{ marginBottom: '0.5rem' }}><strong>Reporting Radiologist:</strong> {selectedCase.sonologist}</div>
              <div style={{ marginTop: '0.75rem' }}>
                <strong>Ultrasound Observations:</strong>
                <p style={{ marginTop: '0.25rem', color: '#334155', lineHeight: 1.5, background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  {selectedCase.findings}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => window.print()}
                style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PrinterIcon style={{ width: '16px' }} /> Print Report
              </button>
              <button
                onClick={() => setSelectedCase(null)}
                style={{ padding: '0.5rem 1rem', background: '#15803d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
