import React from 'react';
import soundEngine from '../services/sound.js';

export default function BottomNav({ activeScreen, setActiveScreen }) {
  const tabs = [
    { id: 'screen-home', label: 'Home', icon: '🛡️', testId: 'nav-btn-home' },
    { id: 'screen-selection', label: 'Test Food', icon: '🧪', testId: 'nav-btn-test' },
    { id: 'screen-map', label: 'Heat Map', icon: '🗺️', testId: 'nav-btn-map' },
    { id: 'screen-learning', label: 'Learn & Win', icon: '🎓', testId: 'nav-btn-learn' },
  ];

  const handleNavClick = (id) => {
    soundEngine.playClick();
    setActiveScreen(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="bottom-nav-bar" id="app-bottom-nav">
      {tabs.map((tab) => {
        const isActive = activeScreen === tab.id || (tab.id === 'screen-selection' && activeScreen === 'screen-camera');
        return (
          <button
            key={tab.id}
            id={tab.testId}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleNavClick(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
