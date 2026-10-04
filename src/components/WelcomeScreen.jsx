import React, { useState, useEffect } from 'react';
import PurePlateLogo from './PurePlateLogo.jsx';
import soundEngine from '../services/sound.js';

/**
 * Volumetric Fluid Loading Sequence
 * High-fidelity glass plaque launcher with liquid-core pooling animation,
 * sunken glass well progress track, and glossy shimmer sweeps.
 */
export default function WelcomeScreen({ onFinish }) {
  const [progress, setProgress] = useState(15);
  const [stage, setStage] = useState('Initializing Sensors');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(55);
      setStage('Calibrating Reagent Spectrometry');
    }, 500);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStage('Syncing Surat Municipal Grid');
    }, 1100);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStage('Citizen Safety Network Online');
      try {
        soundEngine.playSuccess();
      } catch (e) {}
    }, 1700);

    const t4 = setTimeout(() => {
      handleComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleComplete = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 500);
  };

  return (
    <div
      className={`volumetric-welcome-overlay ${isExiting ? 'volumetric-exiting' : 'volumetric-active'}`}
      onClick={handleComplete}
      role="dialog"
      aria-label="Welcome to PurePlate"
    >
      {/* Background Liquid Light Orbs */}
      <div className="volumetric-ambient-backdrop" aria-hidden="true">
        <div className="ambient-fluid-orb orb-emerald"></div>
        <div className="ambient-fluid-orb orb-teal"></div>
        <div className="ambient-fluid-orb orb-cyan"></div>
      </div>

      {/* Centered Glass Plaque Launcher Block */}
      <div className="volumetric-glass-plaque">
        {/* Specular Highlight Glaze */}
        <div className="plaque-specular-edge"></div>

        {/* Liquid-Core Pooling Logo Stage */}
        <div className="liquid-core-asset-stage">
          <div className="liquid-pool-glow"></div>
          <div className="liquid-fill-anim-wrapper">
            <PurePlateLogo size={84} variant="icon" animated={true} showGlow={true} />
            <div
              className="fluid-pool-waterline"
              style={{ height: `${progress}%` }}
            >
              <div className="fluid-wave-surface"></div>
            </div>
          </div>
        </div>

        {/* Brand Identification */}
        <div className="plaque-brand-info">
          <h1 className="plaque-title">PurePlate</h1>
          <p className="plaque-subtitle">Citizen Food Safety Network</p>
          <div className="plaque-node-tag">
            <span className="pulse-dot-live"></span>
            <span>Surat Verification Node</span>
          </div>
        </div>

        {/* Sunken Glass Well Progress Track */}
        <div className="sunken-progress-well">
          <div
            className="sunken-progress-fill"
            style={{ width: `${progress}%` }}
          >
            <div className="sunken-shimmer-sweep"></div>
          </div>
        </div>

        {/* Progress Caption */}
        <div className="plaque-status-row">
          <span className="plaque-status-text">{stage}</span>
          <span className="plaque-status-pct">{progress}%</span>
        </div>

        {/* Skip button for instant entry */}
        <button
          className="plaque-enter-action"
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
        >
          <span>Enter Dashboard ➔</span>
        </button>
      </div>
    </div>
  );
}
