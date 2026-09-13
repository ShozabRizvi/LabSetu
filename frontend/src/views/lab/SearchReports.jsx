import React from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function SearchReports() {
  return (
    <div className="lab-view-container">
      <h2>Search lab reports</h2>
      
      <div className="lab-form-row">
        <div className="lab-field lab-field-duration">
          <label>Duration</label>
          <div className="lab-duration-group">
            <select className="lab-select lab-select-duration">
              <option>Past 7 days</option>
            </select>
            <input type="text" className="lab-input lab-input-date" value="06 Sep 2026 to 13 Sep 2026" readOnly />
          </div>
        </div>
        
        <div className="lab-field">
          <label>Patient first name</label>
          <input type="text" className="lab-input" />
        </div>
        
        <div className="lab-field">
          <label>Status</label>
          <select className="lab-select"><option></option></select>
        </div>
        
        <div className="lab-field">
          <label>Referred by</label>
          <select className="lab-select"><option>Select referrer</option></select>
        </div>
      </div>

      <div className="lab-form-row">
        <div className="lab-field">
          <label>Reg. no.</label>
          <input type="text" className="lab-input" />
        </div>
        <div className="lab-field">
          <label>Daily case no.</label>
          <input type="text" className="lab-input" />
        </div>
        <div className="lab-field">
          <label>UHID</label>
          <input type="text" className="lab-input" />
        </div>
        
        <div className="lab-actions-inline">
          <button className="lab-link-btn">Show all filters <ChevronDownIcon className="lab-small-icon" /></button>
          <button className="lab-btn lab-btn-blue"><MagnifyingGlassIcon className="lab-btn-icon" /> Search</button>
          <button className="lab-btn lab-btn-white">Clear</button>
        </div>
      </div>
      
      <div className="lab-form-row">
        <div className="lab-field">
          <select className="lab-select"><option>Select test</option></select>
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>REG. NO.</th>
            <th>DATE/TIME</th>
            <th>PATIENT</th>
            <th>REFERRED BY</th>
            <th>TESTS</th>
            <th>CC</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>R-2026-001</td>
            <td>12/09/2026 10:30 AM</td>
            <td>Alice Walker</td>
            <td>Dr. Smith</td>
            <td>HbA1c</td>
            <td>Main</td>
            <td><span className="lab-status-badge status-signed">Signed off</span></td>
            <td><button className="lab-link-btn">View</button></td>
          </tr>
          <tr>
            <td>R-2026-002</td>
            <td>13/09/2026 09:15 AM</td>
            <td>Tom Hardy</td>
            <td>Self</td>
            <td>Vitamin D</td>
            <td>Main</td>
            <td><span className="lab-status-badge status-progress">In progress</span></td>
            <td><button className="lab-link-btn">View</button></td>
          </tr>
          <tr>
            <td>R-2026-003</td>
            <td>13/09/2026 11:45 AM</td>
            <td>Emily Clark</td>
            <td>Dr. Jones</td>
            <td>Thyroid Profile</td>
            <td>Main</td>
            <td><span className="lab-status-badge status-new">New</span></td>
            <td><button className="lab-link-btn">View</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
