import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { assistantService } from '../../services/assistantService';
import { money, paymentLink, rows, statusLabel, validatePrescription } from '../../utils/assistantUtils';
import { SpeechPlayback, VoiceInput } from '../../components/assistant/VoiceControls';
import ReportExplanation from '../../components/assistant/ReportExplanation';
import './CitizenAssistant.css';

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('The prescription could not be read.'));
    reader.readAsDataURL(file);
  });
}

async function loadCheckout() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Secure checkout could not be loaded.'));
    document.head.appendChild(script);
  });
}

function ActionSummary({ action }) {
  const summary = action.summary;
  if (typeof summary === 'string') return <p>{summary}</p>;
  if (action.type === 'booking') return <><ul>{summary?.quote?.tests?.map(test => <li key={test.id}>{test.name} — {money(test.pricePaise, summary.quote.currency)}</li>)}</ul>{summary?.slot && <p>{summary.slot.date} · {summary.slot.startTime}</p>}<p>Confirmation creates a booking, registration token and invoice. Catalogue total: {money(summary?.quote?.totalPaise, summary?.quote?.currency)}. The backend applies configured tax and discount to the final invoice.</p></>;
  if (action.type === 'payment') return <p>Invoice {summary?.invoice?.id}: {money(summary?.invoice?.totalPaise, summary?.invoice?.currency)}. Confirm to request the configured payment provider. Review its mode and amount before paying.</p>;
  return <p>Review the selected action before continuing.</p>;
}

function ToolResults({ results, language }) {
  return results?.map((entry, index) => {
    const result = entry.result;
    if (!result?.success) return <p className="assistant-tool-error" key={index}>{result?.error || 'The backend could not complete this request.'}</p>;
    const data = result.data;
    if (data?.pendingAction) return null;
    if (entry.name === 'explain_approved_report') return <ReportExplanation data={data} language={language} key={index} />;
    const catalogue = entry.name === 'get_test_prices' ? data?.tests : entry.name === 'search_available_tests' ? rows(data, 'tests') : null;
    if (catalogue) return <div className="assistant-tool-result" key={index}><strong>Current catalogue</strong><ul>{catalogue.map(test => <li key={test.id}>{test.name} — {money(test.pricePaise, test.currency || data.currency)}</li>)}</ul></div>;
    if (entry.name === 'check_appointment_availability') return <div className="assistant-tool-result" key={index}><strong>Available collection slots</strong><ul>{rows(data, 'slots').map(slot => <li key={slot.id}>{slot.date} · {slot.startTime} · {slot.remaining} places</li>)}</ul></div>;
    if (entry.name === 'get_my_appointments') return <div className="assistant-tool-result" key={index}><strong>Your bookings</strong><ul>{rows(data, 'appointments').map(item => <li key={item.id}>{item.id} · {item.date} · {statusLabel(item.status)}</li>)}</ul></div>;
    if (!data || typeof data !== 'object') return null;
    return <div className="assistant-tool-result" key={index}>
      {data.id && <strong>{data.id}</strong>}
      {data.status && <p>Status: {statusLabel(data.status)}</p>}
      {data.sample && <p>Sample: {statusLabel(data.sample.status)}</p>}
      {data.report && <p>Report: {statusLabel(data.report.status)}</p>}
      {data.totalPaise != null && <p>Invoice total: {money(data.totalPaise, data.currency)}</p>}
      {data.invoice && <p>Invoice: {money(data.invoice.totalPaise, data.invoice.currency)} · {statusLabel(data.invoice.status)}</p>}
      {typeof data.ready === 'boolean' && <p>{data.ready ? 'Approved report ready' : 'Awaiting laboratory approval'}{data.paymentRequired ? ' · Payment required for report access' : ''}</p>}
      {typeof data.paid === 'boolean' && <p>{data.paid ? 'Payment capture confirmed' : 'No captured payment recorded'}</p>}
      {data.mode && <p>{data.label || (['mock', 'simulated'].includes(data.mode) ? 'SIMULATED TEST PAYMENT — no money transferred' : data.mode === 'razorpay_link_live' ? 'Razorpay live payment link' : 'Razorpay TEST MODE')}</p>}
      {data.amountPaise != null && <p>Amount: {money(data.amountPaise, data.currency)}</p>}
    </div>;
  });
}

