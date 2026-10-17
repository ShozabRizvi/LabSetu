import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  UsersIcon, 
  CurrencyRupeeIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function BusinessAnalysis() {
  const [timeframe, setTimeframe] = useState('month');

  return (
    <div className="business-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Business Analytics & Intelligence</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Revenue growth, test popularity trends, and patient demographic patterns.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={timeframe} 
            onChange={e => setTimeframe(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month (September 2026)</option>
            <option value="year">Year to Date (2026)</option>
          </select>
          <button 
            type="button" 
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <ArrowDownTrayIcon style={{ width: '16px' }} /> Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gross Billings</span>
            <CurrencyRupeeIcon style={{ width: '20px', color: '#15803d' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0.35rem 0' }}>Rs. 1,48,250</div>
          <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600' }}>↑ 14.8% vs last month</span>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Patient Registrations</span>
            <UsersIcon style={{ width: '20px', color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0.35rem 0' }}>264</div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>↑ 22 new patients this week</span>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Avg. Ticket Value</span>
            <ArrowTrendingUpIcon style={{ width: '20px', color: '#9333ea' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0.35rem 0' }}>Rs. 561</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Healthy diagnostic bundle size</span>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Turnaround Performance</span>
            <ChartBarIcon style={{ width: '20px', color: '#ea580c' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0.35rem 0' }}>98.4%</div>
          <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600' }}>On-time report dispatches</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Top Performing Tests */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#0f172a' }}>Top Diagnostics By Volume</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { name: 'Complete Blood Count (CBC)', count: 142, revenue: 56800, percent: '75%' },
              { name: 'Lipid Profile Comprehensive', count: 88, revenue: 70400, percent: '55%' },
              { name: 'Liver Function Test (LFT)', count: 64, revenue: 48000, percent: '42%' },
              { name: 'Thyroid Profile (T3, T4, TSH)', count: 52, revenue: 26000, percent: '35%' },
              { name: 'HbA1c Blood Sugar', count: 48, revenue: 26400, percent: '30%' }
            ].map(t => (
              <div key={t.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>{t.name}</strong>
                  <span>{t.count} tests (Rs. {t.revenue.toLocaleString()})</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: t.percent, height: '100%', background: '#15803d', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modes & Outsource Split */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#0f172a' }}>Revenue by Payment Mode</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                <span>📱 UPI & QR Code Payments</span>
                <strong>48% (Rs. 71,160)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                <span>💵 Physical Cash Settlement</span>
                <strong>38% (Rs. 56,335)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                <span>💳 Debit & Credit POS Cards</span>
                <strong>14% (Rs. 20,755)</strong>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
            💡 <strong>Smart Observation:</strong> 86% of patients now pay digitally via UPI or card. Cash collection reconciliations are at an all-time speed.
          </div>
        </div>
      </div>
    </div>
  );
}
