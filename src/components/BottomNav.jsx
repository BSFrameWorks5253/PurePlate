import React, { useState, useEffect } from 'react';
import soundEngine from '../services/sound.js';
import authEngine from '../services/auth.js';

/**
 * Apple iOS 27 Liquid Glass Lens Dock
 * Matches user's reference design with dark capsule frame,
 * elevated glass squircle active lens, dual specular meniscus reflections,
 * and fluid spring transitions.
 */
export default function BottomNav({ activeScreen, setActiveScreen }) {
  const [currentUser, setCurrentUser] = useState(() => authEngine.getCurrentUser());

  useEffect(() => {
    return authEngine.subscribe((user) => {
      setCurrentUser(user);
    });
  }, []);

  const tabs = [
    {
      id: 'screen-home',
      label: 'Home',
      testId: 'nav-btn-home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5v9.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 20V10.5z" />
        </svg>
      )
    },
    {
      id: 'screen-selection',
      label: 'Test Lab',
      testId: 'nav-btn-test',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
        </svg>
      )
    },
    {
      id: 'screen-map',
      label: 'Heat Map',
      testId: 'nav-btn-map',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 2L4 20l8-4 8 4L12 2z" />
        </svg>
      )
    },
    {
      id: 'screen-learning',
      label: 'Academy',
      testId: 'nav-btn-learn',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
      )
    },
    {
      id: 'screen-login',
      label: 'Profile',
      testId: 'nav-btn-profile',
      icon: (
        <div className="nav-avatar-circle">
          {currentUser ? (
            <span className="avatar-letter">{currentUser.name ? currentUser.name.charAt(0) : '🧑‍🔬'}</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
      )
    }
  ];

  const handleNavClick = (id) => {
    soundEngine.playClick();
    setActiveScreen(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isTabActive = (tabId) => {
    if (activeScreen === tabId) return true;
    if (tabId === 'screen-selection' && (activeScreen === 'screen-camera' || activeScreen === 'screen-procedure')) {
      return true;
    }
    return false;
  };

  return (
    <nav className="lens-dock-container" id="app-bottom-nav" aria-label="Main Navigation">
      <div className="lens-dock-capsule">
        {tabs.map((tab) => {
          const active = isTabActive(tab.id);
          return (
            <button
              key={tab.id}
              id={tab.testId}
              className={`lens-dock-item ${active ? 'active-lens' : ''}`}
              onClick={() => handleNavClick(tab.id)}
              aria-current={active ? 'page' : undefined}
            >
              {/* Elevated Floating Glass Squircle Lens for Active Item */}
              {active ? (
                <div className="active-glass-squircle">
                  {/* Top Meniscus Lens Curved Specular Reflection */}
                  <div className="squircle-top-meniscus"></div>

                  <div className="squircle-content">
                    <span className="squircle-icon">{tab.icon}</span>
                    <span className="squircle-label">{tab.label}</span>
                  </div>

                  {/* Bottom Meniscus Lens Curved Specular Reflection */}
                  <div className="squircle-bottom-meniscus"></div>
                </div>
              ) : (
                <div className="inactive-icon-wrap">
                  <span className="dock-svg-icon">{tab.icon}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
