import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { assistantService } from '../../services/assistantService';
import { money } from '../../utils/assistantUtils';
import { SpeechPlayback, VoiceInput } from './VoiceControls';
import ReportExplanation from './ReportExplanation';
import './VoiceAssistant.css';

function ToolSummary({ results, language }) {
  return results?.map((entry, index) => {
    const data = entry.result?.data;
    if (!data || !entry.result.success || data.pendingAction) return null;
    if (entry.name === 'explain_approved_report') return <ReportExplanation data={data} language={language} key={index} />;
    if (entry.name === 'search_available_tests') {
      const tests = Array.isArray(data) ? data : data.tests || [];
      return <ul key={index}>{tests.slice(0, 8).map(test => <li key={test.id}>{test.name} — {money(test.pricePaise, test.currency || 'INR')}</li>)}</ul>;
    }
    const invoice = data.invoice || data;
    return <p key={index}>
      {data.registrationToken?.tokenNumber && `LabSetu token ${data.registrationToken.tokenNumber}. `}
      {invoice.id && invoice.totalPaise != null && `Invoice ${invoice.id}: ${money(invoice.totalPaise, invoice.currency)}. `}
      {data.status && `Status: ${String(data.status).replaceAll('_', ' ')}.`}
      {data.sample?.status && ` Sample: ${String(data.sample.status).replaceAll('_', ' ')}.`}
      {data.report?.status && ` Report: ${String(data.report.status).replaceAll('_', ' ')}.`}
    </p>;
  });
}

export default function VoiceAssistantPanel({ authenticated = false, onClose }) {
  const { lang, setLang } = useLanguage();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const latestReply = [...messages].reverse().find(item => item.role === 'assistant');

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, processing]);

  async function submit(event) {
    event.preventDefault();
    const submitted = message.trim();
    if (!submitted || processing) return;
    setMessage('');
    setError('');
    setMessages(previous => [...previous, { role: 'user', text: submitted }]);
    setProcessing(true);
    try {
      const response = authenticated
        ? await assistantService.chat({ message: submitted, conversationId, language: lang })
        : await assistantService.publicChat({ message: submitted, language: lang });
      if (response.conversationId) setConversationId(response.conversationId);
      setPendingAction(response.pendingAction || null);
      setMessages(previous => [...previous, { role: 'assistant', text: response.reply, results: response.results }]);
    } catch (requestError) {
      setError(requestError.message || 'The assistant could not complete this request.');
    } finally {
      setProcessing(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction || !conversationId || processing) return;
    setProcessing(true);
    setError('');
    try {
      const response = await assistantService.confirm({ conversationId, confirmationId: pendingAction.id });
      setPendingAction(null);
      setMessages(previous => [...previous, { role: 'assistant', text: response.reply, results: response.results }]);
    } catch (requestError) {
      setError(requestError.message || 'The action could not be confirmed.');
    } finally {
      setProcessing(false);
    }
  }

  return <section className="labsetu-voice-panel" aria-label="LabSetu AI assistant">
    <header className="labsetu-voice-panel-heading">
      <div>
        <p>LABSETU AI ASSISTANT</p>
        <h2>{lang === 'hi' ? 'बात करें या संदेश लिखें' : 'Talk or type to LabSetu AI'}</h2>
      </div>
      <label className="labsetu-voice-language">Language
        <select value={lang} onChange={event => setLang(event.target.value)} aria-label="Assistant language">
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </label>
      {onClose && <button type="button" className="labsetu-voice-close" onClick={onClose} aria-label="Close assistant">×</button>}
    </header>

    <p className="labsetu-voice-disclaimer">
      {authenticated
        ? 'Private requests use your signed-in patient account. Review all test names, dates, and amounts before confirming an action.'
        : 'Public information only. Sign in before booking tests or accessing prescriptions, reports, payments, or other private records.'}
    </p>

    <div className="labsetu-voice-messages" role="log" aria-live="polite" aria-relevant="additions">
      {messages.length === 0 && <p className="labsetu-voice-welcome">
        {lang === 'hi' ? 'नमस्ते! LabSetu सेवाओं के बारे में पूछें। बुकिंग और निजी रिकॉर्ड के लिए मरीज खाते में साइन इन करें।' : 'Hello! Ask about LabSetu services. Sign in to your patient account for bookings and private records.'}
      </p>}
      {messages.map((item, index) => <article className={`labsetu-voice-message ${item.role}`} key={`${index}-${item.role}`}>
        <strong>{item.role === 'user' ? (lang === 'hi' ? 'आप' : 'You') : 'LabSetu AI'}</strong>
        <p>{item.text}</p>
        {item.results && <ToolSummary results={item.results} language={lang} />}
        {item.role === 'assistant' && <SpeechPlayback text={item.text} lang={lang} />}
      </article>)}
      {processing && <p className="labsetu-voice-status" role="status">{lang === 'hi' ? 'प्रोसेस हो रहा है…' : 'Processing your request…'}</p>}
      <div ref={endRef} />
    </div>

    {pendingAction && <div className="labsetu-voice-confirm" role="group" aria-label="Confirm requested action">
      <strong>Review before confirming</strong>
      <p>{pendingAction.type === 'booking' ? 'Confirm these selected tests and appointment details in the booking review.' : `Confirm ${pendingAction.type} only after reviewing the invoice and amount.`}</p>
      {pendingAction.summary?.quote?.tests?.map(test => <p key={test.id}>{test.name} — {money(test.pricePaise, pendingAction.summary.quote.currency)}</p>)}
      <button type="button" disabled={processing} onClick={confirmAction}>Confirm {pendingAction.type}</button>
      <button type="button" className="secondary" disabled={processing} onClick={() => setPendingAction(null)}>Dismiss</button>
    </div>}

    {error && <p className="labsetu-voice-error" role="alert">{error}</p>}
    {!authenticated && <p className="labsetu-voice-signin"><Link to="/login?role=citizen" state={{ defaultRole: 'citizen' }}>Sign in to your patient account</Link></p>}

    <form className="labsetu-voice-composer" onSubmit={submit}>
      <label htmlFor="labsetu-voice-message">{lang === 'hi' ? 'संदेश' : 'Message'}</label>
      <textarea id="labsetu-voice-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={2000} rows={3} placeholder={lang === 'hi' ? 'अपना प्रश्न बोलें या लिखें…' : 'Speak or type your question…'} />
      <VoiceInput lang={lang} value={message} onTranscript={setMessage} isProcessing={processing} />
      <p className="labsetu-voice-review-hint">{lang === 'hi' ? 'भेजने से पहले ट्रांसक्रिप्ट और महत्वपूर्ण जानकारी जाँचें।' : 'Review the editable transcript, especially test names, dates, and amounts, before sending.'}</p>
      <button type="submit" disabled={processing || !message.trim()}>{processing ? 'Please wait…' : lang === 'hi' ? 'भेजें' : 'Ask LabSetu'}</button>
    </form>
    {latestReply && <span className="sr-only" aria-live="polite">{lang === 'hi' ? 'उत्तर पूरा हुआ' : 'Assistant response complete'}</span>}
  </section>;
}
