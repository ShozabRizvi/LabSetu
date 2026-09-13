import React from 'react';
import { StarIcon } from '@heroicons/react/24/outline';

export default function GoogleReview() {
  return (
    <div>
      <h2 className="setup-page-title" style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
        Build Google Reviews
      </h2>
      <p style={{color:'#4b5563', marginBottom:'2rem', fontSize:'0.95rem'}}>
        Get more business by building your Google reviews. Bring your lab on top of google search to nearby patients.
      </p>

      <div style={{maxWidth: '500px'}}>
        <div className="setup-form-group">
          <label className="setup-label">Google Business Profile URL</label>
          <input type="text" className="setup-input" placeholder="https://g.page/r/..." />
        </div>
        <button className="setup-btn-blue">Save Configuration</button>
      </div>
    </div>
  );
}
