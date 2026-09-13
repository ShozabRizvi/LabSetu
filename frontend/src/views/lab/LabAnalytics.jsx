import React from 'react';
import './LabAnalytics.css';

export default function LabAnalytics() {
  return (
    <div className="analytics-container">
      <h2 className="analytics-title">Lab Analytics Dashboard</h2>
      
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="stat-label">Total Tests Completed</div>
          <div className="stat-value">2,485</div>
          <div className="stat-trend positive">↑ 12% vs last month</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">₹ 4,25,000</div>
          <div className="stat-trend positive">↑ 8% vs last month</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-label">Active Patients</div>
          <div className="stat-value">1,120</div>
          <div className="stat-trend neutral">- Same as last month</div>
        </div>
      </div>

      <div className="analytics-charts-grid">
        
        {/* Card 1: Bar Chart */}
        <div className="analytics-chart-card">
          <h3 className="chart-title">Monthly Revenue Graph</h3>
          <div className="bar-chart-container">
            <div className="bar-wrapper">
              <div className="bar" style={{height: '40%'}}></div>
              <span className="bar-label">Jan</span>
            </div>
            <div className="bar-wrapper">
              <div className="bar" style={{height: '55%'}}></div>
              <span className="bar-label">Feb</span>
            </div>
            <div className="bar-wrapper">
              <div className="bar" style={{height: '70%'}}></div>
              <span className="bar-label">Mar</span>
            </div>
            <div className="bar-wrapper">
              <div className="bar" style={{height: '65%'}}></div>
              <span className="bar-label">Apr</span>
            </div>
            <div className="bar-wrapper">
              <div className="bar" style={{height: '85%'}}></div>
              <span className="bar-label">May</span>
            </div>
            <div className="bar-wrapper">
              <div className="bar" style={{height: '100%', backgroundColor: '#14532d'}}></div>
              <span className="bar-label">Jun</span>
            </div>
          </div>
        </div>

        {/* Card 2: Donut Chart */}
        <div className="analytics-chart-card">
          <h3 className="chart-title">Test Distribution</h3>
          <div className="donut-container">
            <div className="donut-chart">
              <div className="donut-hole">
                <span>Total<br/>100%</span>
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
