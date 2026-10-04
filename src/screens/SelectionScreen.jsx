import React, { useState } from 'react';
import { FOOD_PROTOCOLS } from '../data/protocols.js';
import soundEngine from '../services/sound.js';

export default function SelectionScreen({
  onBack,
  onOpenProtocol
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Foods' },
    { id: 'dairy', label: '🥛 Milk & Dairy' },
    { id: 'spices', label: '🌶️ Spices & Condiments' },
    { id: 'sweeteners', label: '🍯 Honey & Sweeteners' },
    { id: 'oils', label: '🫒 Oils & Ghee' },
  ];

  const filtered = FOOD_PROTOCOLS.filter((item) => {
    const matchCat = category === 'all' || item.category === category;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.foodName.toLowerCase().includes(q) ||
      item.adulterant.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleCardClick = (protocol) => {
    soundEngine.playClick();
    onOpenProtocol({
      ...protocol,
      name: protocol.title,
      targetAdulterant: protocol.adulterant,
      requiredItems: protocol.tools,
      sciencePrinciple: protocol.science
    });
  };

  return (
    <section id="screen-selection" className="app-screen active">
      {/* Top Nav Bar */}
      <div className="screen-top-nav">
        <button
          className="btn-back"
          id="btn-back-home"
          title="Return to Dashboard"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="screen-top-title">
          <div className="title-with-badge">
            <h2>What are we testing today?</h2>
            <span className="catalog-counter-pill" id="catalog-count-pill">
              {filtered.length} Protocols
            </span>
          </div>
          <p>Select a staple food item to open its testing protocol</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-box-wrap">
        <span className="search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          id="food-search-input"
          placeholder="Search food item (e.g., Honey, Turmeric, Milk)..."
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search-btn"
            id="btn-clear-search"
            style={{ display: 'block' }}
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Select Categories Tabs */}
      <div className="categories-scroll" id="categories-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-pill ${category === cat.id ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setCategory(cat.id);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Food Protocols Grid */}
      <div className="food-cards-grid" id="food-items-grid">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '32px' }}>🔍</span>
            <p style={{ marginTop: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No testing protocol found for "{searchQuery}"
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="food-card"
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(item)}
            >
              <div className="food-card-icon">{item.icon}</div>
              <div className="food-card-body">
                <div className="food-card-top-row">
                  <h4 className="food-card-name">{item.title}</h4>
                  <span className="food-card-badge">{item.category.toUpperCase()}</span>
                </div>
                <div className="food-card-adulterant-para">
                  <span className="adulterant-label">Target Adulterant:</span>{' '}
                  <span className="adulterant-val">{item.adulterant}</span>
                </div>
                <div className="food-card-action-row">
                  <div className="food-card-meta">
                    <span>🧪 {item.tools.length} Tools</span>
                    <span>⏱️ 2 Mins</span>
                  </div>
                  <button
                    className="btn-card-start-test"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(item);
                    }}
                  >
                    Start Test ➔
                  </button>
                </div>
              </div>
              <div className="food-card-arrow">➔</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
