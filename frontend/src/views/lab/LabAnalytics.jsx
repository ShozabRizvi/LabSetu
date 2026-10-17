import React, { useState } from 'react';
import './LabAnalytics.css';

export default function LabAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');

  const dataByRange = {
    '7d': {
      tests: '640',
      testsTrend: '↑ 4% vs last week',
      revenue: '₹ 1,18,000',
      revTrend: '↑ 5% vs last week',
      patients: '310',
      bars: [
        { label: 'Mon', height: '60%' },
        { label: 'Tue', height: '75%' },
        { label: 'Wed', height: '85%' },
        { label: 'Thu', height: '70%' },
        { label: 'Fri', height: '90%' },
        { label: 'Sat', height: '100%', highlight: true },
      ]
    },
    '30d': {
      tests: '2,485',
      testsTrend: '↑ 12% vs last month',
      revenue: '₹ 4,25,000',
      revTrend: '↑ 8% vs last month',
      patients: '1,120',
      bars: [
        { label: 'Jan', height: '40%' },
        { label: 'Feb', height: '55%' },
        { label: 'Mar', height: '70%' },
        { label: 'Apr', height: '65%' },
        { label: 'May', height: '85%' },
        { label: 'Jun', height: '100%', highlight: true },
      ]
    },
    '1y': {
      tests: '28,950',
      testsTrend: '↑ 24% year-on-year',
      revenue: '₹ 49,60,000',
      revTrend: '↑ 18% year-on-year',
      patients: '12,400',
      bars: [
        { label: 'Q1', height: '65%' },
        { label: 'Q2', height: '78%' },
        { label: 'Q3', height: '90%' },
        { label: 'Q4', height: '100%', highlight: true },
      ]
    }
  };

  const current = dataByRange[timeRange];

  return (
    <div className="analytics-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="analytics-title" style={{ margin: 0 }}>Lab Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.35rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setTimeRange('7d')}
            style={{
              padding: '0.4rem 0.8rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: timeRange === '7d' ? '600' : '500',
              background: timeRange === '7d' ? '#15803d' : 'transparent',
              color: timeRange === '7d' ? 'white' : '#475569',
              cursor: 'pointer'
            }}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            style={{
              padding: '0.4rem 0.8rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: timeRange === '30d' ? '600' : '500',
              background: timeRange === '30d' ? '#15803d' : 'transparent',
              color: timeRange === '30d' ? 'white' : '#475569',
              cursor: 'pointer'
            }}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('1y')}
            style={{
              padding: '0.4rem 0.8rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: timeRange === '1y' ? '600' : '500',
              background: timeRange === '1y' ? '#15803d' : 'transparent',
              color: timeRange === '1y' ? 'white' : '#475569',
              cursor: 'pointer'
            }}
          >
            Current Year
          </button>
        </div>
      </div>

      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="stat-label">Total Tests Completed</div>
          <div className="stat-value">{current.tests}</div>
          <div className="stat-trend positive">{current.testsTrend}</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-label">Diagnostic Revenue</div>
          <div className="stat-value">{current.revenue}</div>
          <div className="stat-trend positive">{current.revTrend}</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-label">Unique Patients</div>
          <div className="stat-value">{current.patients}</div>
          <div className="stat-trend neutral">Active clinical registry</div>
        </div>
      </div>

      <div className="analytics-charts-grid">
        {/* Card 1: Bar Chart */}
        <div className="analytics-chart-card">
          <h3 className="chart-title">Revenue Trajectory ({timeRange === '7d' ? 'Daily' : timeRange === '30d' ? 'Monthly' : 'Quarterly'})</h3>
          <div className="bar-chart-container">
            {current.bars.map((bar, idx) => (
              <div key={idx} className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    height: bar.height,
                    backgroundColor: bar.highlight ? '#14532d' : '#22c55e'
                  }}
                />
                <span className="bar-label">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Donut Chart */}
        <div className="analytics-chart-card">
          <h3 className="chart-title">Department Test Distribution</h3>
          <div className="donut-container">
            <div className="donut-chart">
              <div className="donut-hole">
                <span>Total<br />100%</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-color c-haema"></span> Haematology (40%)</div>
              <div className="legend-item"><span className="legend-color c-bio"></span> Biochemistry (35%)</div>
              <div className="legend-item"><span className="legend-color c-sero"></span> Serology (15%)</div>
              <div className="legend-item"><span className="legend-color c-micro"></span> Microbiology (10%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
