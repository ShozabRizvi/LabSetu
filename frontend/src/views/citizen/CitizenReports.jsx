import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { assistantService } from '../../services/assistantService';
import ReportExplanation from '../../components/assistant/ReportExplanation';
import './CitizenAssistant.css';

export default function CitizenReports({ lang: propLang }) {
  const { currentUser } = useAuth();
  const { lang: contextLang } = useLanguage();
  const language = propLang || contextLang || 'en';
  const hi = language === 'hi';
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') || '');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [explanation, setExplanation] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await assistantService.appointments();
        if (active) { setBookings(data); setError(''); }
      } catch (e) { if (active) { setBookings([]); setError(e.message); } }
      finally { if (active) setLoading(false); }
    }
    setBookings([]); setExplanation(null); setLoading(true);
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { active = false; window.removeEventListener('focus', onFocus); };
  }, [currentUser?.id]);

  async function download(bookingId) {
    setBusy(true); setError('');
    try {
      const blob = await assistantService.report(bookingId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'LabSetu-approved-report.pdf'; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function explain(bookingId) {
    setBusy(true); setError(''); setExplanation(null);
    try { setExplanation(await assistantService.explanation(bookingId, language)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const filtered = bookings.filter(b => `${b.id} ${b.report?.id || ''} ${(b.tests || []).map(t => t.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  
  return (
    <div className="assistant-page">
      <div className="assistant-heading">
        <div>
          <h1>{hi ? 'मेरी लैब रिपोर्ट' : 'My Diagnostic Lab Reports'}</h1>
          <p>{hi ? 'अपने खाते की रिपोर्ट की स्थिति, स्वीकृत PDF और सरल व्याख्या देखें।' : 'Track your reports, download approved PDFs and read explanations of recorded values.'}</p>
        </div>
        <Link to="/portal/assistant">LabSetu Assistant</Link>
      </div>
      {error && <div className="assistant-error" role="alert">{error}</div>}
      <section className="assistant-card">
        <label className="assistant-field">{hi ? 'रिपोर्ट खोजें' : 'Search reports'}
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={hi ? 'जाँच का नाम या रिपोर्ट ID' : 'Test name or report ID'} />
        </label>
        {loading && <p role="status">{hi ? 'रिपोर्ट की स्थिति लोड हो रही है…' : 'Loading report status…'}</p>}
        {!loading && !error && !filtered.length && <p>{hi ? 'कोई रिपोर्ट नहीं मिली।' : 'No reports found for your account.'}</p>}
        {filtered.map(booking => {
          const approved = ['approved', 'released'].includes(booking.report?.status);
          return (
            <article className="assistant-booking" key={booking.id}>
              <h2>{(booking.tests || []).map(t => t.name).join(', ')}</h2>
              {booking.synthetic && <p role="note">SYNTHETIC DEMONSTRATION — not a clinical patient record</p>}
              <p>{hi ? 'बुकिंग' : 'Booking'}: {booking.id}</p>
              {booking.report?.id && <p>{hi ? 'रिपोर्ट' : 'Report'}: {booking.report.id}</p>}
              <p>{hi ? 'संग्रह का समय' : 'Collection appointment'}: {booking.date} {booking.startTime}</p>
              <p>{hi ? 'नमूने की स्थिति' : 'Sample status'}: {booking.sample?.status}</p>
              <p>{hi ? 'रिपोर्ट की स्थिति' : 'Report status'}: {booking.report?.status}</p>
              {booking.report?.approvedByName && <p>{hi ? 'स्वीकृत करने वाले' : 'Approved by'}: {booking.report.approvedByName}</p>}
              <div className="assistant-actions">
                <button disabled={busy || !approved} onClick={() => download(booking.id)}>{hi ? 'स्वीकृत PDF डाउनलोड करें' : 'Download approved PDF'}</button>
                <button className="secondary" disabled={busy || !approved} onClick={() => explain(booking.id)}>{hi ? 'रिपोर्ट समझें' : 'Explain report'}</button>
              </div>
              {!approved && <p>{hi ? 'प्रयोगशाला की स्वीकृति के बाद रिपोर्ट उपलब्ध होगी।' : 'Report access requires laboratory approval.'}</p>}
              {approved && booking.invoice?.status !== 'paid' && <p>{hi ? 'प्रयोगशाला की भुगतान नीति के अनुसार रिपोर्ट पर रोक हो सकती है।' : 'Report access may require verified payment under the laboratory policy.'}</p>}
            </article>
          );
        })}
      </section>
      {explanation && <section className="assistant-card"><ReportExplanation data={explanation} language={language} /></section>}
      <section className="assistant-card">
        <h2>{hi ? 'डॉक्टर से परामर्श की तैयारी' : 'Prepare for a clinician visit'}</h2>
        <p>{hi ? 'अपनी स्वीकृत रिपोर्ट और पुराने रिकॉर्ड साथ रखें। पूछें कि परिणाम का आपके लिए क्या अर्थ है और क्या आगे जाँच चाहिए।' : 'Bring your approved report and earlier records. Ask what the findings mean in your circumstances and whether follow-up is needed.'}</p>
        <p>{hi ? 'यह व्याख्या निदान या उपचार की सलाह नहीं है।' : 'These explanations are educational. A qualified clinician must assess diagnosis and treatment.'}</p>
        <Link to="/portal/assistant">{hi ? 'पर्चा अपलोड करें और रिपोर्ट ट्रैक करें' : 'Upload a prescription and track reports with LabSetu Assistant'}</Link>
      </section>
    </div>
  );
}