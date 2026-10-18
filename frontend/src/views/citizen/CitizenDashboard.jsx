import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import { demoCitizenReports, demoCitizenBills, appointmentSlots, departments } from '../../data/mockLabData';
import './CitizenDashboard.css';
import {
  CalendarDaysIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckBadgeIcon,
  XMarkIcon,
  PrinterIcon,
  BuildingOffice2Icon,
  TruckIcon,
  SparklesIcon,
  BellAlertIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function CitizenDashboard({ lang: propLang }) {
  const { currentUser } = useAuth();
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const { data: appointments, update: setAppointments } = useDemoResource('appointments', []);
  const [selectedReport, setSelectedReport] = useState(null);

  const readyReports = demoCitizenReports.filter(r => r.status === 'Ready');
  const safeAppts = Array.isArray(appointments) ? appointments : [];
  const upcomingAppts = safeAppts.filter(a => a.status === 'Confirmed');

  const cancelAppointment = (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setAppointments((Array.isArray(appointments) ? appointments : []).map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    }
  };

  return (
    <div className="citizen-dash-container">
      {/* Welcome Banner */}
      <div className="citizen-welcome-hero">
        <div className="hero-text">
          <h1>{lang === 'hi' ? 'स्वागत है' : 'Welcome'}, {currentUser?.name || 'Patient'}</h1>
          <p>
            {lang === 'hi' ? 'रोगी यूएचआईडी' : 'Patient UHID'}: <strong>{currentUser?.uhid || 'UHID-2026-8901'}</strong> · {lang === 'hi' ? 'पंजीकृत केंद्र' : 'Registered Centre'}:{' '}
            <strong>LabSetu Diagnostics</strong>
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/portal/appointments/book" className="hero-btn primary">
            <CalendarDaysIcon style={{ width: '18px' }} />
            {lang === 'hi' ? 'जांच अपॉइंटमेंट बुक करें' : 'Book Lab Appointment'}
          </Link>
          <Link to="/portal/reports" className="hero-btn secondary">
            <DocumentChartBarIcon style={{ width: '18px' }} />
            {lang === 'hi' ? 'मेरी रिपोर्ट्स देखें' : 'All Reports'}
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="citizen-stats-row">
        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper green">
            <DocumentChartBarIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{readyReports.length}</div>
            <div className="stat-label">Published Reports</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper blue">
            <CalendarDaysIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{upcomingAppts.length}</div>
            <div className="stat-label">Upcoming Appointments</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper purple">
            <CreditCardIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">₹550</div>
            <div className="stat-label">Outstanding Invoices</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper emerald">
            <CheckBadgeIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">Verified</div>
            <div className="stat-label">Health ID Status</div>
          </div>
        </div>
      </div>

      {/* Patient Services & Roadmap Hub */}
      <div className="citizen-hub-section">
        <div className="hub-section-header">
          <div>
            <h2 className="hub-section-title">Patient Care & Digital Lab Services</h2>
            <p className="hub-section-subtitle">
              Book tests, track doorstep phlebotomy, understand biomarkers with AI, and manage consent
            </p>
          </div>
        </div>

        <div className="citizen-hub-grid">
          <Link to="/portal/home-collection" className="hub-card">
            <div className="hub-card-top">
              <div className="hub-card-icon green">
                <TruckIcon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill active">Doorstep</span>
            </div>
            <h4>Home Sample Collection</h4>
            <p>Schedule home phlebotomist visit with live 4-stage tracking and temperature-safe transit.</p>
            <div className="hub-card-footer">
              <span>Book / Track visit</span>
              <ArrowRightIcon style={{ width: '14px' }} />
            </div>
          </Link>

          <Link to="/portal/explainer" className="hub-card ai-featured">
            <div className="hub-card-top">
              <div className="hub-card-icon purple">
                <SparklesIcon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill ai">AI Assistant</span>
            </div>
            <h4>AI Report Explainer</h4>
            <p>Understand complex lab biomarkers in simple Hindi & English with reference ranges.</p>
            <div className="hub-card-footer">
              <span>Explain biomarkers</span>
              <ArrowRightIcon style={{ width: '14px' }} />
            </div>
          </Link>

          <Link to="/portal/labs" className="hub-card">
            <div className="hub-card-top">
              <div className="hub-card-icon blue">
                <BuildingOffice2Icon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill verified">NABL Accredited</span>
            </div>
            <h4>Nearby Participating Labs</h4>
            <p>Compare transparent test pricing, distance, turnaround times, and verified credentials.</p>
            <div className="hub-card-footer">
              <span>Compare labs</span>
              <ArrowRightIcon style={{ width: '14px' }} />
            </div>
          </Link>

          <Link to="/portal/reminders" className="hub-card">
            <div className="hub-card-top">
              <div className="hub-card-icon amber">
                <BellAlertIcon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill prep">Fasting Guide</span>
            </div>
            <h4>Fasting Prep & Reminders</h4>
            <p>Check lab-approved preparation instructions, fasting rules, and recurring reminders.</p>
            <div className="hub-card-footer">
              <span>View instructions</span>
              <ArrowRightIcon style={{ width: '14px' }} />
            </div>
          </Link>

          <Link to="/portal/family" className="hub-card">
            <div className="hub-card-top">
              <div className="hub-card-icon teal">
                <UserGroupIcon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill">Family UHID</span>
            </div>
            <h4>Family Health Profiles</h4>
            <p>Manage health records, appointments, and test history for parents, spouse, and dependents.</p>
            <div className="hub-card-footer">
              <span>Switch / Add member</span>
              <ArrowRightIcon style={{ width: '14px' }} />
            </div>
          </Link>

          <Link to="/portal/privacy" className="hub-card">
            <div className="hub-card-top">
              <div className="hub-card-icon emerald">
                <ShieldCheckIcon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill secure">ABDM Secure</span>
            </div>
            <h4>Privacy & Consent Controls</h4>
            <p>Grant or revoke doctor access, view immutable access audit logs, and export your health data.</p>
            <div className="hub-card-footer">
              <span>Manage consent</span>
              <ArrowRightIcon style={{ width: '14px' }} />
            </div>
          </Link>
        </div>
      </div>

      {/* Split Section: Recent Reports & Upcoming Visits */}
      <div className="citizen-dash-grid">
        {/* Left Column: Recent Diagnostic Reports */}
        <div className="citizen-dash-panel">
          <div className="panel-header">
            <h3>Recent Test Reports</h3>
            <Link to="/portal/reports" className="panel-link">View all reports →</Link>
          </div>

          <div className="reports-table-wrap">
            <table className="citizen-table">
              <thead>
                <tr>
                  <th>REPORT ID</th>
                  <th>TEST NAME</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {demoCitizenReports.slice(0, 3).map((rep) => (
                  <tr key={rep.id}>
                    <td><span className="mono-badge">{rep.id}</span></td>
                    <td>
                      <strong>{rep.testName}</strong>
                      <div className="sub-text">{rep.category}</div>
                    </td>
                    <td>{rep.date}</td>
                    <td>
                      <span className={`citizen-status-badge ${rep.status === 'Ready' ? 'ready' : 'processing'}`}>
                        {rep.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="citizen-table-btn"
                        onClick={() => setSelectedReport(rep)}
                        title="View Report Details"
                      >
                        <EyeIcon style={{ width: '16px' }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Upcoming Appointments */}
        <div className="citizen-dash-panel">
          <div className="panel-header">
            <h3>Upcoming Appointments</h3>
            <Link to="/portal/appointments" className="panel-link">Manage →</Link>
          </div>

          <div className="appt-list-wrap">
            {upcomingAppts.length === 0 ? (
              <div className="empty-appt-box">
                <ClockIcon style={{ width: '36px', color: '#94a3b8' }} />
                <p>No upcoming visits scheduled.</p>
                <Link to="/portal/appointments/book" className="mini-book-btn">
                  Schedule an Appointment
                </Link>
              </div>
            ) : (
              upcomingAppts.map((appt) => {
                const deptObj = departments.find(d => d.id === appt.department);
                const slotObj = appointmentSlots.find(s => s.id === appt.slot);
                return (
                  <div key={appt.id} className="dash-appt-card">
                    <div className="dash-appt-header">
                      <div className="dash-appt-dept">
                        <BuildingOffice2Icon style={{ width: '18px', color: '#15803d' }} />
                        <strong>{deptObj?.name || appt.department}</strong>
                      </div>
                      <span className="appt-badge-confirmed">Confirmed</span>
                    </div>
                    <div className="dash-appt-details">
                      <div>📅 <strong>Date:</strong> {appt.date}</div>
                      <div>⏰ <strong>Time:</strong> {slotObj?.label || appt.slot}</div>
                      <div>👤 <strong>Patient:</strong> {appt.patientName}</div>
                    </div>
                    <div className="dash-appt-footer">
                      <span className="ref-tag">Ref: {appt.id}</span>
                      <button
                        type="button"
                        className="cancel-appt-link"
                        onClick={() => cancelAppointment(appt.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="citizen-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="report-modal-card" onClick={e => e.stopPropagation()}>
            <div className="report-modal-header">
              <div>
                <h2>{selectedReport.testName}</h2>
                <span className="report-id-chip">Report ID: {selectedReport.id}</span>
              </div>
              <button 
                type="button" 
                className="citizen-modal-close" 
                onClick={() => setSelectedReport(null)}
              >
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <div className="report-modal-body">
              <div className="report-meta-grid">
                <div><span>Patient:</span> <strong>{currentUser?.name || 'Shozab Rizvi'}</strong></div>
                <div><span>UHID:</span> <strong>{currentUser?.uhid || 'UHID-2026-8901'}</strong></div>
                <div><span>Date of Collection:</span> <strong>{selectedReport.date}</strong></div>
                <div><span>Reporting Doctor:</span> <strong>{selectedReport.doctor}</strong></div>
              </div>

              {selectedReport.parameters.length > 0 ? (
                <div className="clinical-table-wrap">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>INVESTIGATION</th>
                        <th>OBSERVED VALUE</th>
                        <th>UNIT</th>
                        <th>BIOLOGICAL REFERENCE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.parameters.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.name}</strong></td>
                          <td><span className="param-value">{p.value}</span></td>
                          <td>{p.unit}</td>
                          <td>{p.reference}</td>
                          <td>
                            <span className={`clinical-badge ${p.status.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="processing-banner">
                  <ClockIcon style={{ width: '24px' }} />
                  <div>
                    <strong>Sample Processing in Laboratory</strong>
                    <p>{selectedReport.doctorRemark}</p>
                  </div>
                </div>
              )}

              {selectedReport.doctorRemark && selectedReport.parameters.length > 0 && (
                <div className="doctor-remarks">
                  <strong>Consultant Pathologist Impression:</strong>
                  <p>{selectedReport.doctorRemark}</p>
                </div>
              )}
            </div>

            <div className="report-modal-footer">
              <button 
                type="button" 
                className="report-action-btn primary"
                onClick={() => window.print()}
              >
                <PrinterIcon style={{ width: '18px' }} /> Print / Download PDF
              </button>
              <button 
                type="button" 
                className="report-action-btn secondary"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
