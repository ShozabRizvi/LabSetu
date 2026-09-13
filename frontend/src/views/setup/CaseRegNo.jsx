import React from 'react';

export default function CaseRegNo() {
  return (
    <div>
      <h2 className="setup-page-title">Case reg. no.</h2>

      <div style={{maxWidth: '400px'}}>
        <div className="setup-form-group">
          <label className="setup-label">Reg. no. alias ⓘ</label>
          <input type="text" className="setup-input" defaultValue="Reg. no." />
        </div>

        <div className="setup-form-group">
          <label className="setup-label">Set reg. no. starting point ⓘ</label>
          <input type="text" className="setup-input" />
        </div>

        <div style={{background:'#fef08a', color:'#854d0e', padding:'0.75rem', borderRadius:'4px', fontSize:'0.85rem', marginBottom:'1.5rem', fontWeight:'500'}}>
          Current reg. no. starting point is set to 1001
        </div>

        <div className="setup-form-group">
          <label style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.9rem', color:'#374151'}}>
            <input type="checkbox" /> Use UHID ⓘ
          </label>
        </div>

        <button className="setup-btn-blue">Update</button>
      </div>
    </div>
  );
}
