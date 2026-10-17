import React, { useState } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function Expenses() {
  const [expenses, setExpenses] = useState([
    { id: 'EXP-101', title: 'Vacutainer Tubes & Syringes', category: 'Lab Consumables', amount: 3500, date: '13/09/2026', paidVia: 'UPI', addedBy: 'Dr. Shozab' },
    { id: 'EXP-102', title: 'Biochemistry Reagents Pack', category: 'Reagents & Kits', amount: 8200, date: '11/09/2026', paidVia: 'Bank Transfer', addedBy: 'Mark Evans' },
    { id: 'EXP-103', title: 'Thermal Barcode Rolls', category: 'Printing & Stationery', amount: 650, date: '09/09/2026', paidVia: 'Cash', addedBy: 'Jane Doe' },
    { id: 'EXP-104', title: 'High-speed Fiber Internet Bill', category: 'Utilities', amount: 1200, date: '05/09/2026', paidVia: 'UPI', addedBy: 'Dr. Shozab' }
  ]);

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', category: 'Lab Consumables', amount: '', paidVia: 'UPI' });

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (newExp.title && newExp.amount) {
      const item = {
        id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
        title: newExp.title,
        category: newExp.category,
        amount: Number(newExp.amount),
        date: new Date().toLocaleDateString('en-GB'),
        paidVia: newExp.paidVia,
        addedBy: 'Dr. Shozab'
      };
      setExpenses([item, ...expenses]);
      setNewExp({ title: '', category: 'Lab Consumables', amount: '', paidVia: 'UPI' });
      setIsAddModalOpen(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this expense record?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const filtered = expenses.filter(e =>
    !search.trim() ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="business-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Expenses</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Track laboratory overheads, consumables, reagents, and operational costs.</p>
        </div>
        <button 
          type="button" 
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#15803d',
            color: '#ffffff',
            border: 'none',
            padding: '0.6rem 1rem',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <PlusIcon style={{ width: '18px' }} /> Record New Expense
        </button>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Expenses (This Month)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#dc2626', marginTop: '0.2rem' }}>Rs. {totalExpense}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Expense Entries</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>{expenses.length} Records</div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', maxWidth: '340px', position: 'relative' }}>
        <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', width: '16px', color: '#94a3b8' }} />
        <input 
          type="text" 
          placeholder="Filter expenses..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.2rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem 1rem' }}>EXPENSE ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>DESCRIPTION</th>
              <th style={{ padding: '0.75rem 1rem' }}>CATEGORY</th>
              <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
              <th style={{ padding: '0.75rem 1rem' }}>METHOD</th>
              <th style={{ padding: '0.75rem 1rem' }}>AMOUNT</th>
              <th style={{ padding: '0.75rem 1rem' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{item.id}</td>
                <td style={{ padding: '0.75rem 1rem' }}><strong>{item.title}</strong></td>
                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{item.category}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.date}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.paidVia}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#dc2626' }}>Rs. {item.amount}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                    title="Delete record"
                  >
                    <TrashIcon style={{ width: '16px' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setIsAddModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Record Laboratory Expense</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Expense Description</label>
                <input required type="text" placeholder="e.g. Centrifuge Machine Servicing" value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Expense Category</label>
                <select value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}>
                  <option>Lab Consumables</option>
                  <option>Reagents & Kits</option>
                  <option>Printing & Stationery</option>
                  <option>Utilities & Maintenance</option>
                  <option>Courier & Outsource Transport</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Amount (Rs.)</label>
                <input required type="number" placeholder="e.g. 1500" value={newExp.amount} onChange={e => setNewExp({ ...newExp, amount: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Payment Mode</label>
                <select value={newExp.paidVia} onChange={e => setNewExp({ ...newExp, paidVia: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}>
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Card</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
