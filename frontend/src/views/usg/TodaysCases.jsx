import React from 'react';
import '../cases/OutsourceCases.css';

export default function TodaysCasesUSG() {
  return (
    <div className="cases-container">
      <h2>Today's cases (USG)</h2>
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
          <tr><td>U-101</td><td>13/09/2026</td><td>John Smith</td><td>Abdomen USG</td><td><span className="status-new">New</span></td></tr>
          <tr><td>U-102</td><td>13/09/2026</td><td>Alice Brown</td><td>Pelvic USG</td><td><span className="status-progress">In Progress</span></td></tr>
          <tr><td>U-103</td><td>13/09/2026</td><td>Tom Hanks</td><td>Renal USG</td><td><span className="status-final">Completed</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}
