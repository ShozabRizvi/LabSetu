import React from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

export default function Interpretations() {
  return (
    <div className="lab-view-container">
      <div className="lab-header-row">
        <h2>Interpretations</h2>
      </div>

      <div className="lab-tabs-row" style={{borderBottom: 'none'}}>
        <div className="lab-tabs">
          <button className="lab-tab active">Test <span className="lab-badge">116</span></button>
          <button className="lab-tab">Panels <span className="lab-badge">13</span></button>
        </div>
      </div>

      <div className="lab-controls-row" style={{justifyContent: 'space-between', marginTop: '0.5rem'}}>
        <div className="lab-search-input-wrapper" style={{width: '300px'}}>
          <MagnifyingGlassIcon className="lab-search-icon" />
          <input type="text" placeholder="Search in page" className="lab-input" style={{width: '100%'}} />
        </div>
        
        <button className="lab-btn lab-btn-blue"><PlusIcon className="lab-btn-icon" /> Add new</button>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>S. NO.</th>
            <th>NAME</th>
            <th>INTERPRETATION</th>
            <th style={{textAlign: 'right'}}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr className="lab-hover-interactive">
            <td>1.</td>
            <td>25 Hydroxy (OH) Vitamin D</td>
            <td>Physiological Basis:</td>
            <td>
              <div className="lab-actions-inline" style={{justifyContent: 'flex-end'}}>
                <button className="lab-view-all-pill">View all</button>
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>5.</td>
            <td>Alfa Fetoprotein, AFP</td>
            <td>Alpha-fetoprotein (AFP) is a crucial protein found in fetal serum, serving a physiological role akin to that of albumin...</td>
            <td>
              <div className="lab-actions-inline" style={{justifyContent: 'flex-end'}}>
                <button className="lab-view-all-pill">View all</button>
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>11.</td>
            <td>Anti Phospholipid IgG</td>
            <td>2006 International Consensus statement on Classification of definite APS</td>
            <td>
              <div className="lab-actions-inline" style={{justifyContent: 'flex-end'}}>
                <button className="lab-view-all-pill">View all</button>
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>32.</td>
            <td>Dengue NS1 Antigen</td>
            <td>Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes...</td>
            <td>
              <div className="lab-actions-inline" style={{justifyContent: 'flex-end'}}>
                <button className="lab-view-all-pill">View all</button>
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>45.</td>
            <td>HbA1c (Glycosylated Hemoglobin)</td>
            <td>Interpretation as per American Diabetes Association (ADA) Guidelines</td>
            <td>
              <div className="lab-actions-inline" style={{justifyContent: 'flex-end'}}>
                <button className="lab-view-all-pill">View all</button>
                <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                <EllipsisHorizontalIcon className="lab-small-icon" style={{color: '#9ca3af', cursor: 'pointer'}} />
              </div>
            </td>
          </tr>
          <tr className="lab-hover-interactive">
            <td>113.</td>
            <td>Urine Routine Examination</td>
            <td>Protein: Elevated urinary protein levels can signal early kidney disease but may also rise due to strenuous exercise...</td>
            <td>
              <div className="lab-actions-inline" style={{justifyContent: 'flex-end'}}>
                <button className="lab-view-all-pill">View all</button>
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
