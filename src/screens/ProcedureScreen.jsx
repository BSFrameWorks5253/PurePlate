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
  const currentProtocol = protocol || {
    id: "milk_starch",
    category: "dairy",
    title: "Milk Starch & Thickener Test",
    foodName: "Milk & Dairy",
    icon: "🥛",
    adulterant: "Added Starch / Potato Flour",
    healthRisk: "Severe gastrointestinal issues, altered insulin response, nutrient dilution.",
    tools: [
      "1 clean transparent glass cup or test tube",
      "Tincture of Iodine reagent (2-3 drops)",
      "5 ml milk sample (boiled and cooled to room temp)"
    ],
    science: "Iodine (triiodide ion I3-) slips inside the helical coil of amylose in starch, forming a deep blue-black charge-transfer complex. Pure milk does not react with iodine and remains white or pale cream.",
    steps: [
      "Measure 5 ml of milk sample into a clean transparent glass cup or tube.",
      "Bring the milk sample to a gentle boil and let it cool completely to room temperature (~25°C).",
      "Add 2 to 3 drops of Tincture of Iodine reagent into the milk.",
      "Swirl gently for 5 seconds and compare the resulting color against the calibrated visual standards."
    ],
    visualGuide: {
      pureTitle: "Remains Milky White / Pale Cream",
      pureDesc: "Pure milk without added thickeners or potato starch",
      pureColorHex: "#FAF8F5",
      adulteratedTitle: "Turns Deep Midnight Blue / Violet",
      adulteratedDesc: "Starch adulteration present (>0.1% starch detected)",
      adulteratedColorHex: "#1E1B4B"
    }
  };

  const [checkedTools, setCheckedTools] = useState({});
  const [selectedVerdict, setSelectedVerdict] = useState(null);
  const [testLogged, setTestLogged] = useState(false);
  const [testScore, setTestScore] = useState(null);

  const toggleTool = (idx) => {
    soundEngine.playClick();
    setCheckedTools((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleRecordVerdict = (verdict) => {
    soundEngine.playSuccess();
    setSelectedVerdict(verdict);
    const isPure = verdict === 'pure';
    const score = isPure ? 96 : 22;
    setTestScore(score);
    setTestLogged(true);

    const record = {
      id: `test-${Date.now()}`,
      foodId: currentProtocol.id,
      foodName: currentProtocol.foodName,
      title: currentProtocol.title,
      status: isPure ? 'pass' : 'fail',
      adulterant: isPure ? 'None (Clean Sample)' : currentProtocol.adulterant,
      ward: 'Athwa Lines',
      lat: 21.1738 + (Math.random() - 0.5) * 0.015,
      lng: 72.8028 + (Math.random() - 0.5) * 0.015,
      timestamp: 'Just now',
      school: 'Lourdes Convent Primary School, Surat',
      score: score
    };

    storage.addTestRecord(record);
    storage.awardXP(60);

    showToast(
      isPure
        ? '✅ Sample Verified Pure! Logged to Surat Heat Map (+60 XP)'
        : '⚠️ Adulteration Spike Logged to Surat Heat Map (+60 XP)',
      isPure ? 'success' : 'warning'
    );
  };

  return (
    <section id="screen-procedure" className="app-screen active">
      {/* Top Navigation */}
      <div className="screen-top-nav">
        <button
          className="btn-back"
          id="btn-back-to-catalog"
          title="Back to Catalog"
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
          <p>Lourdes Convent Primary School • Official FSSAI Testing Method</p>
        </div>
      </div>

      <div className="method-guide-container">
        {/* Method Overview Banner */}
        <div className="method-overview-card glass-card">
          <div className="overview-header-row">
            <div className="overview-icon-box">{currentProtocol.icon}</div>
            <div className="overview-details">
              <div className="overview-meta-line">
                <span className="overview-category-tag">STANDARD OPERATING PROCEDURE</span>
                <span className="overview-school-badge">🏫 Lourdes Convent Science Lab</span>
              </div>
              <h3 className="overview-food-name">{currentProtocol.foodName}</h3>
              <div className="overview-target-para">
                <span className="target-label">Target Adulterant:</span>
                <span className="target-value">{currentProtocol.adulterant}</span>
              </div>
            </div>
          </div>

          <div className="overview-risk-alert">
            <span className="risk-icon">⚠️</span>
            <div className="risk-info">
              <strong>Health Hazard:</strong> {currentProtocol.healthRisk}
            </div>
          </div>
        </div>

        {/* Section 1: Required Apparatus & Reagents Checklist */}
        <div className="method-section glass-card">
          <div className="section-header-row">
            <div className="section-num-badge">1</div>
            <div>
              <h3 className="section-title">Apparatus &amp; Reagents Checklist</h3>
              <p className="section-sub">Verify and check off required equipment on your lab desk</p>
            </div>
          </div>

          <div className="apparatus-checklist-grid">
            {currentProtocol.tools.map((tool, idx) => {
              const isChecked = !!checkedTools[idx];
              return (
                <button
                  key={idx}
                  className={`apparatus-check-card ${isChecked ? 'is-checked' : ''}`}
                  onClick={() => toggleTool(idx)}
                >
                  <span className="check-box-indicator">{isChecked ? '✓' : ''}</span>
                  <span className="apparatus-label">{tool}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Step-by-Step Method Instructions */}
        <div className="method-section glass-card">
          <div className="section-header-row">
            <div className="section-num-badge">2</div>
            <div>
              <h3 className="section-title">Step-by-Step Procedure Instructions</h3>
              <p className="section-sub">Follow each step in sequential order</p>
            </div>
          </div>

          <div className="procedural-steps-list">
            {currentProtocol.steps.map((step, idx) => (
              <div key={idx} className="procedure-step-card">
                <div className="step-circle-badge">Step {idx + 1}</div>
                <div className="step-body-content">
                  <p className="step-instruction-text">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Scientific Principle */}
        <div className="method-section glass-card">
          <div className="section-header-row">
            <div className="section-num-badge">3</div>
            <div>
              <h3 className="section-title">Chemical Principle &amp; Reaction</h3>
              <p className="section-sub">Scientific basis under FSSAI DART guidelines</p>
            </div>
          </div>
          <div className="science-principle-box">
            <p>{currentProtocol.science}</p>
          </div>
        </div>

        {/* Section 4: Visual Color Verdict Comparator & Result Logging */}
        <div className="method-section glass-card">
          <div className="section-header-row">
            <div className="section-num-badge">4</div>
            <div>
              <h3 className="section-title">Record Physical Observation &amp; Test Result</h3>
              <p className="section-sub">Compare your test sample color and record the official result</p>
            </div>
          </div>

          <div className="verdict-selection-duo">
            {/* Pure Verdict Option */}
            <div
              className={`verdict-action-card pure ${selectedVerdict === 'pure' ? 'active-verdict' : ''}`}
              onClick={() => handleRecordVerdict('pure')}
              role="button"
              tabIndex={0}
            >
              <div
                className="verdict-color-swatch"
                style={{
                  background: currentProtocol.visualGuide.pureColorHex,
                  border: '2px solid rgba(16, 185, 129, 0.4)'
                }}
              >
                <span className="swatch-symbol">🛡️</span>
              </div>
              <h4 className="verdict-heading">{currentProtocol.visualGuide.pureTitle}</h4>
              <p className="verdict-desc">{currentProtocol.visualGuide.pureDesc}</p>
              <button className="verdict-btn pure">
                {selectedVerdict === 'pure' ? '✓ Verified Pure' : 'Select Pure Milk'}
              </button>
            </div>

            {/* Adulterated Verdict Option */}
            <div
              className={`verdict-action-card danger ${selectedVerdict === 'danger' ? 'active-verdict' : ''}`}
              onClick={() => handleRecordVerdict('danger')}
              role="button"
              tabIndex={0}
            >
              <div
                className="verdict-color-swatch"
                style={{
                  background: currentProtocol.visualGuide.adulteratedColorHex,
                  border: '2px solid rgba(239, 68, 68, 0.4)'
                }}
              >
                <span className="swatch-symbol">⚠️</span>
              </div>
              <h4 className="verdict-heading">{currentProtocol.visualGuide.adulteratedTitle}</h4>
              <p className="verdict-desc">{currentProtocol.visualGuide.adulteratedDesc}</p>
              <button className="verdict-btn danger">
                {selectedVerdict === 'danger' ? '⚠️ Log Contamination' : 'Select Adulterated'}
              </button>
            </div>
          </div>

          {/* Result Confirmation Banner */}
          {testLogged && (
            <div className={`test-result-summary-card ${selectedVerdict === 'pure' ? 'pure' : 'danger'}`}>
              <div className="result-crest-icon">
                {selectedVerdict === 'pure' ? '🛡️' : '🚨'}
              </div>
              <div className="result-details">
                <h4>
                  {selectedVerdict === 'pure'
                    ? 'VERIFIED PURE (Pass - 96% Safety Index)'
                    : 'ADULTERATION SPIKE LOGGED (Fail - 22% Safety Index)'}
                </h4>
                <p>
                  Result recorded to Surat Food Security Heat Map. Lourdes Convent Primary School student log updated with +60 XP.
                </p>
              </div>
              <button
                className="btn-result-view-map"
                onClick={() => onNavigate('screen-map')}
              >
                View On Heat Map ➔
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="method-bottom-actions">
          <button
            className="method-action-btn primary"
            onClick={() => onLaunchCamera(currentProtocol)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Launch Camera Spectrometer</span>
          </button>

          <button
            className="method-action-btn secondary"
            onClick={() => onNavigate('screen-map')}
          >
            <span>View Surat Heat Map</span>
          </button>
        </div>
      </div>
    </section>
  );
}
