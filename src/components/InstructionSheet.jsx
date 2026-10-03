import React from 'react';
import soundEngine from '../services/sound.js';

export default function InstructionSheet({
  isOpen,
  protocol,
  onClose,
  onLaunchCamera
}) {
  if (!isOpen || !protocol) return null;

  const handleLaunch = () => {
    soundEngine.playClick();
    onLaunchCamera(protocol);
  };

  const handleClose = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div className="bottom-sheet-backdrop active" id="instruction-sheet-backdrop" onClick={handleClose}>
      <div
        className="instruction-sheet active"
        id="instruction-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber"></div>

        <div className="sheet-header">
          <div className="sheet-icon-title">
            <div className="sheet-item-icon-box">
              <span className="sheet-item-icon" id="sheet-icon">{protocol.icon}</span>
            </div>
            <div className="sheet-text-wrap">
              <h3 id="sheet-title">{protocol.name}</h3>
              <span className="sheet-adulterant" id="sheet-adulterant">
                Target: {protocol.targetAdulterant || protocol.chemicalTarget}
              </span>
            </div>
          </div>
          <button className="sheet-close" id="btn-close-sheet" title="Close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="sheet-body">
          {/* Required Tools Box */}
          <div className="tools-required-box">
            <div className="tools-title">
              <span className="tools-icon-pill">🧪</span>
              <strong>You will need:</strong>
            </div>
            <ul className="tools-list" id="sheet-tools-list">
              {protocol.requiredItems && protocol.requiredItems.map((tool, idx) => (
                <li key={idx}>
                  <span className="tool-check-icon">✓</span>
                  <span>{tool}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Science Principle */}
          <div className="test-science-brief">
            <div className="science-tag-row">
              <span className="science-tag">SCIENCE PRINCIPLE</span>
            </div>
            <p id="sheet-science-desc">
              {protocol.sciencePrinciple}
            </p>
          </div>

          {/* Safety Advisory */}
          <div className="safety-advisory">
            <span className="safety-icon">⚠️</span>
            <span>{protocol.safetyWarning || "Safe at-home protocol. For students, perform under adult supervision."}</span>
          </div>
        </div>

        {/* Action Button: Vibrant Green "Launch Interactive Test" */}
        <div className="sheet-footer">
          <button
            className="btn-primary-action"
            id="btn-launch-camera-test"
            onClick={handleLaunch}
          >
            <span>Launch Interactive Test</span>
            <span className="btn-icon-right">📸 ➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
