import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function ReportTemplatesUSG() {
  const defaultTemplates = [
    { id: 1, name: 'Normal Whole Abdomen', createdBy: 'Dr. John Smith', content: 'Liver: Normal in size and echogenicity. Gallbladder: Normal distension, no calculi. CBD: Normal caliber. Pancreas: Visualized portions unremarkable. Spleen: Normal size. Both Kidneys: Normal size, shape, position. No calculi or hydronephrosis. Urinary Bladder: Normal.' },
    { id: 2, name: 'Normal Female Pelvis', createdBy: 'Dr. Emily Davis', content: 'Uterus: Normal size, anteverted, uniform myometrial echotexture. Endometrial echo complex: Central and regular. Bilateral Ovaries: Normal size and appearance. No adnexal mass lesion or free fluid in pouch of Douglas.' },
    { id: 3, name: 'KUB & Prostate', createdBy: 'Dr. John Smith', content: 'Right and Left Kidneys: Normal bilateral size and parenchymal thickness. Urinary Bladder: Well filled with regular margins. Prostate: Normal size and homogenous echotexture, volume within limits.' }
  ];

  const { data: templates, update: setTemplates } = useDemoResource('labsetu_usg_templates', defaultTemplates);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({ name: '', createdBy: 'Dr. John Smith', content: '' });
  const [notice, setNotice] = useState('');

  const openAdd = () => {
    setForm({ name: '', createdBy: 'Dr. John Smith', content: '' });
    setModalMode('add');
  };

  const openEdit = (tpl) => {
    setSelectedTemplate(tpl);
    setForm({ ...tpl });
    setModalMode('edit');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (modalMode === 'add') {
      const created = { id: Date.now(), ...form };
      setTemplates([...(templates || []), created]);
      setNotice(`Template "${created.name}" created.`);
    } else {
      setTemplates((templates || []).map(t => t.id === selectedTemplate.id ? { ...t, ...form } : t));
      setNotice(`Template "${form.name}" updated.`);
    }
    setModalMode(null);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDelete = (id) => {
    setTemplates((templates || []).filter(t => t.id !== id));
    setModalMode(null);
    setNotice('Template deleted.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{ justifyContent: 'space-between' }}>
        <h2>Report Templates (USG)</h2>
        <button onClick={openAdd} className="lab-btn lab-btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <PlusIcon className="lab-btn-icon" /> Add new template
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
            <th>TEMPLATE NAME</th>
            <th>CREATED BY</th>
            <th>PREVIEW CONTENT</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {(templates || []).map(tpl => (
            <tr key={tpl.id} className="lab-hover-interactive">
              <td style={{ fontWeight: '500', color: '#0f172a' }}>{tpl.name}</td>
              <td style={{ color: '#475569' }}>{tpl.createdBy}</td>
              <td style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px' }}>
                {tpl.content.slice(0, 100)}...
              </td>
              <td>
                <button onClick={() => openEdit(tpl)} className="lab-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <PencilIcon className="lab-small-icon" /> Edit
                </button>
              </td>
            </tr>
          ))}
          {(templates || []).length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No USG report templates found. Click "+ Add new template" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {modalMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {modalMode === 'add' ? 'Create USG Report Template' : 'Edit USG Report Template'}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="setup-form-group">
                <label className="setup-label">Template Name</label>
                <input
                  type="text"
                  className="setup-input"
                  placeholder="e.g. Normal Obstetric Second Trimester"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Created By (Radiologist)</label>
                <input
                  type="text"
                  className="setup-input"
                  value={form.createdBy}
                  onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
                  required
                />
              </div>

              <div className="setup-form-group">
                <label className="setup-label">Standard Findings / Template Text</label>
                <textarea
                  className="setup-input"
                  rows={5}
                  placeholder="Enter boilerplate report findings..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedTemplate.id)}
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
                    {modalMode === 'add' ? 'Save Template' : 'Save Changes'}
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
