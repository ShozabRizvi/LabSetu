import React, { useState } from 'react';
import './Transactions.css';
import { MagnifyingGlassIcon, ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function Transactions() {
  const initialData = [
    { id: 'TX-2041', regNo: 'REG-1049', patient: 'Riya Sharma', ref: 'Self', date: '13 Sep 2026', time: '10:42 AM', dcn: 'D-01', cc: 'Main Lab', amount: 850, method: 'UPI', receivedBy: 'Counter 1' },
    { id: 'TX-2040', regNo: 'REG-1050', patient: 'Aarav Singh', ref: 'Dr. Smith', date: '13 Sep 2026', time: '10:15 AM', dcn: 'D-01', cc: 'Main Lab', amount: 600, method: 'Cash', receivedBy: 'Counter 1' },
    { id: 'TX-2039', regNo: 'REG-1051', patient: 'Meera Verma', ref: 'Dr. Jones', date: '12 Sep 2026', time: '09:54 AM', dcn: 'D-02', cc: 'Branch A', amount: 250, method: 'Card', receivedBy: 'Counter 2' },
    { id: 'TX-2038', regNo: 'REG-1042', patient: 'Vikram Joshi', ref: 'Self', date: '11 Sep 2026', time: '14:20 PM', dcn: 'D-01', cc: 'Main Lab', amount: 1200, method: 'UPI', receivedBy: 'Counter 1' },
    { id: 'TX-2037', regNo: 'REG-1038', patient: 'Ananya Sharma', ref: 'Dr. A. K. Gupta', date: '10 Sep 2026', time: '11:10 AM', dcn: 'D-01', cc: 'Main Lab', amount: 450, method: 'UPI', receivedBy: 'Online Portal' }
  ];

  const [transactions] = useState(initialData);
  const [modeFilter, setModeFilter] = useState('All');
  const [centreFilter, setCentreFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({ mode: 'All', centre: 'All', query: '' });

  const handleSearch = () => {
    setActiveFilters({ mode: modeFilter, centre: centreFilter, query: searchQuery });
  };

  const handleClear = () => {
    setModeFilter('All');
    setCentreFilter('All');
    setTypeFilter('All');
    setSearchQuery('');
    setActiveFilters({ mode: 'All', centre: 'All', query: '' });
  };

  const filtered = transactions.filter(t => {
    if (activeFilters.mode !== 'All' && t.method !== activeFilters.mode) return false;
    if (activeFilters.centre !== 'All' && t.cc !== activeFilters.centre) return false;
    if (activeFilters.query && !t.patient.toLowerCase().includes(activeFilters.query.toLowerCase()) && !t.id.toLowerCase().includes(activeFilters.query.toLowerCase())) return false;
    return true;
  });

  const totalAmount = filtered.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="cases-view-container">
      <h2>Financial Transactions Ledger</h2>
      
      <div className="cases-form-row">
        <div className="cases-field cases-field-duration">
          <label className="cases-label-with-icon">Duration <QuestionMarkCircleIcon className="cases-help-icon" /></label>
          <div className="cases-duration-group">
            <select className="cases-select cases-select-duration">
              <option>Past 7 days</option>
              <option>Past 30 days</option>
              <option>Today</option>
            </select>
            <input type="text" className="cases-input cases-input-date" value="06 Sep 2026 to 13 Sep 2026" readOnly />
          </div>
        </div>
        
        <div className="cases-field">
          <label>Payment mode</label>
          <select className="cases-select" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="All">All Modes</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
          </select>
        </div>
        
        <div className="cases-field">
          <label>Collection centre</label>
          <select className="cases-select" value={centreFilter} onChange={e => setCentreFilter(e.target.value)}>
            <option value="All">All Centres</option>
            <option value="Main Lab">Main Lab</option>
            <option value="Branch A">Branch A</option>
          </select>
        </div>
        
        <div className="cases-field">
          <label>Search Patient / Txn ID</label>
          <input 
            type="text" 
            placeholder="e.g. Riya or TX-2041" 
            className="cases-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="cases-actions-row">
        <button type="button" className="cases-btn cases-btn-blue" onClick={handleSearch}>
          <MagnifyingGlassIcon className="cases-btn-icon" /> Search
        </button>
        <button type="button" className="cases-btn cases-btn-white" onClick={handleClear}>
          Clear
        </button>
      </div>

      <table className="cases-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>REG. NO.</th>
            <th>PATIENT NAME</th>
            <th>REFERRED BY</th>
            <th>DATE</th>
            <th>TIME</th>
            <th>DCN</th>
            <th>CC</th>
            <th>AMOUNT</th>
            <th>METHOD</th>
            <th>RECEIVED BY</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No transactions found for the selected filter.
              </td>
            </tr>
          ) : (
            filtered.map(t => (
              <tr key={t.id}>
                <td><strong>{t.id}</strong></td>
                <td>{t.regNo}</td>
                <td><strong>{t.patient}</strong></td>
                <td>{t.ref}</td>
                <td>{t.date}</td>
                <td>{t.time}</td>
                <td>{t.dcn}</td>
                <td>{t.cc}</td>
                <td><strong>Rs. {t.amount}</strong></td>
                <td>{t.method}</td>
                <td>{t.receivedBy}</td>
              </tr>
            ))
          )}
          {filtered.length > 0 && (
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: '700' }}>
              <td colSpan="8" style={{ textAlign: 'right', padding: '0.85rem' }}>Filtered Transactions Total:</td>
              <td colSpan="3" style={{ color: '#15803d', padding: '0.85rem', fontSize: '1rem' }}>Rs. {totalAmount}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
