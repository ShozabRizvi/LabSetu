import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function BrowserSecurity() {
  const [browsers, setBrowsers] = useState([
    { id: 1, device: 'Chrome (Windows) - Reception PC 1', lastLogin: '13/09/2026', status: 'Trusted' },
    { id: 2, device: 'Safari (iOS) - Dr. Shozab iPhone', lastLogin: '10/09/2026', status: 'Trusted' },
    { id: 3, device: 'Edge (Windows) - Lab Reporting Station', lastLogin: '12/09/2026', status: 'Trusted' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceInput, setDeviceInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (deviceInput.trim()) {
      setBrowsers([...browsers, {
        id: Date.now(),
        device: deviceInput.trim(),
        lastLogin: 'Today',
        status: 'Trusted'
      }]);
      setDeviceInput('');
      setIsModalOpen(false);
    }
  };

  const handleRevoke = (id) => {
    if (window.confirm('Revoke access for this browser session? The session will be instantly logged out.')) {
      setBrowsers(browsers.filter(b => b.id !== id));
    }
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <div>
          <h2>Browser Security & Whitelisted Devices</h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Restrict LabSetu authority workspace to authorized laboratory devices.</p>
        </div>
        <button type="button" className="lab-btn lab-btn-blue" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="lab-btn-icon"/> Add allowed browser
        </button>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>DEVICE / BROWSER SIGNATURE</th>
            <th>LAST LOGIN</th>
            <th>STATUS</th>
            <th>SECURITY ACTION</th>
          </tr>
        </thead>
        <tbody>
          {browsers.map(b => (
            <tr key={b.id} className="lab-hover-interactive">
              <td><strong>{b.device}</strong></td>
              <td>{b.lastLogin}</td>
              <td>
                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {b.status}
                </span>
              </td>
              <td>
                <button 
                  type="button" 
                  className="lab-link-btn" 
                  style={{color:'#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.2rem'}}
                  onClick={() => handleRevoke(b.id)}
                >
                  <TrashIcon className="lab-small-icon"/> Revoke Access
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
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Authorize Trusted Browser</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Browser / Device Identifier</label>
                <input required type="text" placeholder="e.g. Chrome (Windows) - Phlebotomy Tablet" value={deviceInput} onChange={e => setDeviceInput(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Whitelist Browser</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
