import React from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function TodaysReports() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row">
        <h2>Reports for today</h2>
        <a href="#recent" className="lab-recent-link">✨ Recent changes ↗</a>
      </div>
      
      <div className="lab-controls-row">
        <div className="lab-search-input-wrapper">
          <MagnifyingGlassIcon className="lab-search-icon" />
          <input type="text" placeholder="Search in page" className="lab-input" />
        </div>
        
        <div className="lab-date-pager">
          <button className="lab-pager-btn"><ChevronLeftIcon className="lab-small-icon" /></button>
          <input type="text" value="13/09/2026" className="lab-input lab-date-input" readOnly />
          <button className="lab-pager-btn"><ChevronRightIcon className="lab-small-icon" /></button>
        </div>
        
        <div className="lab-goto-wrapper">
          <label>Go to</label>
          <select className="lab-select"><option></option></select>
        </div>
        
        <button className="lab-btn lab-btn-outline"><ChartBarIcon className="lab-btn-icon" /> Stats</button>
        
        <div className="lab-sort-wrapper">
          <label>Sort by:</label>
          <select className="lab-select-minimal"><option>Oldest first</option></select>
        </div>
      </div>

      <div className="lab-tabs-row">
        <div className="lab-tabs">
          <button className="lab-tab">All <span className="lab-badge">3</span></button>
          <button className="lab-tab active">New <span className="lab-badge">1</span></button>
          <button className="lab-tab">In progress <span className="lab-badge">1</span></button>
          <button className="lab-tab">Final <span className="lab-badge">1</span></button>
          <button className="lab-tab">Signed off <span className="lab-badge">0</span></button>
        </div>
        
        <div className="lab-print-status">
          <PrinterIcon className="lab-small-icon" /> 0/0 Printed
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>PATIENT NAME</th>
            <th>TESTS</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1024</td>
            <td>John Doe</td>
            <td>Complete Blood Count (CBC)</td>
            <td><span className="lab-status-badge status-new">New</span></td>
          </tr>
          <tr>
            <td>1025</td>
            <td>Jane Smith</td>
            <td>Lipid Profile</td>
            <td><span className="lab-status-badge status-progress">In progress</span></td>
          </tr>
          <tr>
            <td>1026</td>
            <td>Robert Brown</td>
            <td>Liver Function Test</td>
            <td><span className="lab-status-badge status-final">Final</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
