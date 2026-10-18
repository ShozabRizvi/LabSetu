import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './LabShared.css';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SearchReports() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const initialRows = [
    { regNo: 'R-2026-001', dateTime: '12/09/2026 10:30 AM', patient: 'Alice Walker', ref: 'Dr. Smith', test: 'HbA1c', cc: 'Main Lab', status: 'Signed off', uhid: 'UHID-1001' },
    { regNo: 'R-2026-002', dateTime: '13/09/2026 09:15 AM', patient: 'Tom Hardy', ref: 'Self', test: 'Vitamin D', cc: 'Main Lab', status: 'In progress', uhid: 'UHID-1002' },
    { regNo: 'R-2026-003', dateTime: '13/09/2026 11:45 AM', patient: 'Emily Clark', ref: 'Dr. Jones', test: 'Thyroid Profile', cc: 'Main Lab', status: 'New', uhid: 'UHID-1003' },
    { regNo: 'R-2026-004', dateTime: '13/09/2026 14:10 PM', patient: 'Ananya Sharma', ref: 'Dr. A. K. Gupta', test: 'Complete Blood Count (CBC)', cc: 'Main Lab', status: 'Signed off', uhid: 'UHID-8901' }
  ];

  const [firstName, setFirstName] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('All');
  const [testFilter, setTestFilter] = useState('All');
  const [activeSearch, setActiveSearch] = useState({ name: initialQuery, status: 'All', test: 'All' });
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (initialQuery) {
      setFirstName(initialQuery);
      setActiveSearch({ name: initialQuery, status: 'All', test: 'All' });
    }
  }, [initialQuery]);

  const handleSearch = () => {
    setActiveSearch({ name: firstName, status: statusFilter, test: testFilter });
  };

  const handleClear = () => {
    setFirstName('');
    setStatusFilter('All');
    setTestFilter('All');
    setActiveSearch({ name: '', status: 'All', test: 'All' });
  };

  const filtered = initialRows.filter(r => {
    if (activeSearch.name && !r.patient.toLowerCase().includes(activeSearch.name.toLowerCase()) && !r.regNo.toLowerCase().includes(activeSearch.name.toLowerCase()) && !r.test.toLowerCase().includes(activeSearch.name.toLowerCase())) {
      return false;
    }
    if (activeSearch.status !== 'All' && r.status !== activeSearch.status) {
      return false;
    }
    if (activeSearch.test !== 'All' && !r.test.includes(activeSearch.test)) {
      return false;
    }
    return true;
  });

  return (
    <div className="lab-view-container">
      <h2>Search laboratory reports & patient results</h2>
      
      <div className="lab-form-row">
        <div className="lab-field lab-field-duration">
          <label>Duration</label>
          <div className="lab-duration-group">
            <select className="lab-select lab-select-duration">
              <option>Past 7 days</option>
              <option>Past 30 days</option>
            </select>
            <input type="text" className="lab-input lab-input-date" value="06 Sep 2026 to 13 Sep 2026" readOnly />
          </div>
        </div>
        
        <div className="lab-field">
          <label>Patient name / query</label>
          <input 
            type="text" 
            className="lab-input" 
            placeholder="Search patient, reg no or test"
            value={firstName} 
            onChange={e => setFirstName(e.target.value)} 
          />
        </div>
        
        <div className="lab-field">
          <label>Status</label>
          <select className="lab-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In progress">In progress</option>
            <option value="Signed off">Signed off</option>
          </select>
        </div>
        
        <div className="lab-field">
          <label>Filter by test</label>
          <select className="lab-select" value={testFilter} onChange={e => setTestFilter(e.target.value)}>
            <option value="All">All Tests</option>
            <option value="CBC">Complete Blood Count (CBC)</option>
            <option value="HbA1c">HbA1c</option>
            <option value="Thyroid">Thyroid Profile</option>
            <option value="Vitamin D">Vitamin D</option>
          </select>
        </div>
      </div>

      <div className="lab-form-row" style={{ marginTop: '0.5rem' }}>
        <div className="lab-actions-inline" style={{ marginLeft: 0 }}>
          <button type="button" className="lab-btn lab-btn-blue" onClick={handleSearch}>
            <MagnifyingGlassIcon className="lab-btn-icon" /> Search
          </button>
          <button type="button" className="lab-btn lab-btn-white" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>REG. NO.</th>
            <th>DATE/TIME</th>
            <th>PATIENT</th>
            <th>REFERRED BY</th>
            <th>TESTS</th>
            <th>CC</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No reports found matching your criteria.
              </td>
            </tr>
          ) : (
            filtered.map(r => (
              <tr key={r.regNo}>
                <td><strong>{r.regNo}</strong></td>
                <td>{r.dateTime}</td>
                <td><strong>{r.patient}</strong></td>
                <td>{r.ref}</td>
                <td>{r.test}</td>
                <td>{r.cc}</td>
                <td>
                  <span className={`lab-status-badge status-${r.status.toLowerCase().replace(/\s+/g, '')}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <button 
                    type="button" 
                    className="lab-link-btn"
                    onClick={() => setSelectedReport(r)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Report Quick View Modal */}
      {selectedReport && (
        <div className="citizen-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSelectedReport(null)}>
          <div id="printable-report" className="printable-area" style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Report Details: {selectedReport.regNo}</h3>
              <button type="button" className="no-print" onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div><span>Patient Name:</span> <strong>{selectedReport.patient}</strong></div>
              <div><span>Investigation:</span> <strong>{selectedReport.test}</strong></div>
              <div><span>Sample Registration:</span> {selectedReport.dateTime}</div>
              <div><span>Status:</span> <strong style={{ color: '#15803d' }}>{selectedReport.status}</strong></div>
              <div><span>Referred By:</span> {selectedReport.ref}</div>
              <div><span>Centre:</span> {selectedReport.cc}</div>
            </div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" onClick={() => window.print()} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #15803d', backgroundColor: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Print Slip</button>
              <button type="button" onClick={() => setSelectedReport(null)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
