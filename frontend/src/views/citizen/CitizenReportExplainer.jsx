import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { requestClinova } from '../../services/clinovaService';
import { useLanguage } from '../../context/LanguageContext';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowPathIcon,
  UserCircleIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

/* ─── Medical Disclaimer Banner (shown only after AI responds, inside chat) ──── */
function MedicalDisclaimer() {
  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        display: 'flex',
        gap: '0.65rem',
        alignItems: 'flex-start',
        fontSize: '0.79rem',
        color: '#92400e',
        lineHeight: 1.5,
        marginTop: '0.4rem',
      }}
    >
      <ExclamationTriangleIcon
        style={{ width: '16px', flexShrink: 0, marginTop: '2px', color: '#b45309' }}
      />
      <span>
        This is for informational purposes only. For medical advice or diagnosis, consult a professional. AI responses may include mistakes.
      </span>
    </div>
  );
}

/* ─── Chat Bubble ────────────────────────────────────────────────────────────── */
function ChatBubble({ msg, lang, isSpeaking, onToggleTts }) {
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

        {/* AI response disclaimer - hidden by default, rendered only after actual report is explained */}
        {!isUser && msg.content && msg.isExplanation && (
          <div style={{ marginTop: '0.5rem' }}>
            <MedicalDisclaimer />
          </div>
        )}

        <div
          style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            marginTop: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            gap: '0.5rem',
          }}
        >
          <span>{msg.time}</span>
          {!isUser && msg.content && (
            <button
              type="button"
              aria-label={isSpeaking ? 'Stop spoken response' : 'Read response aloud'}
              aria-pressed={isSpeaking}
              onClick={() => onToggleTts?.(msg.content, lang, msg.id || msg.time)}
              title={
                isSpeaking
                  ? (lang === 'hi' ? 'आवाज़ बंद करें' : 'Stop speaking')
                  : (lang === 'hi' ? 'बोलकर सुनाएं (Text-to-Speech)' : 'Read aloud with text-to-speech')
              }
              className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                isSpeaking ? 'text-emerald-700 font-semibold' : 'text-slate-400 hover:text-emerald-700'
              }`}
              style={{
                background: isSpeaking ? '#ecfdf5' : 'transparent',
                border: isSpeaking ? '1px solid #a7f3d0' : 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: isSpeaking ? '#059669' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              <SpeakerWaveIcon
                width={20}
                height={20}
                aria-hidden="true"
                className={isSpeaking ? 'animate-pulse text-emerald-600' : ''}
                style={{ width: 20, height: 20, flex: '0 0 20px' }}
              />
              <span style={{ fontSize: '0.7rem' }}>
                {isSpeaking ? (lang === 'hi' ? 'रुकें' : 'Stop') : (lang === 'hi' ? 'सुनाएं' : 'Listen')}
              </span>
            </button>
          )}
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
  'What is a complete blood count?', 'What does HbA1c measure?',
  'What is a reference range?', 'Where can I book a test on LabSetu?',
  'How do I find my approved report?', 'What questions can I ask my doctor?',
];
const QUICK_PROMPTS_HI = [
  'पूर्ण रक्त गणना (CBC) क्या है?', 'HbA1c जाँच क्या मापती है?',
  'संदर्भ सीमा का क्या अर्थ है?', 'LabSetu पर जाँच कहाँ बुक करूँ?',
  'अपनी स्वीकृत रिपोर्ट कहाँ देखूँ?', 'डॉक्टर से कौन से प्रश्न पूछ सकता हूँ?',
];

export default function CitizenReportExplainer({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const currentGlobalLang = propLang || contextLang || 'en';
  const isHi = currentGlobalLang === 'hi';
  const [inputFocused, setInputFocused] = useState(false);

  /* ── Web Speech API (Microphone / Voice-to-Text) ──────────────────── */
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState('');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
      setSpeechRecognitionSupported(isSupported);
    }
  }, []);

  /* ── Web Speech API (Text-to-Speech / TTS) ────────────────────────── */
  const [voices, setVoices] = useState([]);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populateVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch (e) {
        console.warn('Error fetching speech synthesis voices:', e);
      }
    };

    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  useEffect(() => {
    // Halt any active speech playback if global language is toggled
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
    }
  }, [currentGlobalLang]);

  /* Function: speakText(text, lang, msgId) */
  const speakText = (text, lang, msgId) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Toggle: clicking speaker icon while speaking halts playback instantly
    if (currentlySpeakingId !== null) {
      window.speechSynthesis.cancel();
      if (currentlySpeakingId === msgId) {
        setCurrentlySpeakingId(null);
        return;
      }
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown tags & URLs for natural narration
      const cleanText = (text || '')
        .replace(/[*#_`]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.lang = targetLang;
      utterance.rate = lang === 'hi' ? 0.95 : 1.0;
      utterance.pitch = 1.0;

      // Select local high-quality voice matching the language
      const voiceList = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      if (voiceList && voiceList.length > 0) {
        let matchingVoice = null;
        if (lang === 'hi') {
          matchingVoice =
            voiceList.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
            voiceList.find(v => v.lang.toLowerCase().startsWith('hi')) ||
            voiceList.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'));
        } else {
          matchingVoice =
            voiceList.find(v => v.lang === 'en-US' || v.lang === 'en_US') ||
            voiceList.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
            voiceList.find(v => v.lang.toLowerCase().startsWith('en'));
        }
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => {
        setCurrentlySpeakingId(msgId);
      };

      utterance.onend = () => {
        setCurrentlySpeakingId(null);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis playback error:', e);
        setCurrentlySpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speakText error:', err);
      setCurrentlySpeakingId(null);
    }
  };

  /* Function: toggleListening (Voice-to-Text) */
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMicNotice(isHi ? 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है।' : 'Voice input is not supported in this browser.');
        setTimeout(() => setMicNotice(''), 3500);
        return;
      }

      // Stop any TTS audio before capturing voice input
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setCurrentlySpeakingId(null);
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentGlobalLang === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
          setTimeout(() => {
            const el = textareaRef.current;
            if (el) {
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 140) + 'px';
            }
          }, 50);
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.name === 'NotAllowedError') {
          setMicNotice(isHi ? 'कृपया माइक्रोफ़ोन अनुमति दें।' : 'Please allow microphone access.');
          setTimeout(() => setMicNotice(''), 4000);
        } else if (event.error !== 'no-speech') {
          setMicNotice(isHi ? 'माइक्रोफ़ोन त्रुटि हुई।' : `Mic error: ${event.error}`);
          setTimeout(() => setMicNotice(''), 3000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Microphone start error:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || (err.message && err.message.toLowerCase().includes('not allowed'))) {
        setMicNotice(isHi ? 'कृपया माइक्रोफ़ोन अनुमति दें।' : 'Please allow microphone access.');
      } else {
        setMicNotice(isHi ? 'माइक्रोफ़ोन शुरू करने में विफल।' : 'Could not activate microphone.');
      }
      setTimeout(() => setMicNotice(''), 4000);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  /* ── Chat state ─────────────────────────────────────────────────── */
  const [messages, setMessages] = useState([
    {
      id: 'welcome-init',
      role: 'assistant',
      content: isHi
        ? 'नमस्ते! मैं Clinova हूँ। सामान्य स्वास्थ्य, चिकित्सा शब्दों और LabSetu के बारे में पूछें। बुकिंग और स्वीकृत रिपोर्ट समझने के लिए LabSetu Assistant खोलें।'
        : 'Hello! I\'m Clinova. Ask about general healthcare, medical terms and using LabSetu. Open LabSetu Assistant for bookings and approved report explanations.',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      file: null,
      isExplanation: false,
    },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant' && !prev[0].isExplanation) {
        return [
          {
            ...prev[0],
            content: currentGlobalLang === 'hi'
              ? 'नमस्ते! मैं Clinova हूँ। सामान्य स्वास्थ्य, चिकित्सा शब्दों और LabSetu के बारे में पूछें। बुकिंग और स्वीकृत रिपोर्ट समझने के लिए LabSetu Assistant खोलें।'
              : 'Hello! I\'m Clinova. Ask about general healthcare, medical terms and using LabSetu. Open LabSetu Assistant for bookings and approved report explanations.',
          },
        ];
      }
      return prev;
    });
  }, [currentGlobalLang]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  /* ── Send message ─────────────────────────────────────────────── */
  const sendMessage = useCallback(async (overrideText = null) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isLoading) return;

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      file: null,
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const history = messages.filter(item => !item.id?.startsWith('welcome') && !item.isError)
        .slice(-12).map(item => ({ role: item.role, content: item.content }));
      const response = await requestClinova(apiClient.baseUrl, {
        message: text, language: currentGlobalLang, history,
      });
      const aiText = response.reply;

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: aiText,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          file: null,
          isExplanation: true,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: err.message || (isHi ? 'अभी Clinova उपलब्ध नहीं है। पुनः प्रयास करें।' : 'Clinova is unavailable. Please try again.'),
          isError: true,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          file: null,
          isExplanation: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, currentGlobalLang, isHi]);

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: isHi
          ? 'नमस्ते! मैं Clinova हूँ। सामान्य स्वास्थ्य जानकारी और LabSetu के बारे में पूछें।'
          : 'Hello! I\'m Clinova. Ask about general healthcare and using LabSetu.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        file: null,
        isExplanation: false,
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
            {isHi ? 'Clinova - AI हेल्थ असिस्टेंट' : 'Clinova - AI Health Assistant'}
          </h1>
          <p className="citizen-page-subtitle">
            {isHi
              ? 'सामान्य स्वास्थ्य जानकारी, चिकित्सा शब्द और LabSetu का उपयोग समझें'
              : 'General healthcare information, medical terms and help using LabSetu'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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

      <p style={{ color: '#475569', fontSize: '0.875rem' }}>
        {isHi ? 'बुकिंग, भुगतान, ट्रैकिंग और स्वीकृत रिपोर्ट समझने के लिए ' : 'For bookings, payments, tracking and approved report explanations, open '}
        <Link to="/portal/assistant">LabSetu Assistant</Link>.
        {' '}{isHi ? 'इस बातचीत के संदेश Gemini को भेजे जाते हैं। निजी चिकित्सा रिकॉर्ड साझा न करें।' : 'Messages in this conversation are sent to Gemini. Avoid sharing private medical records.'}
      </p>

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
          <ChatBubble
            key={msg.id || idx}
            msg={msg}
            lang={currentGlobalLang}
            isSpeaking={currentlySpeakingId === (msg.id || msg.time)}
            onToggleTts={speakText}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick Prompt Chips (directly above input bar) ────────────── */}
      {messages.length <= 1 && (
        <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isHi ? 'त्वरित प्रश्न' : 'Quick Questions'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '20px',
                  border: '1.5px solid #bbf7d0',
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.79rem',
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

      {/* ── Microphone Notice Toast ───────────────────────────────── */}
      {micNotice && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#1e293b',
            color: '#f8fafc',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <ExclamationTriangleIcon style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0 }} />
          <span>{micNotice}</span>
          <button
            type="button"
            onClick={() => setMicNotice('')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, marginLeft: '0.25rem' }}
          >
            <XMarkIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* ── Input Bar ───────────────────────────────────────────────── */}
      <div
        className="focus-within:ring-2 focus-within:ring-emerald-400 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-shadow duration-300 border-transparent"
        style={{
          background: inputFocused ? '#f0fdf4' : '#ffffff',
          border: '2px solid transparent',
          borderRadius: '14px',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: inputFocused
            ? '0 0 15px rgba(16, 185, 129, 0.25), 0 0 0 2px #34d399'
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginTop: 0,
          transition: 'box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease, background-color 300ms ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Text area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={handleTextInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder={
            isHi
              ? 'सामान्य स्वास्थ्य प्रश्न लिखें…'
              : 'Ask a general healthcare question…'
          }
          disabled={isLoading}
          className="pl-3"
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '0.92rem',
            lineHeight: '1.5',
            paddingLeft: '0.75rem',
            paddingTop: '0.35rem',
            paddingBottom: '0.35rem',
            color: '#0f172a',
            background: 'transparent',
            fontFamily: 'inherit',
            overflowY: 'hidden',
            maxHeight: 140,
            margin: 0,
            boxSizing: 'border-box'
          }}
        />

        {/* Microphone Button (Voice-to-Text) - immediately to the left of Send icon */}
        {speechRecognitionSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={
              isListening
                ? (isHi ? 'सुनना बंद करें' : 'Stop listening')
                : (isHi ? 'बोलकर टाइप करें (वॉयस इनपुट)' : 'Voice input (Speech-to-text)')
            }
            className={`cursor-pointer transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
              isListening ? 'animate-pulse text-red-500' : ''
            }`}
            style={{
              background: isListening ? '#fef2f2' : 'none',
              border: isListening ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.45rem',
              cursor: 'pointer',
              color: isListening ? '#ef4444' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isListening) {
                e.currentTarget.style.borderColor = '#15803d';
                e.currentTarget.style.color = '#15803d';
              }
            }}
            onMouseLeave={(e) => {
              if (!isListening) {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#64748b';
              }
            }}
            aria-label={
              isListening
                ? (isHi ? 'सुनना बंद करें' : 'Stop listening')
                : (isHi ? 'बोलकर टाइप करें' : 'Voice input')
            }
          >
            <MicrophoneIcon
              className={isListening ? 'animate-pulse text-red-500' : ''}
              style={{ width: 20, height: 20 }}
            />
          </button>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={isLoading || !inputText.trim()}
          title={isHi ? 'भेजें' : 'Send'}
          style={{
            background:
              isLoading || !inputText.trim()
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #15803d, #059669)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.55rem 0.8rem',
            cursor:
              isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
            color: isLoading || !inputText.trim() ? '#94a3b8' : 'white',
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
          { icon: DocumentTextIcon, label: isHi ? 'चिकित्सा शब्द' : 'Medical Terms' },
          { icon: InformationCircleIcon, label: isHi ? 'प्लेटफ़ॉर्म मार्गदर्शन' : 'Platform Guidance' },
          { icon: SparklesIcon, label: isHi ? 'Gemini AI द्वारा' : 'Powered by Gemini AI' },
          { icon: ShieldCheckIcon, label: isHi ? 'सामान्य जानकारी' : 'General Information' },
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
