/**
 * PurePlate Camera Scanner & Optical Analysis Engine
 * Real-time WebRTC camera streaming, live optical frame analysis loop,
 * circular reticle hue sampling, protocol-aware adulteration detection,
 * interactive tap-to-probe, gyroscope tilt tracking, and simulation fallbacks.
 */

class PurePlateCamera {
  constructor() {
    this.videoEl = document.getElementById("live-camera-video");
    this.canvasEl = document.getElementById("camera-capture-canvas");
    this.ctx = this.canvasEl ? this.canvasEl.getContext("2d") : null;

    this.mediaStream = null;
    this.facingMode = "environment"; // default to rear camera on mobile
    this.isRealCameraActive = false;
    this.activeSimMode = "pure"; // "pure" or "adulterated"
    this.detectedHex = "#FAF8F5";
    this.currentAngle = 45;
    this.lockedVerdict = null;

    // Real-time Frame Analysis Engine
    this.isAnalyzing = false;
    this.analysisTimer = null;
    this.sampleCanvas = document.createElement("canvas");
    this.sampleCtx = this.sampleCanvas.getContext("2d", { willReadFrequently: true });

    this.init();
  }

  init() {
    this.setupListeners();
    this.setupGyroscope();
    this.setupNativePhotoInput();
  }

