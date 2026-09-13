import React from 'react';
import '../lab/LabShared.css';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function BrowserSecurity() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Browser security</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon"/> Add allowed browser</button>
      </div>
      <table className="lab-data-table">
        <thead><tr><th>DEVICE/BROWSER</th><th>LAST LOGIN</th><th>STATUS</th><th>ACTION</th></tr></thead>
        <tbody>
          <tr className="lab-hover-interactive"><td>Chrome (Windows) - Office Desktop</td><td>13/09/2026</td><td>Trusted</td><td><button className="lab-link-btn" style={{color:'#ef4444'}}><TrashIcon className="lab-small-icon"/> Revoke</button></td></tr>
          <tr className="lab-hover-interactive"><td>Safari (iOS) - Mobile</td><td>10/09/2026</td><td>Trusted</td><td><button className="lab-link-btn" style={{color:'#ef4444'}}><TrashIcon className="lab-small-icon"/> Revoke</button></td></tr>
        </tbody>
      </table>
    </div>
  );
}
