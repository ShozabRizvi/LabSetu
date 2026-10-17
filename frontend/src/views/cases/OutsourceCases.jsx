import React, { useState } from 'react';
import './OutsourceCases.css';
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function OutsourceCases() {
  const [cases, setCases] = useState([
    { id: 'OUT-101', regNo: 'REG-1048', date: '13/09/2026', patient: 'Deepak Chopra', investigations: 'Biopsy / Histopathology (Large Specimen)', partnerLab: 'Metropolis Reference Lab', status: 'Sent to Lab' },
    { id: 'OUT-102', regNo: 'REG-1042', date: '11/09/2026', patient: 'Pooja Bhatt', investigations: 'Karyotyping Genetic Scan', partnerLab: 'Oncquest Central Lab', status: 'Processing' },
    { id: 'OUT-103', regNo: 'REG-1036', date: '09/09/2026', patient: 'Rahul Saxena', investigations: 'Autoimmune Profile (ANA Blot 17)', partnerLab: 'Lal PathLabs Reference', status: 'Report Received' }
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({ patient: '', investigations: 'Biopsy Histopathology', partnerLab: 'Metropolis Reference Lab' });

  const handleAddCase = (e) => {
    e.preventDefault();
    if (newCase.patient) {
      const item = {
        id: `OUT-${Math.floor(104 + Math.random() * 90)}`,
        regNo: `REG-${Math.floor(1060 + Math.random() * 100)}`,
        date: new Date().toLocaleDateString('en-GB'),
        patient: newCase.patient,
        investigations: newCase.investigations,
        partnerLab: newCase.partnerLab,
        status: 'Sent to Lab'
      };
      setCases([item, ...cases]);
      setIsModalOpen(false);
      setNewCase({ patient: '', investigations: 'Biopsy Histopathology', partnerLab: 'Metropolis Reference Lab' });
    }
  };

  const filtered = cases.filter(c =>
    !search.trim() ||
    c.patient.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.investigations.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="cases-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2>Outsource Laboratory Cases</h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#15803d',
            color: '#ffffff',
            border: 'none',
            padding: '0.55rem 0.9rem',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <PlusIcon style={{ width: '16px' }} /> + Dispatch Outsource Sample
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', width: '16px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search outsource cases or labs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <table className="cases-table">
        <thead>
          <tr>
            <th>Outsource ID</th>
            <th>Reg No.</th>
            <th>Date</th>
            <th>Patient</th>
            <th>Investigations</th>
            <th>Reference Lab</th>
            <th>Status</th>
            <th>Tracking</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id}>
              <td><strong>{c.id}</strong></td>
              <td>{c.regNo}</td>
              <td>{c.date}</td>
              <td><strong>{c.patient}</strong></td>
              <td>{c.investigations}</td>
              <td>{c.partnerLab}</td>
              <td>
                <span className={`status-${c.status === 'Report Received' ? 'final' : 'progress'}`}>
                  {c.status}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => alert(`Tracking specimen for ${c.patient} at ${c.partnerLab}`)}
                  style={{ padding: '0.3rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Track Sample
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setIsModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Dispatch Outsource Sample</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleAddCase} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Patient Name</label>
                <input required type="text" placeholder="e.g. Deepak Chopra" value={newCase.patient} onChange={e => setNewCase({ ...newCase, patient: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Specialized Investigation</label>
                <input required type="text" placeholder="e.g. Biopsy Histopathology / Flow Cytometry" value={newCase.investigations} onChange={e => setNewCase({ ...newCase, investigations: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Reference Lab Partner</label>
                <select value={newCase.partnerLab} onChange={e => setNewCase({ ...newCase, partnerLab: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}>
                  <option>Metropolis Reference Lab</option>
                  <option>Oncquest Central Lab</option>
                  <option>Lal PathLabs Reference</option>
                  <option>Thyrocare Technologies</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Dispatch Specimen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
