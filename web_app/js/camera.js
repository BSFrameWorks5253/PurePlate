/**
 * PurePlate Camera Scanner & Optical Analysis Module
 * Handles WebRTC live feed, native photo capture/upload, circular targeting reticle,
 * color inspection probe, gyroscope angle detection, and high-fidelity simulated fallbacks
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
    const cameraBox = document.getElementById("camera-lens-box");

    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        if (this.isRealCameraActive) {
          this.stopCamera();
          this.renderSimulatedFeed(this.activeSimMode);
        } else {
          this.startCamera();
        }
      });
    }

    if (btnFlip) {
      btnFlip.addEventListener("click", () => {
        this.facingMode = this.facingMode === "environment" ? "user" : "environment";
        if (this.isRealCameraActive) {
          this.startCamera();
        }
      });
    }

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

    // Color picker probe when user clicks/taps on sample
    if (cameraBox) {
      cameraBox.addEventListener("click", (e) => {
        this.pickColorAtEvent(e);
      });
    }
  }

  // Native Photo Upload / Take Photo fallback
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
            this.videoEl.style.display = "none";
            this.canvasEl.width = 480;
            this.canvasEl.height = 360;

            // Draw captured image to fill canvas
            this.ctx.drawImage(img, 0, 0, 480, 360);

            // Sample center target pixel
            try {
              const pixel = this.ctx.getImageData(240, 180, 1, 1).data;
              const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
              this.updateColorDisplay(hex, `Captured Sample (${hex})`);

              // Auto match verdict based on color
              const isBlueOrDark = pixel[2] > pixel[0] || (pixel[0] < 80 && pixel[1] < 80);
              const targetBtn = isBlueOrDark ? document.getElementById("btn-choice-adulterated") : document.getElementById("btn-choice-pure");
              if (targetBtn) targetBtn.click();

              if (window.showAppToast) {
                window.showAppToast("📸 Photo analyzed successfully!", "success");
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

  // Setup Gyroscope DeviceOrientation event for the Water Trail slope test
  setupGyroscope() {
    if (window.DeviceOrientationEvent) {
      // iOS 13+ permission support
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const gyroOverlay = document.getElementById("gyro-sensor-overlay");
        if (gyroOverlay) {
          gyroOverlay.style.cursor = "pointer";
          gyroOverlay.title = "Tap to enable device motion sensors";
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
          if (angleText) {
            const isOptimal = angle >= 35 && angle <= 50;
            angleText.innerText = `Angle: ${angle}° (${isOptimal ? "Optimal 35-50°" : "Tilt to 45°"})`;
            angleText.style.color = isOptimal ? "#4ade80" : "#f59e0b";
          }
        }
      });
    }
  }

  // Start live device camera stream
  async startCamera() {
    try {
      if (this.mediaStream) {
        this.stopCamera();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebRTC camera not supported on this browser context.");
      }

      const constraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      this.videoEl.srcObject = stream;
      await this.videoEl.play();

      this.isRealCameraActive = true;
      this.videoEl.style.display = "block";
      this.canvasEl.style.display = "none";

      this.updateCameraToolbarState(true);
      if (window.showAppToast) {
        window.showAppToast("📹 Camera active. Align sample in the circular ring.", "info");
      }
    } catch (err) {
      console.warn("Camera start failed, falling back to simulation / upload:", err.message);
      this.isRealCameraActive = false;
      this.videoEl.style.display = "none";
      this.canvasEl.style.display = "block";
      this.renderSimulatedFeed(this.activeSimMode);
      this.updateCameraToolbarState(false);

      if (window.showAppToast) {
        window.showAppToast("ℹ️ Real camera requires HTTPS. Test Mode & Demo active!", "info");
      }
    }
  }

  // Stop camera stream
  stopCamera() {
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
    if (icon) icon.innerText = isActive ? "🔴" : "📹";
    if (txt) txt.innerText = isActive ? "Live Feed" : "Test Mode";
  }

  // Render high-fidelity simulated sample on canvas for easy demonstrations
  renderSimulatedFeed(mode) {
    this.activeSimMode = mode;
    this.videoEl.style.display = "none";
    this.canvasEl.style.display = "block";

    this.canvasEl.width = 480;
    this.canvasEl.height = 360;

    const ctx = this.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    // Draw realistic background (lab counter top with subtle gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0b1320");
    bgGrad.addColorStop(1, "#162035");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle table grid line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
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
    ctx.ellipse(cx, cy + 12, radius + 10, radius - 6, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill();

    // Glass rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
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
      milkGrad.addColorStop(1, "#fef3c7"); // faint yellow iodine tint
      ctx.fillStyle = milkGrad;
      ctx.fill();

      this.updateColorDisplay("#FAF8F5", "Pure Sample Hue (#FAF8F5)");
    } else {
      // Starch Adulterated: Deep iodine violet/ink blue reaction
      const starchGrad = ctx.createRadialGradient(cx - 15, cy - 15, 10, cx, cy, radius - 6);
      starchGrad.addColorStop(0, "#312e81"); // indigo
      starchGrad.addColorStop(0.4, "#1e1b4b"); // deep violet
      starchGrad.addColorStop(0.8, "#0f172a"); // dark midnight
      starchGrad.addColorStop(1, "#4338ca"); // blue streak
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

      this.updateColorDisplay("#1E1B4B", "Starch Reaction Complex (#1E1B4B)");
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

    // Auto sync choice buttons on Screen 3
    if (mode === "pure") {
      const btnPure = document.getElementById("btn-choice-pure");
      if (btnPure) btnPure.click();
    } else {
      const btnAdulterated = document.getElementById("btn-choice-adulterated");
      if (btnAdulterated) btnAdulterated.click();
    }
  }

  // Interactive color picker upon tapping sample
  pickColorAtEvent(e) {
    if (!this.canvasEl || this.canvasEl.style.display === "none") {
      return;
    }
    const rect = this.canvasEl.getBoundingClientRect();
    const scaleX = this.canvasEl.width / rect.width;
    const scaleY = this.canvasEl.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    try {
      const pixel = this.ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
      this.updateColorDisplay(hex, `Probed RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);

      // If bluish/dark, auto select adulterated, else pure
      const isBlueOrDark = pixel[2] > pixel[0] || (pixel[0] < 80 && pixel[1] < 80);
      if (isBlueOrDark) {
        const btn = document.getElementById("btn-choice-adulterated");
        if (btn) btn.click();
      } else {
        const btn = document.getElementById("btn-choice-pure");
        if (btn) btn.click();
      }
    } catch (err) {
      console.warn("Could not sample pixel:", err);
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
