import React from 'react';
import './Transactions.css'; // Reusing layout CSS
import { MagnifyingGlassIcon, ChevronDownIcon, InformationCircleIcon, ArrowDownTrayIcon, CheckIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function ReferralDoctors() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="cases-view-container">
      <h2>Referral Doctors</h2>
      
      <div className="ref-alphabet-row">
        <span className="ref-alphabet-label">Name starts with:</span>
        {alphabet.map(letter => (
          <span key={letter} className="ref-letter">{letter}</span>
        ))}
      </div>

      <div className="cases-form-row">
        <div className="cases-field">
          <label>First name</label>
          <input type="text" className="cases-input" />
        </div>
        
        <div className="cases-field">
          <label>Contact number</label>
          <input type="text" className="cases-input" />
        </div>
        
        <div className="cases-field">
          <label>Active</label>
          <select className="cases-select">
            <option></option>
          </select>
        </div>
        
        <div className="cases-actions-inline">
          <button className="cases-link-btn">Show more filters <ChevronDownIcon className="cases-small-icon" /></button>
          <button className="cases-btn cases-btn-blue"><MagnifyingGlassIcon className="cases-btn-icon" /> Search</button>
          <button className="cases-btn cases-btn-white">Clear</button>
        </div>
      </div>
      
      <div className="ref-info-row">
        <div className="ref-info-text">
          <InformationCircleIcon className="ref-info-icon" /> Inactive referrers will not appear in patient registration page.
        </div>
        <button className="cases-btn cases-btn-white ref-download-btn">
          <ArrowDownTrayIcon className="cases-btn-icon" /> Download active referrers
        </button>
      </div>

      <table className="cases-data-table ref-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>REG. ON</th>
            <th>ACTIVE</th>
            <th>REFERRER</th>
            <th>ADDRESS</th>
            <th>PRINT BUSINESS</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>13/09/2026</td>
            <td><CheckIcon className="ref-check-icon" /></td>
            <td>Self</td>
            <td></td>
            <td>
              <div className="ref-print-action">
                <span className="ref-print-icon">🖨️</span> Select <ChevronDownIcon className="cases-small-icon" />
              </div>
            </td>
            <td><button className="ref-action-link"><EyeIcon className="ref-action-icon" /> View</button></td>
            <td><button className="ref-action-link"><PencilIcon className="ref-action-icon" /> Edit</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
