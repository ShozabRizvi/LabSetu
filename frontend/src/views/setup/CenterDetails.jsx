import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function CenterDetails() {
  const caseTypes = [
    "Lab case", "Usg case", "Digital xray case", "Xray case", "Outsource lab case",
    "Ecg case", "Ct scan case", "Mri case", "Eps case", "Opg case", "Cardiology case",
    "Eeg case", "Mammography case"
  ];

  return (
    <div>
      <h2 className="setup-page-title">Centre details</h2>
      
      <div className="setup-form-grid" style={{gridTemplateColumns: '2fr 1fr'}}>
        {/* Left Column (Form) */}
        <div>
          <div className="setup-form-group">
            <label className="setup-label">* Name</label>
            <input type="text" className="setup-input" defaultValue="Labsetu" />
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
            <input type="text" className="setup-input" />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Address line one</label>
            <input type="text" className="setup-input" />
          </div>

          <div className="setup-form-group">
            <label className="setup-label">Address line two</label>
            <input type="text" className="setup-input" />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem'}}>
            <div className="setup-form-group">
              <label className="setup-label">City</label>
              <input type="text" className="setup-input" />
            </div>
            <div className="setup-form-group">
              <label className="setup-label">Postal code</label>
              <input type="text" className="setup-input" />
            </div>
            <div className="setup-form-group">
              <label className="setup-label">State</label>
              <select className="setup-input">
                <option>Uttar Pradesh</option>
              </select>
            </div>
          </div>

          <button className="setup-btn-blue">Update</button>
        </div>

        {/* Right Column (Notes) */}
        <div>
          <div style={{backgroundColor:'#f1f5f9', padding:'1.5rem', borderRadius:'8px'}}>
            <h4 style={{display:'flex', alignItems:'center', gap:'0.5rem', margin:'0 0 1rem 0', color:'#334155'}}>
              <DocumentTextIcon className="setup-icon" /> Note:
            </h4>
            <ul style={{fontSize:'0.85rem', color:'#475569', paddingLeft:'1.2rem', marginBottom:'1.5rem', lineHeight:'1.6'}}>
              <li>Centre details will be used to print the bills.</li>
              <li>Centre phone number will be used in the welcome sms.</li>
            </ul>
            <div style={{fontSize:'0.85rem', color:'#334155', display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              <div><strong>Country:</strong> India</div>
              <div><strong>Currency symbol:</strong> Rs.</div>
              <div><strong>Timezone:</strong> New Delhi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
