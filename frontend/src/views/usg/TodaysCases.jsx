import React, { useState } from 'react';
import '../cases/OutsourceCases.css';
import { PlusIcon, EyeIcon, PrinterIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function TodaysCasesUSG() {
  const initialCases = [
    { id: 'U-101', date: '2026-10-17', patient: 'John Smith', age: '45/M', investigations: 'Abdomen USG', sonologist: 'Dr. John Smith', status: 'New', findings: 'Liver size 14.5 cm with normal echogenicity. Gallbladder well distended, no calculi. Pancreas, spleen, both kidneys normal.' },
    { id: 'U-102', date: '2026-10-17', patient: 'Alice Brown', age: '32/F', investigations: 'Pelvic USG', sonologist: 'Dr. Emily Davis', status: 'In Progress', findings: 'Anteverted normal sized uterus. Endometrial thickness 7.2 mm. Both ovaries show physiological follicles.' },
    { id: 'U-103', date: '2026-10-17', patient: 'Tom Hanks', age: '58/M', investigations: 'Renal USG & KUB', sonologist: 'Dr. John Smith', status: 'Completed', findings: 'Bilateral kidneys normal in size, shape and position with maintained corticomedullary differentiation. No hydronephrosis.' },
  ];

  const { data: cases, update: setCases } = useDemoResource('labsetu_usg_todays_cases', initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({ patient: '', age: '', investigations: 'Abdomen USG', sonologist: 'Dr. John Smith' });
  const [notice, setNotice] = useState('');

  const filteredCases = (cases || []).filter(c => {
    const matchesSearch = c.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.investigations.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id, newStatus) => {
    const updated = (cases || []).map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCases(updated);
    if (selectedCase && selectedCase.id === id) {
      setSelectedCase({ ...selectedCase, status: newStatus });
    }
  };

  const handleAddCase = (e) => {
    e.preventDefault();
    if (!newCase.patient.trim()) return;
    const created = {
      id: `U-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 10),
      patient: newCase.patient.trim(),
      age: newCase.age.trim() || '30/M',
      investigations: newCase.investigations,
      sonologist: newCase.sonologist,
      status: 'New',
      findings: 'Ultrasound scan ordered. Preliminary scan pending sonologist review.'
    };
    setCases([created, ...(cases || [])]);
    setIsAddModalOpen(false);
    setNewCase({ patient: '', age: '', investigations: 'Abdomen USG', sonologist: 'Dr. John Smith' });
    setNotice(`Case ${created.id} registered for ${created.patient}.`);
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="cases-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Today's cases (USG)</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{ padding: '0.5rem 1rem', background: '#15803d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '500' }}
        >
          <PlusIcon style={{ width: '18px' }} /> Schedule USG Case
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Filter Row */}
      <div className="cases-date-picker" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.4rem 0.75rem', width: '280px' }}>
          <MagnifyingGlassIcon style={{ width: '18px', color: '#64748b', marginRight: '0.5rem' }} />
          <input
            type="text"
            placeholder="Search patient, ID or scan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', fontSize: '0.9rem' }}
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <table className="cases-table">
        <thead>
          <tr>
            <th>Reg. No.</th>
            <th>Date</th>
            <th>Patient</th>
            <th>Investigations</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCases.map((c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: '600', color: '#15803d' }}>{c.id}</td>
              <td>{c.date}</td>
              <td>
                <div style={{ fontWeight: '500' }}>{c.patient}</div>
                <small style={{ color: '#64748b' }}>{c.age}</small>
              </td>
              <td>{c.investigations}</td>
              <td>
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.id, e.target.value)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: c.status === 'Completed' ? '#dcfce7' : c.status === 'In Progress' ? '#fef9c3' : '#fee2e2',
                    color: c.status === 'Completed' ? '#15803d' : c.status === 'In Progress' ? '#854d0e' : '#b91c1c'
                  }}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </td>
              <td>
                <button
                  onClick={() => setSelectedCase(c)}
                  style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '500' }}
                >
                  <EyeIcon style={{ width: '16px' }} /> View Findings
                </button>
              </td>
            </tr>
          ))}
          {filteredCases.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No USG cases match the filter criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Case Details Modal */}
      {selectedCase && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>USG Case Record: {selectedCase.id}</h3>
                <small style={{ color: '#64748b' }}>{selectedCase.patient} ({selectedCase.age}) · {selectedCase.date}</small>
              </div>
              <button onClick={() => setSelectedCase(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}><strong>Investigation:</strong> {selectedCase.investigations}</div>
              <div style={{ marginBottom: '0.5rem' }}><strong>Sonologist:</strong> {selectedCase.sonologist}</div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Clinical Findings & Impression:</strong>
                <p style={{ marginTop: '0.25rem', color: '#334155', lineHeight: 1.5, background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  {selectedCase.findings}
                </p>
              </div>
              <div>
                <strong>Status:</strong> <span style={{ fontWeight: '600', color: selectedCase.status === 'Completed' ? '#15803d' : '#854d0e' }}>{selectedCase.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => window.print()}
                style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PrinterIcon style={{ width: '16px' }} /> Print USG Report
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

      {/* Add Case Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Schedule USG Case</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddCase}>
              <div className="setup-form-group">
                <label className="setup-label">Patient Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Ramesh Chandra"
                  value={newCase.patient}
                  onChange={(e) => setNewCase({ ...newCase, patient: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Age / Gender</label>
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="e.g. 42/M"
                    value={newCase.age}
                    onChange={(e) => setNewCase({ ...newCase, age: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Sonologist</label>
                  <select
                    className="setup-input"
                    value={newCase.sonologist}
                    onChange={(e) => setNewCase({ ...newCase, sonologist: e.target.value })}
                  >
                    <option value="Dr. John Smith">Dr. John Smith</option>
                    <option value="Dr. Emily Davis">Dr. Emily Davis</option>
                  </select>
                </div>
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Investigation / Scan Type</label>
                <select
                  className="setup-input"
                  value={newCase.investigations}
                  onChange={(e) => setNewCase({ ...newCase, investigations: e.target.value })}
                >
                  <option value="Abdomen USG">Abdomen USG</option>
                  <option value="Pelvic USG">Pelvic USG</option>
                  <option value="Renal USG & KUB">Renal USG & KUB</option>
                  <option value="Obstetric / Fetal USG">Obstetric / Fetal USG</option>
                  <option value="Thyroid USG">Thyroid USG</option>
                  <option value="Scrotal USG">Scrotal USG</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#15803d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Schedule Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
