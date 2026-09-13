import React from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function SignaturesXray() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Signatures (Digital X-Ray)</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon"/> Add new</button>
      </div>
      <table className="lab-data-table">
        <thead>
          <tr><th>DOCTOR NAME</th><th>DESIGNATION</th><th>ACTION</th></tr>
        </thead>
        <tbody>
          <tr className="lab-hover-interactive"><td>Dr. John Smith</td><td>Chief Radiologist</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
          <tr className="lab-hover-interactive"><td>Dr. Emily Davis</td><td>Consultant</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
        </tbody>
      </table>
    </div>
  );
}
