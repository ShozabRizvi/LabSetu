import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import './GettingStarted.css';

export default function GettingStarted() {
  const userEmail = localStorage.getItem('userEmail') || 'user@email.com';

  return (
    <div className="getting-started-container">
      <h2 className="getting-started-title">Welcome, {userEmail}</h2>
      <p className="getting-started-desc">
        Watch the video to understand the basics of using LabSetu. There is a lot more to explore in LabSetu, but this video will help you get started.
      </p>
      
      <div className="getting-started-video-placeholder">
        <span>[ Video Player Placeholder ]</span>
      </div>
      
      <ul className="getting-started-checklist">
        <li><CheckCircleIcon className="getting-started-icon" /> Billing basics</li>
        <li><CheckCircleIcon className="getting-started-icon" /> Lab reporting basics</li>
      </ul>
    </div>
  );
}
