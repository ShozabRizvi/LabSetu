import React from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, PlayCircleIcon, QuestionMarkCircleIcon, PencilIcon, EllipsisHorizontalIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TestPackages() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Test packages</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon" /> Add new</button>
      </div>
      
      <div className="lab-help-banner">
        <QuestionMarkCircleIcon className="lab-small-icon" /> How it works?
        <button className="lab-link-btn" style={{marginLeft: '1rem'}}><PlayCircleIcon className="lab-btn-icon" /> Watch Video</button>
      </div>

      <div className="lab-tabs-row">
        <div className="lab-tabs">
          <button className="lab-tab active">In ratelist <span className="lab-badge">20</span></button>
          <button className="lab-tab">Not in ratelist <span className="lab-badge">0</span></button>
        </div>
      </div>
      
      <div className="lab-search-input-wrapper" style={{maxWidth: '300px', marginBottom: '0.5rem'}}>
        <MagnifyingGlassIcon className="lab-search-icon" />
        <input type="text" placeholder="Search in page" className="lab-input" style={{width: '100%'}} />
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>S. NO.</th>
            <th>NAME</th>
            <th>FEE</th>
            <th>FOR GENDER</th>
            <th>INCLUDED TESTS AND PANELS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1.</td>
            <td>Anemia package</td>
            <td>Rs.100</td>
            <td>Both</td>
            <td>C-Reactive Protein, CRP (Quantitative), Folic Acid...</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr>
            <td>2.</td>
            <td>Antenatal Package</td>
            <td>Rs.100</td>
            <td>Female</td>
            <td>Urine Routine Examination, Thyroid-Stimulating...</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr>
            <td>3.</td>
            <td>Arthritis Package</td>
            <td>Rs.100</td>
            <td>Both</td>
            <td>C-Reactive Protein, CRP (Quantitative), C3 Compl...</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr>
            <td>4.</td>
            <td>CBC with GBP</td>
            <td>Rs.100</td>
            <td>Both</td>
            <td>Peripheral Blood Smear, Complete Blood Count...</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr>
            <td>5.</td>
            <td>Diabetic package</td>
            <td>Rs.100</td>
            <td>Both</td>
            <td>Urine Routine Examination, Serum Uric Acid...</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
