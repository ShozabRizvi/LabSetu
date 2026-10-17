import React, { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ChartBarIcon,
  ReceiptRefundIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import './LabSetuVideoPlayer.css';

const TOTAL_DURATION = 80; // 1 minutes 20 seconds

const CHAPTERS = [
  { id: 1, title: 'Dashboard Overview', start: 0, end: 20, icon: ChartBarIcon },
  { id: 2, title: 'New Bill & Patient Intake', start: 20, end: 40, icon: ReceiptRefundIcon },
  { id: 3, title: 'Reports & Doctor Signoff', start: 40, end: 60, icon: DocumentCheckIcon },
  { id: 4, title: 'Citizen Portal & SMS', start: 60, end: 80, icon: UserGroupIcon }
];

export default function LabSetuVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Playback timer loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(TOTAL_DURATION, prev + 1);
        });
      }, 1000 / playbackRate);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(Math.floor(newPercent * TOTAL_DURATION));
  };

  const currentChapter = CHAPTERS.find(
    (c) => currentTime >= c.start && currentTime < c.end
  ) || CHAPTERS[0];

  const progressPercent = (currentTime / TOTAL_DURATION) * 100;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`labsetu-video-wrapper ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      {/* Video Screen Container */}
      <div className="labsetu-video-screen" onClick={() => setIsPlaying(!isPlaying)}>
        {/* Top Video Header */}
        <div className="video-top-bar" onClick={(e) => e.stopPropagation()}>
          <div className="video-badge-pill">
            <span className="live-dot"></span>
            <span>HD Walkthrough · 1080p</span>
          </div>
          <div className="video-title-tag">
            <SparklesIcon style={{ width: '15px', height: '15px', color: '#4ade80' }} />
            <span>LabSetu Platform Guide & Demo</span>
          </div>
          <div className="video-duration-pill">{formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}</div>
        </div>

        {/* Center Scene Content Generator */}
        <div className="video-scene-content">
          {/* Scene 1: Dashboard Overview */}
          {currentChapter.id === 1 && (
            <div className="scene-view scene-dashboard">
              <div className="sim-header">
                <span className="sim-brand">LabSetu Diagnostics · Authority Console</span>
                <span className="sim-status">System Live 🟢</span>
              </div>
              <div className="sim-stats-grid">
                <div className="sim-stat-box green">
                  <span className="sim-stat-label">Today's Revenue</span>
                  <span className="sim-stat-val">₹42,850</span>
                  <span className="sim-stat-growth">↑ 18% vs yesterday</span>
                </div>
                <div className="sim-stat-box blue">
                  <span className="sim-stat-label">Samples In Lab</span>
                  <span className="sim-stat-val">38 Cases</span>
                  <span className="sim-stat-sub">3 pending approval</span>
                </div>
                <div className="sim-stat-box yellow">
                  <span className="sim-stat-label">Pending Dues</span>
                  <span className="sim-stat-val">₹3,400</span>
                  <span className="sim-stat-sub">4 patient bills</span>
                </div>
              </div>
              <div className="sim-cursor cursor-scene-1"></div>
            </div>
          )}

          {/* Scene 2: New Bill Generation */}
          {currentChapter.id === 2 && (
            <div className="scene-view scene-billing">
              <div className="sim-header">
                <span className="sim-brand">Quick Patient Invoicing & Token Generation</span>
                <span className="sim-step">Step 2 of 4</span>
              </div>
              <div className="sim-bill-form">
                <div className="sim-form-row">
                  <div className="sim-field">
                    <label>Patient Name</label>
                    <div className="sim-input-box typing-text">Rohan Sharma (Age: 32)</div>
                  </div>
                  <div className="sim-field">
                    <label>Assigned UHID</label>
                    <div className="sim-input-box">UHID-2026-9410</div>
                  </div>
                </div>
                <div className="sim-test-selection">
                  <div className="sim-test-chip active">✓ Complete Blood Count (CBC) - ₹450</div>
                  <div className="sim-test-chip active">✓ Lipid Profile - ₹750</div>
                </div>
                <div className="sim-bill-total">
                  <span>Net Payable: <strong>₹1,200</strong></span>
                  <span className="sim-paid-tag">Paid via UPI / Cash</span>
                </div>
              </div>
              <div className="sim-cursor cursor-scene-2"></div>
            </div>
          )}

          {/* Scene 3: Pathology Reports */}
          {currentChapter.id === 3 && (
            <div className="scene-view scene-reports">
              <div className="sim-header">
                <span className="sim-brand">Pathology Test Result Verification & Signature</span>
                <span className="sim-step">Step 3 of 4</span>
              </div>
              <div className="sim-report-table">
                <div className="sim-table-row header">
                  <span>Investigation</span>
                  <span>Observed Value</span>
                  <span>Biological Ref.</span>
                  <span>Status</span>
                </div>
                <div className="sim-table-row">
                  <span>Hemoglobin (Hb)</span>
                  <span className="val-normal">14.5 g/dL</span>
                  <span>13.0 - 17.0</span>
                  <span className="badge-ok">Normal</span>
                </div>
                <div className="sim-table-row">
                  <span>Total WBC Count</span>
                  <span className="val-normal">7,800 /cumm</span>
                  <span>4,000 - 11,000</span>
                  <span className="badge-ok">Normal</span>
                </div>
                <div className="sim-table-row">
                  <span>Serum Cholesterol</span>
                  <span className="val-flag">215 mg/dL</span>
                  <span>&lt; 200 mg/dL</span>
                  <span className="badge-border">Borderline High</span>
                </div>
              </div>
              <div className="sim-sign-box">
                <span>Verified & Digitally Signed by Dr. Shozab Rizvi (MD Pathologist)</span>
              </div>
              <div className="sim-cursor cursor-scene-3"></div>
            </div>
          )}

          {/* Scene 4: Citizen Portal & SMS */}
          {currentChapter.id === 4 && (
            <div className="scene-view scene-citizen">
              <div className="sim-header">
                <span className="sim-brand">Automated Patient SMS & Citizen Portal Download</span>
                <span className="sim-step">Step 4 of 4</span>
              </div>
              <div className="sim-sms-preview">
                <div className="sms-bubble">
                  <span className="sms-sender">LABSETU SMS GATEWAY</span>
                  <p>
                    Dear Rohan Sharma, your diagnostic test reports are ready! Click to view & download your verified PDF: <u>https://labsetu.com/p/9410</u>
                  </p>
                </div>
                <div className="citizen-card-mock">
                  <div className="citizen-top">
                    <strong>LabSetu Citizen Portal</strong>
                    <span className="citizen-uhid">UHID-2026-9410</span>
                  </div>
                  <button type="button" className="sim-dl-btn">
                    📥 Download Official NABL Report PDF
                  </button>
                </div>
              </div>
              <div className="sim-cursor cursor-scene-4"></div>
            </div>
          )}
        </div>

        {/* Subtitle / Narration Banner */}
        <div className="video-subtitle-bar">
          <p>
            {currentChapter.id === 1 && 'Chapter 1: The Authority Dashboard gives you a 360° overview of daily tests, revenue, and pending balances in real time.'}
            {currentChapter.id === 2 && 'Chapter 2: Register patients in seconds, choose test panels from your ratelist, and generate printable GST bills.'}
            {currentChapter.id === 3 && 'Chapter 3: Enter biochemical parameters with automatic abnormal range detection and attach 1-click digital doctor signatures.'}
            {currentChapter.id === 4 && 'Chapter 4: Patients receive automated WhatsApp & SMS alerts with secure download links directly on their mobile phones.'}
          </p>
        </div>

        {/* Big Center Play Button Overlay (when paused) */}
        {!isPlaying && (
          <div className="video-big-play-overlay">
            <div className="big-play-btn">
              <PlayIcon style={{ width: '38px', height: '38px', marginLeft: '4px' }} />
            </div>
            <span className="big-play-label">Click to Play Interactive Walkthrough</span>
          </div>
        )}
      </div>

      {/* Video Control Bar */}
      <div className="labsetu-video-controls">
        {/* Progress Bar with Tooltip */}
        <div className="video-scrubber-track" onClick={handleSeek}>
          <div className="video-scrubber-fill" style={{ width: `${progressPercent}%` }}></div>
          <div className="video-scrubber-thumb" style={{ left: `${progressPercent}%` }}></div>
        </div>

        <div className="video-controls-row">
          <div className="controls-left">
            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon style={{ width: '22px', height: '22px' }} />
              ) : (
                <PlayIcon style={{ width: '22px', height: '22px' }} />
              )}
            </button>

            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setCurrentTime(0)}
              title="Restart Video"
            >
              <ArrowPathIcon style={{ width: '19px', height: '19px' }} />
            </button>

            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <SpeakerXMarkIcon style={{ width: '20px', height: '20px', color: '#ef4444' }} />
              ) : (
                <SpeakerWaveIcon style={{ width: '20px', height: '20px' }} />
              )}
            </button>

            <span className="ctrl-timestamp">
              {formatTime(currentTime)} <span className="time-sep">/</span> {formatTime(TOTAL_DURATION)}
            </span>
          </div>

          <div className="controls-right">
            {/* Speed Selector */}
            <div className="speed-pills">
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  className={`speed-pill ${playbackRate === spd ? 'active' : ''}`}
                  onClick={() => setPlaybackRate(spd)}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              type="button"
              className="ctrl-btn"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              <ArrowsPointingOutIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Selection Strip */}
      <div className="video-chapters-strip">
        {CHAPTERS.map((chap) => {
          const Icon = chap.icon;
          const isActive = currentChapter.id === chap.id;
          return (
            <button
              key={chap.id}
              type="button"
              className={`chapter-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setCurrentTime(chap.start);
                setIsPlaying(true);
              }}
            >
              <div className="chapter-icon-box">
                <Icon style={{ width: '18px', height: '18px' }} />
              </div>
              <div className="chapter-text">
                <span className="chapter-index">Part 0{chap.id} · {formatTime(chap.start)}</span>
                <span className="chapter-name">{chap.title}</span>
              </div>
              {isActive && <span className="chapter-playing-pill">Playing</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
