import React, { useState } from 'react';
import soundEngine from '../services/sound.js';
import storage from '../services/storage.js';

export default function ProcedureScreen({
  protocol,
  onBack,
  onLaunchCamera,
  onNavigate,
  showToast
}) {
  // If no protocol is passed, fallback to Milk Starch
  const currentProtocol = protocol || {
    id: "milk_starch",
    category: "dairy",
    title: "Milk Starch & Thickener Test",
    foodName: "Milk & Dairy",
    icon: "🥛",
    adulterant: "Added Starch / Potato Flour",
    healthRisk: "Severe gastrointestinal issues, altered insulin response, nutrient dilution.",
    tools: [
      "1 small transparent glass cup",
      "Tincture of Iodine solution (2-3 drops)",
      "5 ml milk sample (boiled & cooled)"
    ],
    science: "Iodine (triiodide ion) slips inside the helical structure of amylose in starch, creating a charge-transfer complex that turns the liquid deep blue or purple. Pure milk does not react and stays white or pale yellowish.",
    steps: [
      "Take 5 ml of milk sample in a clean transparent glass cup.",
      "Boil the milk sample thoroughly and let it cool to room temperature.",
      "Add 2-3 drops of Iodine solution and shake or swirl gently.",
      "Hold the cup inside the camera target ring and verify color change."
    ],
    visualGuide: {
      pureTitle: "Stayed White / Pale Yellow",
      pureDesc: "Pure milk without starch contamination",
      pureColorHex: "#FAF8F5",
      adulteratedTitle: "Turned Deep Blue / Violet",
      adulteratedDesc: "Starch adulteration present (>0.1% starch)",
      adulteratedColorHex: "#1E1B4B"
    }
  };

  // State
  const [activeTab, setActiveTab] = useState('tutorial'); // 'tutorial' | 'manual'
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedTools, setCheckedTools] = useState({});
  const [dropperCount, setDropperCount] = useState(0);
  const [simulatedSampleType, setSimulatedSampleType] = useState('pure'); // 'pure' | 'adulterated'
  const [hasCompletedReaction, setHasCompletedReaction] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState(null);
  const [isLogged, setIsLogged] = useState(false);

  // Tutorial Dialogue Script for Game Mode
  const tutorialSteps = [
    {
      title: "Step 1: Equipment & Sample Preparation",
      dialogue: "Welcome Cadet! I'm Inspector Arya from the Lourdes Convent Science Lab. Let's inspect this milk sample! First, grab a clean transparent glass cup and pour in 5 ml of fresh milk.",
      instruction: "Ensure the glass is dry and transparent. Measure out approximately 5 ml of your milk sample.",
      actionPrompt: "Cadet Checklist: Verify you have all required apparatus ready on your desk.",
      badge: "Preparation"
    },
    {
      title: "Step 2: Heat Activation (Boiling)",
      dialogue: "Crucial lab science rule: Boiling breaks the protective outer amylopectin coating of starch granules! Bring your 5 ml milk sample to a gentle boil, then let it cool completely to room temperature.",
      instruction: "Allow the milk to cool. Adding chemical reagent to scalding hot milk can degrade the iodine complex!",
      actionPrompt: "Wait until sample reaches room temperature (~25°C).",
      badge: "Activation"
    },
    {
      title: "Step 3: Reagent Dropper Reaction",
      dialogue: "Now the magic happens! We're adding Tincture of Iodine. Tap the interactive dropper below to add 3 drops into the test tube and watch the chemical reaction!",
      instruction: "Add 2 to 3 drops of standard Iodine solution directly to the milk sample. Gently swirl for 5 seconds.",
      actionPrompt: "Tap the reagent dropper button 3 times to observe the reaction in the virtual tube!",
      badge: "Chemical Reaction"
    },
    {
      title: "Step 4: Color Analysis & Verdict",
      dialogue: "Observe the color! If starch is present, iodine binds into the amylose helix, flashing deep midnight blue/violet. If the milk is pure, it stays milky white or faint straw yellow!",
      instruction: "Compare your physical sample against our calibrated digital color standard.",
      actionPrompt: "Select your observation below to earn your +60 Citizen XP and log to the Surat Safety Grid!",
      badge: "Final Verdict"
    }
  ];

  const handleToolToggle = (idx) => {
    soundEngine.playClick();
    setCheckedTools(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddDrop = () => {
    if (dropperCount < 3) {
      soundEngine.playBeep(440 + dropperCount * 120);
      const nextCount = dropperCount + 1;
      setDropperCount(nextCount);
      if (nextCount === 3) {
        setHasCompletedReaction(true);
        soundEngine.playSuccess();
        showToast("Reagent applied! Reaction completed.", "info");
      }
    }
  };

  const handleResetDropper = () => {
    soundEngine.playClick();
    setDropperCount(0);
    setHasCompletedReaction(false);
  };

  const handleNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      soundEngine.playClick();
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      soundEngine.playClick();
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleLogResult = (verdict) => {
    soundEngine.playSuccess();
    setSelectedVerdict(verdict);
    setIsLogged(true);

    const isPure = verdict === 'pure';
    const ward = 'Athwa Lines';
    const record = {
      id: `test-${Date.now()}`,
      foodId: currentProtocol.id,
      foodName: currentProtocol.foodName,
      title: currentProtocol.title,
      status: isPure ? 'pure' : 'adulterated',
      adulterant: isPure ? 'None (Clean Sample)' : currentProtocol.adulterant,
      ward: ward,
      lat: 21.1702 + (Math.random() - 0.5) * 0.02,
      lng: 72.8011 + (Math.random() - 0.5) * 0.02,
      timestamp: new Date().toISOString(),
      school: 'Lourdes Convent Primary School, Surat',
      score: isPure ? 96 : 28
    };

    storage.addTestRecord(record);
    storage.awardXP(60);

    showToast(`Test logged to Surat Map! +60 XP awarded to Lourdes Convent Primary School profile`, 'success');
  };

  return (
    <section id="screen-procedure" className="app-screen active">
      {/* Top Navigation */}
      <div className="screen-top-nav">
        <button
          className="btn-back"
          id="btn-back-to-catalog"
          title="Back to Test Selection"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="screen-top-title">
          <div className="title-with-badge">
            <h2>{currentProtocol.title}</h2>
            <span className="catalog-counter-pill">{currentProtocol.foodName}</span>
          </div>
          <p>Lourdes Convent Primary School • Verified FSSAI Test Procedure</p>
        </div>
      </div>

      {/* Mode Switcher: Game Tutorial vs Full Lab Manual */}
      <div className="procedure-tabs-wrap">
        <div className="procedure-tabs-pill">
          <button
            className={`proc-tab-btn ${activeTab === 'tutorial' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('tutorial');
            }}
          >
            <span className="tab-icon">🎮</span>
            <span>Game Tutorial Mode</span>
            <span className="xp-pill-badge">+60 XP</span>
          </button>

          <button
            className={`proc-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('manual');
            }}
          >
            <span className="tab-icon">🔬</span>
            <span>Full Lab Manual</span>
          </button>
        </div>
      </div>

      {/* ── 1. GAME TUTORIAL MODE (Walkthrough) ── */}
      {activeTab === 'tutorial' && (
        <div className="tutorial-game-viewport">
          {/* Game Quest Step Bar */}
          <div className="game-quest-header glass-card">
            <div className="quest-meta">
              <span className="quest-step-indicator">
                MISSION STEP {currentStep + 1} OF {tutorialSteps.length}
              </span>
              <h3 className="quest-step-title">{tutorialSteps[currentStep].title}</h3>
            </div>
            <div className="quest-progress-dots">
              {tutorialSteps.map((step, idx) => (
                <button
                  key={idx}
                  className={`quest-dot ${idx === currentStep ? 'current' : idx < currentStep ? 'completed' : ''}`}
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentStep(idx);
                  }}
                  title={step.title}
                >
                  {idx < currentStep ? '✓' : idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Inspector Cadence Dialogue Stage */}
          <div className="game-dialogue-stage glass-card">
            <div className="cadet-instructor-avatar-wrap">
              <div className="instructor-avatar-frame">
                <span className="instructor-emoji">👩‍🔬</span>
                <span className="instructor-pulse-ring"></span>
              </div>
              <div className="instructor-info">
                <strong>Inspector Arya</strong>
                <span>Lead Science Instructor</span>
                <span className="school-sub-tag">Lourdes Convent Primary</span>
              </div>
            </div>

            <div className="game-speech-bubble">
              <div className="speech-arrow"></div>
              <p className="speech-text">{tutorialSteps[currentStep].dialogue}</p>
            </div>
          </div>

          {/* Interactive Step Workspace */}
          <div className="game-interactive-panel glass-card">
            {currentStep === 0 && (
              <div className="step-apparatus-stage">
                <h4 className="stage-subheading">📋 Desk Preparation Checklist</h4>
                <p className="stage-desc">Tap each item once you have it ready on your lab desk:</p>
                <div className="interactive-tools-list">
                  {currentProtocol.tools.map((tool, idx) => {
                    const isChecked = !!checkedTools[idx];
                    return (
                      <button
                        key={idx}
                        className={`tool-check-pill ${isChecked ? 'checked' : ''}`}
                        onClick={() => handleToolToggle(idx)}
                      >
                        <span className="check-box-icon">{isChecked ? '✅' : '⚪'}</span>
                        <span className="tool-text">{tool}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="step-thermal-stage">
                <div className="thermal-visual-box">
                  <div className="thermal-icon-anim">🔥</div>
                  <div className="thermal-info">
                    <h4>Thermal Starch Release Principle</h4>
                    <p>Raw starch resides inside rigid crystalline envelopes. Gentle boiling swells and bursts these granule envelopes, liberating <em>amylose</em> so our iodine reagent can detect adulteration instantly!</p>
                  </div>
                </div>
                <div className="temperature-gauge">
                  <div className="gauge-marker heated">Boiled (100°C)</div>
                  <div className="gauge-arrow">➔</div>
                  <div className="gauge-marker ready">Cooled to Room Temp (~25°C) ✅</div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="step-reaction-stage">
                <h4 className="stage-subheading">🧪 Interactive Virtual Reagent Dropper</h4>
                <p className="stage-desc">Simulate the chemical reaction or choose sample state:</p>

                {/* Sample Selector */}
                <div className="sample-type-toggle">
                  <button
                    className={`sample-pill-btn ${simulatedSampleType === 'pure' ? 'active' : ''}`}
                    onClick={() => {
                      soundEngine.playClick();
                      setSimulatedSampleType('pure');
                      handleResetDropper();
                    }}
                  >
                    Simulate: Pure Milk
                  </button>
                  <button
                    className={`sample-pill-btn ${simulatedSampleType === 'adulterated' ? 'active' : ''}`}
                    onClick={() => {
                      soundEngine.playClick();
                      setSimulatedSampleType('adulterated');
                      handleResetDropper();
                    }}
                  >
                    Simulate: Starch-Adulterated Milk
                  </button>
                </div>

                {/* Reaction Vial Visualizer */}
                <div className="virtual-lab-bench">
                  <div className="virtual-tube-wrapper">
                    <div className="virtual-tube">
                      <div
                        className="tube-liquid"
                        style={{
                          backgroundColor:
                            dropperCount === 0
                              ? '#FFFDF9'
                              : simulatedSampleType === 'pure'
                              ? '#FAF6EB'
                              : dropperCount === 1
                              ? '#4A5568'
                              : dropperCount === 2
                              ? '#2D3748'
                              : '#1E1B4B',
                          height: `${45 + dropperCount * 12}%`,
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <div className="liquid-surface-shine"></div>
                      </div>
                    </div>
                    <span className="tube-label">
                      {dropperCount === 0
                        ? 'Raw Milk (5 ml)'
                        : hasCompletedReaction
                        ? simulatedSampleType === 'pure'
                          ? 'Pure Milk (No Reaction)'
                          : 'Starch Positive (Deep Blue/Violet)'
                        : `Drops Added: ${dropperCount}/3`}
                    </span>
                  </div>

                  {/* Dropper Control */}
                  <div className="dropper-control-box">
                    <button
                      className="btn-dropper-squeeze"
                      onClick={handleAddDrop}
                      disabled={dropperCount >= 3}
                    >
                      <span className="dropper-icon">💧</span>
                      <span>{dropperCount < 3 ? `Add Iodine Drop (${dropperCount}/3)` : 'Reaction Ready!'}</span>
                    </button>

                    <button className="btn-reset-vial" onClick={handleResetDropper}>
                      Reset Vial
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="step-verdict-stage">
                <h4 className="stage-subheading">🔍 Record Your Physical Observation</h4>
                <p className="stage-desc">Look at your real desk sample. Which matches your observation?</p>

                <div className="verdict-comparison-grid">
                  {/* Pure Option */}
                  <div
                    className={`verdict-choice-card ${selectedVerdict === 'pure' ? 'selected pure' : ''}`}
                    onClick={() => handleLogResult('pure')}
                  >
                    <div className="color-swatch-box" style={{ background: '#FAF8F5', border: '2px solid #E2E8F0' }}>
                      <span className="swatch-check">🥛</span>
                    </div>
                    <h4>{currentProtocol.visualGuide.pureTitle}</h4>
                    <p>{currentProtocol.visualGuide.pureDesc}</p>
                    <button className="btn-select-verdict pure">
                      {selectedVerdict === 'pure' ? '✓ Verified Pure' : 'Select Pure Milk'}
                    </button>
                  </div>

                  {/* Adulterated Option */}
                  <div
                    className={`verdict-choice-card ${selectedVerdict === 'adulterated' ? 'selected danger' : ''}`}
                    onClick={() => handleLogResult('adulterated')}
                  >
                    <div className="color-swatch-box" style={{ background: '#1E1B4B', border: '2px solid #312E81' }}>
                      <span className="swatch-check">⚠️</span>
                    </div>
                    <h4>{currentProtocol.visualGuide.adulteratedTitle}</h4>
                    <p>{currentProtocol.visualGuide.adulteratedDesc}</p>
                    <button className="btn-select-verdict danger">
                      {selectedVerdict === 'adulterated' ? '⚠️ Log Starch Contamination' : 'Select Adulterated'}
                    </button>
                  </div>
                </div>

                {isLogged && (
                  <div className="quest-success-banner glass-card">
                    <span className="party-emoji">🎉</span>
                    <div className="banner-text">
                      <h4>Tutorial Quest Completed!</h4>
                      <p>+60 XP awarded to your Lourdes Convent Primary School cadet log. Data synced to Surat municipal grid.</p>
                    </div>
                    <button
                      className="btn-view-map-pill"
                      onClick={() => onNavigate('screen-map')}
                    >
                      View Live On Heat Map ➔
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="quest-navigation-bar">
              <button
                className="btn-quest-step"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                ← Previous Step
              </button>

              {currentStep < tutorialSteps.length - 1 ? (
                <button className="btn-quest-step next" onClick={handleNextStep}>
                  Next Step ({currentStep + 2}/{tutorialSteps.length}) →
                </button>
              ) : (
                <button
                  className="btn-quest-step finish"
                  onClick={() => onLaunchCamera(currentProtocol)}
                >
                  📸 Launch Camera Color Scanner
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. FULL LAB MANUAL MODE ── */}
      {activeTab === 'manual' && (
        <div className="lab-manual-viewport glass-card">
          <div className="manual-section">
            <h3 className="section-title">🔬 Scientific Principle</h3>
            <p className="science-text">{currentProtocol.science}</p>
          </div>

          <div className="manual-section">
            <h3 className="section-title">⚠️ Target Adulterant &amp; Health Risk</h3>
            <div className="risk-box">
              <strong>Adulterant:</strong> {currentProtocol.adulterant}
              <p className="risk-detail">{currentProtocol.healthRisk}</p>
            </div>
          </div>

          <div className="manual-section">
            <h3 className="section-title">🧪 Apparatus &amp; Reagents</h3>
            <ul className="apparatus-list">
              {currentProtocol.tools.map((item, idx) => (
                <li key={idx} className="apparatus-item">
                  <span className="bullet-dot">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="manual-section">
            <h3 className="section-title">📝 Step-by-Step Procedure</h3>
            <ol className="procedure-ordered-list">
              {currentProtocol.steps.map((step, idx) => (
                <li key={idx} className="proc-step-row">
                  <span className="step-num-pill">{idx + 1}</span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="manual-section">
            <h3 className="section-title">🎨 Visual Color Standards</h3>
            <div className="visual-guide-duo">
              <div className="visual-box pure">
                <div className="visual-swatch" style={{ background: currentProtocol.visualGuide.pureColorHex }}></div>
                <strong>Pure Result</strong>
                <p>{currentProtocol.visualGuide.pureTitle}</p>
                <small>{currentProtocol.visualGuide.pureDesc}</small>
              </div>

              <div className="visual-box danger">
                <div className="visual-swatch" style={{ background: currentProtocol.visualGuide.adulteratedColorHex }}></div>
                <strong>Adulteration Positive</strong>
                <p>{currentProtocol.visualGuide.adulteratedTitle}</p>
                <small>{currentProtocol.visualGuide.adulteratedDesc}</small>
              </div>
            </div>
          </div>

          <div className="manual-footer-actions">
            <button
              className="btn-primary-action"
              onClick={() => onLaunchCamera(currentProtocol)}
            >
              📸 Launch Camera Spectrometer
            </button>
            <button
              className="btn-secondary-action"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('tutorial');
              }}
            >
              🎮 Open Interactive Tutorial Mode
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
