import React, { useState } from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, EyeIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function Interpretations() {
  const initialInterpretations = [
    { id: 1, type: 'Test', name: '25 Hydroxy (OH) Vitamin D', content: 'Physiological Basis: Vitamin D promotes intestinal calcium absorption and bone mineralization. Deficiencies are associated with rickets in children and osteomalacia/osteopenia in adults. Levels <20 ng/mL represent deficiency.' },
    { id: 2, type: 'Test', name: 'Alfa Fetoprotein, AFP', content: 'Alpha-fetoprotein (AFP) is a crucial glycoprotein synthesized by fetal liver and yolk sac. Elevated adult concentrations indicate hepatocellular carcinoma (HCC) or non-seminomatous germ cell tumors.' },
    { id: 3, type: 'Test', name: 'Anti Phospholipid IgG', content: '2006 International Consensus statement on Classification of definite Antiphospholipid Syndrome (APS). Positive results must be confirmed with repeat testing after 12 weeks.' },
    { id: 4, type: 'Test', name: 'Dengue NS1 Antigen', content: 'Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes. NS1 antigen is detectable from day 1 to day 9 of fever onset.' },
    { id: 5, type: 'Test', name: 'HbA1c (Glycosylated Hemoglobin)', content: 'Interpretation as per American Diabetes Association (ADA) Guidelines: <5.7% Normal, 5.7%-6.4% Prediabetes, >=6.5% Diagnostic of Diabetes Mellitus.' },
    { id: 6, type: 'Test', name: 'Urine Routine Examination', content: 'Protein: Elevated urinary protein levels can signal early kidney disease, nephrotic syndrome, or transient orthostatic proteinuria.' },
    { id: 7, type: 'Panels', name: 'Complete Blood Count (CBC) Panel', content: 'Comprehensive interpretation of RBC, WBC and Platelet series. Hemoglobin and indices evaluate microcytic vs macrocytic anemia. Differential count guides infection staging.' },
    { id: 8, type: 'Panels', name: 'Lipid Profile Panel', content: 'Evaluates atherosclerotic cardiovascular disease (ASCVD) risk according to NCEP ATP III guidelines. High LDL-C and low HDL-C are independent risk factors.' }
  ];

  const { data: list, update: setList } = useDemoResource('labsetu_interpretations', initialInterpretations);
  const [activeTab, setActiveTab] = useState('Test');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view'
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Test', content: '' });
  const [notice, setNotice] = useState('');

  const filteredItems = (list || []).filter(item => {
    const matchesTab = item.type === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const testCount = (list || []).filter(i => i.type === 'Test').length;
  const panelCount = (list || []).filter(i => i.type === 'Panels').length;

  const openAdd = () => {
    setForm({ name: '', type: activeTab, content: '' });
    setModalMode('add');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({ ...item });
    setModalMode('edit');
  };

  const openView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (modalMode === 'add') {
      const created = { id: Date.now(), ...form };
      setList([...(list || []), created]);
      setNotice(`Interpretation for "${created.name}" created.`);
    } else {
      setList((list || []).map(i => i.id === selectedItem.id ? { ...i, ...form } : i));
      setNotice(`Interpretation for "${form.name}" updated.`);
    }
    setModalMode(null);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDelete = (id) => {
    setList((list || []).filter(i => i.id !== id));
    setModalMode(null);
    setNotice('Interpretation removed.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row">
        <h2>Clinical Interpretations</h2>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <div className="lab-tabs-row" style={{ borderBottom: 'none' }}>
        <div className="lab-tabs">
          <button
            onClick={() => setActiveTab('Test')}
            className={`lab-tab ${activeTab === 'Test' ? 'active' : ''}`}
          >
            Test <span className="lab-badge">{testCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('Panels')}
            className={`lab-tab ${activeTab === 'Panels' ? 'active' : ''}`}
          >
            Panels <span className="lab-badge">{panelCount}</span>
          </button>
        </div>
      </div>

      <div className="lab-controls-row" style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <div className="lab-search-input-wrapper" style={{ width: '320px' }}>
          <MagnifyingGlassIcon className="lab-search-icon" />
          <input
            type="text"
            placeholder="Search interpretation text..."
            className="lab-input"
            style={{ width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button onClick={openAdd} className="lab-btn lab-btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <PlusIcon className="lab-btn-icon" /> Add new interpretation
        </button>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>S. NO.</th>
            <th>NAME</th>
            <th>INTERPRETATION</th>
            <th style={{ textAlign: 'right' }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, idx) => (
            <tr key={item.id} className="lab-hover-interactive">
              <td>{idx + 1}.</td>
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{item.name}</td>
              <td style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px' }}>
                {item.content.length > 90 ? `${item.content.slice(0, 90)}...` : item.content}
              </td>
              <td>
                <div className="lab-actions-inline" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button onClick={() => openView(item)} className="lab-view-all-pill">
                    <EyeIcon style={{ width: '14px', display: 'inline', marginRight: '3px' }} /> View all
                  </button>
                  <button onClick={() => openEdit(item)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <PencilIcon className="lab-small-icon" /> Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No interpretations found for {activeTab}.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal: View All */}
      {modalMode === 'view' && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedItem.name}</h3>
                <small style={{ color: '#64748b' }}>Category: {selectedItem.type}</small>
              </div>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem', lineHeight: 1.6, color: '#334155' }}>
              {selectedItem.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => openEdit(selectedItem)} className="lab-btn lab-btn-blue">
                Edit
              </button>
              <button onClick={() => setModalMode(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {modalMode === 'add' ? 'Add Clinical Interpretation' : `Edit Interpretation: ${selectedItem?.name}`}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="setup-form-group">
                <label className="setup-label">Test or Panel Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. C-Reactive Protein (CRP)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Type</label>
                <select
                  className="setup-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="Test">Test</option>
                  <option value="Panels">Panels</option>
                </select>
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Clinical Interpretation Notes</label>
                <textarea
                  className="setup-input"
                  rows={5}
                  placeholder="Enter medical interpretation, guidance, and reference guidelines..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedItem.id)}
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
                    {modalMode === 'add' ? 'Save' : 'Update'}
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
