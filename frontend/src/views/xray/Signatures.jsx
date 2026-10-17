import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function SignaturesXray() {
  const defaultSignatures = [
    { id: 1, name: 'Dr. John Smith', designation: 'Chief Radiologist & Medical Director', regNo: 'MCI-48291', status: 'Active' },
    { id: 2, name: 'Dr. Emily Davis', designation: 'Consultant Radiologist', regNo: 'MCI-71829', status: 'Active' }
  ];

  const { data: signatures, update: setSignatures } = useDemoResource('labsetu_xray_signatures', defaultSignatures);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [selectedSig, setSelectedSig] = useState(null);
  const [form, setForm] = useState({ name: '', designation: '', regNo: '', status: 'Active' });
  const [notice, setNotice] = useState('');

  const openAdd = () => {
    setForm({ name: '', designation: '', regNo: '', status: 'Active' });
    setModalMode('add');
  };

  const openEdit = (sig) => {
    setSelectedSig(sig);
    setForm({ ...sig });
    setModalMode('edit');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (modalMode === 'add') {
      const created = { id: Date.now(), ...form };
      setSignatures([...(signatures || []), created]);
      setNotice(`Signature authority "${created.name}" added.`);
    } else {
      setSignatures((signatures || []).map(s => s.id === selectedSig.id ? { ...s, ...form } : s));
      setNotice(`Signature for "${form.name}" updated.`);
    }
    setModalMode(null);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDelete = (id) => {
    setSignatures((signatures || []).filter(s => s.id !== id));
    setModalMode(null);
    setNotice('Signature profile removed.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{ justifyContent: 'space-between' }}>
        <h2>Signatures (Digital X-Ray)</h2>
        <button onClick={openAdd} className="lab-btn lab-btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <PlusIcon className="lab-btn-icon" /> Add new doctor
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>DOCTOR NAME</th>
            <th>DESIGNATION</th>
            <th>REGISTRATION NO.</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {(signatures || []).map(sig => (
            <tr key={sig.id} className="lab-hover-interactive">
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{sig.name}</td>
              <td>{sig.designation}</td>
              <td style={{ color: '#64748b' }}>{sig.regNo || '—'}</td>
              <td>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' }}>
                  {sig.status}
                </span>
              </td>
              <td>
                <button onClick={() => openEdit(sig)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <PencilIcon className="lab-small-icon" /> Edit
                </button>
              </td>
            </tr>
          ))}
          {(signatures || []).length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No radiologist signatures configured.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {modalMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {modalMode === 'add' ? 'Add Doctor Signature (X-Ray)' : 'Edit Doctor Signature'}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="setup-form-group">
                <label className="setup-label">Doctor Full Name & Qualifications</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Dr. Rajesh Verma, MD (Radiology)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Clinical Designation</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Consultant Radiologist"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Medical Council Registration No.</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. DMC/R/12495"
                  value={form.regNo}
                  onChange={(e) => setForm({ ...form, regNo: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedSig.id)}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}
                  >
                    <TrashIcon style={{ width: '16px' }} /> Delete
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModalMode(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="setup-btn-blue">
                    Save Signature
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
