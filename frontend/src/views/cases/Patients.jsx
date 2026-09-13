import React from 'react';
import './Patients.css';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Patients() {
  return (
    <div className="patients-container">
      <h2>Patients</h2>
      
      <div className="patients-form">
        <div className="p-row">
          <div className="p-field">
            <label>UHID</label>
            <input type="text" />
          </div>
          <div className="p-field">
            <label>First name</label>
            <input type="text" />
          </div>
          <div className="p-field">
            <label>Last name</label>
            <input type="text" />
          </div>
          <div className="p-field">
            <label>Mobile number</label>
            <input type="text" />
          </div>
          <div className="p-field">
            <label>ID</label>
            <input type="text" />
          </div>
        </div>

        <div className="p-row p-date-row">
          <div className="p-field">
            <label>From</label>
            <input type="text" placeholder="Select date" />
          </div>
          <div className="p-field">
            <label>To</label>
            <input type="text" placeholder="Select date" />
          </div>
          
          <div className="p-actions">
            <button className="p-search-btn">
              <MagnifyingGlassIcon className="p-icon" /> Search
            </button>
            <button className="p-clear-btn">Clear</button>
          </div>
        </div>
      </div>

      <table className="patients-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NAME</th>
            <th>ADDRESS</th>
            <th>MOBILE NUMBER</th>
            <th>REGISTERED ON</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="5" className="p-empty-cell"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
