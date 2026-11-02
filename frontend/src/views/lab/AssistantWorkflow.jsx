import React, { useCallback, useEffect, useState } from 'react';
import { assistantService } from '../../services/assistantService';
import { rows, sampleNext, reportNext, tokenNext, statusLabel } from '../../utils/assistantUtils';
import '../citizen/CitizenAssistant.css';

export default function AssistantWorkflow() {
  const [bookings, setBookings] = useState([]);
  const [booking, setBooking] = useState(null);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState(null);

  const reload = useCallback(async (id) => {
    const list = rows(await assistantService.staffBookings(), 'bookings');
    setBookings(list);
    if (id) setBooking(await assistantService.booking(id));
  }, []);

  useEffect(() => {
    let alive = true;
    assistantService.staffBookings().then(data => { if (alive) setBookings(rows(data, 'bookings')); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  async function select(id) {
    setError(''); setNotice(''); setReview(null); setBusy(true);
    try {
      const current = await assistantService.booking(id);
      setBooking(current);
      const entered = current.report?.results || [];
      setResults(current.tests.flatMap(test => {
        const parameters = test.parameters?.length ? test.parameters : [{ name: test.name, unit: '', referenceRange: '' }];
        return parameters.map(parameter => entered.find(item => item.testId === test.id && item.name === parameter.name) || {
          testId: test.id, name: parameter.name, value: '', unit: parameter.unit || '', referenceRange: parameter.referenceRange || '',
        });
      }));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function transition() {
    setBusy(true); setError(''); setNotice('');
    try {
      await assistantService.transition(booking.id, { ...review, ...(review.entity === 'report' && review.status === 'draft' ? { results } : {}) });
      await reload(booking.id); setReview(null); setNotice('The authorised workflow event was saved.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function updateResult(index, key, value) {
    setResults(previous => previous.map((result, position) => position === index ? { ...result, [key]: value } : result));
  }

  return <main className="assistant-page"><header className="assistant-heading"><div><p className="assistant-eyebrow">LABORATORY WORKFLOW</p><h1>Assistant bookings</h1><p>Record queue, sample and report events. Report approval requires an authorised human reviewer.</p></div><button disabled={busy} onClick={() => { setError(''); reload(booking?.id).catch(e => setError(e.message)); }}>Refresh</button></header>
    {error && <p className="assistant-error" role="alert">{error}</p>}{notice && <p className="assistant-notice" role="status">{notice}</p>}
    <section className="assistant-card"><h2>Laboratory queue</h2>{bookings.length === 0 ? <p>No assistant bookings returned for your laboratory.</p> : <label className="assistant-field">Booking<select value={booking?.id || ''} onChange={e => { if (e.target.value) select(e.target.value); }} disabled={busy}><option value="">Select a booking</option>{bookings.map(item => <option key={item.id} value={item.id}>{item.registrationToken?.tokenNumber || 'No token'} · {item.id} · {item.patientName || item.patientId} · {item.date} · {statusLabel(item.status)}</option>)}</select></label>}</section>
    {booking && <section className="assistant-card"><h2>{booking.id}</h2><p>Patient: {booking.patientName || booking.patientId} · {booking.date} {booking.startTime}</p><div className="assistant-progress"><div><small>Appointment</small><strong>{statusLabel(booking.status)}</strong></div><div><small>Digital token</small><strong>{statusLabel(booking.registrationToken?.status)}</strong></div><div><small>Sample</small><strong>{statusLabel(booking.sample?.status)}</strong></div><div><small>Report</small><strong>{statusLabel(booking.report?.status)}</strong></div></div>
      {booking.registrationToken && <p><strong>{booking.registrationToken.tokenNumber}</strong> · Queue position {booking.registrationToken.queuePosition ?? 'not active'} · Expires {new Date(booking.registrationToken.expiresAt).toLocaleString()}</p>}
      <div className="assistant-actions">{tokenNext[booking.registrationToken?.status] && <button disabled={busy || booking.status === 'cancelled'} onClick={() => setReview({ entity: 'token', status: tokenNext[booking.registrationToken.status] })}>{booking.registrationToken.status === 'registered' ? 'Call token' : 'Complete token'}</button>}{['registered', 'called'].includes(booking.registrationToken?.status) && <><button className="secondary" disabled={busy} onClick={() => setReview({ entity: 'token', status: 'cancelled' })}>Cancel token</button><button className="secondary" disabled={busy} onClick={() => setReview({ entity: 'token', status: 'expired' })}>Expire token</button></>}</div>
      <div className="assistant-actions">{sampleNext[booking.sample?.status] && <button disabled={busy || booking.status === 'cancelled'} onClick={() => setReview({ entity: 'sample', status: sampleNext[booking.sample.status] })}>Record sample {statusLabel(sampleNext[booking.sample.status])}</button>}</div>
      <h3>Laboratory results</h3><p>Enter only values from a validated laboratory source. Reference intervals are supplied by the test catalogue where configured.</p>
      <div className="assistant-result-table"><table><thead><tr><th>Parameter</th><th>Verified value</th><th>Unit</th><th>Reference interval</th></tr></thead><tbody>{results.map((result, index) => <tr key={`${result.testId}-${result.name}`}><td>{result.name}</td><td><label className="sr-only" htmlFor={`result-${index}`}>{result.name} value</label><input id={`result-${index}`} value={result.value} onChange={e => updateResult(index, 'value', e.target.value)} disabled={busy || booking.report?.status !== 'awaiting_results'} required maxLength={120} /></td><td>{result.unit || 'Not configured'}</td><td>{result.referenceRange || 'Not configured'}</td></tr>)}</tbody></table></div>
      <div className="assistant-actions">{reportNext[booking.report?.status] && <button disabled={busy || booking.sample?.status !== 'processing_complete' || (booking.report?.status === 'awaiting_results' && results.some(result => !String(result.value).trim()))} onClick={() => setReview({ entity: 'report', status: reportNext[booking.report.status] })}>{booking.report?.status === 'awaiting_results' ? 'Save draft from entered results' : `Move report to ${statusLabel(reportNext[booking.report.status])}`}</button>}</div>
      {review && <div className="assistant-confirm"><strong>Confirm authorised {review.entity} event</strong><p>Booking {booking.id} will move to {statusLabel(review.status)}.</p>{review.status === 'approved' && <p>I have reviewed these laboratory results and authorise this report for patient release under the configured access policy.</p>}<button disabled={busy} onClick={transition}>Confirm {review.status === 'approved' ? 'clinical approval' : 'workflow event'}</button><button className="secondary" disabled={busy} onClick={() => setReview(null)}>Back</button></div>}
    </section>}
  </main>;
}
