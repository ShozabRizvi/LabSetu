import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import './ReferralBusiness.css';

export default function ReferralBusiness() {
  return (
    <div className="referral-business-container">
      <div className="rb-header">
        <h2>Referral business summary</h2>
        <div className="rb-actions">
          <button className="rb-btn">Watch Video</button>
          <button className="rb-btn rb-btn-blue">Referreral doctor wise report</button>
          <button className="rb-btn">Download cases data</button>
        </div>
      </div>

      <div className="rb-filters">
        <div className="rb-filter-group">
          <FunnelIcon className="rb-icon" /> <span className="rb-filter-label">Filter by period:</span>
          <span className="rb-tag active">Today</span>
          <span className="rb-tag">Yesterday</span>
          <span className="rb-tag">Last Week</span>
          <span className="rb-tag">September</span>
          <span className="rb-tag">August</span>
          <span className="rb-tag">July</span>
          <span className="rb-tag">Custom</span>
        </div>
        
        <button className="rb-btn rb-btn-blue print-btn">Print</button>
      </div>

      <table className="rb-table">
        <thead>
          <tr>
            <th>S. NO.</th>
            <th>REFERRER ID</th>
            <th>NAME</th>
            <th>CONTACT</th>
            <th>TOTAL CASES</th>
            <th>CASES (PATIENTS) IN FILTER</th>
            <th>PRINT BUSINESS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="7" className="rb-empty"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
