import React from 'react';
import './OutsourceCases.css';

export default function CtScanCases() {
  return (
    <div className="cases-container">
      <h2>Ct scan cases</h2>
      
      <div className="cases-date-picker">
        <input type="text" value="14/08/2026 - 13/09/2026" readOnly className="cases-date-input" />
      </div>

      <table className="cases-table">
        <thead>
          <tr>
            <th>Reg no.</th>
            <th>Date</th>
            <th>Patient</th>
            <th>Investigations</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="5" className="cases-empty-cell"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
