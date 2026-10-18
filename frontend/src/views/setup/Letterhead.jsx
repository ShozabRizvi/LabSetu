import React, { useState } from 'react';
import './Letterhead.css';
import { InformationCircleIcon, PrinterIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function Letterhead() {
  const { data: config, update: setConfig } = useDemoResource('labsetu_setup_letterhead', {
    headerHeight: '4.60',
    footerHeight: '3.40',
    showBorder: true,
    labName: 'LabSetu Diagnostic Centre',
  });

  const [headerHeight, setHeaderHeight] = useState(config?.headerHeight || '4.60');
  const [footerHeight, setFooterHeight] = useState(config?.footerHeight || '3.40');
  const [labName, setLabName] = useState(config?.labName || 'LabSetu Diagnostic Centre');
  const [showMore, setShowMore] = useState(false);
  const [notice, setNotice] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    setConfig({ headerHeight, footerHeight, labName });
    setNotice('Letterhead margins and settings saved successfully.');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNotice(`Sample header "${file.name}" uploaded successfully for preview.`);
      setTimeout(() => setNotice(''), 3500);
    }
  };

  return (
    <div>
      <h2 className="setup-page-title">Letterhead Configuration</h2>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <div className="letterhead-grid">
        {/* Left: Form */}
        <div>
          <form onSubmit={handleUpdate}>
            <div className="setup-form-group">
              <label className="setup-label">Upload Letterhead Header/Banner</label>
              <input type="file" className="setup-input" accept="image/jpeg,image/png" onChange={handleFileUpload} />
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>(Supported file formats: jpeg, jpg, png. Max 400KB)</p>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ color: '#2563eb', fontSize: '0.9rem', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
              >
                <PrinterIcon style={{ width: '16px' }} /> Preview Print PDF
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '1rem' }}>
              Standard A4 letterhead will be merged into clinical patient reports.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="setup-form-group" style={{ flex: 1 }}>
                <label className="setup-label">Header height</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    className="setup-input"
                    value={headerHeight}
                    onChange={(e) => setHeaderHeight(e.target.value)}
                  />
                  <span style={{ marginLeft: '-2.2rem', color: '#6b7280', fontSize: '0.85rem', pointerEvents: 'none' }}>cm</span>
                </div>
              </div>
              <div className="setup-form-group" style={{ flex: 1 }}>
                <label className="setup-label">Footer height</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    className="setup-input"
                    value={footerHeight}
                    onChange={(e) => setFooterHeight(e.target.value)}
                  />
                  <span style={{ marginLeft: '-2.2rem', color: '#6b7280', fontSize: '0.85rem', pointerEvents: 'none' }}>cm</span>
                </div>
              </div>
            </div>

            <div
              style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#2563eb', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Fewer settings ▴' : 'More settings ⌄'}
            </div>

            {showMore && (
              <div className="setup-form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                <label className="setup-label">Centre Title on Reports</label>
                <input
                  type="text"
                  className="setup-input"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="setup-btn-blue">Update Margins</button>
          </form>
        </div>

        {/* Center: Mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="letterhead-mockup-wrapper">
            <div className="letterhead-success-banner">✓ Letterhead preview in A4 ratio</div>
            <div className="letterhead-paper">
              <div className="letterhead-header" style={{ minHeight: `${Math.max(30, parseFloat(headerHeight || 4.6) * 12)}px` }}>
                <div style={{ fontSize: '1rem', fontWeight: '600' }}>{labName}</div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>Authorized Diagnostic & Pathology Services</div>
              </div>

              <div className="letterhead-margin-line top-margin">
                <span className="margin-label">Header: {headerHeight} cm</span>
              </div>

              <div className="letterhead-content">
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '1.5rem' }}>
                  — Clinical Report Body Content Area —
                </div>
              </div>

              <div className="letterhead-margin-line bottom-margin">
                <span className="margin-label">Footer: {footerHeight} cm</span>
              </div>

              <div className="letterhead-footer" style={{ minHeight: `${Math.max(20, parseFloat(footerHeight || 3.4) * 8)}px` }}>
                <div style={{ fontSize: '0.6rem', textAlign: 'center' }}>NOT VALID FOR MEDICO LEGAL PURPOSE · COMPUTER GENERATED REPORT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <h4 style={{ color: '#2563eb', fontSize: '0.95rem', marginBottom: '1rem' }}>Important information</h4>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{ width: '20px', flexShrink: 0, color: '#6b7280' }} />
            <span>Please note down the settings before making any changes so that you can always restore the original settings.</span>
          </div>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{ width: '20px', flexShrink: 0, color: '#6b7280' }} />
            <span>You can upload high-resolution JPG or PNG letterhead artwork (recommended 1000px by 1414px).</span>
          </div>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{ width: '20px', flexShrink: 0, color: '#6b7280' }} />
            <span>Use a centimeter scale to measure header and footer height printed by your local stationer.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
