import React from 'react';
import '../cases/OutsourceCases.css';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchCasesXray() {
  return (
    <div className="cases-container">
      <h2>Search cases (Digital X-Ray)</h2>
      <div className="cases-date-picker" style={{display:'flex', gap:'1rem', alignItems:'center'}}>
        <div className="cases-date-input" style={{display:'flex', alignItems:'center', padding:'0.5rem'}}>
          <MagnifyingGlassIcon style={{width:'18px', marginRight:'0.5rem', color:'#6b7280'}} />
          <input type="text" placeholder="Search by name, ID..." style={{border:'none', outline:'none'}} />
        </div>
        <button style={{padding:'0.5rem 1rem', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Search</button>
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
          <tr><td>X-098</td><td>12/09/2026</td><td>Mike Doe</td><td>Chest PA</td><td><span className="status-final">Completed</span></td></tr>
          <tr><td>X-099</td><td>12/09/2026</td><td>Sarah Connor</td><td>Hand AP/OBL</td><td><span className="status-final">Completed</span></td></tr>
          <tr><td>X-100</td><td>12/09/2026</td><td>Peter Parker</td><td>Ankle AP/LAT</td><td><span className="status-final">Completed</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}
