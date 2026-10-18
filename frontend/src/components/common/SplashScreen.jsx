import React, { useState, useEffect } from 'react';
import './SplashScreen.css';
import logo from '../../assets/logo.png';

/**
 * LabSetu Initial Opening Splash Screen
 * 
 * - Displays center LabSetu logo & brand text for ~1 second
 * - Displays slimmest green loading bar smoothly animating left to right
 * - Hardware-accelerated smooth fade-out revealing the main interface
 */
export default function SplashScreen({ minDuration = 1000, onFinished }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Stage 1: Wait for 1 second of synchronization
    const timer = setTimeout(() => {
      setFadingOut(true);
    }, minDuration);

    // Stage 2: Allow fade-out animation to complete, then unmount
    const finishTimer = setTimeout(() => {
      setHidden(true);
      if (onFinished) onFinished();
    }, minDuration + 350);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinished]);

  if (hidden) return null;

  return (
    <aside 
      className={`labsetu-splash-container ${fadingOut ? 'labsetu-splash-fadeout' : ''}`}
      aria-label="Loading LabSetu"
      aria-busy={!fadingOut}
    >
      <div className="labsetu-splash-content">
        <div className="labsetu-splash-logo-wrap">
          <img 
            src={logo} 
            alt="LabSetu Logo" 
            className="labsetu-splash-logo" 
          />
        </div>
        <div className="labsetu-splash-brand">
          <span className="labsetu-splash-brand-text">
            Lab<span className="labsetu-splash-brand-accent">Setu</span>
          </span>
          <span className="labsetu-splash-tagline">
            Laboratory Intelligence & Diagnostics Network
          </span>
        </div>

        {/* Slim green loading bar directly beneath the brand text */}
        <div className="labsetu-splash-bar-wrapper" aria-hidden="true">
          <div className="labsetu-splash-bar-fill" />
        </div>
        <div className="labsetu-splash-sync-label">
          Synchronizing clinical resources...
        </div>
      </div>

      {/* Edge loading bar pinned at the bottom edge of the splash container */}
      <div className="labsetu-splash-edge-bar" aria-hidden="true">
        <div className="labsetu-splash-edge-bar-fill" />
      </div>
    </aside>
  );
}
