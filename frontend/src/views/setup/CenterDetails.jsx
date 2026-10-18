import React, { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function CenterDetails() {
  const caseTypes = [
    "Lab case", "Usg case", "Digital xray case", "Xray case", "Outsource lab case",
    "Ecg case", "Ct scan case", "Mri case", "Eps case", "Opg case", "Cardiology case",
    "Eeg case", "Mammography case"
  ];

  const initialDetails = {
    name: 'LabSetu Diagnostics',
    phone: '+91 9876543210',
    address1: 'Plot 12, Medical Square',
    address2: 'Near District Hospital',
    city: 'Lucknow',
    postalCode: '226010',
    state: 'Uttar Pradesh'
  };

  const { data: centerData, update: updateCenter } = useDemoResource('setup-center', initialDetails);
  const [form, setForm] = useState(centerData || initialDetails);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    updateCenter(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="setup-page-title" style={{ margin: 0 }}>Centre details</h2>
        {savedNotice && (
          <span style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: '600' }}>
            ✓ Centre details updated successfully!
          </span>
        )}
      </div>
      
      <form onSubmit={handleUpdate} className="setup-form-grid" style={{gridTemplateColumns: '2fr 1fr'}}>
        {/* Left Column (Form) */}
        <div>
          <div className="setup-form-group">
            <label className="setup-label">* Name</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Case types</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'0.75rem'}}>
              {caseTypes.map(type => (
                <label key={type} style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem'}}>
                  <input type="checkbox" defaultChecked /> {type}
                </label>
              ))}
            </div>
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Centre phone number</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Address line one</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.address1} 
              onChange={e => setForm({ ...form, address1: e.target.value })}
            />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Address line two</label>
            <input 
              type="text" 
              className="setup-input" 
              value={form.address2} 
              onChange={e => setForm({ ...form, address2: e.target.value })}
            />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem'}}>
            <div className="setup-form-group">
              <label className="setup-label">City</label>
              <input 
                type="text" 
                className="setup-input" 
                value={form.city} 
                onChange={e => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="setup-form-group">
              <label className="setup-label">Postal code</label>
              <input 
                type="text" 
                className="setup-input" 
                value={form.postalCode} 
                onChange={e => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
            <div className="setup-form-group">
              <label className="setup-label">State</label>
              <select 
                className="setup-input"
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
              >
                <option>Uttar Pradesh</option>
                <option>Delhi NCR</option>
                <option>Maharashtra</option>
                <option>Karnataka</option>
                <option>Bihar</option>
              </select>
            </div>
          </div>

          <button type="submit" className="setup-btn-blue">Update Centre Details</button>
        </div>

        {/* Right Column (Notes) */}
        <div>
          <div style={{backgroundColor:'#f1f5f9', padding:'1.5rem', borderRadius:'8px'}}>
            <h4 style={{display:'flex', alignItems:'center', gap:'0.5rem', margin:'0 0 1rem 0', color:'#334155'}}>
              <DocumentTextIcon className="setup-icon" /> Note:
            </h4>
            <ul style={{fontSize:'0.85rem', color:'#475569', paddingLeft:'1.2rem', marginBottom:'1.5rem', lineHeight:'1.6'}}>
              <li>Centre details will be printed on all invoices and report headers.</li>
              <li>Centre phone number will be included in the automated patient SMS dispatch.</li>
            </ul>
            <div style={{fontSize:'0.85rem', color:'#334155', display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              <div><strong>Country:</strong> India</div>
              <div><strong>Currency symbol:</strong> Rs. (INR)</div>
              <div><strong>Timezone:</strong> Asia/Kolkata (New Delhi)</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