export default function CitizenAssistant() {
  const { currentUser } = useAuth();
  return <PatientAssistant key={currentUser?.id || 'anonymous'} />;
}

function PatientAssistant() {
  const { lang, setLang } = useLanguage();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedBooking = searchParams.get('booking');
  const hi = lang === 'hi';
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [pending, setPending] = useState(null);
  const [text, setText] = useState('');
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [booking, setBooking] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [review, setReview] = useState(null);
  const [payment, setPayment] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [notice, setNotice] = useState('');
  const [file, setFile] = useState(null);
  const idempotency = useRef(null);
  const paymentIdempotency = useRef(null);
  const endRef = useRef(null);
  const simulatedPayments = ['mock', 'simulated'].includes(config?.paymentMode);
  const hostedPayments = ['razorpay_link_test', 'razorpay_link_live'].includes(config?.paymentMode);
  const paymentsConfigured = simulatedPayments || hostedPayments || config?.paymentMode === 'razorpay_test';
  const conversationKey = currentUser?.id ? `labsetu_assistant_conversation:${currentUser.id}` : null;

  const refresh = useCallback(async (id) => {
    const list = rows(await assistantService.appointments(), 'appointments');
    setBookings(list);
    if (id) setBooking(await assistantService.booking(id));
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([assistantService.config(), assistantService.tests(''), assistantService.appointments()])
      .then(([settings, catalogue, appointments]) => {
        if (!alive) return;
        if (settings.status === 'fulfilled') setConfig(settings.value);
        if (catalogue.status === 'fulfilled') setTests(rows(catalogue.value, 'tests'));
        if (appointments.status === 'fulfilled') setBookings(rows(appointments.value, 'appointments'));
        const failures = [settings, catalogue, appointments].filter(result => result.status === 'rejected');
        if (failures.length) {
          setAuthRequired(failures.some(result => result.reason.code === 'UNAUTHENTICATED'));
          setError([...new Set(failures.map(result => result.reason.message))].join(' '));
        }
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const saved = conversationKey && sessionStorage.getItem(conversationKey);
    if (saved) assistantService.conversation(saved).then(data => {
      if (!alive) return;
      setConversationId(data.conversationId);
      setMessages(data.messages.map(item => ({ role: item.role, text: item.content })));
      setPending(data.pendingAction || null);
    }).catch(error => {
      if (alive) {
        setAuthRequired(error.code === 'UNAUTHENTICATED');
        setError(`The previous conversation could not be restored. ${error.message}`);
      }
    });
    return () => { alive = false; };
  }, [conversationKey]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [messages, busy]);

  useEffect(() => {
    if (!requestedBooking) return;
    let alive = true;
    assistantService.booking(requestedBooking).then(data => { if (alive) setBooking(data); })
      .catch(error => { if (alive) setError(error.message); });
    return () => { alive = false; };
  }, [requestedBooking]);

  // A visible page refreshes persisted laboratory events; no status is inferred from elapsed time.
  useEffect(() => {
    if (!booking?.id) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh(booking.id).catch(error => setError(`Status refresh failed. ${error.message}`));
    }, 20000);
    return () => clearInterval(timer);
  }, [booking?.id, refresh]);

  async function run(label, action) {
    setBusy(label); setError(''); setAuthRequired(false); setNotice('');
    try { return await action(); }
    catch (e) {
      setAuthRequired(e.code === 'UNAUTHENTICATED');
      setError(e.message || 'The request could not be completed.');
      return undefined;
    }
    finally { setBusy(''); }
  }

  async function acceptChat(data) {
    setConversationId(data.conversationId);
    if (conversationKey) sessionStorage.setItem(conversationKey, data.conversationId);
    setPending(data.pendingAction || null);
    setMessages(previous => [...previous, { role: 'assistant', text: data.reply || 'Please review the workflow details below.', results: data.results }]);
    const extracted = data.results?.find(item => item.name === 'search_available_tests' && item.result?.success)?.result?.data;
    if (extracted) setTests(previous => [...new Map([...previous, ...rows(extracted, 'tests')].map(test => [test.id, test])).values()]);
    const aggregate = data.results?.map(item => item.result?.success && item.result.data).find(item => item?.invoice && item?.testIds);
    const paymentOrder = data.results?.map(item => item.result?.success && item.result.data).find(item => (item?.orderId || item?.paymentLinkId) && item?.mode);
    if (aggregate) setBooking(aggregate);
    if (paymentOrder) setPayment(paymentOrder);
    await refresh(aggregate?.id || paymentOrder?.bookingId || booking?.id);
  }

  async function send(event) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    const message = text.trim(); setText('');
    setMessages(previous => [...previous, { role: 'user', text: message }]);
    await run('chat', async () => acceptChat(await assistantService.chat({ message, conversationId, language: lang })));
  }

  async function upload(event) {
    event.preventDefault();
    const invalid = validatePrescription(file);
    if (invalid) { setError(invalid); return; }
    await run('upload', async () => {
      const extraction = await assistantService.upload({ filename: file.name, mimeType: file.type, base64: await readFile(file), conversationId });
      setPrescription(extraction);
      setConversationId(extraction.conversationId);
      if (conversationKey) sessionStorage.setItem(conversationKey, extraction.conversationId);
      setMessages(previous => [...previous, { role: 'user', text: `Prescription uploaded: ${file.name}. Suggested tests require review before booking.` }]);
      setNotice(hi ? 'संभावित जाँचों की समीक्षा करके स्वयं चुनें।' : 'Review the possible matches and select only the tests that match your prescription.');
    });
  }

  async function selectDate(next) {
    setDate(next); setSlots([]); setSlotId('');
    if (!next) return;
    await run('slots', async () => setSlots(rows(await assistantService.slots(next), 'slots')));
  }

  function toggle(id) {
    setReview(null);
    setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  }

  async function confirmBooking() {
    await run('booking', async () => {
      const result = await assistantService.book({ testIds: selected, slotId, idempotencyKey: idempotency.current, confirmed: true });
      const saved = result.booking || result;
      setBooking(saved); setReview(null); setSelected([]); setPrescription(null);
      setNotice(`Booking saved: ${saved.id}.`);
      await refresh(saved.id);
    });
  }

  async function checkout() {
    await run('payment', async () => {
      const order = payment?.bookingId === booking.id ? payment : await assistantService.order(booking.id, paymentIdempotency.current || crypto.randomUUID());
      setPayment(order); setReview(null);
      if (order.paymentUrl) return;
      if (order.mode === 'mock' || order.mode === 'simulated' || order.simulated || simulatedPayments) return;
      await loadCheckout();
      const providerOrder = order.order || order;
      const modal = new window.Razorpay({
        key: order.keyId, order_id: providerOrder.providerOrderId || providerOrder.orderId || providerOrder.id,
        amount: providerOrder.amount || providerOrder.amountPaise, currency: providerOrder.currency || 'INR',
        name: 'LabSetu — TEST MODE', description: `Invoice ${booking.invoice?.id || booking.id}`,
        handler: async response => {
          await run('verification', async () => {
            await assistantService.verify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
            await refresh(booking.id); setPayment(null); setNotice('Payment capture verified by the server.');
          });
        },
        modal: { ondismiss: () => setNotice('Checkout closed. Refresh to check payment status before retrying.') },
        theme: { color: '#15803d' },
      });
      modal.on('payment.failed', () => setError('Payment was unsuccessful. Refresh status before retrying.'));
      modal.open();
    });
  }

  async function simulate(outcome) {
    await run('payment', async () => {
      await assistantService.simulate(payment.id || payment.order?.id, outcome);
      setPayment(null); await refresh(booking.id);
      setNotice(outcome === 'captured' ? 'SIMULATED payment recorded. No money was transferred.' : 'SIMULATED payment failure recorded. You can retry.');
    });
  }

  async function download() {
    await run('report', async () => {
      const blob = await assistantService.report(booking.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `LabSetu-${booking.id}.pdf`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  const selectedTests = tests.filter(test => selected.includes(test.id));
  const selectedSlot = slots.find(slot => slot.id === slotId);
  const simulated = payment && (payment.mode === 'mock' || payment.mode === 'simulated' || payment.simulated || simulatedPayments);
  const approved = ['approved', 'released'].includes(booking?.report?.status);
  const paymentAllowed = config?.paymentStage === 'booking' || approved;

  return <main className="assistant-page">
    <header className="assistant-heading"><div><p className="assistant-eyebrow">LABSETU ASSISTANT</p><h1>{hi ? 'आपकी जाँच, एक बातचीत में' : 'Your lab journey, in one conversation'}</h1><p>{hi ? 'जाँच बुक करें, प्रगति देखें और स्वीकृत रिपोर्ट प्राप्त करें।' : 'Book tests, follow laboratory progress and retrieve approved reports.'}</p></div><label>Language<select value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option></select></label></header>
    {config && <div className="assistant-mode">{config.mode === 'demo' ? 'DEMO MODE — deterministic assistant' : config.aiConfigured ? `${config.mode} assistant` : 'AI integration unavailable'} · {config.storageMode === 'demo' ? 'Synthetic local data' : config.storageMode === 'postgres' ? 'Database configured' : 'Database unavailable'} · {simulatedPayments ? 'SIMULATED payments — no money transferred' : config.paymentMode === 'razorpay_link_live' ? 'Razorpay live payment links' : paymentsConfigured ? 'Razorpay TEST MODE' : 'Payments unavailable'}</div>}
    {config?.mode === 'openai' && <p className="assistant-footnote">Chat messages are sent to the configured OpenAI provider to process your request. Avoid sharing unrelated medical or identifying details. Raw prescription files and laboratory result values are not sent through assistant tools.</p>}
    {config?.mode === 'gemini' && <p className="assistant-footnote">Chat messages are sent to Gemini. Patient records are retrieved through authorized backend tools; review all actions before confirming.</p>}
    {error && <div className="assistant-error" role="alert">{error}{authRequired && <a href="/login?role=citizen">Sign in again or recover your account</a>}<button type="button" onClick={() => { setError(''); setAuthRequired(false); }} aria-label="Dismiss error">×</button></div>}
    {notice && <p className="assistant-notice" role="status">{notice}</p>}
    <div className="assistant-columns">
      <section className="assistant-card assistant-conversation" aria-label="Assistant conversation">
        <div className="assistant-card-title"><h2>{hi ? 'सहायक से बात करें' : 'Talk to your assistant'}</h2><span>English / हिन्दी</span></div>
        <div className="assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && <div className="assistant-introduction"><strong>{hi ? 'नमस्ते। मैं आपकी कैसे मदद कर सकता हूँ?' : 'Hello. How can I help you today?'}</strong><p>{hi ? 'अपना पर्चा अपलोड करें या उपलब्ध जाँच चुनें। बुकिंग से पहले आपकी पुष्टि आवश्यक है।' : 'Upload a prescription or choose available tests. You will review and confirm before a booking is saved.'}</p></div>}
          {messages.map((message, index) => <div key={index} className={`assistant-message ${message.role}`}><span>{message.role === 'user' ? (hi ? 'आप' : 'You') : 'LabSetu'}</span><p>{message.text}</p>{message.role === 'assistant' && <SpeechPlayback text={message.text} lang={lang} />}{message.results && <ToolResults results={message.results} language={lang} />}</div>)}
          {busy === 'chat' && <p role="status">{hi ? 'उत्तर तैयार हो रहा है…' : 'Checking your request…'}</p>}
          <div ref={endRef} />
        </div>
        {pending && <div className="assistant-confirm"><strong>Review before confirming</strong><ActionSummary action={pending} /><button disabled={!!busy} onClick={() => run('confirm', async () => acceptChat(await assistantService.confirm({ conversationId, confirmationId: pending.id })))}>Confirm {statusLabel(pending.type)}</button><button className="secondary" onClick={() => setPending(null)}>Dismiss</button></div>}
        <form onSubmit={send} className="assistant-composer"><label className="sr-only" htmlFor="assistant-message">Message</label><textarea id="assistant-message" value={text} onChange={e => setText(e.target.value)} maxLength={2000} rows={2} placeholder={hi ? 'जाँच बुक करनी है…' : 'I would like to book blood tests…'} required /><VoiceInput lang={lang} value={text} onTranscript={setText} isProcessing={!!busy} /><button disabled={!!busy || !text.trim()}>{hi ? 'भेजें' : 'Send'}</button></form>
        <p className="assistant-footnote">Clinical results and report approval are handled by authorised laboratory staff. This assistant provides administrative help.</p>
      </section>
      <aside className="assistant-sidebar">
        <section className="assistant-card"><h2>{hi ? 'पर्चा और जाँच' : 'Prescription & tests'}</h2><form onSubmit={upload} className="assistant-upload"><label htmlFor="prescription-file">{hi ? 'पर्चा (PDF, PNG, JPEG, अधिकतम 5 MB)' : 'Prescription (PDF, PNG, JPEG, up to 5 MB)'}</label><input id="prescription-file" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => setFile(e.target.files?.[0] || null)} /><button className="secondary" disabled={!!busy || !file}>{busy === 'upload' ? 'Reading prescription…' : 'Extract possible tests'}</button></form>
          {prescription && <div className="assistant-prescription"><strong>Patient review required</strong><p>OCR may misread handwriting. Select only tests that match the prescription; ask staff if uncertain. Manual catalogue selection is available below.</p>{prescription.lowConfidence && <p>Low OCR confidence. Ask laboratory staff to check the original prescription before booking.</p>}{rows(prescription, 'candidates').length === 0 && <p>No reliable matches found. Select from the catalogue below or ask laboratory staff.</p>}{rows(prescription, 'candidates').map((candidate, index) => <label key={`${candidate.testId}-${index}`} className="assistant-test"><input type="checkbox" checked={selected.includes(candidate.testId)} disabled={!candidate.testId} onChange={() => toggle(candidate.testId)} /><span>{candidate.name}{(candidate.uncertain || candidate.confidence < .7) && <small>Uncertain match — confirm with staff</small>}</span></label>)}</div>}
          <div className="assistant-tests">{tests.length === 0 && <p>No available tests returned by the backend.</p>}{tests.map(test => <label className="assistant-test" key={test.id}><input type="checkbox" checked={selected.includes(test.id)} onChange={() => toggle(test.id)} disabled={!!busy} /><span>{test.name}<small>{money(test.pricePaise, test.currency)}</small></span></label>)}</div>
          <label className="assistant-field">Appointment date<input type="date" value={date} onChange={e => selectDate(e.target.value)} disabled={!!busy} /></label>
          <label className="assistant-field">Available slot<select value={slotId} onChange={e => { setSlotId(e.target.value); setReview(null); }} disabled={!!busy || !date}><option value="">Select a persisted slot</option>{slots.map(slot => <option key={slot.id} value={slot.id} disabled={slot.remaining <= 0}>{slot.startTime} · {slot.remaining} places available</option>)}</select></label>
          {date && slots.length === 0 && busy !== 'slots' && <p>No available slots on this date. Choose another date or contact the laboratory.</p>}
          <button disabled={!!busy || selected.length === 0 || !slotId} onClick={() => { idempotency.current = crypto.randomUUID(); setReview('booking'); }}>Review booking</button>
          {review === 'booking' && <div className="assistant-confirm"><strong>Confirm tests, appointment and registration token</strong><ul>{selectedTests.map(test => <li key={test.id}>{test.name} — {money(test.pricePaise, test.currency)}</li>)}</ul><p>{date} · {selectedSlot?.startTime}</p><p>The server will calculate the final invoice from current catalogue prices.</p><button disabled={!!busy} onClick={confirmBooking}>Confirm booking, token & invoice</button><button className="secondary" disabled={!!busy} onClick={() => setReview(null)}>Back</button></div>}
        </section>
      </aside>
    </div>
    <section className="assistant-card assistant-journey"><div className="assistant-card-title"><h2>{hi ? 'मेरी बुकिंग और प्रगति' : 'My bookings & progress'}</h2><button className="secondary" disabled={!!busy} onClick={() => run('refresh', () => refresh(booking?.id))}>Refresh status</button></div>
      {bookings.length === 0 ? <p>No bookings returned by the backend. Your confirmed bookings will appear here.</p> : <label className="assistant-field">Select booking<select value={booking?.id || ''} onChange={e => { setReceipt(null); setPayment(null); setExplanation(null); setReview(null); if (e.target.value) run('status', async () => setBooking(await assistantService.booking(e.target.value))); else setBooking(null); }}><option value="">Choose a booking</option>{bookings.map(item => <option key={item.id} value={item.id}>{item.id} · {item.date || item.appointment_date} · {statusLabel(item.status)}</option>)}</select></label>}
      {booking && <><div className="assistant-progress"><div><small>Appointment</small><strong>{statusLabel(booking.status)}</strong></div><div><small>Sample</small><strong>{statusLabel(booking.sample?.status)}</strong></div><div className={approved ? 'ready' : ''}><small>Report</small><strong>{statusLabel(booking.report?.status)}</strong></div><div><small>Invoice</small><strong>{statusLabel(booking.invoice?.status)}</strong></div></div>
        {booking.registrationToken && <div className="assistant-invoice"><h3>LabSetu digital registration token</h3><p><strong>{booking.registrationToken.tokenNumber}</strong> · {statusLabel(booking.registrationToken.status)}</p><p>{booking.registrationToken.queuePosition ? `Queue position ${booking.registrationToken.queuePosition} for this slot. ` : ''}Expires {new Date(booking.registrationToken.expiresAt).toLocaleString()}.</p><p>This is a LabSetu facility token, not an official ABHA/ABDM token.</p></div>}
        {approved && <p className="assistant-notice" role="status">Your report has been approved by laboratory staff. Report access follows the laboratory payment policy.</p>}
        <div className="assistant-invoice"><h3>Invoice {booking.invoice?.id || 'not yet available'}</h3>{booking.invoice && <><table><caption className="sr-only">Invoice breakdown</caption><thead><tr><th>Test</th><th>Amount</th></tr></thead><tbody>{booking.invoice.items?.map((item, index) => <tr key={item.testId || index}><td>{item.name}</td><td>{money(item.totalPaise ?? item.amountPaise, booking.invoice.currency)}</td></tr>)}{Number.isSafeInteger(booking.invoice.subtotalPaise) && <tr><td>Subtotal</td><td>{money(booking.invoice.subtotalPaise, booking.invoice.currency)}</td></tr>}{booking.invoice.discountPaise > 0 && <tr><td>Configured discount</td><td>−{money(booking.invoice.discountPaise, booking.invoice.currency)}</td></tr>}{booking.invoice.taxPaise > 0 && <tr><td>Configured tax</td><td>{money(booking.invoice.taxPaise, booking.invoice.currency)}</td></tr>}</tbody><tfoot><tr><th>Total</th><th>{money(booking.invoice.totalPaise, booking.invoice.currency)}</th></tr></tfoot></table><p>Payment status: <strong>{statusLabel(booking.invoice.status)}</strong></p></>}</div>
        <div className="assistant-actions"><button disabled={!!busy || !approved} onClick={download}>Download approved report</button><button className="secondary" disabled={!!busy || !approved} onClick={() => run('explanation', async () => setExplanation(await assistantService.explanation(booking.id, lang)))}>Explain approved report</button>{booking.invoice?.status !== 'paid' && <button disabled={!!busy || !paymentAllowed || !paymentsConfigured || booking.status === 'cancelled'} onClick={() => { paymentIdempotency.current = crypto.randomUUID(); setReview('payment'); }}>Review payment</button>}<button className="secondary" disabled={!!busy || booking.invoice?.status !== 'paid'} onClick={() => run('receipt', async () => setReceipt(await assistantService.receipt(booking.id)))}>View payment receipt</button>{booking.status === 'confirmed' && <button className="secondary" disabled={!!busy} onClick={() => setReview('cancel')}>Cancel booking</button>}</div>
        {review === 'payment' && <div className="assistant-confirm"><strong>Confirm payment</strong><p>{money(booking.invoice?.totalPaise, booking.invoice?.currency)} for invoice {booking.invoice?.id}. {simulatedPayments ? 'This is a simulated test payment. No money will be transferred.' : hostedPayments ? 'A verified Razorpay payment link will be requested. Check whether it is test or live before paying.' : 'Razorpay TEST MODE checkout will open.'}</p><button disabled={!!busy} onClick={checkout}>Continue to {simulatedPayments ? 'simulated payment' : hostedPayments ? 'payment link' : 'test checkout'}</button><button className="secondary" disabled={!!busy} onClick={() => setReview(null)}>Back</button></div>}
        {review === 'cancel' && <div className="assistant-confirm"><strong>Cancel {booking.id}?</strong><p>This releases the appointment slot. Collected samples and paid bookings may require staff assistance.</p><button disabled={!!busy} onClick={() => run('cancel', async () => { await assistantService.cancel(booking.id); setReview(null); await refresh(booking.id); setNotice('Booking cancellation saved.'); })}>Confirm cancellation</button><button className="secondary" disabled={!!busy} onClick={() => setReview(null)}>Keep booking</button></div>}
        {simulated && <div className="assistant-confirm"><strong>SIMULATED TEST PAYMENT</strong><p>No payment provider is being charged. Choose a synthetic outcome to test the workflow.</p><button disabled={!!busy} onClick={() => simulate('captured')}>Simulate captured payment</button><button className="secondary" disabled={!!busy} onClick={() => simulate('failed')}>Simulate payment failure</button></div>}
        {payment && !simulated && (paymentLink(payment.paymentUrl)
          ? <div className="assistant-confirm"><p>{payment.label}. Payment is confirmed only after the backend verifies capture.</p><a href={paymentLink(payment.paymentUrl)} target="_blank" rel="noopener noreferrer">Open verified Razorpay payment link</a><button className="secondary" disabled={!!busy} onClick={() => run('payment-status', async () => { await assistantService.paymentStatus(booking.id); await refresh(booking.id); setNotice('Payment status refreshed from the backend.'); })}>Verify payment status</button></div>
          : payment.paymentUrl ? <p role="alert">The provider payment link could not be verified.</p> : <button disabled={!!busy} onClick={checkout}>Open Razorpay test checkout</button>)}
        {explanation && <ReportExplanation data={explanation} language={lang} />}
        {receipt && <div className="assistant-receipt"><h3>{receipt.simulated || ['mock', 'simulated'].includes(receipt.mode) ? 'SIMULATED payment receipt' : 'Server-verified payment receipt'}</h3><dl>{Object.entries(receipt).filter(([, value]) => value != null && typeof value !== 'object').map(([key, value]) => <React.Fragment key={key}><dt>{statusLabel(key)}</dt><dd>{key.toLowerCase().includes('paise') ? money(value, receipt.currency) : String(value)}</dd></React.Fragment>)}</dl></div>}
      </>}
    </section>
  </main>;
}
