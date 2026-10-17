import React, { useState } from 'react';
import useDemoResource from '../../hooks/useDemoResource';

export default function CaseRegNo() {
  const defaultSettings = {
    alias: 'Reg. no.',
    startPoint: '1001',
    useUhid: false,
  };

  const { data: settings, update: setSettings } = useDemoResource(
    'labsetu_setup_caseregno',
    defaultSettings
  );

  const [form, setForm] = useState(settings || defaultSettings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div>
      <h2 className="setup-page-title">Case reg. no.</h2>

      {savedNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ Case registration number configuration updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '440px' }}>
        <div className="setup-form-group">
          <label className="setup-label">Reg. no. alias ⓘ</label>
          <input
            type="text"
            className="setup-input"
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            placeholder="e.g. Reg. no., Case ID"
            required
          />
        </div>

        <div className="setup-form-group">
          <label className="setup-label">Set reg. no. starting point ⓘ</label>
          <input
            type="number"
            className="setup-input"
            value={form.startPoint}
            onChange={(e) => setForm({ ...form, startPoint: e.target.value })}
            placeholder="1001"
            required
          />
        </div>

        <div style={{ background: '#fef08a', color: '#854d0e', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
          Current reg. no. starting point is set to {form.startPoint || '1001'}
        </div>

        <div className="setup-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.useUhid}
              onChange={(e) => setForm({ ...form, useUhid: e.target.checked })}
            />
            Use UHID (Unique Hospital Identification) ⓘ
          </label>
        </div>

        <button type="submit" className="setup-btn-blue">Update Configuration</button>
      </form>
    </div>
  );
}
