import React, { useEffect } from 'react';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronDownIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import './DashboardHome.css';

export default function DashboardHome() {
  useEffect(() => {
    document.title = 'LabSetu - Dashboard';
  }, []);

  return (
    <div className="dashboard-home-container">
      <div className="dashboard-home-grid">
        
        {/* Left Column (Main Content) */}
        <div className="dashboard-home-left">
          
          {/* Quick Access Cards */}
          <div className="dashboard-home-quick-access">
            <div className="dashboard-home-qa-card">
              <div className="dashboard-home-qa-icon-wrapper green-bg">
                <UserIcon className="dashboard-home-qa-icon green-text" />
              </div>
              <span className="dashboard-home-qa-text">Employee logins</span>
            </div>
            <div className="dashboard-home-qa-card">
              <div className="dashboard-home-qa-icon-wrapper blue-bg">
                <ShieldCheckIcon className="dashboard-home-qa-icon blue-text" />
              </div>
              <span className="dashboard-home-qa-text">Browser security</span>
            </div>
            <div className="dashboard-home-qa-card">
              <div className="dashboard-home-qa-icon-wrapper purple-bg">
                <UserGroupIcon className="dashboard-home-qa-icon purple-text" />
              </div>
              <span className="dashboard-home-qa-text">Doctor portal</span>
            </div>
          </div>

          {/* Status & Operations Row 1 */}
          <div className="dashboard-home-status-row">
            {/* Payments due */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <div>
                  <h3 className="dashboard-home-card-title">Payments due</h3>
                  <p className="dashboard-home-card-subtitle">For all time</p>
                </div>
                <a href="#view-all" className="dashboard-home-view-all">View all</a>
              </div>
              <div className="dashboard-home-card-body centered">
                <div className="dashboard-home-status-icon-box">
                  <CheckCircleIcon className="dashboard-home-status-icon" />
                </div>
                <p className="dashboard-home-status-text">All dues are cleared.</p>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <div>
                  <h3 className="dashboard-home-card-title">Recent transactions</h3>
                  <p className="dashboard-home-card-subtitle">For today</p>
                </div>
                <a href="#view-all" className="dashboard-home-view-all">View all &raquo;</a>
              </div>
              <div className="dashboard-home-card-body centered">
                <div className="dashboard-home-status-icon-box">
                  <DocumentTextIcon className="dashboard-home-status-icon" />
                </div>
                <p className="dashboard-home-status-text">No transactions found for today.</p>
                <p className="dashboard-home-status-subtext">Get started by adding a new case.</p>
              </div>
            </div>
          </div>

          {/* Status & Operations Row 2 */}
          <div className="dashboard-home-status-row">
            {/* Recent activities */}
            <div className="dashboard-home-card dashboard-home-status-card">
              <div className="dashboard-home-card-header">
                <h3 className="dashboard-home-card-title">Recent activities</h3>
                <a href="#view-all" className="dashboard-home-view-all">View all</a>
              </div>
              <div className="dashboard-home-card-body centered">
                <div className="dashboard-home-status-icon-box">
                  <ClockIcon className="dashboard-home-status-icon" />
                </div>
                <p className="dashboard-home-status-text">No recent activities to show.</p>
              </div>
            </div>
            
            {/* Empty block to maintain 2-column grid structure in the left container */}
            <div className="dashboard-home-empty-card"></div>
          </div>
        </div>

        {/* Right Column (Widgets) */}
        <div className="dashboard-home-right">
          
          {/* SMS Credits Widget */}
          <div className="dashboard-home-card dashboard-home-sms-card">
            <span className="dashboard-home-sms-text">SMS Credits</span>
            <span className="dashboard-home-sms-badge">100</span>
            <ChevronDownIcon className="dashboard-home-sms-icon" />
          </div>

          {/* Legal Links */}
          <div className="dashboard-home-legal-links">
            <a href="#terms">Terms & Conditions</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#refund">Refund Policy</a>
          </div>

        </div>
      </div>

      {/* Floating Support Pill */}
      <button className="dashboard-home-support-pill">
        <ChatBubbleLeftEllipsisIcon className="dashboard-home-support-icon" />
        <div className="dashboard-home-support-text-block">
          <span className="dashboard-home-support-title">Get Support</span>
          <span className="dashboard-home-support-status"><span className="dashboard-home-support-dot"></span> Offline</span>
        </div>
      </button>
    </div>
  );
}
