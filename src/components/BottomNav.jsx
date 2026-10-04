import React from 'react';
import soundEngine from '../services/sound.js';

export default function BottomNav({ activeScreen, setActiveScreen }) {
  const tabs = [
    {
      id: 'screen-home',
      label: 'Home',
      testId: 'nav-btn-home',
      badge: null,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      )
    },
    {
      id: 'screen-selection',
      label: 'Test Lab',
      testId: 'nav-btn-test',
      badge: '7',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.69 17.65A2 2 0 0 0 6.42 21h11.16a2 2 0 0 0 1.73-3.35L14 9.31V2"/>
          <path d="M8.5 2h7"/>
          <path d="M7 16h10"/>
        </svg>
      )
    },
    {
      id: 'screen-map',
      label: 'Heat Map',
      testId: 'nav-btn-map',
      badge: 'Live',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
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
      testId: 'nav-btn-learn',
      badge: 'XP',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      )
    },
  ];

  const handleNavClick = (id) => {
    soundEngine.playClick();
    setActiveScreen(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <nav className="bottom-nav-bar" id="app-bottom-nav" aria-label="Main Navigation">
      <div className="bottom-nav-dock">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id || (tab.id === 'screen-selection' && (activeScreen === 'screen-camera' || activeScreen === 'screen-procedure'));
          return (
            <button
              key={tab.id}
              id={tab.testId}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrap">
                <span className="nav-svg-icon">{tab.icon}</span>
                {tab.badge && (
                  <span className={`nav-badge ${tab.badge === 'Live' ? 'live' : ''}`}>
                    {tab.badge === 'Live' && <span className="nav-badge-pulse"></span>}
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="nav-label">{tab.label}</span>
              {isActive && <span className="nav-active-pill" aria-hidden="true"></span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
