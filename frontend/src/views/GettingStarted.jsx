import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import LabSetuVideoPlayer from '../components/common/LabSetuVideoPlayer';
import './GettingStarted.css';

export default function GettingStarted() {
  const { currentUser } = useAuth();
  const orgName = currentUser?.centerName || currentUser?.name || 'LabSetu Diagnostics';

  return (
    <div className="getting-started-container">
      <div className="getting-started-header-card">
        <div className="getting-started-badge">Official Onboarding Video</div>
        <h2 className="getting-started-title">Welcome to LabSetu, {orgName}</h2>
        <p className="getting-started-desc">
          Watch this walkthrough video to understand the end-to-end workflow of LabSetu — from patient registration and invoicing to pathology reporting and citizen portal access.
        </p>
      </div>

      {/* Generated Interactive Video Player */}
      <LabSetuVideoPlayer />

      {/* Interactive Quick Start Checklist */}
      <div className="getting-started-next-steps">
        <h3 className="next-steps-title">Recommended Next Steps</h3>
        <div className="checklist-cards-grid">
          <Link to="/app/cases/new-bill" className="checklist-card">
            <div className="checklist-card-top">
              <CheckCircleIcon className="getting-started-icon" />
              <span className="checklist-step-tag">Step 1</span>
            </div>
            <h4>Create Your First Patient Bill</h4>
            <p>Generate walk-in invoices, assign UHID, and test print GST receipts.</p>
            <span className="checklist-action-link">Open Billing <ArrowRightIcon style={{ width: '14px' }} /></span>
          </Link>

          <Link to="/app/lab/todays-reports" className="checklist-card">
            <div className="checklist-card-top">
              <CheckCircleIcon className="getting-started-icon" />
              <span className="checklist-step-tag">Step 2</span>
            </div>
            <h4>Verify Lab Test Reports</h4>
            <p>Input sample test findings, check reference ranges, and add doctor signatures.</p>
            <span className="checklist-action-link">Open Reports <ArrowRightIcon style={{ width: '14px' }} /></span>
          </Link>

          <Link to="/app/setup/center-details" className="checklist-card">
            <div className="checklist-card-top">
              <CheckCircleIcon className="getting-started-icon" />
              <span className="checklist-step-tag">Step 3</span>
            </div>
            <h4>Configure Center & Letterhead</h4>
            <p>Customize your lab logo, address, phone number, and report header/footer.</p>
            <span className="checklist-action-link">Configure Center <ArrowRightIcon style={{ width: '14px' }} /></span>
          </Link>

          <Link to="/portal/dashboard" className="checklist-card">
            <div className="checklist-card-top">
              <CheckCircleIcon className="getting-started-icon" />
              <span className="checklist-step-tag">Step 4</span>
            </div>
            <h4>Preview Citizen Portal View</h4>
            <p>See how your patients view, download, and track their test reports on mobile.</p>
            <span className="checklist-action-link">View Patient Portal <ArrowRightIcon style={{ width: '14px' }} /></span>
          </Link>
        </div>
      </div>
    </div>
  );
}
