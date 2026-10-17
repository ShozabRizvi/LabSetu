import React, { useState } from 'react';
import './LabShared.css';
import { PlusIcon, PencilIcon, EyeIcon, ChevronUpDownIcon, QuestionMarkCircleIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function TestCategories() {
  const defaultCategories = [
    { id: 1, order: 1, name: 'Haematology', testCount: 28, tests: 'Hemoglobin, TLC, DLC, Platelet Count, ESR, Peripheral Smear, BT, CT, Absolute Counts' },
    { id: 2, order: 2, name: 'Biochemistry', testCount: 42, tests: 'Fasting Blood Sugar, HbA1c, LFT, KFT, Lipid Profile, Serum Amylase, Lipase, Electrolytes' },
    { id: 3, order: 3, name: 'Serology & Immunology', testCount: 19, tests: 'Widal, Dengue NS1/IgM/IgG, HIV I & II, HBsAg, HCV, VDRL, CRP, RA Factor, ASO' },
    { id: 4, order: 4, name: 'Clinical Pathology', testCount: 12, tests: 'Urine Routine & Microscopic, Stool Occult Blood, Stool Routine Examination, Semen Analysis' },
    { id: 5, order: 5, name: 'Microbiology', testCount: 15, tests: 'Urine Culture & Sensitivity, Blood Culture, Sputum AFB, Gram Stain, Fungus KOH Mount' }
  ];

  const { data: categories, update: setCategories } = useDemoResource('labsetu_test_categories', defaultCategories);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view'
  const [selectedCat, setSelectedCat] = useState(null);
  const [form, setForm] = useState({ name: '', tests: '' });
  const [showReorderHelp, setShowReorderHelp] = useState(false);
  const [notice, setNotice] = useState('');

  const openAdd = () => {
    setForm({ name: '', tests: '' });
    setModalMode('add');
  };

  const openEdit = (cat) => {
    setSelectedCat(cat);
    setForm({ ...cat });
    setModalMode('edit');
  };

  const openView = (cat) => {
    setSelectedCat(cat);
    setModalMode('view');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (modalMode === 'add') {
      const created = {
        id: Date.now(),
        order: (categories || []).length + 1,
        name: form.name.trim(),
        testCount: form.tests ? form.tests.split(',').length : 0,
        tests: form.tests || 'Standard diagnostic tests'
      };
      setCategories([...(categories || []), created]);
      setNotice(`Category "${created.name}" created.`);
    } else {
      setCategories((categories || []).map(c => c.id === selectedCat.id ? { ...c, ...form } : c));
      setNotice(`Category "${form.name}" updated.`);
    }
    setModalMode(null);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDelete = (id) => {
    setCategories((categories || []).filter(c => c.id !== id));
    setModalMode(null);
    setNotice('Category removed.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{ justifyContent: 'space-between' }}>
        <h2>Test Categories</h2>
        <button onClick={openAdd} className="lab-btn lab-btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <PlusIcon className="lab-btn-icon" /> Add new category
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <div
        className="lab-help-banner"
        onClick={() => setShowReorderHelp(!showReorderHelp)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <QuestionMarkCircleIcon className="lab-small-icon" /> How to reorder?
      </div>

      {showReorderHelp && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
          Category order dictates the section breakdown on the unified patient laboratory test report. Move categories to match your clinical laboratory priority.
        </div>
      )}

      <table className="lab-data-table" style={{ maxWidth: '800px' }}>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>NAME</th>
            <th>TESTS COUNT</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {(categories || []).map(cat => (
            <tr key={cat.id || cat.order} className="lab-hover-interactive">
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChevronUpDownIcon className="lab-small-icon" style={{ color: '#9ca3af' }} /> {cat.order}
                </div>
              </td>
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{cat.name}</td>
              <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{cat.testCount || 10} tests</td>
              <td>
                <div className="lab-actions-inline">
                  <button onClick={() => openEdit(cat)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <PencilIcon className="lab-small-icon" /> Edit
                  </button>
                  <button onClick={() => openView(cat)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <EyeIcon className="lab-small-icon" /> View tests
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {(categories || []).length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal: View Tests */}
      {modalMode === 'view' && selectedCat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedCat.name} Tests</h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>
                {selectedCat.tests || 'Standard diagnostic test items.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => openEdit(selectedCat)} className="lab-btn lab-btn-blue">
                Edit Category
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
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {modalMode === 'add' ? 'Add Test Category' : `Edit Category: ${selectedCat?.name}`}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="setup-form-group">
                <label className="setup-label">Category Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Molecular Diagnostics"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Included Tests (comma separated)</label>
                <textarea
                  className="setup-input"
                  rows={4}
                  placeholder="e.g. RT-PCR, Viral Load, Genotyping..."
                  value={form.tests}
                  onChange={(e) => setForm({ ...form, tests: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedCat.id)}
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
                    {modalMode === 'add' ? 'Add Category' : 'Save'}
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
