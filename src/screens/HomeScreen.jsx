import React from 'react';
import soundEngine from '../services/sound.js';
import storage from '../services/storage.js';
import { FOOD_PROTOCOLS } from '../data/protocols.js';

export default function HomeScreen({
  onNavigate,
  onSelectFood
}) {
  const incidents = storage.getAllIncidents();
  const totalCount = 1482 + incidents.length;
  const failCount = incidents.filter(i => i.status === 'fail').length;
  const purityPct = Math.max(75, Math.min(96, Math.round(((incidents.length - failCount) / Math.max(1, incidents.length)) * 100)));

  const handleFeedItemClick = (inc) => {
    soundEngine.playClick();
    const matched = FOOD_PROTOCOLS.find(p => 
      inc.food.toLowerCase().includes(p.foodName.toLowerCase().split(' ')[0]) ||
      p.title.toLowerCase().includes(inc.food.toLowerCase())
    ) || FOOD_PROTOCOLS[0];
    onSelectFood(matched);
  };

  return (
    <section id="screen-home" className="app-screen active">
      {/* Live Alert Bulletin */}
      <div className="community-ticker-card">
        <div className="ticker-header">
          <span className="ticker-pulse">🚨</span>
          <span className="ticker-title">Surat Food Quality Bulletin</span>
          <span className="ticker-time">Updated 5m ago</span>
        </div>
        <p className="ticker-content" id="ticker-msg">
          3 spikes of starch-diluted milk reported near Athwa Lines today. Community tests enabled!
        </p>
      </div>

      {/* Surat Food Purity Index Hero Card */}
      <div className="purity-gauge-card">
        <div className="gauge-visual-wrap">
          <div className="gauge-ring-outer">
            <svg className="gauge-svg" viewBox="0 0 120 120">
              <circle className="gauge-track" cx="60" cy="60" r="50"></circle>
              <circle
                className="gauge-fill"
                id="gauge-fill-circle"
                cx="60"
                cy="60"
                r="50"
                style={{
                  strokeDashoffset: `${314 - (314 * purityPct) / 100}px`
                }}
              ></circle>
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-percentage" id="hero-gauge-pct">{purityPct}%</span>
              <span className="gauge-caption">Purity Score</span>
            </div>
          </div>
        </div>
        <div className="gauge-meta-wrap">
          <div className="gauge-badge-row">
            <span className="purity-status-pill status-safe">
              <span className="purity-pulse-dot"></span>
              <span>SURAT CITY: VERIFIED STABLE</span>
            </span>
          </div>
          <h3 className="gauge-title">Community Food Safety Grid</h3>
          <p className="gauge-description">
            Based on <strong id="hero-verified-count">{totalCount.toLocaleString()}</strong> verified citizen reagent tests across 7 municipal wards.
          </p>
          <div className="gauge-wards-row">
            <span className="ward-chip active">📍 Athwa: 86%</span>
            <span className="ward-chip active">📍 Pal: 93%</span>
            <span className="ward-chip active">📍 Adajan: 90%</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="stats-row">
        <div className="stat-pill">
          <span className="stat-val" id="stat-tests-count">{totalCount.toLocaleString()}</span>
          <span className="stat-lbl">Tests Run</span>
        </div>
        <div className="stat-pill success">
          <span className="stat-val" id="stat-purity-rate">{purityPct}%</span>
          <span className="stat-lbl">Purity Index</span>
        </div>
        <div className="stat-pill warning">
          <span className="stat-val" id="stat-alert-zones">3</span>
          <span className="stat-lbl">Watch Zones</span>
        </div>
      </div>

      {/* Section Heading */}
      <div className="section-title-wrap">
        <h2 className="section-heading">Quick Actions</h2>
        <span className="section-sub">Empowering citizens through verified home science</span>
      </div>

      {/* 2 Large Colorful Grid Tiles */}
      <div className="action-grid">
        {/* Tile 1: Test Food Quality */}
        <div
          className="action-tile action-test"
          id="card-nav-test"
          role="button"
          tabIndex={0}
          onClick={() => {
            soundEngine.playClick();
            onNavigate('screen-selection');
          }}
        >
          <div className="tile-sheen"></div>
          <div className="tile-bg-accent"></div>
          <div className="tile-top-row">
            <div className="tile-icon-wrap">
              <span className="tile-emoji">🥛🔬</span>
            </div>
            <span className="tile-tech-tag">⚡ AI VISION 2.0</span>
          </div>
          <div className="tile-text">
            <h3 className="tile-title">Test Food Quality</h3>
            <p className="tile-desc">Interactive AI Camera Wizard for Milk, Spices, Honey &amp; Oils.</p>
          </div>
          <div className="tile-action-row">
            <span className="action-chip">Launch Wizard</span>
            <span className="arrow-circle">➔</span>
          </div>
        </div>

        {/* Tile 2: View Safety Heat Map */}
        <div
          className="action-tile action-map"
          id="card-nav-map"
          role="button"
          tabIndex={0}
          onClick={() => {
            soundEngine.playClick();
            onNavigate('screen-map');
          }}
        >
          <div className="tile-sheen"></div>
          <div className="tile-bg-accent map-accent"></div>
          <div className="tile-top-row">
            <div className="tile-icon-wrap">
              <span className="tile-emoji">🗺️📡</span>
            </div>
            <span className="tile-tech-tag map-tag">🛰️ RETINA MAP</span>
          </div>
          <div className="tile-text">
            <h3 className="tile-title">View Safety Heat Map</h3>
            <p className="tile-desc">Explore crowdsourced adulteration spikes &amp; safe verified zones.</p>
          </div>
          <div className="tile-action-row">
            <span className="action-chip">View Live Map</span>
            <span className="arrow-circle">➔</span>
          </div>
        </div>
      </div>

      {/* Popular Staple Quick-Test Chips */}
      <div className="section-title-wrap" style={{ marginTop: '18px' }}>
        <h3 className="section-heading" style={{ fontSize: '1.05rem' }}>Popular Staple Protocols</h3>
        <span className="section-sub">1-Tap launch for home testing protocols</span>
      </div>
      <div className="quick-tests-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        {FOOD_PROTOCOLS.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="food-card"
            style={{ margin: 0, padding: '12px 14px', cursor: 'pointer' }}
            onClick={() => {
              soundEngine.playClick();
              onSelectFood(item);
            }}
          >
            <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Target: {item.adulterant}
              </div>
            </div>
            <span style={{ color: 'var(--brand-teal)', fontWeight: 800, fontSize: '14px' }}>➔</span>
          </div>
        ))}
      </div>

      {/* Kids' School-To-Home Detective Lab Banner */}
      <div
        className="kids-portal-banner"
        id="card-nav-learn"
        role="button"
        tabIndex={0}
        onClick={() => {
          soundEngine.playClick();
          onNavigate('screen-learning');
        }}
      >
        <div className="banner-gold-sheen"></div>
        <span className="kids-trophy">🎓⭐</span>
        <div className="kids-banner-info">
          <span className="kids-tag">School-To-Home Initiative</span>
          <h4>Food Safety Detective Lab</h4>
          <p>Earn badges, unlock school leaderboard points &amp; master food chemistry!</p>
        </div>
        <button className="btn-kids-enter">Play &amp; Learn</button>
      </div>

      {/* Live Community Activity Feed */}
      <div className="recent-feed-section">
        <div className="feed-header">
          <h4>Live Community Activity</h4>
          <span className="feed-badge">Real-time</span>
        </div>
        <div className="feed-list" id="home-feed-list">
          {incidents.slice(0, 5).map((inc) => (
            <div
              key={inc.id}
              className="feed-item"
              style={{ cursor: 'pointer' }}
              onClick={() => handleFeedItemClick(inc)}
              title="Click to test this food"
            >
              <div className="feed-icon-box">
                {inc.food.toLowerCase().includes('milk') ? '🥛' :
                 inc.food.toLowerCase().includes('turmeric') ? '🌶️' :
                 inc.food.toLowerCase().includes('honey') ? '🍯' :
                 inc.food.toLowerCase().includes('oil') ? '🫒' :
                 inc.food.toLowerCase().includes('tea') ? '☕' : '🧪'}
              </div>
              <div className="feed-details">
                <div className="feed-line1">
                  <strong>{inc.food}</strong>
                  <span className={`feed-status ${inc.status === 'pass' ? 'status-pass' : 'status-fail'}`}>
                    {inc.status === 'pass' ? 'PURE ✓' : 'ADULTERATED ⚠️'}
                  </span>
                </div>
                <div className="feed-line2">
                  <span>📍 {inc.neighborhood}</span>
                  <span>•</span>
                  <span>{inc.timestamp || 'Recent'}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--brand-teal)', fontWeight: 600 }}>Test Now ➔</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
