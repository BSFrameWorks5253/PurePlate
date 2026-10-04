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
  showToast,
  onNavigate
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

  const desktopNavItems = [
    {
      id: 'screen-home',
      label: 'Home',
      shortcut: '⌘1',
      badge: null,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      )
    },
    {
      id: 'screen-selection',
      label: 'Test Lab',
      shortcut: '⌘2',
      badge: '7',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.69 17.65A2 2 0 0 0 6.42 21h11.16a2 2 0 0 0 1.73-3.35L14 9.31V2"/>
          <path d="M8.5 2h7"/>
          <path d="M7 16h10"/>
        </svg>
      )
    },
    {
      id: 'screen-map',
      label: 'Heat Map',
      shortcut: '⌘3',
      badge: 'Live',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
          <circle cx="12" cy="11" r="2.2" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'screen-learning',
      label: 'Academy',
      shortcut: '⌘4',
      badge: 'XP',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      )
    },
  ];

  return (
    <>
      {/* ============================================================
           APPLE 2027 LIQUID GLASS DESKTOP COMMAND BAR (Laptop / Big S      {/* ============================================================
           APPLE LIQUID GLASS DESKTOP COMMAND BAR (Desktop / Laptops)
           ============================================================ */}
      <header className="desktop-top-bar" id="desktop-top-bar">
        {/* Left: Brand Identity with Glass Shield & Live Grid Indicator */}
        <div className="dt-brand" onClick={() => onNavigate && onNavigate('screen-home')} style={{ cursor: 'pointer' }}>
          <div className="dt-logo-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="dt-titles">
            <div className="dt-title-row">
              <span className="dt-name">PurePlate</span>
              <div className="dt-node-status">
                <span className="pulse-dot"></span>
                <span>Surat Grid Live</span>
              </div>
            </div>
            <span className="dt-sub">Citizen Food Safety Network</span>
          </div>
        </div>

        {/* Center: Apple Liquid Glass Capsule Navigation */}
        <nav className="desktop-nav-island" aria-label="Desktop Navigation">
          <div className="dt-nav-capsule">
            {desktopNavItems.map((item) => {
              const isActive = currentScreen === item.id || (item.id === 'screen-selection' && currentScreen === 'screen-camera');
              return (
                <button
                  key={item.id}
                  className={`dt-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (onNavigate) {
                      soundEngine.playClick();
                      onNavigate(item.id);
                    }
                  }}
                  title={`Navigate to ${item.label} (${item.shortcut})`}
                >
                  <span className="dt-nav-icon">{item.icon}</span>
                  <span className="dt-nav-text">{item.label}</span>
                  {item.badge && (
                    <span className={`dt-nav-badge ${item.badge === 'Live' ? 'live' : ''}`}>
                      {item.badge === 'Live' && <span className="dt-nav-badge-dot"></span>}
                      {item.badge}
                    </span>
                  )}
                  {isActive && <span className="dt-nav-pill-glow" aria-hidden="true"></span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Primary Action, Location, Audio, Theme & Profile */}
        <div className="dt-right-actions">
          {/* Quick Primary Action: Test Food */}
          <button
            className="dt-btn dt-btn-launch"
            id="dt-btn-quick-test"
            title="Launch Food Adulteration Test"
            onClick={() => {
              soundEngine.playClick();
              if (onNavigate) onNavigate('screen-selection');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>+ Test Food</span>
          </button>

          {/* Location Trigger Chip */}
          <button
            className="dt-btn dt-btn-loc"
            id="dt-btn-loc-detect"
            title="Sync Live GPS Coordinates"
            onClick={onDetectLocation}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="dt-loc-text">{region || 'Surat, GJ'}</span>
          </button>

          {/* Sound Toggle SVG */}
          <button className="dt-btn dt-icon-only" id="btn-toggle-sound" title={soundMuted ? "Enable Sound" : "Mute Sound"} onClick={toggleSound}>
            {soundMuted ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>

          {/* Theme Toggle SVG */}
          <button className="dt-btn dt-icon-only" id="btn-toggle-theme" title="Toggle Light/Dark Theme" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>

          {/* User Profile / Auth Button */}
          <button className="dt-btn dt-btn-auth" id="dt-user-btn" title="Cloud Profile & Sync" onClick={onOpenAuth}>
            <span className="auth-avatar-svg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span className="auth-label" id="dt-user-email">{currentUser ? currentUser.name : 'Sign In'}</span>
            <span className="sync-pulse-indicator" title="Cloud Sync Active"></span>
          </button>
        </div>
      </header>

      {/* ============================================================
           APP HEADER (Mobile & Small Screen In-App View)
           ============================================================ */}
      <header className="app-header">
        <div
          className="route-progress-bar"
          id="route-progress-bar"
          style={{
            width: currentScreen === 'screen-home' ? '25%' :
                   currentScreen === 'screen-selection' ? '50%' :
                   currentScreen === 'screen-camera' ? '75%' :
                   currentScreen === 'screen-map' ? '90%' : '100%',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        ></div>
        <div className="header-content">
          <div className="brand-row">
            <div className="brand-mark" onClick={() => onNavigate && onNavigate('screen-home')} style={{ cursor: 'pointer' }}>
              <div className="logo-shield-svg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="brand-names">
                <h1 className="brand-title">PurePlate</h1>
                <span className="brand-tagline">Citizen Food Safety Network</span>
              </div>
            </div>
            <div className="header-badges">
              <button className="mb-auth-btn" id="mb-theme-btn" title="Toggle Theme" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                  </svg>
                )}
              </button>
              <button className="mb-auth-btn" id="mb-user-btn" title="Sign In / Sync" onClick={onOpenAuth}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="sync-pulse-indicator" title="Cloud Sync Active"></span>
              </button>
              <button className="mb-auth-btn" id="btn-detect-loc" title="Detect GPS Location" onClick={onDetectLocation}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Location Region Compact Bar */}
          <div className="location-bar-compact" id="location-bar" onClick={onDetectLocation} style={{ cursor: 'pointer' }}>
            <span className="loc-icon-svg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </span>
            <span className="loc-value-sm" id="current-region-display">{region}</span>
            <span className="live-indicator"><span className="pulse-dot-sm"></span>Live</span>
          </div>
        </div>
      </header>
    </>
  );
}
