import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function DueReports() {
  return (
    <div className="business-page">
      <h2>Due report</h2>
      <div className="b-date-picker">
        <input type="text" value="14/08/2026 - 13/09/2026" readOnly />
      </div>
      
      <div className="b-empty-state">
        <div className="b-empty-icon-box">
          <CheckCircleIcon className="b-empty-icon" />
        </div>
        <p>All dues are cleared.</p>
      </div>
    </div>
  );
}
