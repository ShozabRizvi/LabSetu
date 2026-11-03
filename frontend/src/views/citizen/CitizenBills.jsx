import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { assistantService } from '../../services/assistantService';
import { money, rows, statusLabel } from '../../utils/assistantUtils';
import './CitizenAssistant.css';

export default function CitizenBills() {
  const { lang } = useLanguage();
  const hi = lang === 'hi';
  const [bookings, setBookings] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
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

  async function viewReceipt(id) {
    setBusy(true); setError(''); setReceipt(null);
    try { setReceipt(await assistantService.receipt(id)); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <main className="assistant-page">
    <header className="assistant-heading"><div><h1>{hi ? 'मेरे बिल और भुगतान' : 'My bills & payments'}</h1><p>{hi ? 'सहेजे गए इनवॉइस और सर्वर द्वारा सत्यापित भुगतान रसीदें।' : 'Persisted invoices and server-verified payment receipts for your account.'}</p></div><button className="secondary" disabled={busy} onClick={refresh}>{busy ? 'Loading…' : 'Refresh invoices'}</button></header>
    {error && <p className="assistant-error" role="alert">{error}</p>}
    {!busy && !error && bookings.length === 0 && <p>{hi ? 'कोई सहेजा गया इनवॉइस नहीं मिला।' : 'No persisted booking invoices were returned for your account.'}</p>}
    {bookings.map(booking => <article className="assistant-card" key={booking.id}>
      <div className="assistant-card-title"><h2>Invoice {booking.invoice?.id || 'unavailable'}</h2><strong>{statusLabel(booking.invoice?.status)}</strong></div>
      <p>Booking: {booking.id} · {booking.date}</p>
      {booking.invoice && <><table><caption className="sr-only">Invoice items</caption><thead><tr><th>Test</th><th>Amount</th></tr></thead><tbody>{booking.invoice.items?.map((item, index) => <tr key={item.testId || index}><td>{item.name}</td><td>{money(item.totalPaise ?? item.amountPaise, booking.invoice.currency)}</td></tr>)}</tbody><tfoot><tr><th>Total (including configured adjustments)</th><th>{money(booking.invoice.totalPaise, booking.invoice.currency)}</th></tr></tfoot></table>
        {booking.invoice.status === 'paid' && <button className="secondary" disabled={busy} onClick={() => viewReceipt(booking.id)}>View verified receipt</button>}</>}
      <p><Link to={`/portal/assistant?booking=${encodeURIComponent(booking.id)}`}>Review invoice and payment in LabSetu Assistant</Link></p>
    </article>)}
    {receipt && <section className="assistant-receipt"><h2>{receipt.simulated ? 'SIMULATED receipt — no money transferred' : 'Server-verified payment receipt'}</h2><dl>{Object.entries(receipt).filter(([, value]) => value != null && typeof value !== 'object').map(([key, value]) => <React.Fragment key={key}><dt>{statusLabel(key)}</dt><dd>{key.toLowerCase().includes('paise') ? money(value, receipt.currency) : String(value)}</dd></React.Fragment>)}</dl></section>}
  </main>;
}
