import React from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function ReportTemplatesUSG() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Report Templates (USG)</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon"/> Add new</button>
      </div>
      <table className="lab-data-table">
        <thead>
          <tr><th>TEMPLATE NAME</th><th>CREATED BY</th><th>ACTION</th></tr>
        </thead>
        <tbody>
          <tr className="lab-hover-interactive"><td>Normal Abdomen</td><td>Dr. Smith</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
          <tr className="lab-hover-interactive"><td>Normal Pelvis</td><td>Dr. Brown</td><td><button className="lab-link-btn"><PencilIcon className="lab-small-icon"/> Edit</button></td></tr>
        </tbody>
      </table>
    </div>
  );
}
