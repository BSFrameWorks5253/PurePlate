import React, { useState, useEffect } from 'react';
import soundEngine from '../services/sound.js';
import authEngine from '../services/auth.js';
import storage from '../services/storage.js';

export default function Header({
  currentScreen,
  viewMode,
  setViewMode,
  theme,
  setTheme,
  onOpenAuth,
  onOpenQR,
  onDetectLocation,
  region,
  showToast
}) {
  const [soundMuted, setSoundMuted] = useState(soundEngine.isMuted);
  const [currentUser, setCurrentUser] = useState(authEngine.getCurrentUser());

  useEffect(() => {
    return authEngine.subscribe((user) => {
      setCurrentUser(user);
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    soundEngine.playClick();
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setSoundMuted(muted);
    if (!muted) soundEngine.playClick();
    showToast(muted ? "Audio muted" : "Audio enabled", "info");
  };

  return (
    <>
      {/* ============================================================
           DESKTOP TOP UTILITY BAR (Workbench & Evaluation Header)
           ============================================================ */}
      <header className="desktop-top-bar" id="desktop-top-bar">
        {/* Left: Brand Identity */}
        <div className="dt-brand">
          <div className="dt-logo-wrap">
            <span className="dt-shield-icon">🛡️</span>
          </div>
          <div className="dt-titles">
            <div className="dt-title-row">
              <span className="dt-name">PurePlate</span>
              <span className="dt-badge">Citizen Network</span>
            </div>
            <span className="dt-sub">Food Adulteration Testing & Regional Security Grid • Surat, India</span>
          </div>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="dt-center-controls">
          <div className="view-mode-toggle" id="view-mode-toggle">
            <button
              className={`v-mode-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              id="btn-mode-mobile"
              title="Switch to Mobile Phone View"
              onClick={() => {
                setViewMode('mobile');
                soundEngine.playClick();
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="5" y="2" width="14" height="20" rx="3"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span>Phone View</span>
            </button>
            <button
              className={`v-mode-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              id="btn-mode-desktop"
              title="Switch to Expanded Desktop Workbench"
              onClick={() => {
                setViewMode('desktop');
                soundEngine.playClick();
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span>Expanded Desktop</span>
            </button>
          </div>
        </div>

        {/* Right: Controls & Cloud Auth */}
        <div className="dt-right-actions">
          <button className="dt-btn" id="btn-toggle-theme" title="Toggle Theme (Light / Dark)" onClick={toggleTheme}>
            <span id="theme-toggle-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span id="theme-toggle-label">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <button className="dt-btn" id="btn-toggle-sound" title="Toggle Sound Feedback" onClick={toggleSound}>
            <span id="sound-icon">{soundMuted ? '🔇' : '🔊'}</span>
            <span id="sound-label">{soundMuted ? 'Audio Off' : 'Audio On'}</span>
          </button>

          <button className="dt-btn dt-btn-auth" id="dt-user-btn" title="Sign In with Email to Sync Data Across Devices" onClick={onOpenAuth}>
            <span className="auth-avatar" id="dt-user-avatar">{currentUser ? '🎓' : '👤'}</span>
            <span className="auth-label" id="dt-user-email">{currentUser ? currentUser.name : 'Sign In / Sync'}</span>
            <span className="sync-pulse-indicator" title="Cloud Sync Active"></span>
          </button>

          <button className="dt-btn dt-btn-accent" id="btn-show-qr" title="Scan to open on your phone" onClick={onOpenQR}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Mobile QR</span>
          </button>

          <div className="dt-network-pill">
            <span className="pulse-dot"></span>
            <span>Surat Node: Online</span>
          </div>
        </div>
      </header>

      {/* ============================================================
           APP HEADER (Mobile & In-App View)
           ============================================================ */}
      <header className="app-header">
        <div className="route-progress-bar" id="route-progress-bar" style={{ width: '100%' }}></div>
        <div className="header-content">
          <div className="brand-row">
            <div className="brand-mark">
              <span className="logo-shield">🛡️</span>
              <div className="brand-names">
                <h1 className="brand-title">PurePlate</h1>
                <span className="brand-tagline">Citizen Food Safety Network</span>
              </div>
            </div>
            <div className="header-badges">
              <button className="mb-auth-btn" id="mb-theme-btn" title="Toggle Theme" onClick={toggleTheme}>
                <span id="mb-theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
              </button>
              <button className="mb-auth-btn" id="mb-user-btn" title="Sign In / Sync" onClick={onOpenAuth}>
                <span id="mb-user-icon">{currentUser ? '🎓' : '👤'}</span>
                <span className="sync-pulse-indicator" title="Cloud Sync Active"></span>
              </button>
              <button className="mb-auth-btn" id="btn-detect-loc" title="Detect GPS Location" onClick={onDetectLocation}>
                <span>📍</span>
              </button>
            </div>
          </div>

          {/* Location Region Compact Bar */}
          <div className="location-bar-compact" id="location-bar" onClick={onDetectLocation} style={{ cursor: 'pointer' }}>
            <span className="loc-icon-sm">📍</span>
            <span className="loc-value-sm" id="current-region-display">{region}</span>
            <span className="live-indicator"><span className="pulse-dot-sm"></span>Live</span>
          </div>
        </div>
      </header>
    </>
  );
}
