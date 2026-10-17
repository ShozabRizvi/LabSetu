import React, { useState } from 'react';
import useDemoResource from '../../hooks/useDemoResource';

export default function KYC() {
  const initialKyc = {
    ownerName: 'Dr. Shozab Rizvi',
    phone: '+91 9876543210',
    labName: 'LabSetu Diagnostics',
    address: 'Plot 12, Medical Square, Lucknow, UP',
    prevSoftware: 'Manual / Excel',
    patientCount: '10 - 50',
    documentType: 'Aadhaar Card'
  };

  const { data: kycData, update: updateKyc } = useDemoResource('setup-kyc', initialKyc);
  const [form, setForm] = useState(kycData || initialKyc);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    updateKyc(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="setup-page-title" style={{ margin: 0 }}>KYC & Verification</h2>
        {savedNotice && (
          <span style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: '600' }}>
            ✓ KYC details updated successfully!
          </span>
        )}
      </div>
      
      <form onSubmit={handleUpdate} className="setup-form-grid">
        {/* Left Column */}
        <div>
          <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>Ownership verification details</h3>
          
          <div className="setup-form-group">
            <label className="setup-label">Lab owner name</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.ownerName}
              onChange={e => setForm({ ...form, ownerName: e.target.value })}
              required
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Lab owner mobile number</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Lab name</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.labName}
              onChange={e => setForm({ ...form, labName: e.target.value })}
              required
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Lab address</label>
            <textarea 
              className="setup-input" 
              rows="4"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="setup-form-group" style={{backgroundColor:'#f9fafb', padding:'1rem', borderRadius:'4px', border:'1px dashed #d1d5db'}}>
            <p style={{fontSize:'0.85rem', color:'#6b7280', margin:'0 0 0.5rem 0'}}>Uploaded Verification Document: Aadhaar & Clinical Establishment Licence</p>
            <select 
              className="setup-input" 
              style={{width:'auto', display:'inline-block', marginBottom:'0.5rem'}}
              value={form.documentType}
              onChange={e => setForm({ ...form, documentType: e.target.value })}
            >
              <option>Aadhaar Card</option>
              <option>Clinical Establishment Act Certificate</option>
              <option>GST Registration</option>
              <option>Passport</option>
            </select>
            <br />
            <span style={{color:'#15803d', fontSize:'0.85rem', cursor:'pointer'}} onClick={() => alert('Document upload modal: Select PDF or JPEG')}>Upload updated files ↑</span>
          </div>

          <button type="submit" className="setup-btn-blue">Update Ownership Details</button>
        </div>

        {/* Right Column */}
        <div>
          <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>More details</h3>
          
          <div className="setup-form-group">
            <label className="setup-label">Previous software</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.prevSoftware}
              onChange={e => setForm({ ...form, prevSoftware: e.target.value })}
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Per day patient count</label>
            <select 
              className="setup-input"
              value={form.patientCount}
              onChange={e => setForm({ ...form, patientCount: e.target.value })}
            >
              <option>Select</option>
              <option>1 - 10</option>
              <option>10 - 50</option>
              <option>50+</option>
            </select>
          </div>

          <button type="submit" className="setup-btn-blue">Update Details</button>
        </div>
      </form>
    </div>
  );
}
