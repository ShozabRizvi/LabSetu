import React from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function EmployeeLogin() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Employee login</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon"/> Add employee</button>
      </div>
      <table className="lab-data-table">
        <thead><tr><th>EMPLOYEE NAME</th><th>ROLE</th><th>LAST LOGIN</th><th>ACTION</th></tr></thead>
        <tbody>
          <tr className="lab-hover-interactive"><td>Jane Doe</td><td>Receptionist</td><td>13/09/2026 09:00 AM</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
          <tr className="lab-hover-interactive"><td>Mark Evans</td><td>Lab Technician</td><td>13/09/2026 08:45 AM</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
          <tr className="lab-hover-interactive"><td>Anna Lee</td><td>Manager</td><td>12/09/2026 18:30 PM</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
        </tbody>
      </table>
    </div>
  );
}
