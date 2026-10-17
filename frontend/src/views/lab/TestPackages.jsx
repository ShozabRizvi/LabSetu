import React, { useState } from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, PlayCircleIcon, QuestionMarkCircleIcon, PencilIcon, PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function TestPackages() {
  const initialPackages = [
    { id: 1, inRatelist: true, name: 'Anemia package', fee: 850, gender: 'Both', tests: 'C-Reactive Protein (CRP), Folic Acid, Vitamin B12, Hemoglobin, Serum Iron, TIBC' },
    { id: 2, inRatelist: true, name: 'Antenatal Package', fee: 1450, gender: 'Female', tests: 'Urine Routine Examination, Thyroid-Stimulating Hormone (TSH), Blood Group ABO-Rh, VDRL, HIV, HBsAg, CBC' },
    { id: 3, inRatelist: true, name: 'Arthritis Package', fee: 1200, gender: 'Both', tests: 'C-Reactive Protein (CRP), RA Factor Quantitative, Serum Uric Acid, Calcium Total, Complete Blood Count' },
    { id: 4, inRatelist: true, name: 'CBC with GBP', fee: 450, gender: 'Both', tests: 'Peripheral Blood Smear, Complete Blood Count (CBC) with differential counts and RBC indices' },
    { id: 5, inRatelist: true, name: 'Diabetic Health Package', fee: 950, gender: 'Both', tests: 'Fasting Blood Sugar (FBS), Post Prandial (PPBS), HbA1c, Urine Microalbumin, Lipid Profile' },
    { id: 6, inRatelist: false, name: 'Executive Master Wellness Package', fee: 3500, gender: 'Both', tests: 'Complete Blood Count, LFT, KFT, Lipid Profile, Thyroid Panel, HbA1c, Vitamin D3, Vitamin B12, Urine RE' },
  ];

  const { data: packages, update: setPackages } = useDemoResource('labsetu_test_packages', initialPackages);
  const [activeTab, setActiveTab] = useState('inRatelist');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [form, setForm] = useState({ name: '', fee: '', gender: 'Both', inRatelist: true, tests: '' });
  const [notice, setNotice] = useState('');

  const filteredPackages = (packages || []).filter(p => {
    const matchesTab = activeTab === 'inRatelist' ? p.inRatelist : !p.inRatelist;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tests.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const inCount = (packages || []).filter(p => p.inRatelist).length;
  const outCount = (packages || []).filter(p => !p.inRatelist).length;

  const openAdd = () => {
    setForm({ name: '', fee: '', gender: 'Both', inRatelist: activeTab === 'inRatelist', tests: '' });
    setModalMode('add');
  };

  const openEdit = (pkg) => {
    setSelectedPkg(pkg);
    setForm({ ...pkg });
    setModalMode('edit');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (modalMode === 'add') {
      const created = {
        id: Date.now(),
        ...form,
        fee: Number(form.fee) || 0
      };
      setPackages([...(packages || []), created]);
      setNotice(`Test package "${created.name}" created.`);
    } else {
      setPackages((packages || []).map(p => p.id === selectedPkg.id ? { ...p, ...form, fee: Number(form.fee) || 0 } : p));
      setNotice(`Test package "${form.name}" updated.`);
    }
    setModalMode(null);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDelete = (id) => {
    setPackages((packages || []).filter(p => p.id !== id));
    setModalMode(null);
    setNotice('Test package removed.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{ justifyContent: 'space-between' }}>
        <h2>Test Packages & Health Profiles</h2>
        <button onClick={openAdd} className="lab-btn lab-btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <PlusIcon className="lab-btn-icon" /> Add new package
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <div
        className="lab-help-banner"
        onClick={() => setShowHowItWorks(!showHowItWorks)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <QuestionMarkCircleIcon className="lab-small-icon" /> How it works?
      </div>

      {showHowItWorks && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
          Test packages bundle individual tests and panels under a single discounted billing code. When selected during billing, all constituent parameters automatically appear in today's pending reports worklist.
        </div>
      )}

      <div className="lab-tabs-row">
        <div className="lab-tabs">
          <button
            onClick={() => setActiveTab('inRatelist')}
            className={`lab-tab ${activeTab === 'inRatelist' ? 'active' : ''}`}
          >
            In ratelist <span className="lab-badge">{inCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('notInRatelist')}
            className={`lab-tab ${activeTab === 'notInRatelist' ? 'active' : ''}`}
          >
            Not in ratelist <span className="lab-badge">{outCount}</span>
          </button>
        </div>
      </div>

      <div className="lab-search-input-wrapper" style={{ maxWidth: '320px', marginBottom: '0.75rem' }}>
        <MagnifyingGlassIcon className="lab-search-icon" />
        <input
          type="text"
          placeholder="Search package name or tests..."
          className="lab-input"
          style={{ width: '100%' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>S. NO.</th>
            <th>NAME</th>
            <th>FEE</th>
            <th>FOR GENDER</th>
            <th>INCLUDED TESTS AND PANELS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filteredPackages.map((pkg, idx) => (
            <tr key={pkg.id} className="lab-hover-interactive">
              <td>{idx + 1}.</td>
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{pkg.name}</td>
              <td style={{ fontWeight: '600', color: '#15803d' }}>₹ {pkg.fee}</td>
              <td>{pkg.gender}</td>
              <td style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px' }}>{pkg.tests}</td>
              <td>
                <div className="lab-actions-inline">
                  <button onClick={() => openEdit(pkg)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <PencilIcon className="lab-small-icon" /> Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filteredPackages.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No packages found in this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal: Add or Edit */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {modalMode === 'add' ? 'Create Health Package' : `Edit: ${selectedPkg?.name}`}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="setup-form-group">
                <label className="setup-label">Package Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Senior Citizen Wellness Profile"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Fee (₹)</label>
                  <input
                    type="number"
                    className="setup-input"
                    placeholder="e.g. 1500"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="setup-label">Gender</label>
                  <select
                    className="setup-input"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="Both">Both</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Included Tests & Parameters</label>
                <textarea
                  className="setup-input"
                  rows={4}
                  placeholder="List constituent tests separated by commas..."
                  value={form.tests}
                  onChange={(e) => setForm({ ...form, tests: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={form.inRatelist}
                    onChange={(e) => setForm({ ...form, inRatelist: e.target.checked })}
                  />
                  Active in billing ratelist
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedPkg.id)}
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
                    {modalMode === 'add' ? 'Save Package' : 'Update'}
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
