import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LanguageIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowPathIcon,
  UserCircleIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

/* ─── Medical Disclaimer Banner ─────────────────────────────────────────────── */
function MedicalDisclaimer({ lang }) {
  const isHi = lang === 'hi';
  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: '10px',
        padding: '0.9rem 1.1rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        fontSize: '0.82rem',
        color: '#92400e',
        lineHeight: 1.55,
      }}
    >
      <ExclamationTriangleIcon
        style={{ width: '20px', flexShrink: 0, marginTop: '2px', color: '#b45309' }}
      />
      <div>
        <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
          {isHi
            ? '⚕️ महत्वपूर्ण चिकित्सकीय अस्वीकरण (Medical Disclaimer):'
            : '⚕️ Medical Disclaimer:'}
        </strong>
        {isHi
          ? 'यह एआई सारांश केवल स्वास्थ्य जागरूकता और शैक्षिक उद्देश्य के लिए है। यह किसी भी प्रकार की चिकित्सीय सलाह, रोग निदान या दवा की पर्ची नहीं है। किसी भी स्वास्थ्य निर्णय से पहले हमेशा अपने योग्य चिकित्सक से परामर्श करें।'
          : 'This AI summary is provided for informational and educational overview purposes only. Please do not rely on this automated breakdown for direct diagnosis or treatment. Always consult a qualified medical doctor or healthcare professional for personalized medical advice.'}
      </div>
    </div>
  );
}

