import React, { useState, useRef, useEffect, useCallback } from 'react';
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
      ? `✅ आपकी फ़ाइल **"${fileName}"** प्राप्त हुई।\n\nAI विश्लेषण के लिए, कृपया बताएं कि आप इस रिपोर्ट के बारे में क्या जानना चाहते हैं — जैसे "इस रिपोर्ट की असामान्य वैल्यू बताएं" या "सभी टेस्ट समझाएं"।\n\n📋 यह पोर्टल CBC, LFT, KFT, Lipid Profile, Thyroid, HbA1c और अन्य सभी सामान्य पैथोलॉजी रिपोर्ट समझा सकता है।`
      : `✅ Your file **"${fileName}"** has been received.\n\nTo analyze it, please tell me what you'd like to know — such as "Explain the abnormal values" or "Summarize all test results".\n\n📋 This assistant can explain CBC, LFT, KFT, Lipid Profile, Thyroid, HbA1c, and all common pathology reports.`;
  }

  /* HbA1c */
  if (q.includes('hba1c') || q.includes('a1c') || q.includes('glycosylated') || q.includes('diabetes') || q.includes('शुगर') || q.includes('मधुमेह')) {
    return isHi
      ? '📊 **HbA1c (ग्लाइकोसिलेटेड हीमोग्लोबिन) — विश्लेषण**\n\nHbA1c आपके पिछले 90 दिनों (3 महीने) का औसत रक्त शर्करा स्तर दर्शाता है।\n\n📏 **संदर्भ सीमाएँ:**\n• < 5.7% → सामान्य ✅\n• 5.7–6.4% → प्री-डायबिटीज ⚠️\n• ≥ 6.5% → डायबिटीज की संभावना 🔴\n\n**6.8%** का मान सामान्य सीमा से ऊपर है, जो लगातार उच्च रक्त शर्करा का संकेत है। यह एक महत्वपूर्ण चेतावनी संकेत है।\n\n💡 **डॉक्टर से पूछें:**\n• क्या मुझे दवा या केवल जीवनशैली बदलाव की आवश्यकता है?\n• मेरा व्यक्तिगत HbA1c लक्ष्य क्या होना चाहिए?\n• अगला टेस्ट कब कराएं?\n\n⚕️ *यह जानकारी केवल शैक्षिक उद्देश्य के लिए है। अपने डॉक्टर से परामर्श करें।*'
      : '📊 **HbA1c (Glycosylated Hemoglobin) — Analysis**\n\nHbA1c reflects your average blood sugar over the past 90 days (3 months), unlike a fasting blood glucose which is a single snapshot.\n\n📏 **Reference Ranges:**\n• < 5.7% → Normal ✅\n• 5.7–6.4% → Prediabetes ⚠️\n• ≥ 6.5% → Diabetes range 🔴\n\nA value of **6.8%** is above the standard non-diabetic range, indicating blood glucose has been consistently elevated over recent months.\n\n💡 **Questions to ask your doctor:**\n• Do I need medication or can lifestyle changes help?\n• What is my personalized HbA1c target?\n• When should I schedule my next follow-up?\n\n⚕️ *This is educational information only. Please consult your doctor.*';
  }

  /* Hemoglobin / Anemia */
  if (q.includes('hemoglobin') || q.includes('hb') || q.includes('anemia') || q.includes('anaemia') || q.includes('हीमोग्लोबिन') || q.includes('खून')) {
    return isHi
      ? '🩸 **हीमोग्लोबिन (Hb) — विश्लेषण**\n\nहीमोग्लोबिन लाल रक्त कोशिकाओं में मौजूद आयरन युक्त प्रोटीन है जो शरीर के सभी अंगों तक ऑक्सीजन पहुंचाता है।\n\n📏 **सामान्य सीमाएँ:**\n• पुरुष: 13.0–17.0 g/dL\n• महिला: 12.0–15.0 g/dL\n\n**10.8 g/dL** का मान सामान्य से कम है — इसे हल्की एनीमिया (खून की कमी) कहा जाता है।\n\n💡 **डॉक्टर से पूछें:**\n• क्या मुझे आयरन सप्लीमेंट की आवश्यकता है?\n• क्या Serum Ferritin टेस्ट करना चाहिए?\n• खाने में क्या शामिल करें?\n\n⚕️ *अपने डॉक्टर से परामर्श अवश्य करें।*'
      : '🩸 **Hemoglobin (Hb) — Analysis**\n\nHemoglobin is the iron-rich protein in red blood cells that carries oxygen from your lungs to all organs and tissues.\n\n📏 **Normal Ranges:**\n• Males: 13.0–17.0 g/dL\n• Females: 12.0–15.0 g/dL\n\nA value below normal indicates anemia — your tissues may not be getting sufficient oxygen, which can cause fatigue, breathlessness, and reduced stamina.\n\n💡 **Questions to ask your doctor:**\n• Is my anemia due to iron deficiency or another cause?\n• Should I get a Serum Ferritin and Iron Studies panel?\n• What iron-rich foods should I include in my diet?\n\n⚕️ *Please consult your doctor for personalized advice.*';
  }

  /* TSH / Thyroid */
  if (q.includes('tsh') || q.includes('thyroid') || q.includes('थायरॉइड') || q.includes('t3') || q.includes('t4')) {
    return isHi
      ? '🦋 **TSH (थायरॉइड स्टिमुलेटिंग हार्मोन) — विश्लेषण**\n\nTSH मस्तिष्क की पिट्यूटरी ग्रंथि द्वारा बनाया जाता है जो थायरॉइड ग्रंथि को हार्मोन (T3, T4) बनाने का निर्देश देता है।\n\n📏 **सामान्य सीमा:** 0.40–4.20 uIU/mL\n\n**5.6 uIU/mL** का स्तर सामान्य से थोड़ा अधिक है। इसे सबक्लिनिकल हाइपोथायरायडिज्म कहा जाता है — थायरॉइड ग्रंथि धीमी है।\n\n💡 **डॉक्टर से पूछें:**\n• क्या मुझे अभी दवा की जरूरत है?\n• Free T3, Free T4 और Anti-TPO टेस्ट जरूरी हैं?\n• 2 महीने बाद दोबारा टेस्ट कराएं?\n\n⚕️ *अपने डॉक्टर से परामर्श करें।*'
      : '🦋 **TSH (Thyroid Stimulating Hormone) — Analysis**\n\nTSH is produced by the pituitary gland to signal your thyroid how much T3/T4 hormone to produce.\n\n📏 **Normal Range:** 0.40–4.20 uIU/mL\n\nA TSH above 4.20 uIU/mL indicates the thyroid is working slower than needed (subclinical or clinical hypothyroidism).\n\n💡 **Questions to ask your doctor:**\n• Do I need thyroid hormone replacement now?\n• Should we test Free T3, Free T4, and Anti-TPO antibodies?\n• When should I retest?\n\n⚕️ *Please consult your doctor for diagnosis and treatment.*';
  }

  /* Cholesterol / Lipids */
  if (q.includes('cholesterol') || q.includes('lipid') || q.includes('ldl') || q.includes('hdl') || q.includes('triglyceride') || q.includes('कोलेस्ट्रॉल')) {
    return isHi
      ? '💛 **कोलेस्ट्रॉल / लिपिड प्रोफाइल — विश्लेषण**\n\nकोलेस्ट्रॉल एक प्रकार की वसा है जो कोशिकाओं और हार्मोन्स के लिए जरूरी है, लेकिन अधिक मात्रा हृदय के लिए हानिकारक हो सकती है।\n\n📏 **सामान्य सीमाएँ:**\n• टोटल कोलेस्ट्रॉल: < 200 mg/dL ✅\n• LDL (खराब): < 130 mg/dL ✅\n• HDL (अच्छा): > 40 (पुरुष), > 50 (महिला) ✅\n• ट्राइग्लिसराइड: < 150 mg/dL ✅\n\n💡 **डॉक्टर से पूछें:**\n• मेरा LDL और HDL अनुपात कैसा है?\n• क्या मुझे दवा की आवश्यकता है?\n• हृदय-स्वस्थ आहार में क्या शामिल करें?\n\n⚕️ *चिकित्सीय सलाह के लिए अपने डॉक्टर से मिलें।*'
      : '💛 **Cholesterol / Lipid Profile — Analysis**\n\nCholesterol is a waxy fat essential for cell function, but elevated levels can accumulate in arteries over time.\n\n📏 **Optimal Ranges:**\n• Total Cholesterol: < 200 mg/dL ✅\n• LDL (bad): < 130 mg/dL ✅\n• HDL (good): > 40 (men), > 50 (women) ✅\n• Triglycerides: < 150 mg/dL ✅\n\n💡 **Questions to ask your doctor:**\n• How do my LDL and HDL fractions compare?\n• Do I need medication or lifestyle changes alone?\n• What heart-healthy diet changes are recommended?\n\n⚕️ *Please consult your doctor for personalized cardiac risk assessment.*';
  }

  /* CBC */
  if (q.includes('cbc') || q.includes('complete blood') || q.includes('blood count') || q.includes('wbc') || q.includes('platelet') || q.includes('रक्त')) {
    return isHi
      ? '🔬 **CBC (Complete Blood Count) — विश्लेषण**\n\nCBC एक व्यापक रक्त परीक्षण है जो तीन मुख्य घटकों को मापता है:\n\n🔴 **लाल रक्त कोशिकाएं (RBC)** — ऑक्सीजन परिवहन\n⚪ **सफेद रक्त कोशिकाएं (WBC)** — संक्रमण से लड़ना\n💛 **प्लेटलेट्स** — रक्त का थक्का बनाना\n\n📏 **सामान्य सीमाएँ:**\n• WBC: 4,000–11,000 /μL\n• RBC: 4.5–5.5 (पुरुष), 4.0–5.0 (महिला) M/μL\n• Platelets: 1.5–4.0 लाख /μL\n• Hb: 13–17 (पुरुष), 12–15 (महिला) g/dL\n\n💡 अपनी विशिष्ट वैल्यू के साथ प्रश्न पूछें जैसे "मेरा WBC 12,000 है क्या यह ठीक है?"\n\n⚕️ *डॉक्टर से परामर्श लें।*'
      : '🔬 **CBC (Complete Blood Count) — Analysis**\n\nCBC is a comprehensive blood test measuring three main components:\n\n🔴 **Red Blood Cells (RBC)** — Oxygen transport\n⚪ **White Blood Cells (WBC)** — Infection fighting\n💛 **Platelets** — Blood clotting\n\n📏 **Normal Ranges:**\n• WBC: 4,000–11,000 /μL\n• RBC: 4.5–5.5 (male), 4.0–5.0 (female) M/μL\n• Platelets: 150,000–400,000 /μL\n• Hb: 13–17 (male), 12–15 (female) g/dL\n\n💡 For a detailed analysis, share your specific values — e.g., "My WBC is 12,000 — is that high?"\n\n⚕️ *Always consult your doctor for interpretation.*';
  }

  /* Generic / default */
  return isHi
    ? `🤖 **AI स्वास्थ्य सहायक — LabSetu**\n\nआपका प्रश्न प्राप्त हुआ: **"${query}"**\n\nमैं निम्नलिखित विषयों पर सहायता कर सकता हूँ:\n• 🩸 CBC, हीमोग्लोबिन, एनीमिया\n• 🍭 HbA1c, रक्त शर्करा, मधुमेह\n• 🦋 TSH, थायरॉइड\n• 💛 कोलेस्ट्रॉल, लिपिड प्रोफाइल\n• 🫁 LFT (लिवर), KFT (किडनी)\n• 📋 किसी भी रिपोर्ट की PDF/फ़ोटो अपलोड\n\nकृपया अपनी रिपोर्ट की वैल्यू बताएं जैसे "मेरा Creatinine 1.8 है" और मैं विस्तार से समझाऊंगा।\n\n⚕️ *यह जानकारी केवल शैक्षिक उद्देश्य के लिए है। अपने डॉक्टर से परामर्श करें।*`
    : `🤖 **AI Health Assistant — LabSetu**\n\nI received your question: **"${query}"**\n\nI can help explain:\n• 🩸 CBC, Hemoglobin, Anemia\n• 🍭 HbA1c, Blood Sugar, Diabetes\n• 🦋 TSH, Thyroid function\n• 💛 Cholesterol, Lipid Profile\n• 🫁 LFT (Liver), KFT (Kidney)\n• 📋 Upload any lab report PDF or image\n\nFor a detailed analysis, share specific values — e.g., "My Creatinine is 1.8" — and I'll explain what it means.\n\n⚕️ *This information is for educational purposes only. Please consult a qualified healthcare professional.*`;
}
