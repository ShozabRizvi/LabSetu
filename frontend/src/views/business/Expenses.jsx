import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function Expenses() {
  return (
    <div className="business-page">
      <h2>Expenses</h2>
      <div className="b-empty-state">
        <div className="b-empty-icon-box">
          <InformationCircleIcon className="b-empty-icon" />
        </div>
        <p>No expenses recorded.</p>
      </div>
    </div>
  );
}