/* ─── Chat Bubble ────────────────────────────────────────────────────────────── */
function ChatBubble({ msg, lang }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1.1rem',
        gap: '0.6rem',
        alignItems: 'flex-start',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #15803d, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CpuChipIcon style={{ width: 18, color: 'white' }} />
        </div>
      )}

      <div style={{ maxWidth: '78%' }}>
        {/* File attachment preview (user) */}
        {msg.file && (
          <div
            style={{
              background: isUser ? '#dcfce7' : '#f1f5f9',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.5rem 0.8rem',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8rem',
              color: '#166534',
            }}
          >
            {msg.file.type?.includes('pdf') ? (
              <DocumentTextIcon style={{ width: 16 }} />
            ) : (
              <PhotoIcon style={{ width: 16 }} />
            )}
            <span style={{ fontWeight: 600 }}>{msg.file.name}</span>
            <span style={{ color: '#64748b' }}>({(msg.file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {/* Message bubble */}
        <div
          style={{
            background: isUser
              ? 'linear-gradient(135deg, #15803d, #059669)'
              : 'white',
            color: isUser ? 'white' : '#0f172a',
            border: isUser ? 'none' : '1px solid #e2e8f0',
            borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
            padding: '0.75rem 1.1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {msg.content}
        </div>

        {/* AI response disclaimer */}
        {!isUser && msg.content && (
          <div style={{ marginTop: '0.5rem' }}>
            <MedicalDisclaimer lang={lang} />
          </div>
        )}

        <div
          style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            marginTop: '0.3rem',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {msg.time}
        </div>
      </div>

      {isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <UserCircleIcon style={{ width: 20, color: '#475569' }} />
        </div>
      )}
    </div>
  );
}

/* ─── Typing indicator ──────────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1rem' }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #15803d, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CpuChipIcon style={{ width: 18, color: 'white' }} />
      </div>
      <div
        style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '4px 18px 18px 18px',
          padding: '0.75rem 1.1rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          display: 'flex',
          gap: '0.3rem',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#15803d',
              display: 'inline-block',
              animation: 'labsetu-bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Quick Prompt Chips ────────────────────────────────────────────────────── */
const QUICK_PROMPTS_EN = [
  'Explain my CBC report',
  'Is my HbA1c of 6.8% dangerous?',
  'What does TSH of 5.6 mean?',
  'My hemoglobin is 10.8 g/dL — is that low?',
  'Explain my cholesterol of 228 mg/dL',
  'What questions should I ask my doctor?',
];

const QUICK_PROMPTS_HI = [
  'मेरी CBC रिपोर्ट समझाएं',
  'क्या 6.8% HbA1c खतरनाक है?',
  'TSH 5.6 का क्या मतलब है?',
  'मेरा हीमोग्लोबिन 10.8 g/dL है — क्या यह कम है?',
  'कोलेस्ट्रॉल 228 mg/dL समझाएं',
  'डॉक्टर से क्या प्रश्न पूछें?',
];

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function CitizenReportExplainer({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const effectiveLang = propLang || contextLang || 'en';
  const [activeLang, setActiveLang] = useState(effectiveLang);

  useEffect(() => {
    setActiveLang(effectiveLang);
  }, [effectiveLang]);

  const isHi = activeLang === 'hi';

  /* ── Chat state ─────────────────────────────────────────────────── */
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isHi
        ? 'नमस्ते! 👋 मैं LabSetu का AI स्वास्थ्य सहायक हूँ।\n\nआप अपनी लैब रिपोर्ट (PDF/Image) अपलोड कर सकते हैं या सीधे प्रश्न टाइप करें। उदाहरण: "मेरी CBC रिपोर्ट समझाएं" या "HbA1c 6.8% का क्या मतलब है?"'
        : 'Hello! 👋 I\'m the LabSetu AI Health Assistant.\n\nYou can upload your lab report (PDF or image) or type your question directly. For example: "Explain my CBC report" or "Is my HbA1c of 6.8% high?"',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      file: null,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* Auto-scroll to bottom on new message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* Auto-resize textarea */
  const handleTextInput = (e) => {
    setInputText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }
  };

  /* ── File attachment ───────────────────────────────────────────── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert(isHi ? 'कृपया PDF, PNG या JPEG फ़ाइल चुनें।' : 'Please select a PDF, PNG, or JPEG file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(isHi ? 'फ़ाइल का आकार 10 MB से कम होना चाहिए।' : 'File size must be under 10 MB.');
      return;
    }
    setAttachedFile(file);
    // Clear input so the same file can be reselected later
    e.target.value = '';
  };

  /* ── Convert file to base64 for sending ───────────────────────── */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result?.split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* ── Send message ─────────────────────────────────────────────── */
  const sendMessage = useCallback(async (overrideText = null) => {
    const text = (overrideText ?? inputText).trim();
    if (!text && !attachedFile) return;

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      role: 'user',
      content: text || (isHi ? '(रिपोर्ट अपलोड की)' : '(Lab report uploaded)'),
      file: attachedFile
        ? { name: attachedFile.name, size: attachedFile.size, type: attachedFile.type }
        : null,
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAttachedFile(null);
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      let fileBase64 = null;
      let fileMimeType = null;
      if (attachedFile) {
        fileBase64 = await fileToBase64(attachedFile);
        fileMimeType = attachedFile.type;
      }

      /* Build backend payload */
      const payload = {
        query: text || (isHi ? 'इस रिपोर्ट का सरल विश्लेषण करें।' : 'Please analyze this lab report.'),
        lang: activeLang,
        fileBase64,
        fileMimeType,
        context: 'patient_report_explainer',
      };

      /* Resolve API base URL (mirrors apiClient logic) */
      const baseUrl =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
          ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
          : (typeof import.meta !== 'undefined' && import.meta.env?.PROD)
            ? 'https://labsetu-backend.onrender.com'
            : 'http://localhost:5000';

      let aiText = null;

      try {
        const resp = await fetch(`${baseUrl}/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000),
        });

        if (resp.ok) {
          const json = await resp.json();
          aiText =
            json?.data?.explanation ||
            json?.data?.analysis ||
            json?.data?.text ||
            json?.explanation ||
            json?.text ||
            null;
        }
      } catch {
        /* Backend unavailable – fall through to local simulation */
      }

      /* ── Local intelligent simulation (offline / hackathon fallback) ── */
      if (!aiText) {
        aiText = generateOfflineResponse(text, activeLang, attachedFile?.name);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiText,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          file: null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isHi
            ? 'क्षमा करें, अभी AI प्रतिक्रिया उपलब्ध नहीं है। कृपया पुनः प्रयास करें।'
            : 'Sorry, the AI service is temporarily unavailable. Please try again in a moment.',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          file: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, attachedFile, activeLang, isHi]); // eslint-disable-line react-hooks/exhaustive-deps

  const location = useLocation();
  const autoRunRef = useRef(false);

  /* ── Auto-run query if passed via navigation state or localStorage ── */
  useEffect(() => {
    const incomingQuery =
      location.state?.autoQuery ||
      (typeof window !== 'undefined' ? localStorage.getItem('labsetu_explainer_query') : null);

    if (incomingQuery && !autoRunRef.current) {
      autoRunRef.current = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('labsetu_explainer_query');
      }
      setInputText(incomingQuery);
      sendMessage(incomingQuery);
    }
  }, [location.state, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: isHi
          ? 'नमस्ते! 👋 मैं LabSetu का AI स्वास्थ्य सहायक हूँ। अपना प्रश्न टाइप करें या रिपोर्ट अपलोड करें।'
          : 'Hello! 👋 I\'m the LabSetu AI Health Assistant. Type your question or upload a lab report.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        file: null,
      },
    ]);
  };

  const quickPrompts = isHi ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN;

  return (
    <div className="citizen-page">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="citizen-page-header">
        <div>
          <h1
            className="citizen-page-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <SparklesIcon style={{ width: '28px', color: '#15803d' }} />
            {isHi ? 'AI हेल्थ असिस्टेंट — रिपोर्ट एक्सप्लेनर' : 'AI Health Assistant — Report Explainer'}
          </h1>
          <p className="citizen-page-subtitle">
            {isHi
              ? 'अपनी लैब रिपोर्ट अपलोड करें या कोई भी स्वास्थ्य प्रश्न पूछें — AI सरल भाषा में समझाएगा'
              : 'Upload your lab report or ask any health question — AI explains in plain language'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Language Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              padding: '0.3rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
            }}
          >
            <LanguageIcon style={{ width: '17px', color: '#15803d' }} />
            {['en', 'hi'].map((l) => (
              <button
                key={l}
                onClick={() => setActiveLang(l)}
                style={{
                  border: 'none',
                  background: activeLang === l ? '#15803d' : 'transparent',
                  color: activeLang === l ? 'white' : '#475569',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                {l === 'en' ? 'English' : 'हिंदी'}
              </button>
            ))}
          </div>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.82rem',
              color: '#64748b',
            }}
          >
            <ArrowPathIcon style={{ width: 15 }} />
            {isHi ? 'नई बातचीत' : 'New Chat'}
          </button>
        </div>
      </div>

      {/* ── Top Disclaimer ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1rem' }}>
        <MedicalDisclaimer lang={activeLang} />
      </div>

      {/* ── Quick Prompt Chips ───────────────────────────────────────── */}
      {messages.length <= 1 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isHi ? 'त्वरित प्रश्न' : 'Quick Questions'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  border: '1.5px solid #bbf7d0',
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#15803d';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f0fdf4';
                  e.currentTarget.style.color = '#15803d';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat Window ─────────────────────────────────────────────── */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '1.25rem',
          minHeight: '340px',
          maxHeight: '420px',
          overflowY: 'auto',
          marginBottom: '0',
          scrollBehavior: 'smooth',
        }}
      >
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} msg={msg} lang={activeLang} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* ── Attached File Preview ───────────────────────────────────── */}
      {attachedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0 0 8px 8px',
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            color: '#166534',
          }}
        >
          {attachedFile.type?.includes('pdf') ? (
            <DocumentTextIcon style={{ width: 16 }} />
          ) : (
            <PhotoIcon style={{ width: 16 }} />
          )}
          <span style={{ fontWeight: 600 }}>{attachedFile.name}</span>
          <span style={{ color: '#64748b' }}>({(attachedFile.size / 1024).toFixed(1)} KB)</span>
          <button
            onClick={() => setAttachedFile(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XMarkIcon style={{ width: 16 }} />
          </button>
        </div>
      )}

      {/* ── Input Bar ───────────────────────────────────────────────── */}
      <div
        style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: attachedFile ? '0 0 14px 14px' : '14px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.6rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginTop: 0,
        }}
      >
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title={isHi ? 'रिपोर्ट/फ़ोटो अटैच करें (PDF, PNG, JPEG)' : 'Attach report/image (PDF, PNG, JPEG)'}
          style={{
            background: 'none',
            border: '1.5px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#15803d';
            e.currentTarget.style.color = '#15803d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <PaperClipIcon style={{ width: 20 }} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label={isHi ? 'रिपोर्ट फ़ाइल अपलोड करें' : 'Upload lab report file'}
        />

        {/* Text area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={handleTextInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isHi
              ? 'यहाँ अपना प्रश्न टाइप करें… (जैसे: "HbA1c 6.8% का क्या अर्थ है?")'
              : 'Type your question… (e.g. "What does HbA1c of 6.8% mean?")'
          }
          disabled={isLoading}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '0.92rem',
            lineHeight: 1.55,
            color: '#0f172a',
            background: 'transparent',
            fontFamily: 'inherit',
            overflowY: 'hidden',
            maxHeight: 140,
          }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={isLoading || (!inputText.trim() && !attachedFile)}
          title={isHi ? 'भेजें' : 'Send'}
          style={{
            background:
              isLoading || (!inputText.trim() && !attachedFile)
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #15803d, #059669)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.55rem 0.8rem',
            cursor:
              isLoading || (!inputText.trim() && !attachedFile) ? 'not-allowed' : 'pointer',
            color: isLoading || (!inputText.trim() && !attachedFile) ? '#94a3b8' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          <PaperAirplaneIcon style={{ width: 20 }} />
        </button>
      </div>

      {/* ── Keyboard hint ───────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem' }}>
        {isHi ? 'Enter दबाएँ भेजने के लिए • Shift+Enter नई लाइन के लिए' : 'Press Enter to send • Shift+Enter for new line'}
      </div>

      {/* ── Capability badges ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginTop: '1.25rem',
          justifyContent: 'center',
        }}
      >
        {[
          { icon: DocumentTextIcon, label: isHi ? 'PDF रिपोर्ट' : 'PDF Reports' },
          { icon: PhotoIcon, label: isHi ? 'रिपोर्ट फ़ोटो' : 'Report Images' },
          { icon: SparklesIcon, label: isHi ? 'Gemini AI द्वारा' : 'Powered by Gemini AI' },
          { icon: ShieldCheckIcon, label: isHi ? '100% गोपनीय' : '100% Confidential' },
          { icon: InformationCircleIcon, label: isHi ? 'शैक्षिक उद्देश्य' : 'Educational Only' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: '#64748b',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '0.3rem 0.75rem',
            }}
          >
            <Icon style={{ width: 13, color: '#15803d' }} />
            {label}
          </div>
        ))}
      </div>

      {/* CSS keyframes injected inline for portability */}
      <style>{`
        @keyframes labsetu-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Offline AI simulation engine ──────────────────────────────────────────── */
function generateOfflineResponse(query, lang, fileName) {
  const q = (query || '').toLowerCase();
  const isHi = lang === 'hi';

  /* File-based response */
  if (!query && fileName) {
    return isHi
      ? `📋 **सारांश (Summary)**: आपकी रिपोर्ट फ़ाइल **"${fileName}"** सफलतापूर्वक प्राप्त हो गई है। यह प्रणाली विभिन्न परीक्षणों जैसे लाल रक्त कोशिकाएं (Erythrocytes) और शर्करा स्तर (Blood Glucose) को समझने में मदद करती है।\n\n📊 **आपके परिणाम (Your Numbers Explained)**: विश्लेषण शुरू करने के लिए कृपया बताएं कि आप इस रिपोर्ट में क्या जानना चाहते हैं (जैसे: "क्या मेरे परिणाम सामान्य हैं?")।\n\n💡 **सरल सलाह (Practical Advice)**: अपने डॉक्टर की परामर्श पर्ची और पिछली रिपोर्टों को एक साथ सुरक्षित रखें ताकि तुलना करना आसान हो।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या इस परीक्षण रिपोर्ट के आधार पर किसी दवा या आहार में बदलाव की ज़रूरत है?\n2. मुझे अगली जाँच कब करवानी चाहिए?\n\n⚕️ *यह केवल शैक्षिक जानकारी है। किसी भी चिकित्सीय निर्णय के लिए हमेशा अपने डॉक्टर से परामर्श करें।*`
      : `📋 **Summary**: Your report file **"${fileName}"** has been securely received. This assistant helps explain key markers such as your red blood cells (Erythrocytes) and blood sugar (Glucose) in simple terms.\n\n📊 **Your Numbers Explained**: To begin, please type what you would like explained (for example: "Explain my CBC report" or "Are my numbers normal?").\n\n💡 **Practical Advice**: Keep your current prescription and past test reports organized together for easy long-term tracking.\n\n🩺 **Questions for Your Doctor**:\n1. Are there specific markers in this report that I should monitor closely?\n2. When do you recommend taking my next routine test?\n\n⚕️ *This summary is provided for educational purposes only. Please consult your physician for medical decisions.*`;
  }

  /* HbA1c / Diabetes / Blood Sugar */
  if (q.includes('hba1c') || q.includes('a1c') || q.includes('glycosylated') || q.includes('diabetes') || q.includes('शुगर') || q.includes('मधुमेह')) {
    return isHi
      ? `📋 **सारांश (Summary)**: यह परीक्षण आपके पिछले 3 महीनों (90 दिनों) का औसत रक्त शर्करा स्तर (HbA1c / Glycosylated Hemoglobin) मापता है। यह दैनिक उतार-चढ़ाव के बजाय आपके शरीर के लंबे समय के शुगर नियंत्रण की स्पष्ट तस्वीर देता है।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• सामान्य स्तर (Normal): 5.7% से कम ✅\n• शुरुआती चेतावनी या प्रीडायबिटीज (Prediabetes): 5.7% से 6.4% ⚠️\n• उच्च या डायबिटीज सीमा (Diabetes Range): 6.5% या अधिक 🔴\n• यदि आपका मान 6.8% है, तो यह दर्शाता है कि हाल के महीनों में औसत रक्त शर्करा स्तर सामान्य से अधिक रहा है।\n\n💡 **सरल सलाह (Practical Advice)**:\n• प्रतिदिन 30–45 मिनट की मध्यम सैर करें और ताजी हरी सब्जियों व साबुत अनाज को भोजन में शामिल करें।\n• पैकेज्ड मीठे पेय और रिफाइंड कार्ब्स को कम करें और समय पर भोजन करने की आदत डालें।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या मेरे इस शर्करा स्तर (HbA1c) को नियंत्रित करने के लिए केवल आहार और व्यायाम पर्याप्त है, या मुझे दवा की आवश्यकता होगी?\n2. मेरे स्वास्थ्य इतिहास के अनुसार मेरा व्यक्तिगत शुगर लक्ष्य क्या होना चाहिए?\n\n⚕️ *यह सारांश केवल शैक्षिक उद्देश्य के लिए है। किसी भी उपचार के लिए हमेशा अपने चिकित्सक से परामर्श लें।*`
      : `📋 **Summary**: This test measures your average 3-month blood sugar (HbA1c / Glycosylated Hemoglobin). Rather than reflecting just today's meal, it provides a stable window into how your body manages glucose over about 90 days.\n\n📊 **Your Numbers Explained**:\n• Healthy baseline (Normal): Below 5.7% ✅\n• Early elevated warning (Prediabetes): 5.7% to 6.4% ⚠️\n• Higher concern (Diabetes range): 6.5% or above 🔴\n• An observed value around 6.8% is above standard non-diabetic reference boundaries, showing that blood sugar has trended elevated recently.\n\n💡 **Practical Advice**:\n• Emphasize fiber-rich vegetables, legumes, and whole grains while moderating sweetened beverages and refined carbohydrates.\n• Engage in 30 minutes of daily moderate walking or aerobic movement to improve insulin responsiveness.\n\n🩺 **Questions for Your Doctor**:\n1. Given this HbA1c level, can we start with nutrition and activity adjustments, or do I need medical therapy?\n2. What is my realistic, personalized target level over the next 3 to 6 months?\n\n⚕️ *This summary is provided for educational purposes only. Always consult your qualified physician for medical decisions.*`;
  }

  /* Hemoglobin / Anemia */
  if (q.includes('hemoglobin') || q.includes('hb') || q.includes('anemia') || q.includes('anaemia') || q.includes('हीमोग्लोबिन') || q.includes('खून')) {
    return isHi
      ? `📋 **सारांश (Summary)**: हीमोग्लोबिन (Hemoglobin) आपकी लाल रक्त कोशिकाओं (Erythrocytes) में मौजूद एक महत्वपूर्ण आयरन-युक्त प्रोटीन है। इसका मुख्य कार्य फेफड़ों से शरीर के सभी अंगों तक जीवनदायिनी ऑक्सीजन पहुँचाना है।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• पुरुषों के लिए सामान्य सीमा: 13.0 से 17.0 g/dL\n• महिलाओं के लिए सामान्य सीमा: 12.0 से 15.5 g/dL\n• 10.8 g/dL या इससे कम मान खून की कमी (Mild Anemia) को दर्शाता है, जिसके कारण थकान या सांस फूलने जैसी समस्या हो सकती है।\n\n💡 **सरल सलाह (Practical Advice)**:\n• पालक, मेथी, गुड़, चना, अनार, चुकंदर और खजूर जैसे आयरन युक्त खाद्य पदार्थों का सेवन बढ़ाएं।\n• आयरन के अच्छे अवशोषण के लिए भोजन के साथ नींबू पानी या संतरा (Vitamin C) लें।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या मेरे कम हीमोग्लोबिन का कारण आयरन की कमी (Iron Deficiency) है, और क्या मुझे सप्लीमेंट लेना चाहिए?\n2. क्या मुझे शरीर में आयरन भंडारण की जाँच (Serum Ferritin Test) करानी चाहिए?\n\n⚕️ *यह सारांश केवल शैक्षिक उद्देश्य के लिए है। उचित निदान व उपचार के लिए अपने डॉक्टर से परामर्श करें।*`
      : `📋 **Summary**: Hemoglobin (Hb) is the vital iron-carrying protein inside your red blood cells (Erythrocytes). Its central job is delivering oxygen from your lungs to every organ and tissue throughout your body.\n\n📊 **Your Numbers Explained**:\n• Expected range for adult males: 13.0 – 17.0 g/dL\n• Expected range for adult females: 12.0 – 15.5 g/dL\n• A value below the lower cutoff indicates low oxygen-carrying capacity (Anemia), which can lead to low energy, fatigue, and reduced stamina.\n\n💡 **Practical Advice**:\n• Enjoy natural iron-rich foods including spinach, lentils, beans, beetroot, and lean proteins.\n• Pair iron-rich meals with vitamin C (such as citrus or bell peppers) to boost intestinal iron absorption.\n\n🩺 **Questions for Your Doctor**:\n1. Is my low hemoglobin caused by dietary iron deficiency or another underlying factor?\n2. Would you recommend checking my body iron stores (Serum Ferritin) before starting any supplements?\n\n⚕️ *This summary is provided for educational purposes only. Always consult your medical doctor for diagnostic advice.*`;
  }

  /* TSH / Thyroid */
  if (q.includes('tsh') || q.includes('thyroid') || q.includes('थायरॉइड') || q.includes('t3') || q.includes('t4')) {
    return isHi
      ? `📋 **सारांश (Summary)**: यह परीक्षण आपके मस्तिष्क द्वारा भेजे जाने वाले थायरॉइड नियंत्रण संदेश (TSH / Thyroid Stimulating Hormone) को मापता है। यह हार्मोन आपकी थायरॉइड ग्रंथि को ऊर्जा और मेटाबॉलिज्म नियंत्रित करने वाले हार्मोन (T3 व T4) बनाने का निर्देश देता है।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• स्वस्थ सामान्य सीमा: 0.40 से 4.20 uIU/mL\n• 4.20 से ऊपर का स्तर (जैसे 5.6 uIU/mL) यह दर्शाता है कि थायरॉइड ग्रंथि थोड़ी धीमी गति से काम कर रही है (Subclinical Hypothyroidism), जिससे मस्तिष्क को अधिक संकेत भेजना पड़ रहा है।\n\n💡 **सरल सलाह (Practical Advice)**:\n• पर्याप्त नींद लें, अत्यधिक तनाव से बचें और संतुलित आयोडीन युक्त आहार लें।\n• डॉक्टर द्वारा दी गई किसी भी थायरॉइड दवा को सुबह खाली पेट पानी के साथ लेने की सलाह दी जाती है।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या मेरे बढ़े हुए TSH स्तर के लिए दवा की आवश्यकता है या 6–8 सप्ताह बाद दोबारा परीक्षण करना उचित रहेगा?\n2. क्या मुझे सक्रिय थायरॉइड हार्मोन (Free T3 / Free T4) और एंटीबॉडी (Anti-TPO) परीक्षण भी करवाने चाहिए?\n\n⚕️ *यह केवल शैक्षिक जानकारी है। उपचार के लिए कृपया अपने डॉक्टर से परामर्श करें।*`
      : `📋 **Summary**: This test measures the master signaling hormone from your brain to your thyroid (TSH / Thyroid Stimulating Hormone). It tells the butterfly-shaped thyroid gland in your neck how much metabolic fuel (T3 and T4 hormones) to release.\n\n📊 **Your Numbers Explained**:\n• Standard healthy range: 0.40 – 4.20 uIU/mL\n• A mildly elevated value (such as 5.6 uIU/mL) usually indicates a sluggish thyroid (Subclinical Hypothyroidism), where the pituitary gland works harder to stimulate thyroid production.\n\n💡 **Practical Advice**:\n• Maintain a consistent sleep schedule and manage daily stress, both of which support balanced endocrine function.\n• Avoid starting over-the-counter thyroid supplements without medical supervision.\n\n🩺 **Questions for Your Doctor**:\n1. Does my current TSH level warrant thyroid hormone replacement, or should we re-test in 8 to 12 weeks?\n2. Should we also check active thyroid levels (Free T3, Free T4) and immune markers (Anti-TPO Antibodies)?\n\n⚕️ *This summary is provided for educational purposes only. Always consult your qualified physician for medical decisions.*`;
  }

  /* Cholesterol / Lipids */
  if (q.includes('cholesterol') || q.includes('lipid') || q.includes('ldl') || q.includes('hdl') || q.includes('triglyceride') || q.includes('कोलेस्ट्रॉल')) {
    return isHi
      ? `📋 **सारांश (Summary)**: यह परीक्षण आपके रक्त में वसा और तेल के स्तर (Lipid Profile) की जाँच करता है। इसमें रक्त वाहिकाओं को सुरक्षित रखने वाला अच्छा कोलेस्ट्रॉल (HDL) और धमनियों में जमा होने वाला खराब कोलेस्ट्रॉल (LDL) शामिल हैं।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• कुल कोलेस्ट्रॉल (Total Cholesterol): 200 mg/dL से कम अनुकूल ✅\n• खराब कोलेस्ट्रॉल (LDL): 100–130 mg/dL से कम सुरक्षित ✅\n• अच्छा कोलेस्ट्रॉल (HDL): 40–50 mg/dL से अधिक हृदय रक्षक ✅\n• रक्त वसा (Triglycerides): 150 mg/dL से कम सामान्य ✅\n\n💡 **सरल सलाह (Practical Advice)**:\n• ट्रांस फैट और तली-भुनी चीजों से बचें; अखरोट, बादाम, अलसी और जैतून का तेल जैसे स्वस्थ वसा अपनाएं।\n• सप्ताह में कम से कम 150 मिनट मध्यम व्यायाम (जैसे तेज चलना या योग) करें।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. मेरे कुल कोलेस्ट्रॉल और अच्छे कोलेस्ट्रॉल (HDL Ratio) का संतुलन मेरे दिल के लिए कैसा है?\n2. क्या मुझे अपने कोलेस्ट्रॉल को कम करने के लिए केवल जीवनशैली में सुधार करना होगा या दवा लेनी होगी?\n\n⚕️ *यह केवल शैक्षिक जानकारी है। हृदय स्वास्थ्य से जुड़े निर्णयों के लिए अपने डॉक्टर से मिलें।*`
      : `📋 **Summary**: This panel measures circulating blood fats and lipids (Lipid Profile). It distinguishes between protective "good" cholesterol (HDL) that clears your arteries and "bad" cholesterol (LDL) that can cause vessel narrowing over time.\n\n📊 **Your Numbers Explained**:\n• Total Cholesterol: Below 200 mg/dL is desirable ✅\n• Artery-clogging fat (LDL Cholesterol): Below 100–130 mg/dL is optimal ✅\n• Heart-protective fat (HDL Cholesterol): Above 40 mg/dL (men) or 50 mg/dL (women) ✅\n• Stored food fats (Triglycerides): Below 150 mg/dL is healthy ✅\n\n💡 **Practical Advice**:\n• Limit fried foods, commercial pastries, and trans fats while incorporating omega-3 rich walnuts, flaxseeds, and olive oil.\n• Aim for 150 minutes of weekly aerobic exercise, such as brisk walking, cycling, or swimming.\n\n🩺 **Questions for Your Doctor**:\n1. Looking at my full lipid profile, what is my overall cardiovascular risk calculation?\n2. Do my cholesterol numbers call for medication (such as statins) or should we target diet and lifestyle first?\n\n⚕️ *This summary is provided for educational purposes only. Please consult your physician for individualized cardiac guidance.*`;
  }

  /* CBC (Complete Blood Count) */
  if (q.includes('cbc') || q.includes('complete blood') || q.includes('blood count') || q.includes('wbc') || q.includes('platelet') || q.includes('रक्त')) {
    return isHi
      ? `📋 **सारांश (Summary)**: सम्पूर्ण रक्त गणना (CBC / Complete Blood Count) आपके रक्त के तीन प्राथमिक घटकों की जाँच करता है: ऑक्सीजन पहुँचाने वाली लाल कोशिकाएं (Erythrocytes/RBC), संक्रमण से लड़ने वाली सफेद कोशिकाएं (Leukocytes/WBC), और चोट लगने पर रक्त का थक्का बनाने वाली कोशिकाएं (Thrombocytes/Platelets)।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• संक्रमण रक्षक श्वेत कोशिकाएं (Total WBC): 4,000–11,000 /cu mm (सामान्य सीमा)\n• ऑक्सीजन वाहक हीमोग्लोबिन (Hemoglobin): 12.0–17.0 g/dL (सामान्य सीमा)\n• रक्त थक्का प्लेटलेट्स (Platelets): 1.50–4.50 लाख /cu mm (सामान्य सीमा)\n• यदि आपके मान इन सीमाओं के भीतर हैं, तो आपका रक्त तंत्र अच्छी स्थिति में काम कर रहा है।\n\n💡 **सरल सलाह (Practical Advice)**:\n• पर्याप्त पानी पिएं, मौसमी फल खाएं और शरीर की रोग प्रतिरोधक क्षमता (Immunity) बनाए रखने के लिए तनाव कम करें।\n• किसी भी नए लक्षण (जैसे अत्यधिक थकान या अकारण चोट) की स्थिति में डॉक्टर को बताएं।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या मेरी इस CBC रिपोर्ट में कोई ऐसा पैरामीटर है जिस पर मुझे विशेष ध्यान देना चाहिए?\n2. क्या मुझे कोई अतिरिक्त पूरक आहार (जैसे विटामिन्स या मिनरल्स) लेने की आवश्यकता है?\n\n⚕️ *यह सारांश केवल शैक्षिक अवलोकन के लिए है। किसी भी स्वास्थ्य निर्णय के लिए हमेशा अपने डॉक्टर से परामर्श करें।*`
      : `📋 **Summary**: The Complete Blood Count (CBC) examines the three essential cellular building blocks in your bloodstream: oxygen-delivering red cells (Erythrocytes/RBC), infection-fighting white cells (Leukocytes/WBC), and clotting cells (Thrombocytes/Platelets).\n\n📊 **Your Numbers Explained**:\n• Infection defense cells (Total WBC Count): 4,000 – 11,000 /cu mm (Standard interval)\n• Oxygen carrier (Hemoglobin): 12.0 – 17.0 g/dL depending on biological sex\n• Clotting agents (Platelet Count): 1.50 – 4.50 Lakh /cu mm (Standard interval)\n• Values inside these reference windows show a resilient, properly balanced hematologic system.\n\n💡 **Practical Advice**:\n• Stay well-hydrated throughout the day and eat a rainbow of fresh fruits and vegetables to support cellular health.\n• Adequate sleep directly aids bone marrow production of healthy blood cells.\n\n🩺 **Questions for Your Doctor**:\n1. Do all parameters across my red cells, white cells, and platelets appear balanced for my age group?\n2. When do you advise our next routine complete blood screen?\n\n⚕️ *This summary is provided for educational purposes only. Always consult your healthcare provider for medical decisions.*`;
  }

  /* Generic / default */
  return isHi
    ? `📋 **सारांश (Summary)**: यह परीक्षण आपके शरीर के आंतरिक अंगों के समुचित कार्य और चयापचय (Metabolism) की स्थिति की जाँच करता है।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• प्राप्त प्रश्न: "${query}"।\n• अधिकांश नैदानिक परीक्षणों के परिणाम संदर्भ सीमाओं (Reference Intervals) के आधार पर देखे जाते हैं। यदि कोई मान थोड़ा कम या अधिक है, तो यह अस्थायी शारीरिक परिवर्तनों से भी हो सकता है।\n\n💡 **सरल सलाह (Practical Advice)**:\n• नियमित दिनचर्या, संतुलित आहार और भरपूर पानी का सेवन आपके अंगों को स्वस्थ रखता है।\n• अपनी पुरानी और नई लैब रिपोर्टों को एक साथ सहेज कर रखें ताकि स्वास्थ्य में सुधार को देखा जा सके।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या मेरे इन परिणामों के आधार पर किसी फॉलो-अप परीक्षण की आवश्यकता है?\n2. क्या मुझे अपने दैनिक आहार या व्यायाम में कोई विशेष संशोधन करना चाहिए?\n\n⚕️ *यह जानकारी केवल शैक्षिक और सामान्य समझ के लिए है। किसी भी चिकित्सीय निर्णय के लिए हमेशा अपने डॉक्टर से परामर्श करें।*`
    : `📋 **Summary**: This diagnostic investigation evaluates your internal organ health, biochemical pathways, and overall body balance (Metabolism).\n\n📊 **Your Numbers Explained**:\n• Query received: "${query}".\n• Laboratory parameters are measured against standard healthy baselines (Reference Intervals). Slight variations can occur due to hydration, diet, exercise, or timing of the blood draw.\n\n💡 **Practical Advice**:\n• Maintain steady daily hydration, eat nutrient-dense whole foods, and get consistent rest.\n• Keep copies of all diagnostic reports so your physician can monitor your progress over time.\n\n🩺 **Questions for Your Doctor**:\n1. Do my observed findings indicate the need for any repeat testing or medication review?\n2. Are there personalized lifestyle or dietary guidelines you recommend based on this report?\n\n⚕️ *This summary is provided for informational and educational purposes only. Please consult your personal doctor for medical decisions.*`;
}