  setupListeners() {
    const btnToggle = document.getElementById("btn-toggle-camera");
    const btnFlip = document.getElementById("btn-switch-lens");
    const btnSimPure = document.getElementById("btn-sim-pure");
    const btnSimAdulterated = document.getElementById("btn-sim-adulterated");
    const btnAnalyzeFrame = document.getElementById("btn-analyze-frame");
    const cameraBox = document.getElementById("camera-lens-box");
    const circularReticle = document.getElementById("circular-reticle");

    // Toggle real camera vs test mode
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        if (this.isRealCameraActive) {
          this.stopCamera();
          this.renderSimulatedFeed(this.activeSimMode);
          if (window.showAppToast) window.showAppToast("🧪 Test Mode active (Simulation)", "info");
        } else {
          this.startCamera();
        }
      });
    }

    // Flip between rear and front camera
    if (btnFlip) {
      btnFlip.addEventListener("click", async () => {
        this.facingMode = this.facingMode === "environment" ? "user" : "environment";
        if (this.isRealCameraActive) {
          await this.startCamera();
          if (window.showAppToast) {
            window.showAppToast(`🔄 Switched to ${this.facingMode === "user" ? "Front" : "Rear"} camera`, "info");
          }
        }
      });
    }

    // Trigger explicit instant optical analysis lock
    if (btnAnalyzeFrame) {
      btnAnalyzeFrame.addEventListener("click", () => {
        this.captureAndAnalyzeCurrentSample(true);
      });
    }

    // Tapping the reticle triggers instant sample lock
    if (circularReticle) {
      circularReticle.style.pointerEvents = "auto";
      circularReticle.style.cursor = "pointer";
      circularReticle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.captureAndAnalyzeCurrentSample(true);
      });
    }

    // Simulation sample picks
    if (btnSimPure) {
      btnSimPure.addEventListener("click", () => {
        this.setSimulationMode("pure");
      });
    }

    if (btnSimAdulterated) {
      btnSimAdulterated.addEventListener("click", () => {
        this.setSimulationMode("adulterated");
      });
    }

    // Tap/Click anywhere on camera feed to sample that point
    if (cameraBox) {
      cameraBox.addEventListener("click", (e) => {
        this.pickColorAtEvent(e);
      });
    }
  }

  // Setup Gyroscope DeviceOrientation for Milk Water Trail slope test
  setupGyroscope() {
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const gyroOverlay = document.getElementById("gyro-sensor-overlay");
        if (gyroOverlay) {
          gyroOverlay.style.cursor = "pointer";
          gyroOverlay.title = "Tap to enable gyroscope sensor";
          gyroOverlay.addEventListener("click", async () => {
            try {
              const permission = await DeviceOrientationEvent.requestPermission();
              if (permission === "granted") {
                if (window.showAppToast) window.showAppToast("📐 Gyroscope sensor enabled!", "success");
              }
            } catch (e) {}
          });
        }
      }

      window.addEventListener("deviceorientation", (event) => {
        if (event.beta !== null) {
          const angle = Math.round(Math.abs(event.beta));
          this.currentAngle = angle;
          const angleText = document.getElementById("gyro-angle-text");
          const bubblePip = document.getElementById("gyro-bubble-pip");
          if (angleText) {
            const isOptimal = angle >= 35 && angle <= 50;
            angleText.innerText = `Surface Angle: ${angle}° (${isOptimal ? "Optimal 35-50°" : "Tilt to 45°"})`;
            angleText.style.color = isOptimal ? "#10b981" : "#f59e0b";
          }
          if (bubblePip) {
            const offsetPct = Math.max(-40, Math.min(40, (angle - 45) * 2));
            bubblePip.style.transform = `translateX(${offsetPct}px)`;
          }
        }
      });
    }
  }

  // Native Photo Upload / Take Photo
  setupNativePhotoInput() {
    const btnPhoto = document.getElementById("btn-upload-photo");
    const fileInput = document.getElementById("camera-file-input");

    if (btnPhoto && fileInput) {
      btnPhoto.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            this.stopCamera();
            this.canvasEl.style.display = "block";
            if (this.videoEl) this.videoEl.style.display = "none";
            this.canvasEl.width = 480;
            this.canvasEl.height = 360;

            this.ctx.drawImage(img, 0, 0, 480, 360);

            // Sample center target pixel area
            try {
              const pixelData = this.ctx.getImageData(220, 160, 40, 40).data;
              let r = 0, g = 0, b = 0, count = 0;
              for (let i = 0; i < pixelData.length; i += 4) {
                r += pixelData[i];
                g += pixelData[i + 1];
                b += pixelData[i + 2];
                count++;
              }
              const avgR = Math.round(r / count);
              const avgG = Math.round(g / count);
              const avgB = Math.round(b / count);
              const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1).toUpperCase()}`;

              this.evaluateAndApplyOpticalReading(avgR, avgG, avgB, hex, "Uploaded Photo Analyzed");

              if (window.soundEngine) window.soundEngine.playSuccess();
              if (window.showAppToast) {
                window.showAppToast(`📸 Photo analyzed: Hue ${hex}`, "success");
              }
            } catch (err) {
              console.warn("Could not sample uploaded image:", err);
            }
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Start live device camera stream with progressive fallbacks
  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("[PurePlate Camera] getUserMedia not available in this context.");
      this.fallbackToSimulation("Camera not supported on this browser context");
      return;
    }

    try {
      if (this.mediaStream) {
        this.stopCamera();
      }

      // Constraints cascade: High-res environment -> basic environment -> default video
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: this.facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (err1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: this.facingMode },
            audio: false
          });
        } catch (err2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      this.mediaStream = stream;
      if (this.videoEl) {
        this.videoEl.srcObject = stream;
        this.videoEl.setAttribute("playsinline", "");
        this.videoEl.setAttribute("autoplay", "");
        this.videoEl.muted = true;
        this.videoEl.style.display = "block";
        await this.videoEl.play();
      }

      if (this.canvasEl) {
        this.canvasEl.style.display = "none";
      }

      this.isRealCameraActive = true;
      this.updateCameraToolbarState(true);

      // Start continuous optical frame analysis loop
      this.startLiveAnalysisLoop();

      if (window.showAppToast) {
        window.showAppToast("📹 Camera active. Align sample inside the circular ring.", "info");
      }
    } catch (err) {
      console.warn("[PurePlate Camera] Camera permission or device error:", err.message);
      this.fallbackToSimulation(err.name === "NotAllowedError" ? "Camera permission denied" : "Camera unavailable");
    }
  }

  fallbackToSimulation(reason) {
    this.isRealCameraActive = false;
    this.stopLiveAnalysisLoop();
    if (this.videoEl) this.videoEl.style.display = "none";
    if (this.canvasEl) this.canvasEl.style.display = "block";
    this.renderSimulatedFeed(this.activeSimMode);
    this.updateCameraToolbarState(false);

    if (window.showAppToast) {
      window.showAppToast(`ℹ️ ${reason}. Using Interactive Test Mode!`, "info");
    }
  }

  // Stop camera stream & analysis loop
  stopCamera() {
    this.stopLiveAnalysisLoop();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.isRealCameraActive = false;
    this.updateCameraToolbarState(false);
  }

  updateCameraToolbarState(isActive) {
    const icon = document.getElementById("cam-mode-icon");
    const txt = document.getElementById("cam-mode-text");
    const indicator = document.getElementById("camera-live-badge");

    if (icon) icon.innerText = isActive ? "🟢" : "🧪";
    if (txt) txt.innerText = isActive ? "Live Feed" : "Test Mode";
    if (indicator) {
      indicator.style.display = isActive ? "inline-flex" : "none";
    }
  }

  // =========================================================================
  // REAL-TIME OPTICAL FRAME ANALYZER LOOP
  // =========================================================================
  startLiveAnalysisLoop() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    // Run optical sampling 10 times per second (smooth, real-time, low battery impact)
    this.analysisTimer = setInterval(() => {
      if (!this.isRealCameraActive || !this.videoEl || this.videoEl.paused || this.videoEl.ended) {
        return;
      }

      if (this.videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.sampleVideoFrame();
      }
    }, 120);
  }

  stopLiveAnalysisLoop() {
    this.isAnalyzing = false;
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
  }

  // Sample center targeting circle from live video
  sampleVideoFrame() {
    const vw = this.videoEl.videoWidth || 640;
    const vh = this.videoEl.videoHeight || 480;
    if (vw === 0 || vh === 0) return;

    // Target the center 25% region of the camera frame
    const sampleSize = 48;
    this.sampleCanvas.width = sampleSize;
    this.sampleCanvas.height = sampleSize;

    const sourceCrop = Math.min(vw, vh) * 0.28;
    const sx = (vw - sourceCrop) / 2;
    const sy = (vh - sourceCrop) / 2;

    this.sampleCtx.drawImage(this.videoEl, sx, sy, sourceCrop, sourceCrop, 0, 0, sampleSize, sampleSize);

    try {
      const imgData = this.sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;
      let totalR = 0, totalG = 0, totalB = 0, count = 0;

      // Sample pixels in circular pattern
      const half = sampleSize / 2;
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          const dx = x - half;
          const dy = y - half;
          if (dx * dx + dy * dy <= half * half) {
            const idx = (y * sampleSize + x) * 4;
            totalR += imgData[idx];
            totalG += imgData[idx + 1];
            totalB += imgData[idx + 2];
            count++;
          }
        }
      }

      if (count > 0) {
        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);
        const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1).toUpperCase()}`;

        this.evaluateAndApplyOpticalReading(avgR, avgG, avgB, hex, "Live Optical Scan");
      }
    } catch (e) {
      // Ignore cross-origin sampling issues if any
    }
  }

  // Evaluate RGB against active protocol chemistry
  evaluateAndApplyOpticalReading(r, g, b, hex, sourceLabel = "Scan") {
    const activeProto = window.activeSelectedFoodProtocol || { id: "milk_starch" };
    let isAdulterated = false;
    let confidenceNote = "";

    if (activeProto.id === "milk_starch") {
      // Iodine + Starch creates deep triiodide blue-violet complex
      // Adulterated: Blue/Violet dominant (b is higher than r, or low brightness indigo)
      const isBlueShift = (b > r * 1.08 && b > g) || (b > 70 && r < 75 && g < 75);
      const isDarkPrecipitate = (r < 70 && g < 70 && b < 100);
      isAdulterated = isBlueShift || isDarkPrecipitate;

      if (isAdulterated) {
        confidenceNote = `⚠️ Starch Reaction Detected (${hex})`;
      } else {
        confidenceNote = `Pure Milk Hue (${hex})`;
      }
    } else if (activeProto.id === "turmeric_metanil") {
      // Metanil Yellow turns intense magenta/red-pink when acid is added
      const isPinkShift = (r > 150 && b > 80 && g < 110);
      isAdulterated = isPinkShift;
      confidenceNote = isAdulterated ? `⚠️ Metanil Dye Spike (${hex})` : `Pure Turmeric Yellow (${hex})`;
    } else if (activeProto.id === "honey_water") {
      // Honey dispersion turbidity
      const isTurbid = (r < 120 && g < 100);
      isAdulterated = isTurbid;
      confidenceNote = isAdulterated ? `⚠️ Adulterated Syrup (${hex})` : `Pure Honey Amber (${hex})`;
    } else {
      // General color detection
      isAdulterated = (b > r * 1.15);
      confidenceNote = isAdulterated ? `⚠️ Chemical Shift (${hex})` : `Standard Base (${hex})`;
    }

    // Update UI Swatch & Reticle
    this.updateColorDisplay(hex, `${confidenceNote} • ${sourceLabel}`);
    this.updateReticleVisuals(isAdulterated, hex);

    // Auto-select corresponding verdict button
    const btnPure = document.getElementById("btn-choice-pure");
    const btnAdulterated = document.getElementById("btn-choice-adulterated");
    const btnAnalyze = document.getElementById("btn-analyze-generate");

    if (isAdulterated) {
      if (btnAdulterated && !btnAdulterated.classList.contains("selected")) {
        btnAdulterated.classList.add("recommended-match");
      }
      if (btnPure) btnPure.classList.remove("recommended-match");
    } else {
      if (btnPure && !btnPure.classList.contains("selected")) {
        btnPure.classList.add("recommended-match");
      }
      if (btnAdulterated) btnAdulterated.classList.remove("recommended-match");
    }

    if (btnAnalyze && btnAnalyze.disabled) {
      // Auto-unlock analyze button once valid optical data is detected
      btnAnalyze.disabled = false;
      btnAnalyze.classList.remove("disabled");
    }

    return { isAdulterated, hex };
  }

  // Update reticle ring with dynamic glowing feedback
  updateReticleVisuals(isAdulterated, hex) {
    const reticle = document.getElementById("circular-reticle");
    const laser = document.getElementById("scanner-laser");
    if (!reticle) return;

    if (isAdulterated) {
      reticle.style.borderColor = "#a855f7";
      reticle.style.boxShadow = "0 0 24px rgba(168, 85, 247, 0.6), inset 0 0 16px rgba(168, 85, 247, 0.3)";
      if (laser) {
        laser.style.background = "linear-gradient(90deg, transparent 5%, #c084fc 35%, #ec4899 65%, transparent 95%)";
        laser.style.boxShadow = "0 0 14px rgba(192, 132, 252, 0.9)";
      }
    } else {
      reticle.style.borderColor = "#10b981";
      reticle.style.boxShadow = "0 0 24px rgba(16, 185, 129, 0.5), inset 0 0 16px rgba(16, 185, 129, 0.25)";
      if (laser) {
        laser.style.background = "linear-gradient(90deg, transparent 5%, #10b981 35%, #38bdf8 65%, transparent 95%)";
        laser.style.boxShadow = "0 0 14px rgba(16, 185, 129, 0.85)";
      }
    }
  }

  // Instant capture and lock
  captureAndAnalyzeCurrentSample(manualTrigger = true) {
    if (this.isRealCameraActive && this.videoEl) {
      this.sampleVideoFrame();
    }

    // Auto click matching button
    const btnPure = document.getElementById("btn-choice-pure");
    const btnAdulterated = document.getElementById("btn-choice-adulterated");

    const isMatchAdulterated = btnAdulterated && btnAdulterated.classList.contains("recommended-match");
    if (isMatchAdulterated) {
      if (btnAdulterated) btnAdulterated.click();
    } else {
      if (btnPure) btnPure.click();
    }

    if (manualTrigger) {
      if (window.soundEngine) window.soundEngine.playSuccess();
      if (window.showAppToast) {
        window.showAppToast(`⚡ Optical reading locked: ${this.detectedHex}`, "success");
      }
    }
  }

  // Tap-to-probe on camera viewport
  pickColorAtEvent(e) {
    if (this.isRealCameraActive && this.videoEl) {
      const rect = this.videoEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const vw = this.videoEl.videoWidth || 640;
      const vh = this.videoEl.videoHeight || 480;

      const scaleX = vw / rect.width;
      const scaleY = vh / rect.height;
      const vidX = Math.max(0, Math.min(vw - 1, Math.floor(clickX * scaleX)));
      const vidY = Math.max(0, Math.min(vh - 1, Math.floor(clickY * scaleY)));

      this.sampleCanvas.width = 1;
      this.sampleCanvas.height = 1;
      this.sampleCtx.drawImage(this.videoEl, vidX, vidY, 1, 1, 0, 0, 1, 1);
      const pixel = this.sampleCtx.getImageData(0, 0, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;

      this.evaluateAndApplyOpticalReading(pixel[0], pixel[1], pixel[2], hex, "Tapped Coordinate");
      if (window.soundEngine) window.soundEngine.playClick();
      return;
    }

    if (this.canvasEl && this.canvasEl.style.display !== "none") {
      const rect = this.canvasEl.getBoundingClientRect();
      const scaleX = this.canvasEl.width / rect.width;
      const scaleY = this.canvasEl.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      try {
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
        this.evaluateAndApplyOpticalReading(pixel[0], pixel[1], pixel[2], hex, "Tapped Sample");
        if (window.soundEngine) window.soundEngine.playClick();
      } catch (err) {}
    }
  }

  // Render high-fidelity simulated sample on canvas for easy demonstrations
  renderSimulatedFeed(mode) {
    this.activeSimMode = mode;
    if (this.videoEl) this.videoEl.style.display = "none";
    if (this.canvasEl) this.canvasEl.style.display = "block";

    this.canvasEl.width = 480;
    this.canvasEl.height = 360;

    const ctx = this.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    // Clean neutral lab surface
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isDark) {
      bgGrad.addColorStop(0, "#0b1320");
      bgGrad.addColorStop(1, "#162035");
    } else {
      bgGrad.addColorStop(0, "#f1f5f9");
      bgGrad.addColorStop(1, "#e2e8f0");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle table grid line
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 40; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }

    // Draw Glass Cup Rim and Body in center
    const cx = w / 2;
    const cy = h / 2;
    const radius = 95;

    // Cup shadow
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, radius + 12, radius - 6, 0, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(0, 0, 0, 0.12)";
    ctx.fill();

    // Glass rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.85)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(148, 163, 184, 0.8)";
    ctx.stroke();

    // Liquid inside cup
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, 2 * Math.PI);

    if (mode === "pure") {
      // Pure milk: Creamy white with faint amber iodine rim
      const milkGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, radius - 6);
      milkGrad.addColorStop(0, "#ffffff");
      milkGrad.addColorStop(0.7, "#f8fafc");
      milkGrad.addColorStop(0.92, "#f1f5f9");
      milkGrad.addColorStop(1, "#fef3c7");
      ctx.fillStyle = milkGrad;
      ctx.fill();

      this.evaluateAndApplyOpticalReading(250, 248, 245, "#FAF8F5", "Simulated Pure");
    } else {
      // Starch Adulterated: Deep iodine violet/ink blue reaction
      const starchGrad = ctx.createRadialGradient(cx - 15, cy - 15, 10, cx, cy, radius - 6);
      starchGrad.addColorStop(0, "#312e81");
      starchGrad.addColorStop(0.4, "#1e1b4b");
      starchGrad.addColorStop(0.8, "#0f172a");
      starchGrad.addColorStop(1, "#4338ca");
      ctx.fillStyle = starchGrad;
      ctx.fill();

      // Swirl streaks of violet iodine precipitate
      ctx.beginPath();
      ctx.ellipse(cx - 25, cy - 10, 45, 25, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(67, 56, 202, 0.75)";
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx + 20, cy + 25, 35, 18, -Math.PI / 6, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(30, 27, 75, 0.9)";
      ctx.fill();

      this.evaluateAndApplyOpticalReading(30, 27, 75, "#1E1B4B", "Simulated Starch Spike");
    }

    // Glass reflection highlights
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, -Math.PI / 3, -Math.PI / 6);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.stroke();
  }

  setSimulationMode(mode) {
    this.stopCamera();
    this.activeSimMode = mode;
    this.renderSimulatedFeed(mode);

    const btnPure = document.getElementById("btn-choice-pure");
    const btnAdulterated = document.getElementById("btn-choice-adulterated");
    if (mode === "pure") {
      if (btnPure) btnPure.click();
    } else {
      if (btnAdulterated) btnAdulterated.click();
    }
  }

  updateColorDisplay(hex, confidenceText) {
    this.detectedHex = hex;
    const swatch = document.getElementById("swatch-color-box");
    const hexText = document.getElementById("swatch-color-hex");
    const conf = document.getElementById("color-confidence-text");

    if (swatch) swatch.style.backgroundColor = hex;
    if (hexText) hexText.innerText = hex;
    if (conf && confidenceText) conf.innerText = confidenceText;
  }
}

window.PurePlateCamera = PurePlateCamera;
