import React, { useState } from 'react';
import '../lab/LabShared.css';
import './TestPanels.css';
import { PlusIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon, PencilIcon, EyeIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function TestPanels() {
  const initialData = [
    {
      id: 1,
      order: 1,
      name: 'Complete Blood Count (CBC)',
      category: 'Haematology',
      tests: 'Hemoglobin, Total Leukocyte Count, Platelet Count, Differential Count, RBC Indices (14 tests)',
      ratelist: 'CBC with GBP, Complete Blood Count (CBC)'
    },
    {
      id: 2,
      order: 2,
      name: 'CBC (with absolute counts)',
      category: 'Haematology',
      tests: 'Hemoglobin, TLC, Absolute Neutrophil, Lymphocyte, Monocyte, Eosinophil Count (16 tests)',
      ratelist: 'Antenatal Package, Cardiac package'
    },
    {
      id: 3,
      order: 3,
      name: 'CBC with ESR',
      category: 'Haematology',
      tests: 'Hemoglobin, Total Leukocyte Count, ESR Westergren (15 tests)',
      ratelist: 'Anemia package, Arthritis Package'
    },
    {
      id: 4,
      order: 4,
      name: 'BT & CT',
      category: 'Haematology',
      tests: 'Bleeding Time, Clotting Time (2 tests)',
      ratelist: 'BT & CT Coagulation Profile'
    }
  ];

  const { data: panels, update: setPanels } = useDemoResource('labsetu_setup_panels', initialData);
  const [showReorderHelp, setShowReorderHelp] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view'
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [panelForm, setPanelForm] = useState({ name: '', category: 'Haematology', tests: '', ratelist: '' });
  const [notice, setNotice] = useState('');

  const openAdd = () => {
    setPanelForm({ name: '', category: 'Haematology', tests: '', ratelist: '' });
    setModalMode('add');
  };

  const openEdit = (item) => {
    setSelectedPanel(item);
    setPanelForm({ ...item });
    setModalMode('edit');
  };

  const openView = (item) => {
    setSelectedPanel(item);
    setModalMode('view');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!panelForm.name.trim()) return;

    if (modalMode === 'add') {
      const created = {
        id: Date.now(),
        order: (panels || []).length + 1,
        ...panelForm
      };
      setPanels([...(panels || []), created]);
      setNotice(`Test panel "${created.name}" created successfully.`);
    } else if (modalMode === 'edit') {
      setPanels((panels || []).map(p => p.id === selectedPanel.id ? { ...p, ...panelForm } : p));
      setNotice(`Test panel "${panelForm.name}" updated successfully.`);
    }
    setModalMode(null);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDelete = (id) => {
    setPanels((panels || []).filter(p => p.id !== id));
    setModalMode(null);
    setNotice('Test panel removed.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="setup-page-title" style={{ marginBottom: 0 }}>Test Panels</h2>
        <button onClick={openAdd} className="setup-btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <PlusIcon className="setup-icon" style={{ width: '18px' }} /> Add new
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <div
        className="test-panels-help-block"
        onClick={() => setShowReorderHelp(!showReorderHelp)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <QuestionMarkCircleIcon style={{ width: '20px' }} />
          <span>How to reorder?</span>
        </div>
        {showReorderHelp ? <ChevronUpIcon style={{ width: '18px' }} /> : <ChevronDownIcon style={{ width: '18px' }} />}
      </div>

      {showReorderHelp && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
          Panels define groups of clinical test parameters that print together sequentially on reports. Reordering changes the sequence of tests appearing in doctor reports and printouts.
        </div>
      )}

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>ORDER</th>
            <th>NAME</th>
            <th>CATEGORY</th>
            <th>TESTS</th>
            <th>RATELIST ENTRIES</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {(panels || []).map((row) => (
            <tr key={row.id || row.order} className="lab-hover-interactive">
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                  <ChevronUpDownIcon style={{ width: '16px' }} /> {row.order}.
                </div>
              </td>
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{row.name}</td>
              <td>{row.category}</td>
              <td style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '300px' }}>{row.tests}</td>
              <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{row.ratelist}</td>
              <td>
                <div className="lab-actions-inline">
                  <button onClick={() => openEdit(row)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <PencilIcon className="lab-small-icon" /> Edit
                  </button>
                  <button onClick={() => openView(row)} className="lab-link-btn" style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <EyeIcon className="lab-small-icon" /> View
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {(panels || []).length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No test panels defined. Click "+ Add new" to create one.
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                {modalMode === 'add' ? 'Create New Test Panel' : `Edit Panel: ${selectedPanel?.name}`}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="setup-form-group">
                <label className="setup-label">Panel Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Comprehensive Metabolic Panel (CMP)"
                  value={panelForm.name}
                  onChange={(e) => setPanelForm({ ...panelForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Category</label>
                <select
                  className="setup-input"
                  value={panelForm.category}
                  onChange={(e) => setPanelForm({ ...panelForm, category: e.target.value })}
                >
                  <option value="Haematology">Haematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Serology & Immunology">Serology & Immunology</option>
                  <option value="Clinical Pathology">Clinical Pathology</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Included Test Parameters</label>
                <textarea
                  className="setup-input"
                  rows={3}
                  placeholder="List constituent tests separated by commas..."
                  value={panelForm.tests}
                  onChange={(e) => setPanelForm({ ...panelForm, tests: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Associated Ratelist Packages</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Master Health Package, Pre-Op Panel"
                  value={panelForm.ratelist}
                  onChange={(e) => setPanelForm({ ...panelForm, ratelist: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedPanel.id)}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}
                  >
                    <TrashIcon style={{ width: '16px' }} /> Delete Panel
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModalMode(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="setup-btn-blue">
                    {modalMode === 'add' ? 'Create Panel' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View */}
      {modalMode === 'view' && selectedPanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{selectedPanel.name}</h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Department Category:</div>
              <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '0.75rem' }}>{selectedPanel.category}</div>

              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Constituent Tests:</div>
              <div style={{ color: '#1e293b', marginBottom: '0.75rem', lineHeight: 1.5 }}>{selectedPanel.tests}</div>

              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Linked Ratelist Packages:</div>
              <div style={{ color: '#334155' }}>{selectedPanel.ratelist || 'None linked'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => openEdit(selectedPanel)} className="setup-btn-blue">
                Edit Panel
              </button>
              <button onClick={() => setModalMode(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
