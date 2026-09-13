import React from 'react';
import './DailyBusiness.css';
import { FunnelIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export default function DailyBusiness() {
  return (
    <div className="daily-business-container">
      <div className="daily-business-header">
        <h2>Daily business</h2>
        <div className="daily-business-actions">
          <button className="db-action-btn">Business Report</button>
          <button className="db-action-btn">Monthly Overview (BETA)</button>
          <button className="db-action-btn">Print</button>
          <button className="db-action-btn">Email</button>
        </div>
      </div>
      
      <div className="db-date-picker-row">
        <button className="db-arrow-btn">&lt;</button>
        <input type="date" className="db-date-input" defaultValue="2026-09-13" />
        <button className="db-arrow-btn">&gt;</button>
      </div>

      <div className="db-summary-card">
        <div className="db-summary-row">
          <div className="db-summary-item">
            <span className="db-label">Total Income</span>
            <span className="db-value">Rs.0</span>
          </div>
          <span className="db-math">+</span>
          <div className="db-summary-item">
            <span className="db-label">Total collection charge</span>
            <span className="db-value">Rs.0</span>
          </div>
          <span className="db-math">-</span>
          <div className="db-summary-item">
            <span className="db-label">Expenses</span>
            <span className="db-value">Rs.0</span>
          </div>
          <span className="db-math">=</span>
          <div className="db-summary-item highlight">
            <span className="db-label">Net income</span>
            <span className="db-value">Rs.0</span>
          </div>
          <div className="db-date-stamp">
            <span className="db-label">Date -</span>
            <span className="db-value">04:00 PM, 13/09/2026</span>
          </div>
        </div>

        <div className="db-split-row">
          <div className="db-split-col">
            <span className="db-split-label">Cash</span>
            <span>Rs.0</span>
          </div>
          <div className="db-split-col">
            <span className="db-split-label">Card</span>
            <span>Rs.0</span>
          </div>
          <div className="db-split-col">
            <span className="db-split-label">UPI</span>
            <span>Rs.0</span>
          </div>
          <div className="db-split-col">
            <span className="db-split-label">Insurance</span>
            <span>Rs.0</span>
          </div>
        </div>
      </div>

      <div className="db-tabs">
        <button className="db-tab active">Transactions <span className="db-badge">0</span></button>
        <button className="db-tab">Bills <span className="db-badge">0</span></button>
        <button className="db-tab">Expenses <span className="db-badge">0</span></button>
      </div>

      <div className="db-table-controls">
        <div className="db-search-box">
          <MagnifyingGlassIcon className="db-icon" />
          <input type="text" placeholder="Search in page" />
        </div>
        <button className="db-filter-btn">
          <FunnelIcon className="db-icon" /> Previous day bills 0
        </button>
      </div>

      <button className="db-add-cashier-btn">
        <UserPlusIcon className="db-icon" /> Add cashier
      </button>

      <table className="db-table">
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
            <td colSpan="11" className="db-table-total">Total income: <span className="db-total-green">Rs. 0</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
