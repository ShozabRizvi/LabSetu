import React from 'react';
import './Dashboard.css';
import logo from './assets/logo.png';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="LabSetu Logo" className="dashboard-logo" />
        </div>
        <div className="dashboard-header-center">
          <input 
            type="text" 
            placeholder="Search any bills, reports" 
            className="dashboard-search-input" 
          />
        </div>
        <div className="dashboard-header-right">
          <a href="#help" className="dashboard-header-link">Help</a>
          <a href="#setup" className="dashboard-header-link">Setup</a>
          <a href="#video" className="dashboard-header-link">Watch Video</a>
          <a href="#notifications" className="dashboard-header-link">🔔</a>
          <a href="#profile" className="dashboard-header-link">👤</a>
        </div>
      </header>

      {/* Layout Body */}
      <div className="dashboard-body">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar">
          <button className="dashboard-new-bill-btn">+ New bill</button>
          <nav className="dashboard-nav">
            <a href="#getting-started" className="dashboard-nav-item dashboard-nav-active">Getting Started</a>
            <a href="#dashboard" className="dashboard-nav-item">Dashboard</a>
            <a href="#business" className="dashboard-nav-item">Business</a>
            <a href="#cases" className="dashboard-nav-item">Cases</a>
            <a href="#lab" className="dashboard-nav-item">Lab</a>
            <a href="#usg" className="dashboard-nav-item">USG</a>
            <a href="#digital-xray" className="dashboard-nav-item">Digital X-ray</a>
            <a href="#manage" className="dashboard-nav-item">Manage</a>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          {/* Banner Alerts */}
          <div className="dashboard-banners">
            <div className="dashboard-banner">
              🎉 Super September Deal: ₹4,500/- + GST for the first year | 7 day money back guarantee.
            </div>
            <div className="dashboard-banner dashboard-banner-trial">
              ⚠️ Your trial ends in 5 days. Even if you purchase early, duration of trial period is included for free.
            </div>
            <div className="dashboard-banner">
              💡 Manage entire panels from a single page. Try now Lab &gt; Test Panels
            </div>
          </div>

          <div className="dashboard-content-split">
            {/* Main Left Section */}
            <div className="dashboard-content-left">
              <h2 className="dashboard-content-title">Get started with LabSetu</h2>
              <p className="dashboard-content-desc">
                Watch the video to understand the basics of using LabSetu. There is a lot more to explore in LabSetu, but this video will help you get started.
              </p>
              
              <div className="dashboard-video-placeholder">
                <span>[ Video Player Placeholder ]</span>
              </div>
              
              <ul className="dashboard-checklist">
                <li>✔️ Billing basics</li>
                <li>✔️ Lab reporting basics</li>
              </ul>
            </div>
            
            {/* Narrow Right Column */}
            <div className="dashboard-content-right">
              <div className="dashboard-widget">
                <h3 className="dashboard-widget-title">SMS Credits</h3>
                <p className="dashboard-widget-value">100</p>
              </div>
              <div className="dashboard-widget">
                <h3 className="dashboard-widget-title">Your Relationship Manager</h3>
                <p className="dashboard-widget-desc">Call for Demo/Setup/Support/Any other help</p>
                <div className="dashboard-rm-profile">
                  <div className="dashboard-rm-avatar">👤</div>
                  <div>
                    <strong className="dashboard-rm-name">Mr. Hari</strong>
                    <p className="dashboard-rm-role">BSc. MLT | Sales & Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
