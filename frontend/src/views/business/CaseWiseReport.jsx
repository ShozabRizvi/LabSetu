import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import './CaseWiseReport.css';

export default function CaseWiseReport() {
  const caseTypesLeft = [
    'LabCase', 'UsgCase', 'DigitalXrayCase', 'XrayCase', 
    'OutsourceLabCase', 'EcgCase', 'CtScanCase'
  ];
  
  const caseTypesRight = [
    'MriCase', 'EpsCase', 'OpgCase', 'CardiologyCase', 
    'EegCase', 'MammographyCase'
  ];

  const allCaseTypes = [
    'LabCase', 'MriCase',
    'UsgCase', 'EpsCase',
    'DigitalXrayCase', 'OpgCase',
    'XrayCase', 'CardiologyCase',
    'OutsourceLabCase', 'EegCase',
    'EcgCase', 'MammographyCase',
    'CtScanCase'
  ];

  return (
    <div className="cwr-container">
      <div className="cwr-card">
        {/* Header */}
        <div className="cwr-header">
          <div className="cwr-icon-wrapper">
            <DocumentTextIcon className="cwr-icon" />
          </div>
          <h2 className="cwr-title">Case wise business report</h2>
        </div>

        {/* Form Body */}
        <div className="cwr-body">
          <div className="cwr-form-group cwr-checkbox-group">
            <label className="cwr-checkbox-label">
              <input type="checkbox" defaultChecked />
              Exclude cancelled cases
            </label>
          </div>

          <div className="cwr-form-group">
            <label className="cwr-label">Collection centre*</label>
            <select className="cwr-select">
              <option>Main</option>
            </select>
          </div>

          <div className="cwr-form-group">
            <label className="cwr-label">On*</label>
            <input type="date" className="cwr-input" defaultValue="2026-09-13" />
          </div>

          <div className="cwr-form-group cwr-types-group">
            <label className="cwr-label">Case types*</label>
            <div className="cwr-grid">
              {allCaseTypes.map((type) => (
                <label key={type} className="cwr-checkbox-label">
                  <input type="checkbox" defaultChecked />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cwr-footer">
          <button className="cwr-generate-btn">Generate</button>
        </div>
      </div>
    </div>
  );
}
