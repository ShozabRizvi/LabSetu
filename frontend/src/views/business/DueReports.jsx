import React, { useState } from 'react';
import { CheckCircleIcon, ChatBubbleBottomCenterTextIcon, CheckIcon } from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function DueReports() {
  const [dues, setDues] = useState([
    { id: 'BILL-401', patient: 'Karan Mehra', phone: '9876511223', test: 'Liver Function Test + Lipid', total: 1550, paid: 1000, due: 550, date: '12/09/2026' },
    { id: 'BILL-398', patient: 'Sunita Yadav', phone: '9812345678', test: 'Thyroid Profile Comprehensive', total: 800, paid: 400, due: 400, date: '10/09/2026' },
    { id: 'BILL-385', patient: 'Vikram Joshi', phone: '9798765432', test: 'Digital X-Ray Chest PA View', total: 400, paid: 0, due: 400, date: '08/09/2026' }
  ]);

  const [dateRange, setDateRange] = useState('14/08/2026 - 13/09/2026');

  const totalDueAmount = dues.reduce((acc, curr) => acc + curr.due, 0);

  const handleSendReminder = (patient, phone) => {
    alert(`SMS payment reminder dispatched to ${patient} (${phone})!`);
  };

  const handleClearDue = (id) => {
    setDues(dues.filter(d => d.id !== id));
    alert('Payment recorded and due cleared successfully.');
  };

  return (
    <div className="business-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Due Reports & Patient Balances</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Monitor pending balances, dispatch SMS reminders, and reconcile payments.</p>
        </div>
        <div className="b-date-picker" style={{ margin: 0 }}>
          <input 
            type="text" 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Outstanding Patient Dues</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#dc2626', marginTop: '0.2rem' }}>Rs. {totalDueAmount}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Unsettled Cases</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>{dues.length} Cases</div>
        </div>
      </div>

      {dues.length === 0 ? (
        <div className="b-empty-state">
          <div className="b-empty-icon-box">
            <CheckCircleIcon className="b-empty-icon" />
          </div>
          <p>All dues are cleared.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem' }}>BILL ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>PATIENT NAME</th>
                <th style={{ padding: '0.75rem 1rem' }}>CONTACT</th>
                <th style={{ padding: '0.75rem 1rem' }}>INVESTIGATIONS</th>
                <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                <th style={{ padding: '0.75rem 1rem' }}>TOTAL</th>
                <th style={{ padding: '0.75rem 1rem' }}>DUE AMOUNT</th>
                <th style={{ padding: '0.75rem 1rem' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {dues.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{item.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><strong>{item.patient}</strong></td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{item.phone}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{item.test}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{item.date}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>Rs. {item.total}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#dc2626' }}>Rs. {item.due}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => handleSendReminder(item.patient, item.phone)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        <ChatBubbleBottomCenterTextIcon style={{ width: '14px' }} /> SMS Reminder
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearDue(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckIcon style={{ width: '14px' }} /> Settle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
