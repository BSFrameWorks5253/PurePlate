import React from 'react';
import soundEngine from '../services/sound.js';

export default function BottomNav({ activeScreen, setActiveScreen }) {
  const tabs = [
    { id: 'screen-home', label: 'Home', icon: '🛡️', testId: 'nav-btn-home', badge: null },
    { id: 'screen-selection', label: 'Test Food', icon: '🧪', testId: 'nav-btn-test', badge: '7' },
    { id: 'screen-map', label: 'Heat Map', icon: '🗺️', testId: 'nav-btn-map', badge: 'Live' },
    { id: 'screen-learning', label: 'Learn & Win', icon: '🎓', testId: 'nav-btn-learn', badge: 'XP' },
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
          const isActive = activeScreen === tab.id || (tab.id === 'screen-selection' && activeScreen === 'screen-camera');
          return (
            <button
              key={tab.id}
              id={tab.testId}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrap">
                <span className="nav-icon">{tab.icon}</span>
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
