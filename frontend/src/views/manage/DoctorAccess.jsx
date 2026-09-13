import React from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function DoctorAccess() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Doctor access</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon"/> Grant access</button>
      </div>
      <table className="lab-data-table">
        <thead><tr><th>DOCTOR NAME</th><th>ACCESS LEVEL</th><th>LAST LOGIN</th><th>ACTION</th></tr></thead>
        <tbody>
          <tr className="lab-hover-interactive"><td>Dr. Smith</td><td>Full Access</td><td>13/09/2026 10:15 AM</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
          <tr className="lab-hover-interactive"><td>Dr. Jones</td><td>View Only (X-Ray)</td><td>11/09/2026 14:20 PM</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
        </tbody>
      </table>
    </div>
  );
}
