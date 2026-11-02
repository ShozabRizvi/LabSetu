import React, { useState, useEffect } from 'react';
import './Transactions.css';
import { MagnifyingGlassIcon, QuestionMarkCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('All');
  const [centreFilter, setCentreFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({ mode: 'All', centre: 'All', query: '' });

  // Map database transaction row to UI display object
  const mapDbTransaction = (row) => {
    const createdDate = row.created_at ? new Date(row.created_at) : new Date();
    return {
      id: row.id,
      regNo: row.reg_no || 'REG-1001',
      patient: row.patient || 'Walk-in Patient',
      ref: row.ref || 'Self',
      date: createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dcn: row.dcn || 'D-01',
      cc: row.cc || 'Main Lab',
      amount: Number(row.amount || 0),
      method: row.method || 'Cash',
      receivedBy: row.received_by || 'Cashier Desk'
    };
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Transactions] Supabase query notice:', error);
      }

      if (data && data.length > 0) {
        setTransactions(data.map(mapDbTransaction));
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.warn('[Transactions] Fetch exception:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Attach Realtime listener to push new rows into local state array as they occur
    const channel = supabase.channel('transactions-live-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new) {
          const newRow = mapDbTransaction(payload.new);
          setTransactions(prev => [newRow, ...prev.filter(t => t.id !== newRow.id)]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new) {
          const updatedRow = mapDbTransaction(payload.new);
          setTransactions(prev => prev.map(t => t.id === updatedRow.id ? updatedRow : t));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.old) {
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearch = () => {
    setActiveFilters({ mode: modeFilter, centre: centreFilter, query: searchQuery });
  };

  const handleClear = () => {
    setModeFilter('All');
    setCentreFilter('All');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem' }}>Financial Transactions Ledger</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Real-time cashier journal & transaction auditing directly linked to Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTransactions}
          className="cases-btn cases-btn-white"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          title="Refresh ledger from database"
        >
          <ArrowPathIcon style={{ width: '15px' }} /> Refresh Ledger
        </button>
      </div>
      
      <div className="cases-form-row">
        <div className="cases-field cases-field-duration">
          <label className="cases-label-with-icon">Duration <QuestionMarkCircleIcon className="cases-help-icon" /></label>
          <div className="cases-duration-group">
            <select className="cases-select cases-select-duration">
              <option>All Calendar Records</option>
              <option>Past 7 days</option>
              <option>Today</option>
            </select>
            <input type="text" className="cases-input cases-input-date" value="Live Realtime Journal" readOnly />
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
          {loading ? (
            <tr>
              <td colSpan="11" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: '#15803d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Hydrating transactions ledger in real time...</div>
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No live transactions found for the selected filter.
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
                <td>
                  <span style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    backgroundColor: t.method === 'Cash' ? '#ecfdf5' : t.method === 'UPI' ? '#eff6ff' : '#fef3c7',
                    color: t.method === 'Cash' ? '#047857' : t.method === 'UPI' ? '#1d4ed8' : '#b45309'
                  }}>
                    {t.method}
                  </span>
                </td>
                <td>{t.receivedBy}</td>
              </tr>
            ))
          )}
          {!loading && filtered.length > 0 && (
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
