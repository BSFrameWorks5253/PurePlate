import React, { useState, useEffect, useRef } from 'react';
import soundEngine from '../services/sound.js';
import storage from '../services/storage.js';
import authEngine from '../services/auth.js';

export default function CameraScreen({
  protocol,
  onBack,
  onNavigateHome,
  onNavigateMap,
  showToast
}) {
  const [phase, setPhase] = useState(1); // 1: Prep, 2: Camera/Scan, 3: Verdict
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [simMode, setSimMode] = useState('pure'); // 'pure' or 'adulterated'
  const [facingMode, setFacingMode] = useState('environment');
  const [detectedHex, setDetectedHex] = useState('#FAF8F5');
  const [colorConfidence, setColorConfidence] = useState('Align sample inside targeting ring');
  const [selectedChoice, setSelectedChoice] = useState(null); // 'pure' or 'adulterated'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vendorType, setVendorType] = useState('Local Loose Milk Vendor');
  const [surfaceAngle, setSurfaceAngle] = useState(45);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const isSlopeTest = protocol?.id === 'milk_water_trail';

  // Cleanup camera on unmount or phase change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Gyroscope for slope tests
  useEffect(() => {
    const handleOrientation = (e) => {
      if (e.beta !== null) {
        setSurfaceAngle(Math.round(Math.abs(e.beta)));
      }
    };
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      drawSimulation(simMode);
      setIsCameraActive(false);
      showToast('Camera not available. Simulation mode enabled.', 'info');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      showToast('📹 Camera live. Align sample inside the circular ring.', 'info');

      // Start optical sampling loop
      startSamplingLoop();
    } catch (err) {
      console.warn('Camera error:', err);
      drawSimulation(simMode);
      setIsCameraActive(false);
      showToast('Camera permission denied. Using interactive test mode.', 'warning');
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    soundEngine.playClick();
    if (isCameraActive) {
      stopCamera();
      drawSimulation(simMode);
    } else {
      startCamera();
    }
  };

  const flipCamera = async () => {
    soundEngine.playClick();
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  // Draw simulated lab sample on canvas
  const drawSimulation = (mode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 480;
    canvas.height = 360;
    const w = canvas.width;
    const h = canvas.height;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = 95;

    // Cup shadow & rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.stroke();

    // Liquid inside
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, 2 * Math.PI);

    if (mode === 'pure') {
      const milkGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, radius - 6);
      milkGrad.addColorStop(0, '#ffffff');
      milkGrad.addColorStop(0.7, '#f8fafc');
      milkGrad.addColorStop(1, '#fef3c7');
      ctx.fillStyle = milkGrad;
      ctx.fill();
      setDetectedHex('#FAF8F5');
      setColorConfidence('Pure Sample Hue (#FAF8F5)');
    } else {
      const starchGrad = ctx.createRadialGradient(cx - 15, cy - 15, 10, cx, cy, radius - 6);
      starchGrad.addColorStop(0, '#312e81');
      starchGrad.addColorStop(0.5, '#1e1b4b');
      starchGrad.addColorStop(1, '#4338ca');
      ctx.fillStyle = starchGrad;
      ctx.fill();
      setDetectedHex('#1E1B4B');
      setColorConfidence('⚠️ Chemical Reaction Spike (#1E1B4B)');
    }
  };

  const startSamplingLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      const v = videoRef.current;
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (!vw || !vh) return;

      const sc = document.createElement('canvas');
      sc.width = 32;
      sc.height = 32;
      const sctx = sc.getContext('2d', { willReadFrequently: true });
      const crop = Math.min(vw, vh) * 0.25;
      sctx.drawImage(v, (vw - crop) / 2, (vh - crop) / 2, crop, crop, 0, 0, 32, 32);

      try {
        const p = sctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, cnt = 0;
        for (let i = 0; i < p.length; i += 4) {
          r += p[i];
          g += p[i + 1];
          b += p[i + 2];
          cnt++;
        }
        if (cnt > 0) {
          const avgR = Math.round(r / cnt);
          const avgG = Math.round(g / cnt);
          const avgB = Math.round(b / cnt);
          const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1).toUpperCase()}`;
          setDetectedHex(hex);

          const isShift = (avgB > avgR * 1.1 && avgB > avgG) || (avgB > 75 && avgR < 70);
          setColorConfidence(isShift ? `⚠️ Chemical Shift Detected (${hex})` : `Standard Base Hue (${hex})`);
        }
      } catch (e) {}
    }, 150);
  };

  const handleSimSelect = (mode) => {
    soundEngine.playClick();
    setSimMode(mode);
    stopCamera();
    drawSimulation(mode);
    setSelectedChoice(mode);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        stopCamera();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 480;
        canvas.height = 360;
        ctx.drawImage(img, 0, 0, 480, 360);

        try {
          const p = ctx.getImageData(220, 160, 40, 40).data;
          let r = 0, g = 0, b = 0, cnt = 0;
          for (let i = 0; i < p.length; i += 4) {
            r += p[i]; g += p[i + 1]; b += p[i + 2]; cnt++;
          }
          const avgR = Math.round(r / cnt);
          const avgG = Math.round(g / cnt);
          const avgB = Math.round(b / cnt);
          const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1).toUpperCase()}`;
          setDetectedHex(hex);
          setColorConfidence(`Photo Analyzed (${hex})`);
          soundEngine.playSuccess();
          showToast(`📸 Photo sampled: ${hex}`, 'success');
        } catch (err) {}
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNextToCamera = () => {
    soundEngine.playClick();
    setPhase(2);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleAnalyzeGenerate = () => {
    if (!selectedChoice) return;
    soundEngine.playClick();
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      setPhase(3); // Proceed to Verdict
      stopCamera();
      if (selectedChoice === 'adulterated') {
        soundEngine.playWarning();
      } else {
        soundEngine.playSuccess();
      }
    }, 600);
  };

  const handleSubmitToMap = () => {
    soundEngine.playClick();
    const isPass = selectedChoice === 'pure';
    const result = storage.submitTestResult({
      food: protocol.title || protocol.foodName || 'Milk',
      testType: protocol.title || 'Chemical Test',
      status: isPass ? 'pass' : 'fail',
      adulterant: isPass ? 'None Detected' : (protocol.adulterant || 'Added Starch / Potato Flour'),
      vendorType: vendorType,
      locationName: storage.getUserRegion(),
      lat: 21.1738 + (Math.random() - 0.5) * 0.03,
      lng: 72.8028 + (Math.random() - 0.5) * 0.03
    });

    authEngine.triggerSync();
    showToast(result.message, isPass ? 'success' : 'warning');
    onNavigateMap();
  };

  return (
    <section id="screen-camera" className="app-screen active">
      {/* Top Nav with Step Progress Bar */}
      <div className="screen-top-nav">
        <button
          className="btn-back"
          id="btn-back-selection"
          title="Return"
          onClick={() => {
            soundEngine.playClick();
            stopCamera();
            onBack();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="screen-top-title">
          <h2 id="cam-screen-title">{protocol ? protocol.title : 'Food Safety Test'}</h2>
          <div className="wizard-steps-indicator">
            <span className={`step-dot ${phase >= 1 ? 'active' : ''}`} id="dot-step-1">1</span>
            <span className={`step-connector ${phase >= 2 ? 'active' : ''}`} id="connector-step-1"></span>
            <span className={`step-dot ${phase >= 2 ? 'active' : ''}`} id="dot-step-2">2</span>
            <span className={`step-connector ${phase >= 3 ? 'active' : ''}`} id="connector-step-2"></span>
            <span className={`step-dot ${phase >= 3 ? 'active' : ''}`} id="dot-step-3">3</span>
          </div>
        </div>
      </div>

      <div className="test-wizard-container">
        {/* Phase 1: Preparation */}
        {phase === 1 && (
          <div className="wizard-instruction-card" id="wizard-instruction-card">
            <div className="instruction-badge-row">
              <span className="badge-step-pill" id="badge-step-number">Step 1 of 3</span>
              <span className="badge-guide-status" id="badge-guide-status">Preparation</span>
            </div>
            <p className="instruction-text" id="wizard-instruction-text">
              {protocol.steps && protocol.steps[0]
                ? protocol.steps[0]
                : "Take a small sample of food in a transparent cup and prepare reagents."}
            </p>
            <div id="phase1-action-row" className="wizard-step-action-row">
              <button className="btn-step-next" id="btn-wizard-next-step" onClick={handleNextToCamera}>
                <span>Next Step: Add Reagent &amp; Scan</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Live Camera & Visual Choice */}
        {phase === 2 && (
          <>
            <div className="camera-viewport-card" id="camera-section-wrap">
              <div className="camera-lens-container" id="camera-lens-box">
                {/* Real video or Simulated canvas */}
                <video
                  ref={videoRef}
                  id="live-camera-video"
                  playsInline
                  autoPlay
                  muted
                  style={{ display: isCameraActive ? 'block' : 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  id="camera-capture-canvas"
                  style={{ display: !isCameraActive ? 'block' : 'none' }}
                />

                {/* Reticle Overlay */}
                <div className="reticle-overlay">
                  <div className="corner-bracket top-left"></div>
                  <div className="corner-bracket top-right"></div>
                  <div className="corner-bracket bottom-left"></div>
                  <div className="corner-bracket bottom-right"></div>

                  <div
                    className="circular-target-ring"
                    id="circular-reticle"
                    style={{
                      borderColor: selectedChoice === 'adulterated' ? '#a855f7' : '#10b981',
                      boxShadow: selectedChoice === 'adulterated'
                        ? '0 0 24px rgba(168, 85, 247, 0.6)'
                        : '0 0 24px rgba(16, 185, 129, 0.5)'
                    }}
                  >
                    <div className="reticle-compass-tick tick-0">0°</div>
                    <div className="reticle-compass-tick tick-90">90°</div>
                    <div className="reticle-compass-tick tick-180">180°</div>
                    <div className="reticle-compass-tick tick-270">270°</div>
                    <div className="target-crosshair"></div>
                    <div className="reticle-pulse-center"></div>
                    <span className="reticle-label">ALIGN CUP SAMPLE</span>
                  </div>

                  <div className="scanner-laser" id="scanner-laser"></div>
                </div>

                {/* Gyroscope Overlay for Slope Test */}
                {isSlopeTest && (
                  <div className="gyro-sensor-overlay" id="gyro-sensor-overlay" style={{ display: 'flex' }}>
                    <div className="gyro-bubble-track">
                      <span
                        className="gyro-bubble-pip"
                        id="gyro-bubble-pip"
                        style={{ transform: `translateX(${Math.max(-40, Math.min(40, (surfaceAngle - 45) * 2))}px)` }}
                      ></span>
                    </div>
                    <span className="gyro-icon">📐</span>
                    <span id="gyro-angle-text">
                      Surface Angle: {surfaceAngle}° ({surfaceAngle >= 35 && surfaceAngle <= 50 ? 'Optimal' : 'Tilt to 45°'})
                    </span>
                  </div>
                )}

                {/* Camera Controls Bar */}
                <div className="camera-lens-toolbar">
                  <button className="cam-lens-btn" id="btn-toggle-camera" onClick={toggleCamera}>
                    <span id="cam-mode-icon">{isCameraActive ? '🟢' : '🧪'}</span>
                    <span id="cam-mode-text">{isCameraActive ? 'Live Feed' : 'Test Mode'}</span>
                  </button>
                  <button
                    className="cam-lens-btn cam-btn-highlight"
                    id="btn-analyze-frame"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedChoice(selectedChoice === 'pure' ? 'adulterated' : 'pure');
                    }}
                  >
                    ⚡ Sample
                  </button>
                  <button className="cam-lens-btn" id="btn-switch-lens" onClick={flipCamera}>
                    🔄 Flip
                  </button>
                  <button
                    className="cam-lens-btn"
                    id="btn-upload-photo"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    📷 Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="camera-file-input"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Quick Simulation Demos */}
                <div className="simulation-quickbar">
                  <span className="sim-caption">Demo Samples:</span>
                  <button
                    className={`btn-sim-pick pure ${simMode === 'pure' && !isCameraActive ? 'active' : ''}`}
                    onClick={() => handleSimSelect('pure')}
                  >
                    🥛 Pure Sample
                  </button>
                  <button
                    className={`btn-sim-pick adulterated ${simMode === 'adulterated' && !isCameraActive ? 'active' : ''}`}
                    onClick={() => handleSimSelect('adulterated')}
                  >
                    🧪 Adulterated
                  </button>
                </div>
              </div>

              {/* Detected Hue Extractor Bar */}
              <div className="color-extractor-bar" id="color-picker-row">
                <span className="color-prompt-label">Detected Hue:</span>
                <div className="color-swatch-chip" id="detected-color-chip">
                  <span className="swatch-color" id="swatch-color-box" style={{ backgroundColor: detectedHex }}></span>
                  <span className="swatch-hex" id="swatch-color-hex">{detectedHex}</span>
                </div>
                <span className="color-confidence" id="color-confidence-text">{colorConfidence}</span>
              </div>
            </div>

            {/* Visual Choice Dialogue */}
            <div className="visual-choice-card" id="visual-choice-section">
              <h4 className="choice-prompt-title">What color do you see?</h4>
              <p className="choice-subtext">Tap the color matching your test sample to verify purity:</p>

              <div className="choice-buttons-grid">
                <button
                  className={`color-verdict-btn btn-choice-pure ${selectedChoice === 'pure' ? 'selected' : ''}`}
                  id="btn-choice-pure"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedChoice('pure');
                  }}
                >
                  <div className="swatch-circle pure-white-swatch"></div>
                  <div className="choice-label-wrap">
                    <span className="choice-title">Stayed White / Pale Yellow</span>
                    <span className="choice-desc">Stayed White (Pure)</span>
                  </div>
                  <span className="check-tick">✓</span>
                </button>

                <button
                  className={`color-verdict-btn btn-choice-adulterated ${selectedChoice === 'adulterated' ? 'selected' : ''}`}
                  id="btn-choice-adulterated"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedChoice('adulterated');
                  }}
                >
                  <div className="swatch-circle blue-purple-swatch"></div>
                  <div className="choice-label-wrap">
                    <span className="choice-title">Turned Blue / Violet</span>
                    <span className="choice-desc">Turned Blue (Adulterated)</span>
                  </div>
                  <span className="check-tick">⚠️</span>
                </button>
              </div>

              <button
                className={`btn-analyze-log ${!selectedChoice ? 'disabled' : ''}`}
                id="btn-analyze-generate"
                disabled={!selectedChoice || isAnalyzing}
                onClick={handleAnalyzeGenerate}
              >
                <span>{isAnalyzing ? 'Analyzing Optical Density...' : 'Analyze & Generate Log'}</span>
              </button>
            </div>
          </>
        )}

        {/* Phase 3: Verdict Result & Submit to Map */}
        {phase === 3 && (
          <div className="verdict-result-card" id="verdict-result-card">
            <div className={`verdict-stamp ${selectedChoice === 'pure' ? 'verdict-pass' : 'verdict-fail'}`}>
              <span className="stamp-icon" id="verdict-icon">
                {selectedChoice === 'pure' ? '🛡️' : '⚠️'}
              </span>
              <div className="stamp-texts">
                <h3 id="verdict-status-title">
                  {selectedChoice === 'pure'
                    ? 'Result: Pure. No adulteration detected.'
                    : `Result: Adulterated. ${protocol.adulterant || 'Adulterant'} detected!`}
                </h3>
                <span id="verdict-subtitle">
                  {selectedChoice === 'pure'
                    ? 'Sample passed chemical optical density verification'
                    : 'Sample chemical reaction confirmed adulterant presence'}
                </span>
              </div>
            </div>

            <div className="verdict-details-box">
              <div className="detail-row">
                <span className="d-label">Food Tested:</span>
                <span className="d-val" id="res-food-name">{protocol.foodName || protocol.title}</span>
              </div>
              <div className="detail-row">
                <span className="d-label">Chemical Agent:</span>
                <span className="d-val" id="res-adulterant">{protocol.adulterant || 'Target Agent'}</span>
              </div>
              <div className="detail-row">
                <span className="d-label">Health Risk:</span>
                <span className="d-val danger-text" id="res-health-impact">
                  {protocol.healthRisk || 'Gastrointestinal issues, nutrient dilution'}
                </span>
              </div>
              <div className="detail-row">
                <span className="d-label">Detected Region:</span>
                <span className="d-val" id="res-location-val">{storage.getUserRegion()}</span>
              </div>
            </div>

            <div className="vendor-source-wrap" id="vendor-source-wrap">
              <label htmlFor="vendor-type-select">Sample Source (Optional):</label>
              <select
                id="vendor-type-select"
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value)}
              >
                <option value="Local Loose Milk Vendor">Local Loose Milk Vendor / Dairy</option>
                <option value="Supermarket Brand Packet">Supermarket Brand Packaged Milk</option>
                <option value="Street Market Bazaar">Local Market / Bazaar</option>
                <option value="Home Delivery Service">Home Delivery Service</option>
              </select>
            </div>

            <div className="verdict-actions-row">
              <button className="btn-submit-map" id="btn-submit-to-map" onClick={handleSubmitToMap}>
                <span>Submit to PurePlate Community Network</span>
                <span className="map-push-icon">🌐</span>
              </button>
              <button
                className="btn-close-test"
                id="btn-close-test"
                onClick={() => {
                  soundEngine.playClick();
                  onNavigateHome();
                }}
              >
                <span>Close &amp; Return to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
