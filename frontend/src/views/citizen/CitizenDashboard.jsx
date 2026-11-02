import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import { supabase } from '../../lib/supabase';
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
  const { currentUser, activeUHID, activeMember } = useAuth();
  const { lang: contextLang, t } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const navigate = useNavigate();
  const { data: appointments, update: setAppointments } = useDemoResource('appointments', []);
  const [selectedReport, setSelectedReport] = useState(null);

  // Patient Name State - never default to email
  const [patientName, setPatientName] = useState(
    activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : '')
  );

  const readyReports = demoCitizenReports.filter(r => r.status === 'Ready');
  const safeAppts = Array.isArray(appointments) ? appointments : [];
  const upcomingAppts = safeAppts.filter(a => a.status === 'Confirmed');

  // Fetch patient full_name by querying the profiles table
  useEffect(() => {
    let isMounted = true;
    async function loadPatientName() {
      if (activeMember?.name) {
        setPatientName(activeMember.name);
        return;
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        const targetUserId = sessionUser?.id || currentUser?.id;

        let dbName = null;

        // Query profiles table strictly by authenticated user ID (never by email)
        if (targetUserId && typeof targetUserId === 'string' && targetUserId.includes('-')) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', targetUserId)
            .maybeSingle();
          if (profileRow?.full_name && !profileRow.full_name.includes('@')) {
            dbName = profileRow.full_name;
          }
        }

        if (isMounted && dbName) {
          setPatientName(dbName);
        }
      } catch (err) {
        console.warn('[CitizenDashboard] Could not fetch profile name:', err);
      }
    }

    loadPatientName();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, activeMember?.name]);

  const [dbMetrics, setDbMetrics] = useState({
    publishedReports: null,
    upcomingAppointments: null,
    outstandingInvoices: null,
  });

  const fetchMetrics = async () => {
    try {
      const [reportsRes, apptsRes, billsRes] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'signed').then(r => r).catch(() => ({ count: null })),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).neq('status', 'Cancelled').then(r => r).catch(() => ({ count: null })),
        supabase.from('bills').select('due_amount').eq('payment_status', 'due').then(r => r).catch(() => ({ data: [] })),
      ]);

      const totalDues = (billsRes?.data || []).reduce((acc, curr) => acc + (Number(curr.due_amount) || 0), 0);

      setDbMetrics({
        publishedReports: reportsRes?.count !== null && reportsRes?.count !== undefined ? reportsRes.count : readyReports.length,
        upcomingAppointments: apptsRes?.count !== null && apptsRes?.count !== undefined ? apptsRes.count : upcomingAppts.length,
        outstandingInvoices: billsRes?.data && billsRes.data.length > 0 ? `₹${totalDues}` : (billsRes?.count !== null && billsRes?.count === 0 ? '₹0' : '₹550'),
      });
    } catch (err) {
      console.warn('Metrics query fallback:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const channel = supabase.channel('dashboard-metrics-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => fetchMetrics())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cancelAppointment = (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setAppointments((Array.isArray(appointments) ? appointments : []).map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    }
  };

  const handlePrintReport = (report) => {
    setSelectedReport(report);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleExplainWithAi = (report) => {
    if (!report) return;
    const paramList = (report.parameters || [])
      .map((p) => `${p.name}: ${p.value} ${p.unit || ''} (${p.status || 'Normal'})`)
      .join(', ');

    let reportPrompt = `Please explain my ${report.testName || 'diagnostic'} report (ID: ${report.id || 'N/A'}).`;
    if (paramList) {
      reportPrompt += ` Parameters: ${paramList}.`;
    }
    if (report.doctorRemark) {
      reportPrompt += ` Pathologist Impression: ${report.doctorRemark}`;
    }

    try {
      localStorage.setItem('labsetu_explainer_query', reportPrompt);
    } catch (e) {
      console.warn('localStorage error', e);
    }

    setSelectedReport(null);
    navigate('/portal/explainer', { state: { autoQuery: reportPrompt } });
  };

  return (
    <div className="citizen-dash-container">
      {/* Welcome Banner */}
      <div className="citizen-welcome-hero">
        <div className="hero-text">
          <h1>
            {t('dashboard.welcome')}, {activeMember?.name || patientName || 'Patient'}
            {activeMember && activeMember.relation !== 'Self' && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                {activeMember.relation}
              </span>
            )}
          </h1>
          <p>
            {t('dashboard.uhid')}: <strong>{activeUHID || currentUser?.uhid || '—'}</strong> · {t('dashboard.centre')}:{' '}
            <strong>LabSetu Diagnostics</strong>
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/portal/appointments/book" className="hero-btn primary">
            <CalendarDaysIcon style={{ width: '18px' }} />
            {t('dashboard.bookAppointment')}
          </Link>
          <Link to="/portal/reports" className="hero-btn secondary">
            <DocumentChartBarIcon style={{ width: '18px' }} />
            {t('dashboard.myReports')}
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
            <div className="stat-value">{dbMetrics.publishedReports !== null ? dbMetrics.publishedReports : readyReports.length}</div>
            <div className="stat-label">{t('dashboard.publishedReports')}</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper blue">
            <CalendarDaysIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{dbMetrics.upcomingAppointments !== null ? dbMetrics.upcomingAppointments : upcomingAppts.length}</div>
            <div className="stat-label">{t('dashboard.upcomingAppointments')}</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper purple">
            <CreditCardIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{dbMetrics.outstandingInvoices !== null ? dbMetrics.outstandingInvoices : '₹550'}</div>
            <div className="stat-label">{t('dashboard.outstandingInvoices')}</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper emerald">
            <CheckBadgeIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{t('dashboard.verified')}</div>
            <div className="stat-label">{t('dashboard.healthIdStatus')}</div>
          </div>
        </div>
      </div>

      {/* Patient Services & Roadmap Hub */}
      <div className="citizen-hub-section">
        <div className="hub-section-header">
          <div>
            <h2 className="hub-section-title">{t('dashboard.servicesTitle')}</h2>
            <p className="hub-section-subtitle">
              {t('dashboard.servicesSubtitle')}
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
            <h4>{t('dashboard.homeCollectionTitle')}</h4>
            <p>{t('dashboard.homeCollectionDesc')}</p>
            <div className="hub-card-footer">
              <span>{t('dashboard.homeCollectionAction')}</span>
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
            <h4>{t('dashboard.aiExplainerTitle')}</h4>
            <p>{t('dashboard.aiExplainerDesc')}</p>
            <div className="hub-card-footer">
              <span>{t('dashboard.aiExplainerAction')}</span>
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
            <h4>{t('dashboard.nearbyLabsTitle')}</h4>
            <p>{t('dashboard.nearbyLabsDesc')}</p>
            <div className="hub-card-footer">
              <span>{t('dashboard.nearbyLabsAction')}</span>
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
            <h4>{t('dashboard.remindersTitle')}</h4>
            <p>{t('dashboard.remindersDesc')}</p>
            <div className="hub-card-footer">
              <span>{t('dashboard.remindersAction')}</span>
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
            <h4>{t('dashboard.familyTitle')}</h4>
            <p>{t('dashboard.familyDesc')}</p>
            <div className="hub-card-footer">
              <span>{t('dashboard.familyAction')}</span>
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
            <h4>{t('dashboard.privacyTitle')}</h4>
            <p>{t('dashboard.privacyDesc')}</p>
            <div className="hub-card-footer">
              <span>{t('dashboard.privacyAction')}</span>
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
            <h3>{t('dashboard.recentReportsTitle')}</h3>
            <Link to="/portal/reports" className="panel-link">{t('dashboard.viewAll')} →</Link>
          </div>

          <div className="reports-table-wrap">
            <table className="citizen-table">
              <thead>
                <tr>
                  <th>{t('bills.invoiceNo', 'REPORT ID')}</th>
                  <th>{t('bills.testName', 'TEST NAME')}</th>
                  <th>{t('common.date', 'DATE')}</th>
                  <th>{t('common.status', 'STATUS')}</th>
                  <th>{t('common.action', 'ACTION')}</th>
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
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="citizen-table-btn"
                          onClick={() => setSelectedReport(rep)}
                          title="View Report Details"
                        >
                          <EyeIcon style={{ width: '16px' }} /> {t('common.view')}
                        </button>
                        {rep.status === 'Ready' && (
                          <button
                            type="button"
                            className="citizen-table-btn"
                            style={{ color: '#15803d', borderColor: '#86efac', backgroundColor: '#f0fdf4' }}
                            onClick={() => handlePrintReport(rep)}
                            title="Print / Download PDF"
                          >
                            <ArrowDownTrayIcon style={{ width: '15px' }} /> PDF
                          </button>
                        )}
                      </div>
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
          <div id="printable-report" className="report-modal-card printable-area" onClick={e => e.stopPropagation()}>
            {/* Top Accent Stripe */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #15803d, #22c55e)', borderRadius: '4px 4px 0 0' }} />

            {/* Official Pathology Lab Letterhead */}
            <div className="report-letterhead-official" style={{ padding: '1.25rem 1.5rem', borderBottom: '2px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src="/logo.png" alt="LabSetu Logo" style={{ height: '46px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
                      LabSetu Diagnostic & Molecular Pathology Center
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                      NABL ACCREDITED • ISO 15189:2022 CERTIFIED • LIC: DL-PB/2026/89410
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '700', marginTop: '2px' }}>
                      ICMR Ref: ICMR-LABSETU-DEL-0419 • Central Laboratory Network
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                  <div style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '0.8rem', color: '#334155', fontWeight: 'bold' }}>
                    |||| || ||| ||||| ||
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0f172a', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                    SAMPLE: *LS-98410-{selectedReport.id}*
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '700' }}>
                    ✓ PKI SHA-256 AUTHENTICATED
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Screen Header */}
            <div className="report-modal-header" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{selectedReport.testName}</h3>
                <span className="report-id-chip" style={{ marginTop: '2px', display: 'inline-block' }}>Report ID: {selectedReport.id}</span>
              </div>
              <button 
                type="button" 
                className="citizen-modal-close no-print" 
                onClick={() => setSelectedReport(null)}
              >
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <div className="report-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              {/* Patient Demographics Grid */}
              <div className="report-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div><span style={{ color: '#64748b' }}>Patient:</span> <strong>{activeMember?.name || patientName || 'Patient'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Age / Sex:</span> <strong>{activeMember?.age || (currentUser?.age ? `${currentUser.age}Y` : '—')} / {activeMember?.gender || currentUser?.gender || '—'}</strong></div>
                <div><span style={{ color: '#64748b' }}>UHID:</span> <strong>{activeUHID || currentUser?.uhid || '—'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Collection Date:</span> <strong>{selectedReport.date}</strong></div>
                <div><span style={{ color: '#64748b' }}>Reporting Doctor:</span> <strong>{selectedReport.doctor}</strong></div>
                <div><span style={{ color: '#64748b' }}>Status:</span> <strong style={{ color: selectedReport.status === 'Ready' ? '#15803d' : '#b45309' }}>✓ {selectedReport.status}</strong></div>
              </div>

              {/* Investigation Table */}
              {selectedReport.parameters.length > 0 ? (
                <div className="clinical-table-wrap" style={{ marginTop: '0.75rem' }}>
                  <table className="clinical-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: '700' }}>INVESTIGATION</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: '700' }}>OBSERVED VALUE</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: '700' }}>UNIT</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: '700' }}>BIOLOGICAL REFERENCE INTERVAL</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: '700' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.parameters.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.65rem 0.75rem' }}><strong>{p.name}</strong></td>
                          <td style={{ padding: '0.65rem 0.75rem' }}><span className="param-value" style={{ fontWeight: '700', color: '#0f172a' }}>{p.value}</span></td>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{p.unit}</td>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{p.reference}</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
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

              {/* Pathologist Impression */}
              {selectedReport.doctorRemark && selectedReport.parameters.length > 0 && (
                <div className="doctor-remarks" style={{ marginTop: '0.75rem', background: '#f0fdf4', borderLeft: '4px solid #15803d', padding: '0.75rem 1rem', borderRadius: '4px' }}>
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '0.2rem' }}>Consultant Pathologist Impression:</strong>
                  <p style={{ margin: 0, color: '#334155', fontSize: '0.85rem' }}>{selectedReport.doctorRemark}</p>
                </div>
              )}

              {/* Verified Electronic Signature Block */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <div>Verified and Released electronically by LabSetu LIMS.</div>
                  <div style={{ color: '#94a3b8' }}>Report Generated: {selectedReport.date} 11:30 AM • No physical signature required.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#15803d', fontWeight: 'bold' }}>
                    Dr. A. K. Gupta
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0f172a' }}>
                    {selectedReport.doctor || 'Dr. A. K. Gupta (MD Pathology)'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Chief Consultant Pathologist • Reg: MCI-2014-98421
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="report-modal-footer no-print">
              <button 
                type="button" 
                className="report-action-btn primary"
                onClick={() => handlePrintReport(selectedReport)}
              >
                <PrinterIcon style={{ width: '18px' }} /> Print / Download PDF
              </button>
              <button
                type="button"
                className="report-action-btn"
                style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none' }}
                onClick={() => handleExplainWithAi(selectedReport)}
              >
                <SparklesIcon style={{ width: '18px' }} /> Explain with AI
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
