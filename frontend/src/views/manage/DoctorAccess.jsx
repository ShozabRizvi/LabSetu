import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DoctorAccess() {
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Smith', access: 'Full Access', lastLogin: '13/09/2026 10:15 AM' },
    { id: 2, name: 'Dr. Jones', access: 'View Only (X-Ray)', lastLogin: '11/09/2026 14:20 PM' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form, setForm] = useState({ name: '', access: 'Full Access' });

  const handleOpenGrant = () => {
    setEditingDoc(null);
    setForm({ name: '', access: 'Full Access' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setForm({ name: doc.name, access: doc.access });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDoc) {
      setDoctors(doctors.map(d => d.id === editingDoc.id ? { ...d, name: form.name, access: form.access } : d));
    } else {
      setDoctors([...doctors, { id: Date.now(), name: form.name, access: form.access, lastLogin: 'Never' }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Doctor portal & referral access</h2>
        <button type="button" className="lab-btn lab-btn-blue" onClick={handleOpenGrant}>
          <PlusIcon className="lab-btn-icon"/> Grant access
        </button>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>DOCTOR NAME</th>
            <th>ACCESS LEVEL</th>
            <th>LAST LOGIN</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map(doc => (
            <tr key={doc.id} className="lab-hover-interactive">
              <td><strong>{doc.name}</strong></td>
              <td>{doc.access}</td>
              <td>{doc.lastLogin}</td>
              <td>
                <button 
                  type="button" 
                  className="lab-link-btn"
                  onClick={() => handleOpenEdit(doc)}
                >
                  <PencilIcon className="lab-small-icon"/> Edit
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
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{editingDoc ? 'Edit Doctor Access Level' : 'Grant Doctor Portal Access'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Doctor Full Name & Degree</label>
                <input required type="text" placeholder="e.g. Dr. A. K. Gupta (MD)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Access Level Permission</label>
                <select value={form.access} onChange={e => setForm({ ...form, access: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}>
                  <option>Full Access (Reports, Sign-off & Patient History)</option>
                  <option>View Only (Pathology & Blood Reports)</option>
                  <option>View Only (Radiology & X-Ray Scans)</option>
                  <option>Sign-off Authorization Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Save Access</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
