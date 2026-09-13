import React from 'react';
import './Transactions.css';
import { MagnifyingGlassIcon, ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function Transactions() {
  return (
    <div className="cases-view-container">
      <h2>Transactions</h2>
      
      <div className="cases-form-row">
        <div className="cases-field cases-field-duration">
          <label className="cases-label-with-icon">Duration <QuestionMarkCircleIcon className="cases-help-icon" /></label>
          <div className="cases-duration-group">
            <select className="cases-select cases-select-duration">
              <option>Past 7 days</option>
            </select>
            <input type="text" className="cases-input cases-input-date" value="06 Sep 2026 to 13 Sep 2026" readOnly />
          </div>
        </div>
        
        <div className="cases-field">
          <label>Payment mode</label>
          <select className="cases-select">
            <option>Select mode</option>
          </select>
        </div>
        
        <div className="cases-field">
          <label>Collection centre</label>
          <select className="cases-select">
            <option>Select collection centre</option>
          </select>
        </div>
        
        <div className="cases-field">
          <label>Type</label>
          <select className="cases-select">
            <option>Select type</option>
          </select>
        </div>
      </div>
      
      <div className="cases-actions-row">
        <button className="cases-link-btn">Show more filters <ChevronDownIcon className="cases-small-icon" /></button>
        <button className="cases-btn cases-btn-blue"><MagnifyingGlassIcon className="cases-btn-icon" /> Search</button>
        <button className="cases-btn cases-btn-white">Clear</button>
      </div>

      <table className="cases-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>REG. NO.</th>
            <th>PATIENT NAME</th>
            <th>REFERRED BY</th>
            <th>DATE</th>
            <th>TIME</th>
            <th>DCN</th>
            <th>CC</th>
            <th>AMOUNT</th>
            <th>METHOD</th>
            <th>RECEIVED BY</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="11" className="cases-empty-row"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
