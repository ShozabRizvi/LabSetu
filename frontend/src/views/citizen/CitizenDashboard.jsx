import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { assistantService } from '../../services/assistantService';
import { money, rows, statusLabel } from '../../utils/assistantUtils';
import { supabase } from '../../lib/supabase';
import './CitizenDashboard.css';
import {
  CalendarDaysIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckBadgeIcon,
  BuildingOffice2Icon,
  TruckIcon,
  SparklesIcon,
  BellAlertIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function CitizenDashboard(props) {
  const { currentUser } = useAuth();
  return <PatientDashboard key={currentUser?.id || 'anonymous'} {...props} />;
}

function PatientDashboard() {
  const { currentUser, activeUHID, activeMember } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Patient Name State - never default to email
  const [patientName, setPatientName] = useState(
    activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : '')
  );

  const safeAppts = Array.isArray(appointments) ? appointments : [];
  const recentReports = safeAppts.filter(booking => booking.report?.id).map(booking => ({
    ...booking.report, bookingId: booking.id,
    testName: booking.tests?.map(test => test.name).join(', ') || 'Test name unavailable',
    date: booking.report.approvedAt || booking.date,
  }));
  const readyReports = recentReports.filter(report => ['approved', 'released'].includes(report.status));
  const upcomingAppts = safeAppts.filter(booking => booking.status === 'confirmed' && Date.parse(booking.slot?.startsAt || `${booking.date}T${booking.startTime}:00+05:30`) > loadedAt);
  const invoices = safeAppts.filter(booking => booking.status !== 'cancelled').map(booking => booking.invoice);
  const validAmounts = invoices.every(invoice => Number.isSafeInteger(invoice?.totalPaise) && invoice.currency === 'INR');
  const totalDue = validAmounts ? invoices.filter(invoice => invoice.status !== 'paid').reduce((total, invoice) => total + invoice.totalPaise, 0) : undefined;
  const dbMetrics = {
    publishedReports: loaded ? readyReports.length : 'Unavailable',
    upcomingAppointments: loaded ? upcomingAppts.length : 'Unavailable',
    outstandingInvoices: loaded ? money(totalDue) : 'Unavailable',
  };

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

  useEffect(() => {
    let alive = true;
    assistantService.appointments().then(data => {
      if (alive) { setAppointments(rows(data, 'appointments')); setLoadedAt(Date.now()); setLoaded(true); }
    }).catch(failure => { if (alive) setError(failure.message); });
    return () => { alive = false; };
  }, []);

  async function refresh() {
    setBusy(true); setError('');
    try { setAppointments(rows(await assistantService.appointments(), 'appointments')); setLoadedAt(Date.now()); setLoaded(true); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function cancelAppointment(id) {
    if (!window.confirm('Cancel this appointment? The backend will check whether cancellation is allowed.')) return;
    setBusy(true); setError('');
    try { await assistantService.cancel(id); await refresh(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function downloadReport(report) {
    setBusy(true); setError('');
    try {
      const blob = await assistantService.report(report.bookingId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `LabSetu-${report.bookingId}.pdf`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }


  return (
    <div className="citizen-dash-container">
      {error && <p role="alert">{error} Displayed records may be out of date.</p>}
      <button type="button" className="citizen-table-btn" disabled={busy} onClick={refresh}>{busy ? 'Refreshing…' : 'Refresh persisted records'}</button>
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
          <Link to="/portal/assistant" className="hero-btn primary">
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
            <div className="stat-value">{dbMetrics.publishedReports}</div>
            <div className="stat-label">{t('dashboard.publishedReports')}</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper blue">
            <CalendarDaysIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{dbMetrics.upcomingAppointments}</div>
            <div className="stat-label">{t('dashboard.upcomingAppointments')}</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper purple">
            <CreditCardIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{dbMetrics.outstandingInvoices}</div>
            <div className="stat-label">{t('dashboard.outstandingInvoices')}</div>
          </div>
        </div>

        <div className="citizen-stat-card">
          <div className="stat-icon-wrapper emerald">
            <CheckBadgeIcon className="stat-icon" />
          </div>
          <div>
            <div className="stat-value">{currentUser?.uhid ? 'Recorded' : 'Not available'}</div>
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

          <Link to="/portal/assistant" className="hub-card ai-featured">
            <div className="hub-card-top">
              <div className="hub-card-icon purple">
                <SparklesIcon style={{ width: '22px' }} />
              </div>
              <span className="hub-pill ai">AI Assistant</span>
            </div>
            <h4>LabSetu Assistant</h4>
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
              <span className="hub-pill verified">Laboratory directory</span>
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
              <span className="hub-pill secure">Privacy settings</span>
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
                {recentReports.length === 0 && <tr><td colSpan={5}>{loaded ? 'No persisted reports found.' : 'Reports unavailable until the backend responds.'}</td></tr>}
                {recentReports.slice(0, 3).map((rep) => (
                  <tr key={rep.id}>
                    <td><span className="mono-badge">{rep.id}</span></td>
                    <td>
                      <strong>{rep.testName}</strong>
                      <div className="sub-text">{rep.category}</div>
                    </td>
                    <td>{rep.date}</td>
                    <td>
                      <span className={`citizen-status-badge ${['approved', 'released'].includes(rep.status) ? 'ready' : 'processing'}`}>
                        {statusLabel(rep.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="citizen-table-btn"
                          onClick={() => navigate(`/portal/assistant?booking=${encodeURIComponent(rep.bookingId)}`)}
                          title="View Report Details"
                        >
                          <EyeIcon style={{ width: '16px' }} /> {t('common.view')}
                        </button>
                        {['approved', 'released'].includes(rep.status) && (
                          <button
                            type="button"
                            className="citizen-table-btn"
                            style={{ color: '#15803d', borderColor: '#86efac', backgroundColor: '#f0fdf4' }}
                            disabled={busy}
                            onClick={() => downloadReport(rep)}
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
                <p>{loaded ? 'No upcoming visits returned by the backend.' : 'Appointments are unavailable until the backend responds.'}</p>
                <Link to="/portal/assistant" className="mini-book-btn">
                  Schedule an Appointment
                </Link>
              </div>
            ) : (
              upcomingAppts.map((appt) => {
                return (
                  <div key={appt.id} className="dash-appt-card">
                    <div className="dash-appt-header">
                      <div className="dash-appt-dept">
                        <BuildingOffice2Icon style={{ width: '18px', color: '#15803d' }} />
                        <strong>{appt.tests?.map(test => test.name).join(', ') || 'Test name unavailable'}</strong>
                      </div>
                      <span className="appt-badge-confirmed">Confirmed</span>
                    </div>
                    <div className="dash-appt-details">
                      <div>📅 <strong>Date:</strong> {appt.date}</div>
                      <div>⏰ <strong>Time:</strong> {appt.startTime || 'Time unavailable'}</div>
                      <div>👤 <strong>Patient:</strong> {appt.patientName}</div>
                    </div>
                    <div className="dash-appt-footer">
                      <span className="ref-tag">Ref: {appt.id}</span>
                      <button
                        type="button"
                        className="cancel-appt-link"
                        disabled={busy}
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

    </div>
  );
}
