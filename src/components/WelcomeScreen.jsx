import React, { useState, useEffect } from 'react';
import PurePlateLogo from './PurePlateLogo.jsx';
import soundEngine from '../services/sound.js';

export default function WelcomeScreen({ onFinish }) {
  const [phase, setPhase] = useState(0); // 0: init, 1: protocols, 2: ready, 3: exiting
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Phase 1: Spectrometry Calibration
    const timer1 = setTimeout(() => {
      setPhase(1);
    }, 700);

    // Phase 2: Grid Online & Protocols Loaded
    const timer2 = setTimeout(() => {
      setPhase(2);
      try {
        soundEngine.playSuccess();
      } catch (e) {}
    }, 1500);

    // Phase 3: Initiate smooth exit transition
    const timer3 = setTimeout(() => {
      handleComplete();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleComplete = () => {
    if (isExiting) return;
    setIsExiting(true);
    setPhase(3);
    // Allow the 550ms fade & zoom-out animation to complete before unmounting
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 550);
  };

  const getStatusText = () => {
    switch (phase) {
      case 0:
        return 'Calibrating Spectrometry Sensors...';
      case 1:
        return 'Connecting to Surat Municipal Safety Grid...';
      case 2:
      case 3:
        return 'Surat Citizen Food Safety Network Ready';
      default:
        return 'Loading PurePlate...';
    }
  };

  return (
    <div
      className={`welcome-splash-overlay ${isExiting ? 'splash-exiting' : 'splash-active'}`}
      onClick={handleComplete}
      role="dialog"
      aria-label="Welcome to PurePlate"
    >
      {/* Background Liquid Light Orbs */}
      <div className="splash-ambient-mesh" aria-hidden="true">
        <div className="splash-orb orb-1"></div>
        <div className="splash-orb orb-2"></div>
        <div className="splash-orb orb-3"></div>
      </div>

      {/* Center Hero Stage */}
      <div className="splash-center-stage">
        {/* Glowing Logo Pedestal */}
        <div className="splash-logo-wrapper">
          <div className="splash-logo-pulse-ring"></div>
          <div className="splash-logo-glow"></div>
          <PurePlateLogo size={92} animated={true} showGlow={true} />
        </div>

        {/* Brand Wordmark & Identification */}
        <div className="splash-text-wrap">
          <h1 className="splash-brand-title">PurePlate</h1>
          <p className="splash-brand-subtitle">Citizen Food Safety &amp; Purity Network</p>
          <div className="splash-meta-tag">
            <span className="splash-pulse-dot"></span>
            <span>Surat Live Verification Node</span>
          </div>
        </div>

        {/* Dynamic Calibration Progress Bar */}
        <div className="splash-progress-container">
          <div className="splash-progress-bar">
            <div
              className="splash-progress-fill"
              style={{
                width: phase === 0 ? '35%' : phase === 1 ? '75%' : '100%',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            ></div>
          </div>
          <span className="splash-status-label">{getStatusText()}</span>
        </div>

        {/* Action Button & Quick Enter Hint */}
        <button
          className="splash-enter-btn"
          onClick={(e) => {
            e.stopPropagation();
            soundEngine.playClick();
            handleComplete();
          }}
        >
          <span>Enter PurePlate</span>
          <span className="splash-arrow">➔</span>
        </button>
      </div>

      {/* Bottom Legal / Version Watermark */}
      <div className="splash-footer-note">
        <span>Empowering Citizens with Rigorous Science • v2.4</span>
      </div>
    </div>
  );
}
