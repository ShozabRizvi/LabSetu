import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { assistantService } from '../../services/assistantService';
import { rows, statusLabel } from '../../utils/assistantUtils';
import './CitizenAssistant.css';

export default function CitizenAppointments() {
  const { lang } = useLanguage();
  const hi = lang === 'hi';
  const [bookings, setBookings] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const refresh = useCallback(async () => {
    setBusy(true); setError('');
    try { setBookings(rows(await assistantService.appointments(), 'appointments')); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    let alive = true;
    assistantService.appointments().then(data => { if (alive) setBookings(rows(data, 'appointments')); })
      .catch(failure => { if (alive) setError(failure.message); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, []);

  async function cancel() {
    setBusy(true); setError('');
    try { await assistantService.cancel(cancelId); setCancelId(null); await refresh(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <main className="assistant-page">
    <header className="assistant-heading"><div><h1>{hi ? 'मेरी अपॉइंटमेंट' : 'My appointments'}</h1><p>{hi ? 'आपके खाते से जुड़ी सहेजी गई बुकिंग और लैब की प्रगति।' : 'Persisted bookings and laboratory progress for your signed-in account.'}</p></div><Link to="/portal/assistant">{hi ? 'जाँच बुक करें' : 'Book tests with LabSetu Assistant'}</Link></header>
    <button className="secondary" disabled={busy} onClick={refresh}>{busy ? 'Loading…' : hi ? 'स्थिति अपडेट करें' : 'Refresh status'}</button>
    {error && <p className="assistant-error" role="alert">{error} {hi ? 'कोई बुकिंग अनुमानित नहीं की गई है।' : 'Displayed records have not been refreshed.'}</p>}
    {!busy && !error && bookings.length === 0 && <p>{hi ? 'कोई सहेजी गई बुकिंग नहीं मिली।' : 'No persisted appointments were returned for your account.'}</p>}
    {bookings.map(booking => <article className="assistant-card" key={booking.id}>
      <div className="assistant-card-title"><h2>{booking.date} · {booking.startTime || 'Time unavailable'}</h2><strong>{statusLabel(booking.status)}</strong></div>
      <p>Booking: {booking.id}</p>
      <button className="secondary" onClick={() => window.print()}>Print booking details</button>
      <ul>{booking.tests?.map(test => <li key={test.id}>{test.name}</li>)}</ul>
      <div className="assistant-progress"><div><small>Sample</small><strong>{statusLabel(booking.sample?.status)}</strong></div><div><small>Report</small><strong>{statusLabel(booking.report?.status)}</strong></div><div><small>Invoice</small><strong>{statusLabel(booking.invoice?.status)}</strong></div><div><small>Queue position</small><strong>{booking.registrationToken?.queuePosition ?? 'Not available'}</strong></div></div>
      {booking.registrationToken && <p><strong>{booking.registrationToken.tokenNumber}</strong> · {statusLabel(booking.registrationToken.status)} · Expires {new Date(booking.registrationToken.expiresAt).toLocaleString(hi ? 'hi-IN' : 'en-IN')}. This is a LabSetu facility token.</p>}
      <Link to={`/portal/assistant?booking=${encodeURIComponent(booking.id)}`}>Open booking, reports and billing in LabSetu Assistant</Link>
      {booking.status === 'confirmed' && <button className="secondary" disabled={busy} onClick={() => setCancelId(booking.id)}>Cancel booking</button>}
    </article>)}
    {cancelId && <section className="assistant-confirm" role="group" aria-label="Confirm cancellation"><p>Cancel booking {cancelId}? The backend will check whether cancellation is allowed.</p><button disabled={busy} onClick={cancel}>Confirm cancellation</button><button className="secondary" disabled={busy} onClick={() => setCancelId(null)}>Keep booking</button></section>}
  </main>;
}
