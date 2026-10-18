import React, { useState } from 'react';
import './LabShared.css';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon, PrinterIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function TodaysReports() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('13/09/2026');

  const reports = [
    { id: '1024', name: 'John Doe', tests: 'Complete Blood Count (CBC)', status: 'New' },
    { id: '1025', name: 'Jane Smith', tests: 'Lipid Profile', status: 'In progress' },
    { id: '1026', name: 'Robert Brown', tests: 'Liver Function Test', status: 'Final' },
    { id: '1027', name: 'Ananya Sharma', tests: 'Thyroid Function Profile', status: 'Final' }
  ];

  const filtered = reports.filter(r => {
    const matchesTab = activeTab === 'All' || r.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search) || r.tests.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="lab-view-container">
      <div className="lab-header-row">
        <h2>Reports for today</h2>
        <span className="lab-recent-link" style={{ cursor: 'pointer' }} onClick={() => alert('All report dispatches synced.')}>
          ✨ Recent changes ↗
        </span>
      </div>
      
      <div className="lab-controls-row">
        <div className="lab-search-input-wrapper">
          <MagnifyingGlassIcon className="lab-search-icon" />
          <input 
            type="text" 
            placeholder="Search patient, test or ID..." 
            className="lab-input" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="lab-date-pager">
          <button type="button" className="lab-pager-btn" onClick={() => setDate('12/09/2026')}>
            <ChevronLeftIcon className="lab-small-icon" />
          </button>
          <input type="text" value={date} className="lab-input lab-date-input" readOnly />
          <button type="button" className="lab-pager-btn" onClick={() => setDate('14/09/2026')}>
            <ChevronRightIcon className="lab-small-icon" />
          </button>
        </div>
        
        <button type="button" className="lab-btn lab-btn-outline" onClick={() => alert(`Today's summary: ${reports.length} total samples, 2 final reports.`)}>
          <ChartBarIcon className="lab-btn-icon" /> Stats
        </button>
      </div>

      <div className="lab-tabs-row">
        <div className="lab-tabs">
          {['All', 'New', 'In progress', 'Final', 'Signed off'].map(tab => (
            <button 
              key={tab}
              type="button" 
              className={`lab-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} <span className="lab-badge">
                {tab === 'All' ? reports.length : reports.filter(r => r.status.toLowerCase() === tab.toLowerCase()).length}
              </span>
            </button>
          ))}
        </div>
        
        <div className="lab-print-status" style={{ cursor: 'pointer' }} onClick={() => window.print()}>
          <PrinterIcon className="lab-small-icon" /> Print Batch
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>PATIENT NAME</th>
            <th>TESTS</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id}>
              <td><strong>{r.id}</strong></td>
              <td>{r.name}</td>
              <td>{r.tests}</td>
              <td>
                <span className={`lab-status-badge status-${r.status.toLowerCase().replace(/\s+/g, '')}`}>
                  {r.status}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => alert(`Opening Clinical Report Editor for #${r.id} (${r.name})`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <EyeIcon style={{ width: '13px' }} /> View / Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
