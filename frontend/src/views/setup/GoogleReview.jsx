import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import useDemoResource from '../../hooks/useDemoResource';

export default function GoogleReview() {
  const { data: config, update: setConfig } = useDemoResource('labsetu_setup_googlereview', {
    profileUrl: 'https://g.page/r/labsetu-diagnostics/review',
    enabled: true,
  });

  const [form, setForm] = useState(config || { profileUrl: '', enabled: true });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfig(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div>
      <h2 className="setup-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <StarIcon style={{ width: '24px', color: '#eab308' }} /> Build Google Reviews
      </h2>
      <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Get more business by building your Google reviews. Bring your lab on top of Google search to nearby patients.
      </p>

      {savedNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac', maxWidth: '520px' }}>
          ✓ Google Business review link saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '520px' }}>
        <div className="setup-form-group">
          <label className="setup-label">Google Business Profile Review URL</label>
          <input
            type="url"
            className="setup-input"
            value={form.profileUrl}
            onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
            placeholder="https://g.page/r/your-lab/review"
            required
          />
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.4rem' }}>
            This link will be appended to the SMS/WhatsApp notifications sent to patients upon report collection.
          </small>
        </div>

        <div className="setup-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Include review request link in SMS/WhatsApp
          </label>
        </div>

        <button type="submit" className="setup-btn-blue">Save Configuration</button>
      </form>
    </div>
  );
}
