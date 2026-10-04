import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SCIENCE_QUIZ_DATA, ADULTERANT_MATCH_DATA } from '../data/protocols.js';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';

export default function LearningScreen({ showToast }) {
  const [profile, setProfile] = useState(() => {
    const p = storage.getUserProfile();
    return p || {
      name: 'Junior Food Inspector',
      school: 'Lourdes Convent Primary School, Surat',
      points: 420,
      badges: ['detective', 'milk_master', 'spice_sleuth']
    };
  });

  // Keep profile synchronized whenever login/auth updates
  React.useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) setProfile(e.detail);
      else setProfile(storage.getUserProfile());
    };
    window.addEventListener('pureplate_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('pureplate_profile_updated', handleProfileUpdate);
  }, []);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Matching Game State
  const [selectedFood, setSelectedFood] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [mismatchedKey, setMismatchedKey] = useState(null);
  const [shuffledAdulterants, setShuffledAdulterants] = useState(() => {
    return [...ADULTERANT_MATCH_DATA].sort(() => Math.random() - 0.5);
  });

  const currentQuiz = SCIENCE_QUIZ_DATA[quizIndex % SCIENCE_QUIZ_DATA.length];

  const handleQuizAnswer = (option, idx) => {
    if (quizAnswered) return;
    setSelectedOption(idx);
    setQuizAnswered(true);

    if (option.isCorrect) {
      setIsCorrect(true);
      soundEngine.playSuccess();
      const newPoints = storage.addPoints(50);
      setProfile({ ...profile, points: newPoints });

      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.7 }
      });

      // Unlock chemist badge if not already unlocked
      if (storage.unlockBadge('chemist')) {
        soundEngine.playFanfare();
        showToast('🏅 Achievement Unlocked: Chemical Sleuth Badge!', 'success');
        setProfile(storage.getUserProfile());
      }
    } else {
      setIsCorrect(false);
      soundEngine.playWarning();
    }
  };

  const handleNextQuiz = () => {
    soundEngine.playClick();
    setQuizIndex((prev) => (prev + 1) % SCIENCE_QUIZ_DATA.length);
    setSelectedOption(null);
    setQuizAnswered(false);
    setIsCorrect(false);
  };

  // Matching game handlers
  const handleFoodClick = (item) => {
    if (matchedPairs.includes(item.id)) return;
    soundEngine.playClick();
    setSelectedFood(item.id);
  };

  const handleAdulterantClick = (item) => {
    if (!selectedFood || matchedPairs.includes(item.matchId)) return;

    if (selectedFood === item.matchId) {
      // Match found!
      soundEngine.playSuccess();
      const updatedMatches = [...matchedPairs, item.matchId];
      setMatchedPairs(updatedMatches);
      setSelectedFood(null);

      if (updatedMatches.length === ADULTERANT_MATCH_DATA.length) {
        soundEngine.playFanfare();
        const newPoints = storage.addPoints(80);
        setProfile({ ...profile, points: newPoints });
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        showToast('🎉 All matched! +80 Points awarded!', 'success');
      }
    } else {
      // Mismatch
      soundEngine.playWarning();
      setMismatchedKey(item.matchId);
      setTimeout(() => {
        setMismatchedKey(null);
      }, 500);
    }
  };

  const handleResetMatch = () => {
    soundEngine.playClick();
    setSelectedFood(null);
    setMatchedPairs([]);
    setShuffledAdulterants([...ADULTERANT_MATCH_DATA].sort(() => Math.random() - 0.5));
  };

  const xpPercent = Math.min(100, Math.floor((profile.points % 1000) / 10));
  const rank = profile.points >= 800 ? 'Senior Inspector 🌟' : profile.points >= 500 ? 'Detective Level 2 🔍' : 'Junior Inspector 🛡️';
  const unlockedBadgesCount = 2 + (profile.badges?.includes('chemist') ? 1 : 0);

  return (
    <section id="screen-learning" className="app-screen active">
      {/* ── 1. Inspector Credential Hero Card ── */}
      <div className="learning-hero-card">
        <div className="learning-hero-header">
          <div className="l-avatar-ring">
            <div className="l-avatar">🎓</div>
            <div className="l-badge-ring"></div>
          </div>
          <div className="l-info">
            <div className="l-title-row">
              <h2 className="l-name">{profile.name}</h2>
              <span className="l-official-tag">Surat Student Cadre</span>
            </div>
            <span className="l-school">{profile.school}</span>
            <div className="rank-row">
              <span className="rank-badge" id="student-rank-badge">{rank}</span>
              <span className="xp-badge" id="student-xp-badge">⚡ {profile.points} Total XP</span>
              <span className="cadet-badge">🛡️ Ward 12 Certified</span>
            </div>
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className="xp-section">
          <div className="xp-label-row">
            <span className="xp-target-text">
              Target: <strong>Senior Inspector Level</strong> (1,000 XP)
            </span>
            <span className="xp-pct-text">{profile.points} / 1,000 XP ({xpPercent}%)</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" id="student-xp-fill" style={{ width: `${xpPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* ── 2. Detective Badges Showcase (Full Width Container) ── */}
      <div className="badges-showcase-card">
        <div className="badges-header">
          <div>
            <h3 className="section-heading">🎖️ Detective Badges</h3>
            <span className="section-sub">Earned through scientific rigor, chemical detection, and verified field reports</span>
          </div>
          <span className="badges-status-pill">
            {unlockedBadgesCount} of 4 Unlocked
          </span>
        </div>

        <div className="badges-grid">
          <div className="badge-card unlocked">
            <div className="b-icon-wrap">
              <span className="b-icon">🥛</span>
            </div>
            <span className="b-name">Milk Master</span>
            <span className="b-desc">Starch &amp; Water Verification</span>
            <span className="b-status">✓ Unlocked</span>
          </div>

          <div className="badge-card unlocked">
            <div className="b-icon-wrap">
              <span className="b-icon">🌶️</span>
            </div>
            <span className="b-name">Spice Sleuth</span>
            <span className="b-desc">Metanil Yellow &amp; Dye Detection</span>
            <span className="b-status">✓ Unlocked</span>
          </div>

          <div className={`badge-card ${profile.badges?.includes('chemist') ? 'unlocked' : 'locked'}`} id="badge-chemist">
            <div className="b-icon-wrap">
              <span className="b-icon">⚗️</span>
            </div>
            <span className="b-name">Chemical Sleuth</span>
            <span className="b-desc">Acid &amp; Detergent Detection</span>
            <span className="b-status">{profile.badges?.includes('chemist') ? '✓ Unlocked' : '🔒 Complete Lab Test'}</span>
          </div>

          <div className="badge-card locked">
            <div className="b-icon-wrap">
              <span className="b-icon">🏆</span>
            </div>
            <span className="b-name">Chief Guardian</span>
            <span className="b-desc">Surat Food Safety Champion</span>
            <span className="b-status">🔒 Locked (1,000 XP)</span>
          </div>
        </div>
      </div>

      {/* ── 3. Desktop 2-Column Balanced Modules Grid ── */}
      <div className="learning-modules-grid">
        {/* Left Column: Food Science Quiz + Community Leaderboard */}
        <div className="learning-col-left">
          {/* Module 1: Science Quiz */}
          <div className="quiz-container-card">
            <div className="quiz-header-row">
              <div className="qh-left">
                <span className="qh-icon">🧪</span>
                <div>
                  <h4>Food Science Quiz</h4>
                  <span className="qh-sub">Test chemical knowledge and earn +50 XP</span>
                </div>
              </div>
              <span className="qh-points-pill">+50 XP</span>
            </div>

            <p className="quiz-q-text" id="quiz-question-text">{currentQuiz.question}</p>

            <div className="quiz-options-list" id="quiz-options-list">
              {currentQuiz.options.map((opt, idx) => {
                let optionClass = 'quiz-opt-btn';
                if (quizAnswered) {
                  if (opt.isCorrect) optionClass += ' correct';
                  else if (selectedOption === idx) optionClass += ' wrong';
                }
                return (
                  <button
                    key={idx}
                    className={optionClass}
                    disabled={quizAnswered}
                    onClick={() => handleQuizAnswer(opt, idx)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {quizAnswered && (
              <div className={`quiz-feedback-box ${isCorrect ? 'success' : 'error'}`} style={{ display: 'block' }}>
                <strong>{isCorrect ? '🎉 Correct! +50 XP Awarded' : '❌ Not quite right.'}</strong>
                <p style={{ margin: '6px 0 10px 0', fontSize: '0.88rem', lineHeight: 1.45 }}>{currentQuiz.explanation}</p>
                <button className="btn-quiz-next" onClick={handleNextQuiz}>
                  Next Question ➔
                </button>
              </div>
            )}
          </div>

          {/* Module 3: Surat School Safety Leaderboard */}
          <div className="leaderboard-card">
            <div className="lb-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏫</span>
                <div>
                  <h4 style={{ margin: 0 }}>Surat School Safety Leaderboard</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top verified student testing squads</span>
                </div>
              </div>
              <span className="lb-tag">Monthly</span>
            </div>
            <div className="lb-list">
              <div className="lb-item rank-1">
                <span className="lb-rank">🥇 1</span>
                <div className="lb-name">Lourdes Convent Primary School, Surat</div>
                <span className="lb-points">4,820 pts</span>
              </div>
              <div className="lb-item rank-2">
                <span className="lb-rank">🥈 2</span>
                <div className="lb-name">Hillwoods Academy</div>
                <span className="lb-points">3,950 pts</span>
              </div>
              <div className="lb-item rank-3">
                <span className="lb-rank">🥉 3</span>
                <div className="lb-name">Essar International School</div>
                <span className="lb-points">3,120 pts</span>
              </div>
              <div className="lb-item">
                <span className="lb-rank">4</span>
                <div className="lb-name">SVNIT Campus School</div>
                <span className="lb-points">2,740 pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Adulterant Matching Game + Field Guide Tips */}
        <div className="learning-col-right">
          {/* Module 2: Adulterant Matching Game */}
          <div className="matching-game-card">
            <div className="match-header-row">
              <div>
                <h4>Adulterant Match Up</h4>
                <span className="match-sub">Tap a staple food on the left, then tap its adulterant on the right!</span>
              </div>
              <button className="btn-reset-match" id="btn-reset-match" onClick={handleResetMatch}>
                🔄 Reset
              </button>
            </div>

            <div className="match-status" id="match-status-msg">
              {matchedPairs.length === ADULTERANT_MATCH_DATA.length
                ? '🎉 All Pairs Matched! +80 XP Earned!'
                : `Matches Found: ${matchedPairs.length} / ${ADULTERANT_MATCH_DATA.length}`}
            </div>

            <div className="match-columns-wrap">
              {/* Foods Column */}
              <div className="match-col foods-col">
                <div className="col-head-label">STAPLE FOOD</div>
                {ADULTERANT_MATCH_DATA.map((item) => {
                  const isMatched = matchedPairs.includes(item.id);
                  const isSelected = selectedFood === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`match-tile food-tile ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleFoodClick(item)}
                    >
                      {item.food}
                    </div>
                  );
                })}
              </div>

              {/* Adulterants Column (Shuffled) */}
              <div className="match-col adulterants-col">
                <div className="col-head-label">COMMON ADULTERANT</div>
                {shuffledAdulterants.map((item) => {
                  const isMatched = matchedPairs.includes(item.id);
                  const isMismatch = mismatchedKey === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`match-tile adulterant-tile ${isMatched ? 'matched' : ''} ${isMismatch ? 'mismatch' : ''}`}
                      onClick={() => handleAdulterantClick({ matchId: item.id })}
                    >
                      {item.adulterant}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Inspector Field Reference Guide */}
          <div className="field-protocols-card">
            <div className="field-protocols-head">
              <span style={{ fontSize: '18px' }}>🔬</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800 }}>Field Testing Best Practices</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Surat Safety Cadet Protocol Reference</span>
              </div>
            </div>
            <div className="field-tips-list">
              <div className="field-tip-item">
                <span className="field-tip-num">1</span>
                <p><strong>Baseline Iodine:</strong> Pure milk never turns blue with iodine; deep violet signifies starch adulteration.</p>
              </div>
              <div className="field-tip-item">
                <span className="field-tip-num">2</span>
                <p><strong>Turmeric Water Test:</strong> Natural turmeric stays suspended with a soft yellow cloud; metanil yellow produces a vivid artificial hue.</p>
              </div>
              <div className="field-tip-item">
                <span className="field-tip-num">3</span>
                <p><strong>GPS Geocoding:</strong> Always ensure pin location aligns with the vendor's actual landmark for public heat map validity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
