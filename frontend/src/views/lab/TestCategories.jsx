import React from 'react';
import './LabShared.css';
import { PlusIcon, PencilIcon, EyeIcon, ChevronUpDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function TestCategories() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Test categories</h2>
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon" /> Add new</button>
      </div>
      
      <div className="lab-help-banner">
        <QuestionMarkCircleIcon className="lab-small-icon" /> How to reorder?
      </div>

      <table className="lab-data-table" style={{maxWidth: '800px'}}>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>NAME</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ChevronUpDownIcon className="lab-small-icon" style={{color: '#9ca3af'}}/> 1</div></td>
            <td>Haematology</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <button className="lab-link-btn"><EyeIcon className="lab-small-icon" /> View tests</button>
              </div>
            </td>
          </tr>
          <tr>
            <td><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ChevronUpDownIcon className="lab-small-icon" style={{color: '#9ca3af'}}/> 2</div></td>
            <td>Biochemistry</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <button className="lab-link-btn"><EyeIcon className="lab-small-icon" /> View tests</button>
              </div>
            </td>
          </tr>
          <tr>
            <td><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ChevronUpDownIcon className="lab-small-icon" style={{color: '#9ca3af'}}/> 3</div></td>
            <td>Serology & Immunology</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <button className="lab-link-btn"><EyeIcon className="lab-small-icon" /> View tests</button>
              </div>
            </td>
          </tr>
          <tr>
            <td><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ChevronUpDownIcon className="lab-small-icon" style={{color: '#9ca3af'}}/> 4</div></td>
            <td>Clinical Pathology</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <button className="lab-link-btn"><EyeIcon className="lab-small-icon" /> View tests</button>
              </div>
            </td>
          </tr>
          <tr>
            <td><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ChevronUpDownIcon className="lab-small-icon" style={{color: '#9ca3af'}}/> 5</div></td>
            <td>Microbiology</td>
            <td>
              <div className="lab-actions-inline">
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <button className="lab-link-btn"><EyeIcon className="lab-small-icon" /> View tests</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
