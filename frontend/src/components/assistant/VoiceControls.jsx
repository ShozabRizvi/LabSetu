import React, { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import './VoiceAssistant.css';

export function VoiceInput({ lang, value, onTranscript, isProcessing = false }) {
  const [listening, setListening] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const transcriptRef = useRef('');
  const hadErrorRef = useRef(false);

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
    recognitionRef.current?.abort();
  }, []);

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setCompleted(false);
    setError('');
    transcriptRef.current = '';
    hadErrorRef.current = false;
    if (!Recognition) {
      setError('Voice input is not supported in this browser. You can type your message instead.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
      transcriptRef.current = transcript;
      onTranscript(transcript ? `${value ? `${value.trim()} ` : ''}${transcript}` : value);
    };
    recognition.onerror = event => {
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow microphone access or type your message.',
        'service-not-allowed': 'The browser speech service is unavailable. You can type your message instead.',
        'no-speech': 'No speech was detected. Please try again or type your message.',
        'audio-capture': 'No microphone was found. Connect a microphone or type your message.',
        network: 'Speech recognition needs a network connection. You can type your message instead.',
        'language-not-supported': 'Speech recognition for this language is unavailable. Choose the other language or type your message.'
      };
      if (event.error !== 'aborted') {
        hadErrorRef.current = true;
        setError(messages[event.error] || 'Voice input failed. Please try again or type your message.');
      }
      setListening(false);
      clearTimeout(timeoutRef.current);
    };
    recognition.onend = () => {
      setListening(false);
      clearTimeout(timeoutRef.current);
      if (transcriptRef.current.trim()) setCompleted(true);
      else if (!hadErrorRef.current) setError('No speech was detected. Please try again or type your message.');
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      timeoutRef.current = setTimeout(() => recognition.stop(), 30000);
    } catch (startError) {
      setError(startError.message || 'The microphone could not be started. Please type your message.');
    }
  }

  function stopListening() {
    clearTimeout(timeoutRef.current);
    recognitionRef.current?.stop();
  }

  return <div className="labsetu-voice-controls">
    <button type="button" className="labsetu-voice-button" onClick={listening ? stopListening : startListening} disabled={isProcessing} aria-label={listening ? 'Stop recording' : 'Start voice input'}>
      {listening ? <StopIcon width={20} height={20} aria-hidden="true" style={{ flex: '0 0 20px' }} /> : <MicrophoneIcon width={20} height={20} aria-hidden="true" style={{ flex: '0 0 20px' }} />}
      {listening ? 'Stop recording' : 'Talk'}
    </button>
    <span className="labsetu-voice-state" role="status" aria-live="polite">
      {listening ? (lang === 'hi' ? 'सुन रहे हैं…' : 'Listening…')
        : isProcessing ? (lang === 'hi' ? 'जवाब तैयार हो रहा है…' : 'Processing…')
          : completed ? (lang === 'hi' ? 'ट्रांसक्रिप्ट तैयार — भेजने से पहले जाँचें।' : 'Transcript ready — review before sending.')
            : error}
    </span>
    {error && <span className="labsetu-voice-error" role="alert">{error}</span>}
  </div>;
}

export function SpeechPlayback({ text, lang }) {
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak() {
    if (!enabled || !text?.trim()) return;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setSupported(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase().startsWith(lang === 'hi' ? 'hi' : 'en')) || null;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return <div className="labsetu-speech-controls">
    <label><input type="checkbox" checked={enabled} onChange={event => {
      setEnabled(event.target.checked);
      if (!event.target.checked) stop();
    }} /> Enable spoken responses</label>
    <button type="button" className="labsetu-voice-button secondary" onClick={speaking ? stop : speak} disabled={!enabled || !text?.trim() || !supported} aria-pressed={speaking} aria-label={speaking ? 'Stop spoken response' : 'Read response aloud'}>
      {speaking ? <StopIcon width={20} height={20} aria-hidden="true" style={{ flex: '0 0 20px' }} /> : <SpeakerWaveIcon width={20} height={20} aria-hidden="true" style={{ flex: '0 0 20px' }} />}{speaking ? 'Stop speaking' : 'Read aloud / replay'}
    </button>
    {!supported && <span role="status">Spoken responses are not supported in this browser.</span>}
    <span className="sr-only" aria-live="polite">{speaking ? 'Speaking response' : ''}</span>
  </div>;
}
