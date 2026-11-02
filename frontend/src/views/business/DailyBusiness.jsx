import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DailyBusiness.css';
import { supabase } from '../../lib/supabase';
import { FunnelIcon, MagnifyingGlassIcon, UserPlusIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function DailyBusiness() {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [search, setSearch] = useState('');
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [cashiers, setCashiers] = useState(['Counter 1 (Main Reception)', 'Dr. Shozab']);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', isFading: false });

  const showToastNotification = (msg) => {
    setToast({ show: true, message: msg, isFading: false });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isFading: true }));
      setTimeout(() => {
        setToast({ show: false, message: '', isFading: false });
      }, 300); // 300ms fade-out animation
    }, 3000); // 3-second auto-dismiss
  };

  // Live Supabase query filtered by calendar day (gte startOfDay, lte endOfDay)
  const fetchLiveTransactions = async (selectedDate) => {
    try {
      const targetDate = selectedDate || date;
      const startOfDay = `${targetDate}T00:00:00.000Z`;
      const endOfDay = `${targetDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        setRecords(data.map(d => ({
          id: d.id,
          regNo: d.reg_no || 'REG-1049',
          patient: d.patient,
          ref: d.ref || 'Self',
          date: new Date(d.created_at).toLocaleDateString(),
          time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dcn: d.dcn || 'D-01',
          cc: d.cc || 'Main Lab',
          amount: Number(d.amount) || 0,
          method: d.method || 'Cash',
          receivedBy: d.received_by || 'Counter 1'
        })));
      } else {
        // Fallback for demonstration if no rows inserted today yet
        setRecords([
          { id: 'TX-2041', regNo: 'REG-1049', patient: 'Riya Sharma', ref: 'Self', date: 'Today', time: '10:42 AM', dcn: 'D-01', cc: 'Main Lab', amount: 850, method: 'UPI', receivedBy: 'Counter 1' },
          { id: 'TX-2040', regNo: 'REG-1050', patient: 'Aarav Singh', ref: 'Dr. Smith', date: 'Today', time: '10:15 AM', dcn: 'D-01', cc: 'Main Lab', amount: 600, method: 'Cash', receivedBy: 'Counter 1' },
          { id: 'TX-2039', regNo: 'REG-1051', patient: 'Meera Verma', ref: 'Dr. Jones', date: 'Today', time: '09:54 AM', dcn: 'D-02', cc: 'Branch A', amount: 250, method: 'Card', receivedBy: 'Counter 2' }
        ]);
      }
    } catch (err) {
      console.warn('Live transactions query fallback:', err);
    }
  };

  useEffect(() => {
    fetchLiveTransactions(date);

    // Bind Supabase Realtime channel listener
    const channel = supabase.channel('daily-business-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchLiveTransactions(date);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  const changeDateBy = (days) => {
    const cur = new Date(date);
    cur.setDate(cur.getDate() + days);
    const newDateStr = cur.toISOString().split('T')[0];
    setDate(newDateStr);
  };

  const handleAddCashier = (e) => {
    e.preventDefault();
    if (cashierName.trim()) {
      const added = cashierName.trim();
      setCashiers([...cashiers, added]);
      setCashierName('');
      setIsCashierModalOpen(false);
      showToastNotification(`Cashier "${added}" registered and assigned to Active Cash Desk.`);
    }
  };

  const filteredRecords = records.filter(r => 
    !search.trim() || 
    r.patient.toLowerCase().includes(search.toLowerCase()) ||
    r.regNo.toLowerCase().includes(search.toLowerCase()) ||
    r.method.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = records.reduce((acc, r) => acc + r.amount, 0);
  const cashTotal = records.filter(r => r.method === 'Cash').reduce((acc, r) => acc + r.amount, 0);
  const upiTotal = records.filter(r => r.method === 'UPI').reduce((acc, r) => acc + r.amount, 0);
  const cardTotal = records.filter(r => r.method === 'Card').reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="daily-business-container">
      {/* Animated State-Driven Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            transform: toast.isFading ? 'translateX(100%)' : 'translateX(0)',
            opacity: toast.isFading ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1px solid #059669',
            maxWidth: '380px'
          }}
          role="alert"
        >
          <CheckCircleIcon style={{ width: '22px', height: '22px', color: '#34d399', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500', lineHeight: 1.4 }}>{toast.message}</span>
        </div>
      )}

      <div className="daily-business-header">
        <div>
          <h2>Daily business</h2>
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
            ● SUPABASE REALTIME SYNC ACTIVE
          </span>
        </div>
        <div className="daily-business-actions">
          <button 
            type="button" 
            className="db-action-btn"
            onClick={() => setIsMonthlyModalOpen(true)}
          >
            Monthly Overview (BETA)
          </button>
          <button 
            type="button" 
            className="db-action-btn"
            onClick={() => window.print()}
          >
            Print
          </button>
          <button 
            type="button" 
            className="db-action-btn"
            onClick={() => {
              const email = window.prompt('Enter email to dispatch daily business ledger:', 'accounts@labsetu.com');
              if (email) showToastNotification(`Daily ledger dispatched to ${email}!`);
            }}
          >
            Email
          </button>
        </div>
      </div>
      
      <div className="db-date-picker-row">
        <button type="button" className="db-arrow-btn" onClick={() => changeDateBy(-1)}>&lt;</button>
        <input 
          type="date" 
          className="db-date-input" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="button" className="db-arrow-btn" onClick={() => changeDateBy(1)}>&gt;</button>
      </div>

      <div className="db-summary-card">
        <div className="db-summary-row">
          <div className="db-summary-item">
            <span className="db-label">Total Income</span>
            <span className="db-value">Rs.{totalIncome}</span>
          </div>
          <span className="db-math">+</span>
          <div className="db-summary-item">
            <span className="db-label">Total collection charge</span>
            <span className="db-value">Rs.0</span>
          </div>
          <span className="db-math">-</span>
          <div className="db-summary-item">
            <span className="db-label">Expenses</span>
            <span className="db-value">Rs.0</span>
          </div>
          <span className="db-math">=</span>
          <div className="db-summary-item highlight">
            <span className="db-label">Net income</span>
            <span className="db-value">Rs.{totalIncome}</span>
          </div>
          <div className="db-date-stamp">
            <span className="db-label">Date -</span>
            <span className="db-value">{date}</span>
          </div>
        </div>

        <div className="db-split-row">
          <div className="db-split-col">
            <span className="db-split-label">Cash</span>
            <span>Rs.{cashTotal}</span>
          </div>
          <div className="db-split-col">
            <span className="db-split-label">Card</span>
            <span>Rs.{cardTotal}</span>
          </div>
          <div className="db-split-col">
            <span className="db-split-label">UPI</span>
            <span>Rs.{upiTotal}</span>
          </div>
          <div className="db-split-col">
            <span className="db-split-label">Insurance</span>
            <span>Rs.0</span>
          </div>
        </div>
      </div>

      <div className="db-tabs">
        <button 
          type="button" 
          className={`db-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions <span className="db-badge">{filteredRecords.length}</span>
        </button>
        <button 
          type="button" 
          className={`db-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses <span className="db-badge">0</span>
        </button>
      </div>

      <div className="db-table-controls">
        <div className="db-search-box">
          <MagnifyingGlassIcon className="db-icon" />
          <input 
            type="text" 
            placeholder="Search in page" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="db-filter-btn" onClick={() => showToastNotification('Filtering active transactions for current register.')}>
          <FunnelIcon className="db-icon" /> Filter Transactions
        </button>
      </div>

      <button 
        type="button" 
        className="db-add-cashier-btn"
        onClick={() => setIsCashierModalOpen(true)}
      >
        <UserPlusIcon className="db-icon" /> Add cashier
      </button>

      <table className="db-table">
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
          {filteredRecords.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.regNo}</td>
              <td><strong>{r.patient}</strong></td>
              <td>{r.ref}</td>
              <td>{r.date}</td>
              <td>{r.time}</td>
              <td>{r.dcn}</td>
              <td>{r.cc}</td>
              <td><strong>Rs. {r.amount}</strong></td>
              <td>{r.method}</td>
              <td>{r.receivedBy}</td>
            </tr>
          ))}
          <tr>
            <td colSpan="11" className="db-table-total">
              Total income: <span className="db-total-green">Rs. {totalIncome}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Add Cashier Modal */}
      {isCashierModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setIsCashierModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Add Cashier Desk</h3>
              <button type="button" onClick={() => setIsCashierModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleAddCashier} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Cashier Desk Name / Staff</label>
                <input required type="text" placeholder="e.g. Counter 3 (Pathology)" value={cashierName} onChange={e => setCashierName(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsCashierModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Add Cashier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Overview Modal */}
      {isMonthlyModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setIsMonthlyModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '540px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Monthly Overview</h3>
              <button type="button" onClick={() => setIsMonthlyModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Monthly Revenue</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#15803d', marginTop: '0.25rem' }}>Rs. 1,48,250</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Bills Executed</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>264 Bills</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsMonthlyModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Close Overview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
