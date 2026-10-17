import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PlusIcon, ArrowDownTrayIcon, PrinterIcon, XCircleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function Ratelist() {
  const defaultRatelist = [
    { id: 1, name: 'ABG (Arterial Blood Gas)', modality: 'Lab', type: 'Tests', fee: 800, revShare: 150, gender: 'Both', active: true },
    { id: 2, name: 'ADA (Adenosine Deaminase)', modality: 'Lab', type: 'Tests', fee: 650, revShare: 100, gender: 'Both', active: true },
    { id: 3, name: 'AEC (Absolute Eosinophil Count)', modality: 'Lab', type: 'Tests', fee: 200, revShare: 30, gender: 'Both', active: true },
    { id: 4, name: 'AFB Stain (Acid Fast Bacilli)', modality: 'Lab', type: 'Tests', fee: 350, revShare: 50, gender: 'Both', active: true },
    { id: 5, name: 'AFP (Alpha Fetoprotein)', modality: 'Lab', type: 'Tests', fee: 900, revShare: 180, gender: 'Both', active: true },
    { id: 6, name: 'Complete Blood Count (CBC)', modality: 'Lab', type: 'Panels', fee: 350, revShare: 50, gender: 'Both', active: true },
    { id: 7, name: 'Lipid Profile', modality: 'Lab', type: 'Panels', fee: 650, revShare: 100, gender: 'Both', active: true },
    { id: 8, name: 'Liver Function Test (LFT)', modality: 'Lab', type: 'Panels', fee: 750, revShare: 120, gender: 'Both', active: true },
    { id: 9, name: 'Kidney Function Test (KFT)', modality: 'Lab', type: 'Panels', fee: 700, revShare: 110, gender: 'Both', active: true },
    { id: 10, name: 'Executive Health Checkup', modality: 'Lab', type: 'Packages', fee: 2499, revShare: 400, gender: 'Both', active: true },
    { id: 11, name: 'Abdomen USG', modality: 'USG', type: 'Tests', fee: 1200, revShare: 250, gender: 'Both', active: true },
    { id: 12, name: 'Pelvic USG', modality: 'USG', type: 'Tests', fee: 1100, revShare: 200, gender: 'Female', active: true },
    { id: 13, name: 'Chest PA Digital X-Ray', modality: 'Digital X-ray', type: 'Tests', fee: 500, revShare: 80, gender: 'Both', active: true },
    { id: 14, name: 'Knee Joint AP/LAT', modality: 'Digital X-ray', type: 'Tests', fee: 700, revShare: 120, gender: 'Both', active: true },
  ];

  const { data: ratelist, update: setRatelist } = useDemoResource('labsetu_setup_ratelist', defaultRatelist);

  const [activeModality, setActiveModality] = useState('Lab');
  const [activeType, setActiveType] = useState('Tests');
  const [bulkPercent, setBulkPercent] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', modality: 'Lab', type: 'Tests', fee: '', revShare: '', gender: 'Both' });
  const [notice, setNotice] = useState('');

  const modalities = ['Lab', 'USG', 'Digital X-ray', 'X-ray', 'Outsource Lab', 'ECG'];
  const types = ['Tests', 'Packages', 'Panels', 'Bill only'];

  const filteredItems = (ratelist || []).filter(item => {
    const matchesModality = activeModality === 'Lab' ? (item.modality === 'Lab' || !item.modality) : item.modality === activeModality;
    const matchesType = activeType ? item.type === activeType : true;
    return matchesModality && matchesType;
  });

  const handleBulkUpdate = () => {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct)) return;
    const updated = ratelist.map(item => {
      if (item.modality === activeModality) {
        const newRev = Math.round(Number(item.fee) * (pct / 100));
        return { ...item, revShare: newRev };
      }
      return item;
    });
    setRatelist(updated);
    setNotice(`Updated revenue share for ${activeModality} to ${pct}% across items.`);
    setBulkPercent('');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDownloadCsv = () => {
    const headers = ['ID,Name,Modality,Type,Fee,Revenue Share,Gender'];
    const rows = (ratelist || []).map(r => `"${r.id}","${r.name}","${r.modality}","${r.type}","${r.fee}","${r.revShare}","${r.gender}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `labsetu-ratelist-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemove = (id) => {
    setRatelist(ratelist.filter(item => item.id !== id));
  };

  const handleFieldChange = (id, field, value) => {
    setRatelist(ratelist.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newEntry.name.trim()) return;
    const created = {
      id: Date.now(),
      name: newEntry.name.trim(),
      modality: activeModality,
      type: newEntry.type || activeType,
      fee: Number(newEntry.fee) || 0,
      revShare: Number(newEntry.revShare) || 0,
      gender: newEntry.gender,
      active: true
    };
    setRatelist([...ratelist, created]);
    setIsAddModalOpen(false);
    setNewEntry({ name: '', modality: 'Lab', type: 'Tests', fee: '', revShare: '', gender: 'Both' });
    setNotice(`Test "${created.name}" added to ratelist.`);
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Top Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {/* Modality Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#f8fafc', padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          {modalities.map(m => (
            <button
              key={m}
              onClick={() => setActiveModality(m)}
              style={{
                padding: '0.45rem 0.85rem',
                background: activeModality === m ? '#15803d' : 'transparent',
                color: activeModality === m ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                fontWeight: activeModality === m ? '600' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Bulk Update */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
          <span>Bulk rev share:</span>
          <input
            type="number"
            className="setup-input"
            style={{ width: '60px', padding: '0.3rem' }}
            placeholder="%"
            value={bulkPercent}
            onChange={(e) => setBulkPercent(e.target.value)}
          />
          <button
            onClick={handleBulkUpdate}
            className="setup-btn-blue"
            style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          >
            Apply to {activeModality}
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleDownloadCsv}
            className="setup-btn-blue"
            style={{ background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowDownTrayIcon style={{ width: '16px' }} /> Download CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="setup-btn-blue"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <PlusIcon style={{ width: '16px' }} /> Add New
          </button>
          <button
            onClick={() => window.print()}
            className="setup-btn-blue"
            style={{ background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <PrinterIcon style={{ width: '16px' }} /> Print
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
        <div style={{ fontWeight: '600', color: '#15803d', borderBottom: '2px solid #15803d', paddingBottom: '0.4rem' }}>
          Active <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{filteredItems.length}</span>
        </div>
      </div>

      <div className="lab-tabs-row" style={{ marginBottom: '1rem' }}>
        <div className="lab-tabs" style={{ border: 'none', gap: '0.5rem' }}>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`lab-tab ${activeType === t ? 'active' : ''}`}
              style={{
                background: activeType === t ? '#f1f5f9' : '#ffffff',
                border: activeType === t ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: '20px',
                padding: '0.3rem 1rem'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>MODALITY / TYPE</th>
            <th>FEE (₹)</th>
            <th>REVENUE SHARE (₹)</th>
            <th>GENDER</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((row) => (
            <tr key={row.id} className="lab-hover-interactive">
              <td style={{ fontWeight: '500' }}>
                {row.name}
              </td>
              <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {row.modality} · {row.type}
              </td>
              <td>
                <input
                  type="number"
                  className="setup-input"
                  value={row.fee}
                  onChange={(e) => handleFieldChange(row.id, 'fee', Number(e.target.value))}
                  style={{ width: '90px', padding: '0.3rem' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="setup-input"
                  value={row.revShare}
                  onChange={(e) => handleFieldChange(row.id, 'revShare', Number(e.target.value))}
                  style={{ width: '90px', padding: '0.3rem' }}
                />
              </td>
              <td>
                <select
                  className="setup-input"
                  value={row.gender}
                  onChange={(e) => handleFieldChange(row.id, 'gender', e.target.value)}
                  style={{ width: '100px', padding: '0.3rem' }}
                >
                  <option>Both</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </td>
              <td>
                <button
                  onClick={() => handleRemove(row.id)}
                  className="lab-link-btn"
                  style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <XCircleIcon style={{ width: '16px' }} /> Remove
                </button>
              </td>
            </tr>
          ))}
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No items found for {activeModality} ({activeType}). Click "+ Add New" to add one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add New Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Add Ratelist Item ({activeModality})</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddNew}>
              <div className="setup-form-group">
                <label className="setup-label">Investigation / Test Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Vitamin D Total, Renal Doppler"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Entry Type</label>
                  <select
                    className="setup-input"
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  >
                    <option value="Tests">Test</option>
                    <option value="Packages">Package</option>
                    <option value="Panels">Panel</option>
                    <option value="Bill only">Bill only</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Gender</label>
                  <select
                    className="setup-input"
                    value={newEntry.gender}
                    onChange={(e) => setNewEntry({ ...newEntry, gender: e.target.value })}
                  >
                    <option value="Both">Both</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Fee (₹)</label>
                  <input
                    type="number"
                    className="setup-input"
                    placeholder="e.g. 500"
                    value={newEntry.fee}
                    onChange={(e) => setNewEntry({ ...newEntry, fee: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Revenue Share (₹)</label>
                  <input
                    type="number"
                    className="setup-input"
                    placeholder="e.g. 100"
                    value={newEntry.revShare}
                    onChange={(e) => setNewEntry({ ...newEntry, revShare: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="setup-btn-blue">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
