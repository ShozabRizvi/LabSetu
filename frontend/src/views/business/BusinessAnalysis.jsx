import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function BusinessAnalysis() {
  return (
    <div className="business-page">
      <h2>Business analysis</h2>
      <div className="b-empty-state">
        <div className="b-empty-icon-box">
          <InformationCircleIcon className="b-empty-icon" />
        </div>
        <p>No analysis data available.</p>
      </div>
    </div>
  );
}
