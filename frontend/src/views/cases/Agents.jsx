import React from 'react';
import './Transactions.css';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function Agents() {
  return (
    <div className="cases-view-container">
      <h2>Sample collection agents</h2>
      
      <div className="agents-help-block">
        <div className="agents-help-header">
          <QuestionMarkCircleIcon className="agents-help-icon" /> 
          <span className="agents-help-title">How does this work?</span>
        </div>
        <ul className="agents-help-list">
          <li>You can add and edit agents from new case page.</li>
          <li>Agent name will be displayed on cases page and daily business page.</li>
          <li>You can filter cases by agent name on cases page.</li>
        </ul>
      </div>

      <div className="agents-tabs">
        <button className="agents-tab active">Active <span className="agents-badge">0</span></button>
        <button className="agents-tab">Archived <span className="agents-badge">0</span></button>
      </div>

      <table className="cases-data-table">
        <thead>
          <tr>
            <th>AGENT ID</th>
            <th>NAME</th>
            <th>REGISTERED ON</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="3" className="cases-empty-row"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
