import React from 'react';
import '../cases/OutsourceCases.css';

export default function TodaysCasesXray() {
  return (
    <div className="cases-container">
      <h2>Today's cases (Digital X-Ray)</h2>
      <div className="cases-date-picker">
        <input type="text" value="13/09/2026 - 13/09/2026" readOnly className="cases-date-input" style={{width:'220px'}} />
        <button style={{marginLeft:'1rem', padding:'0.5rem 1rem', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Search</button>
      </div>
      <table className="cases-table">
        <thead>
          <tr>
            <th>Reg. No.</th>
            <th>Date</th>
            <th>Patient</th>
            <th>Investigations</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>X-101</td><td>13/09/2026</td><td>John Smith</td><td>Chest PA</td><td><span className="status-new">New</span></td></tr>
          <tr><td>X-102</td><td>13/09/2026</td><td>Alice Brown</td><td>Knee AP/LAT</td><td><span className="status-progress">In Progress</span></td></tr>
          <tr><td>X-103</td><td>13/09/2026</td><td>Tom Hanks</td><td>L-Spine AP/LAT</td><td><span className="status-final">Completed</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}
