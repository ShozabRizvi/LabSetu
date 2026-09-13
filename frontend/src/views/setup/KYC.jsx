import React from 'react';

export default function KYC() {
  return (
    <div>
      <h2 className="setup-page-title">KYC</h2>
      
      <div className="setup-form-grid">
        {/* Left Column */}
        <div>
          <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>Ownership verification details</h3>
          
          <div className="setup-form-group">
            <label className="setup-label">Lab owner name</label>
            <input type="text" className="setup-input" />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Lab owner mobile number</label>
            <input type="text" className="setup-input" defaultValue="+91 " />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Lab name</label>
            <input type="text" className="setup-input" />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Lab address</label>
            <textarea className="setup-input" rows="4"></textarea>
          </div>

          <div className="setup-form-group" style={{backgroundColor:'#f9fafb', padding:'1rem', borderRadius:'4px', border:'1px dashed #d1d5db'}}>
            <p style={{fontSize:'0.85rem', color:'#6b7280', margin:'0 0 0.5rem 0'}}>No documents uploaded yet.</p>
            <select className="setup-input" style={{width:'auto', display:'inline-block', marginBottom:'0.5rem'}}>
              <option>Allowed Documents</option>
            </select>
            <br />
            <a href="#upload" style={{color:'#2563eb', fontSize:'0.85rem', textDecoration:'none'}}>Upload files ↑</a>
          </div>

          <button className="setup-btn-blue">Update</button>
        </div>

        {/* Right Column */}
        <div>
          <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>More details</h3>
          
          <div className="setup-form-group">
            <label className="setup-label">Previous software</label>
            <input type="text" className="setup-input" />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Per day patient count</label>
            <select className="setup-input">
              <option>Select</option>
              <option>1 - 10</option>
              <option>10 - 50</option>
              <option>50+</option>
            </select>
          </div>

          <button className="setup-btn-blue">Update</button>
        </div>
      </div>
    </div>
  );
}
