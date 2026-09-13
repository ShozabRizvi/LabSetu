import React from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function TestCounts() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row">
        <h2>Test counts</h2>
      </div>

      <div className="lab-controls-row">
        <div className="lab-date-pager">
          <input type="text" value="13/09/2026 - 13/09/2026" className="lab-input lab-date-input" style={{width: '200px'}} readOnly />
        </div>
        <button className="lab-btn lab-btn-blue">Show</button>
      </div>

      <div className="lab-search-input-wrapper" style={{maxWidth: '300px'}}>
        <MagnifyingGlassIcon className="lab-search-icon" />
        <input type="text" placeholder="Search in page" className="lab-input" style={{width: '100%'}} />
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>S.NO</th>
            <th>TEST NAME</th>
            <th>COUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr className="lab-hover-interactive">
            <td>1</td>
            <td>Complete Blood Count</td>
            <td>45</td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>2</td>
            <td>Lipid Profile</td>
            <td>12</td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>3</td>
            <td>Fasting Blood Sugar</td>
            <td>28</td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>4</td>
            <td>Thyroid Profile</td>
            <td>15</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
