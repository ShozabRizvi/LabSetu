import React, { useState } from 'react';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  ShieldCheckIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function Activities() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [activities] = useState([
    { id: 1, type: 'billing', title: 'New Bill Generated', desc: 'Bill #INV-2026-1051 generated for Riya Sharma (Rs. 850).', user: 'Jane Doe (Receptionist)', time: '10 mins ago', icon: <CurrencyRupeeIcon style={{ width: '20px', color: '#15803d' }} /> },
    { id: 2, type: 'reports', title: 'Diagnostic Report Published', desc: 'CBC report published and signed by Dr. Shozab Rizvi for Patient #1024.', user: 'Mark Evans (Lab Tech)', time: '35 mins ago', icon: <DocumentTextIcon style={{ width: '20px', color: '#0284c7' }} /> },
    { id: 3, type: 'security', title: 'Employee Login Verified', desc: 'Successful login from Chrome on Windows (IP: 192.168.1.14).', user: 'Anna Lee (Manager)', time: '1 hour ago', icon: <ShieldCheckIcon style={{ width: '20px', color: '#9333ea' }} /> },
    { id: 4, type: 'setup', title: 'Ratelist Updated', desc: 'Price updated for Thyroid Function Test from Rs. 450 to Rs. 500.', user: 'Dr. Shozab Rizvi', time: '3 hours ago', icon: <UserCircleIcon style={{ width: '20px', color: '#ea580c' }} /> },
    { id: 5, type: 'billing', title: 'Payment Reconciled', desc: 'Cashier Counter 1 closed shift reconciliation with Rs. 14,200 collected.', user: 'Counter 1', time: 'Yesterday, 8:30 PM', icon: <CurrencyRupeeIcon style={{ width: '20px', color: '#15803d' }} /> }
  ]);

  const filtered = activities.filter(a => {
    const matchesF = filter === 'all' || a.type === filter;
    const matchesS = !search.trim() || 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase()) ||
      a.user.toLowerCase().includes(search.toLowerCase());
    return matchesF && matchesS;
  });

  return (
    <div className="business-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Audit & Activity Trail</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Real-time chronological events, staff logins, report approvals, and financial shifts.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'billing', label: 'Billing' },
            { id: 'reports', label: 'Reports' },
            { id: 'security', label: 'Security & Access' },
            { id: 'setup', label: 'Setup Changes' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filter === t.id ? '#15803d' : '#cbd5e1',
                backgroundColor: filter === t.id ? '#dcfce7' : '#ffffff',
                color: filter === t.id ? '#15803d' : '#475569',
                fontWeight: filter === t.id ? '700' : '500',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', width: '16px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search activities or staff..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.5rem 1rem' }}>
        {filtered.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.title}</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.time}</span>
              </div>
              <p style={{ margin: '0.2rem 0', fontSize: '0.825rem', color: '#475569' }}>{item.desc}</p>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Staff: <strong>{item.user}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
