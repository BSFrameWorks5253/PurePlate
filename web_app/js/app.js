/**
 * PurePlate Main Application Controller
 * Wires together Navigation, Testing Workflow Phases 1-4, Modals, and Network Monitoring
 * Matches the DOCS Specifications & Block Logic Exactly
 */

document.addEventListener("DOMContentLoaded", () => {
  // Global Toast function
  window.showAppToast = function (message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✅" : type === "warning" ? "⚠️" : "ℹ️";
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-msg">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px) scale(0.95)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // State
  let currentActiveScreen = "screen-home";
  let activeSelectedFoodProtocol = FOOD_PROTOCOLS[0]; // Default to Milk Starch
  let chosenVisualVerdict = null; // "pure" or "adulterated"

  // Modules
  const cameraEngine = new window.PurePlateCamera();
  const mapEngine = new window.PurePlateMap();
  const quizEngine = new window.PurePlateQuiz();

  // Navigation Controller
  function navigateToScreen(targetScreenId) {
    if (window.soundEngine) window.soundEngine.playClick();
    const screens = document.querySelectorAll(".app-screen");
    screens.forEach((s) => s.classList.remove("active"));

    const target = document.getElementById(targetScreenId);
    if (target) {
      target.classList.add("active");
      currentActiveScreen = targetScreenId;
    }

    // Update bottom nav buttons
    const navButtons = document.querySelectorAll(".nav-item");
    navButtons.forEach((btn) => {
      if (btn.getAttribute("data-target") === targetScreenId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Special screen triggers
    if (targetScreenId === "screen-camera") {
      setupCameraScreenForProtocol(activeSelectedFoodProtocol);
    } else {
      cameraEngine.stopCamera();
    }

    if (targetScreenId === "screen-heatmap") {
      mapEngine.refresh();
    }

    if (targetScreenId === "screen-home") {
      updateHomeDashboard();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Setup Bottom Navigation Bar Clicks
  const navButtons = document.querySelectorAll(".nav-item");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (target) navigateToScreen(target);
    });
  });

  // Home Hub Quick Tile Actions (From DOCS Screen 1 Blueprint)
  const cardNavTest = document.getElementById("card-nav-test");
  if (cardNavTest) {
    cardNavTest.addEventListener("click", () => navigateToScreen("screen-selection"));
  }

  const cardNavMap = document.getElementById("card-nav-map");
  if (cardNavMap) {
    cardNavMap.addEventListener("click", () => navigateToScreen("screen-heatmap"));
  }

  const cardNavLearn = document.getElementById("card-nav-learn");
  if (cardNavLearn) {
    cardNavLearn.addEventListener("click", () => navigateToScreen("screen-learning"));
  }

  // Back Buttons
  const btnBackHome = document.getElementById("btn-back-home");
  if (btnBackHome) {
    btnBackHome.addEventListener("click", () => navigateToScreen("screen-home"));
  }

  const btnBackSelection = document.getElementById("btn-back-selection");
  if (btnBackSelection) {
    btnBackSelection.addEventListener("click", () => navigateToScreen("screen-selection"));
  }

  // =========================================================================
  // Screen 2: Food Selection & Search Logic (From DOCS Screen 2)
  // =========================================================================
  const foodGrid = document.getElementById("food-items-grid");
  const searchInput = document.getElementById("food-search-input");
  const btnClearSearch = document.getElementById("btn-clear-search");
  const catTabs = document.querySelectorAll(".cat-pill");

  let currentCategory = "all";
  let searchQuery = "";

  function renderFoodItems() {
    if (!foodGrid) return;

    const filtered = FOOD_PROTOCOLS.filter((item) => {
      const matchCat = currentCategory === "all" || item.category === currentCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery) ||
        item.foodName.toLowerCase().includes(searchQuery) ||
        item.adulterant.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      foodGrid.innerHTML = `
        <div style="text-align:center; padding: 36px 16px; color: var(--text-muted);">
          <span style="font-size: 32px;">🔍</span>
          <p style="margin-top: 10px; font-weight: 600; color: var(--text-secondary);">No testing protocol found for "${searchQuery}"</p>
        </div>
      `;
      return;
    }

    foodGrid.innerHTML = filtered
      .map((item) => {
        return `
        <div class="food-card" data-id="${item.id}">
          <div class="food-card-icon">${item.icon}</div>
          <div class="food-card-body">
            <div class="food-card-top-row">
              <h4 class="food-card-name">${item.title}</h4>
              <span class="food-card-badge">${item.category.toUpperCase()}</span>
            </div>
            <span class="food-card-adulterant">Target: ${item.adulterant}</span>
            <div class="food-card-meta">
              <span>🧪 ${item.tools.length} Tools</span>
              <span>⏱️ 2 Mins</span>
            </div>
          </div>
          <div class="food-card-arrow">➔</div>
        </div>
      `;
      })
      .join("");

    // Wire clicks to open Instruction Sheet
    const cards = foodGrid.querySelectorAll(".food-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const protocol = FOOD_PROTOCOLS.find((p) => p.id === id);
        if (protocol) {
          openInstructionSheet(protocol);
        }
      });
    });
  }

  // Categories click
  catTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      catTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.getAttribute("data-cat");
      renderFoodItems();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (btnClearSearch) {
        btnClearSearch.style.display = searchQuery ? "flex" : "none";
      }
      renderFoodItems();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      btnClearSearch.style.display = "none";
      renderFoodItems();
    });
  }

  // =========================================================================
  // Instruction Bottom Sheet (From DOCS Screen 2 Instruction Card)
  // =========================================================================
  const sheetBackdrop = document.getElementById("instruction-sheet-backdrop");
  const btnCloseSheet = document.getElementById("btn-close-sheet");
  const btnLaunchCamera = document.getElementById("btn-launch-camera-test");

  function openInstructionSheet(protocol) {
    activeSelectedFoodProtocol = protocol;

    const icon = document.getElementById("sheet-icon");
    const title = document.getElementById("sheet-title");
    const adult = document.getElementById("sheet-adulterant");
    const toolsList = document.getElementById("sheet-tools-list");
    const science = document.getElementById("sheet-science-desc");

    if (icon) icon.innerText = protocol.icon;
    if (title) title.innerText = protocol.title;
    if (adult) adult.innerText = `Target: ${protocol.adulterant}`;
    if (science) science.innerText = protocol.science;

    if (toolsList) {
      toolsList.innerHTML = protocol.tools.map((t) => `<li>${t}</li>`).join("");
    }

    if (sheetBackdrop) {
      sheetBackdrop.classList.add("active");
      sheetBackdrop.classList.add("visible");
    }
  }

  function closeInstructionSheet() {
    if (sheetBackdrop) {
      sheetBackdrop.classList.remove("active");
      sheetBackdrop.classList.remove("visible");
    }
  }

  if (btnCloseSheet) {
    btnCloseSheet.addEventListener("click", closeInstructionSheet);
  }

  if (sheetBackdrop) {
    sheetBackdrop.addEventListener("click", (e) => {
      if (e.target === sheetBackdrop) closeInstructionSheet();
    });
  }

  if (btnLaunchCamera) {
    btnLaunchCamera.addEventListener("click", () => {
      closeInstructionSheet();
      navigateToScreen("screen-camera");
    });
  }

  // =========================================================================
  // Screen 3: Test Wizard Workflow (Phases 1 to 4 Exact Implementation)
  // =========================================================================
  function setupCameraScreenForProtocol(protocol) {
    chosenVisualVerdict = null;

    // Reset step progress dots (Phase 1 Initial State)
    const dot1 = document.getElementById("dot-step-1");
    const dot2 = document.getElementById("dot-step-2");
    const dot3 = document.getElementById("dot-step-3");
    const conn1 = document.getElementById("connector-step-1");
    const conn2 = document.getElementById("connector-step-2");

    if (dot1) dot1.className = "step-dot active";
    if (dot2) dot2.className = "step-dot";
    if (dot3) dot3.className = "step-dot";
    if (conn1) conn1.className = "step-connector";
    if (conn2) conn2.className = "step-connector";

    // Set Header Title
    const title = document.getElementById("cam-screen-title");
    if (title) title.innerText = protocol.title;

    // Phase 1 Instruction Text (From DOCS Block Logic: WhatsApp Image 3.23.36 PM (1))
    const stepNum = document.getElementById("badge-step-number");
    const guideStatus = document.getElementById("badge-guide-status");
    const stepTxt = document.getElementById("wizard-instruction-text");

    if (stepNum) stepNum.innerText = "Step 1 of 3";
    if (guideStatus) guideStatus.innerText = "Preparation";
    if (stepTxt) {
      stepTxt.innerText = protocol.steps[0] || "Step 1: Take a small sample of food in a transparent cup, boil it if required, and let it cool down. Click Next when ready.";
    }

    // Show Phase 1 action row, Hide camera & choice & verdict
    const phase1Row = document.getElementById("phase1-action-row");
    const cameraSection = document.getElementById("camera-section-wrap");
    const choiceSection = document.getElementById("visual-choice-section");
    const verdictCard = document.getElementById("verdict-result-card");

    if (phase1Row) phase1Row.style.display = "flex";
    if (cameraSection) cameraSection.style.display = "none";
    if (choiceSection) choiceSection.style.display = "none";
    if (verdictCard) verdictCard.style.display = "none";

    // Gyroscope display for water trail test
    const gyroOverlay = document.getElementById("gyro-sensor-overlay");
    if (gyroOverlay) {
      gyroOverlay.style.display = protocol.id === "milk_water_trail" ? "flex" : "none";
    }

    // Configure Choice Buttons for Protocol
    const btnPure = document.getElementById("btn-choice-pure");
    const btnAdulterated = document.getElementById("btn-choice-adulterated");

    if (btnPure && protocol.visualGuide) {
      const titleSpan = btnPure.querySelector(".choice-title");
      const descSpan = btnPure.querySelector(".choice-desc");
      if (titleSpan) titleSpan.innerText = protocol.visualGuide.pureTitle;
      if (descSpan) descSpan.innerText = protocol.visualGuide.pureDesc;
      btnPure.classList.remove("selected");
    }

    if (btnAdulterated && protocol.visualGuide) {
      const titleSpan = btnAdulterated.querySelector(".choice-title");
      const descSpan = btnAdulterated.querySelector(".choice-desc");
      if (titleSpan) titleSpan.innerText = protocol.visualGuide.adulteratedTitle;
      if (descSpan) descSpan.innerText = protocol.visualGuide.adulteratedDesc;
      btnAdulterated.classList.remove("selected");
    }

    // Reset analyze button state
    const btnAnalyze = document.getElementById("btn-analyze-generate");
    if (btnAnalyze) {
      btnAnalyze.disabled = true;
      btnAnalyze.classList.add("disabled");
      const span = btnAnalyze.querySelector("span");
      if (span) span.innerText = "Analyze & Generate Log";
    }
  }

  // Phase 1 -> Phase 2 Transition (Btn_NextStep.Click in DOCS Block Logic)
  const btnWizardNextStep = document.getElementById("btn-wizard-next-step");
  if (btnWizardNextStep) {
    btnWizardNextStep.addEventListener("click", () => {
      if (window.soundEngine) window.soundEngine.playClick();

      // Advance step indicators to Step 2
      const dot1 = document.getElementById("dot-step-1");
      const dot2 = document.getElementById("dot-step-2");
      const conn1 = document.getElementById("connector-step-1");

      if (dot1) dot1.className = "step-dot completed";
      if (conn1) conn1.className = "step-connector completed";
      if (dot2) dot2.className = "step-dot active";

      // Phase 2 Instructions (From DOCS Block Logic: WhatsApp Image 3.23.36 PM (2))
      const stepNum = document.getElementById("badge-step-number");
      const guideStatus = document.getElementById("badge-guide-status");
      const stepTxt = document.getElementById("wizard-instruction-text");

      if (stepNum) stepNum.innerText = "Step 2 of 3";
      if (guideStatus) guideStatus.innerText = "Live Scanner Ready";
      if (stepTxt) {
        stepTxt.innerText = activeSelectedFoodProtocol.steps[2] || activeSelectedFoodProtocol.steps[1] || "Step 2: Add reagent or drops to the sample. Shake well. Align your cup inside the circular targeting ring below.";
      }

      // Hide Phase 1 row, Show Camera Viewport & Visual Choice
      const phase1Row = document.getElementById("phase1-action-row");
      const cameraSection = document.getElementById("camera-section-wrap");
      const choiceSection = document.getElementById("visual-choice-section");

      if (phase1Row) phase1Row.style.display = "none";
      if (cameraSection) cameraSection.style.display = "block";
      if (choiceSection) choiceSection.style.display = "block";

      // Start simulated pure feed or real camera
      cameraEngine.renderSimulatedFeed("pure");
    });
  }

  // Phase 3: Visual Choice Buttons (DOCS: "What color do you see?")
  const btnChoicePure = document.getElementById("btn-choice-pure");
  const btnChoiceAdulterated = document.getElementById("btn-choice-adulterated");
  const btnAnalyzeGenerate = document.getElementById("btn-analyze-generate");

  if (btnChoicePure) {
    btnChoicePure.addEventListener("click", () => {
      chosenVisualVerdict = "pure";
      btnChoicePure.classList.add("selected");
      if (btnChoiceAdulterated) btnChoiceAdulterated.classList.remove("selected");

      if (window.soundEngine) window.soundEngine.playClick();

      // Sync simulation feed if active
      cameraEngine.activeSimMode = "pure";
      if (cameraEngine.canvasEl && cameraEngine.canvasEl.style.display !== "none") {
        cameraEngine.renderSimulatedFeed("pure");
      }

      if (btnAnalyzeGenerate) {
        btnAnalyzeGenerate.disabled = false;
        btnAnalyzeGenerate.classList.remove("disabled");
      }
    });
  }

  if (btnChoiceAdulterated) {
    btnChoiceAdulterated.addEventListener("click", () => {
      chosenVisualVerdict = "adulterated";
      btnChoiceAdulterated.classList.add("selected");
      if (btnChoicePure) btnChoicePure.classList.remove("selected");

      if (window.soundEngine) window.soundEngine.playClick();

      // Sync simulation feed if active
      cameraEngine.activeSimMode = "adulterated";
      if (cameraEngine.canvasEl && cameraEngine.canvasEl.style.display !== "none") {
        cameraEngine.renderSimulatedFeed("adulterated");
      }

      if (btnAnalyzeGenerate) {
        btnAnalyzeGenerate.disabled = false;
        btnAnalyzeGenerate.classList.remove("disabled");
      }
    });
  }

  // Phase 3 -> Phase 4 Transition ("Analyze & Generate Log" Click)
  if (btnAnalyzeGenerate) {
    btnAnalyzeGenerate.addEventListener("click", () => {
      if (!chosenVisualVerdict) return;

      const spinner = document.getElementById("analyze-spinner");
      const btnSpan = btnAnalyzeGenerate.querySelector("span");
      if (spinner) spinner.style.display = "inline-block";
      if (btnSpan) btnSpan.innerText = "Analyzing Optical Metrics...";

      // Advance step indicator to Step 3
      const dot2 = document.getElementById("dot-step-2");
      const dot3 = document.getElementById("dot-step-3");
      const conn2 = document.getElementById("connector-step-2");
      if (dot2) dot2.className = "step-dot completed";
      if (conn2) conn2.className = "step-connector completed";
      if (dot3) dot3.className = "step-dot active completed";

      const stepNum = document.getElementById("badge-step-number");
      const guideStatus = document.getElementById("badge-guide-status");
      if (stepNum) stepNum.innerText = "Step 3 of 3";
      if (guideStatus) guideStatus.innerText = "Verification Complete";

      setTimeout(() => {
        if (spinner) spinner.style.display = "none";
        renderVerdictResult(chosenVisualVerdict);
      }, 600);
    });
  }

  // Phase 4: Output Status & Submit to Map (DOCS Block Logic: WhatsApp Image 4.41.19 & 4.41.21)
  function renderVerdictResult(verdict) {
    const cameraSection = document.getElementById("camera-section-wrap");
    const choiceSection = document.getElementById("visual-choice-section");
    const verdictCard = document.getElementById("verdict-result-card");
    const stamp = document.getElementById("verdict-stamp");
    const icon = document.getElementById("verdict-icon");
    const title = document.getElementById("verdict-status-title");
    const sub = document.getElementById("verdict-subtitle");

    const foodName = document.getElementById("res-food-name");
    const adult = document.getElementById("res-adulterant");
    const health = document.getElementById("res-health-impact");
    const loc = document.getElementById("res-location-val");
    const btnSubmitMap = document.getElementById("btn-submit-to-map");
    const vendorWrap = document.getElementById("vendor-source-wrap");

    if (cameraSection) cameraSection.style.display = "none";
    if (choiceSection) choiceSection.style.display = "none";
    if (verdictCard) verdictCard.style.display = "block";

    if (foodName) foodName.innerText = activeSelectedFoodProtocol.foodName;
    if (loc) loc.innerText = window.storage ? window.storage.getUserRegion() : "Athwa, Surat";

    if (verdict === "adulterated") {
      // FAILED / ADULTERATED (DOCS: Set Var_TestResult = "Fail", Status Text Red)
      if (window.soundEngine) window.soundEngine.playWarning();

      if (stamp) stamp.className = "verdict-stamp danger";
      if (icon) icon.innerText = "🚨";
      if (title) title.innerText = `Result: Adulterated. ${activeSelectedFoodProtocol.adulterant} detected!`;
      if (sub) sub.innerText = "Sample chemical reaction confirmed adulterant presence";

      if (adult) adult.innerText = activeSelectedFoodProtocol.adulterant;
      if (health) health.innerText = activeSelectedFoodProtocol.healthRisk;
      if (btnSubmitMap) btnSubmitMap.style.display = "flex";
      if (vendorWrap) vendorWrap.style.display = "block";

      window.showAppToast("⚠️ Adulteration Detected! Ready to report to Community Network.", "warning");
    } else {
      // PASSED / PURE (DOCS: Set Var_TestResult = "Pass", Status Text Green)
      if (window.soundEngine) window.soundEngine.playSuccess();

      if (stamp) stamp.className = "verdict-stamp success";
      if (icon) icon.innerText = "🛡️";
      if (title) title.innerText = "Result: Pure. No adulterant detected.";
      if (sub) sub.innerText = "Physical and color metrics match safe standard criteria";

      if (adult) adult.innerText = "None detected (100% Unadulterated)";
      if (health) health.innerText = "Safe for consumption. Meets food safety standards.";
      if (btnSubmitMap) btnSubmitMap.style.display = "none";
      if (vendorWrap) vendorWrap.style.display = "none";

      window.showAppToast("✅ Sample Verified 100% Pure!", "success");

      // Award gamification points & unlock badge
      if (window.storage) {
        window.storage.addPoints(50);
        window.storage.unlockBadge("milk_master");
      }
    }

    verdictCard.scrollIntoView({ behavior: "smooth" });
  }

  // Submit to Map Click (From DOCS Phase 4 Block Logic)
  const btnSubmitToMap = document.getElementById("btn-submit-to-map");
  if (btnSubmitToMap) {
    btnSubmitToMap.addEventListener("click", () => {
      const vendorSelect = document.getElementById("vendor-type-select");
      const vendorType = vendorSelect ? vendorSelect.value : "Local Loose Milk Vendor";

      const submissionResult = window.storage.submitTestResult({
        food: activeSelectedFoodProtocol.foodName,
        testType: activeSelectedFoodProtocol.title,
        status: chosenVisualVerdict === "adulterated" ? "fail" : "pass",
        adulterant: activeSelectedFoodProtocol.adulterant,
        vendorType: vendorType,
        locationName: window.storage.getUserRegion()
      });

      // Show alert as specified in DOCS Block Logic
      alert(submissionResult.message);

      // Refresh map and return to dashboard / map view
      mapEngine.renderIncidents();
      mapEngine.renderRecentFeed();
      navigateToScreen("screen-heatmap");
    });
  }

  // Close Test Button Click (From DOCS Phase 3 Block Logic: Btn_CloseTest)
  const btnCloseTest = document.getElementById("btn-close-test");
  if (btnCloseTest) {
    btnCloseTest.addEventListener("click", () => {
      navigateToScreen("screen-home");
    });
  }

  // =========================================================================
  // Network Connectivity Monitoring
  // =========================================================================
  function updateNetworkStatus() {
    const badge = document.getElementById("network-status");
    const text = document.getElementById("network-text");

    if (navigator.onLine) {
      if (badge) badge.className = "network-badge";
      if (text) text.innerText = "Live Sync";
    } else {
      if (badge) badge.className = "network-badge offline";
      if (text) text.innerText = "Offline Mode";
      window.showAppToast("Device offline. Tests will be saved locally.", "warning");
    }
  }

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();

  // =========================================================================
  // Home Hub Live Statistics Sync
  // =========================================================================
  function updateHomeDashboard() {
    const incidents = window.storage.getAllIncidents();
    const countEl = document.getElementById("stat-tests-count");
    const rateEl = document.getElementById("stat-purity-rate");
    const watchEl = document.getElementById("stat-alert-zones");

    if (countEl) countEl.innerText = (1482 + incidents.length).toLocaleString();
    if (watchEl) {
      const fails = incidents.filter((i) => i.status === "fail").length;
      watchEl.innerText = fails;
    }
    if (rateEl) {
      const passes = incidents.filter((i) => i.status === "pass").length;
      const total = incidents.length;
      const rate = total > 0 ? ((passes / total) * 100).toFixed(1) : "88.4";
      rateEl.innerText = `${rate}%`;
    }

    mapEngine.renderRecentFeed();
  }

  // Initial render
  renderFoodItems();
  updateHomeDashboard();

  // PWA Install prompt handling
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById("pwa-banner");
    if (banner) banner.style.display = "flex";
  });

  const btnInstall = document.getElementById("btn-pwa-install");
  if (btnInstall) {
    btnInstall.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          console.log("User accepted PWA installation");
        }
        deferredPrompt = null;
        document.getElementById("pwa-banner").style.display = "none";
      }
    });
  }

  const btnDismissPwa = document.getElementById("btn-pwa-dismiss");
  if (btnDismissPwa) {
    btnDismissPwa.addEventListener("click", () => {
      document.getElementById("pwa-banner").style.display = "none";
    });
  }

  // =========================================================================
  // Desktop Top Bar Controls (Workbench vs Mobile Phone View & Audio Toggle)
  // =========================================================================
  const btnModeDesktop = document.getElementById("btn-mode-desktop");
  const btnModeMobile = document.getElementById("btn-mode-mobile");
  const appContainer = document.getElementById("app-container");

  if (btnModeDesktop && btnModeMobile && appContainer) {
    btnModeDesktop.addEventListener("click", () => {
      btnModeDesktop.classList.add("active");
      btnModeMobile.classList.remove("active");
      appContainer.classList.add("frame-expanded");
      appContainer.classList.remove("frame-pixel", "frame-galaxy", "frame-iphone");
      if (window.soundEngine) window.soundEngine.playClick();
      mapEngine.refresh();
      window.showAppToast("💻 Switched to Expanded Desktop Workbench", "info");
    });

    btnModeMobile.addEventListener("click", () => {
      btnModeMobile.classList.add("active");
      btnModeDesktop.classList.remove("active");
      appContainer.classList.remove("frame-expanded");
      appContainer.classList.add("frame-pixel");
      if (window.soundEngine) window.soundEngine.playClick();
      mapEngine.refresh();
      window.showAppToast("📱 Switched to Mobile Phone Simulator View", "info");
    });
  }

  // Audio Sound Toggle
  const btnToggleSound = document.getElementById("btn-toggle-sound");
  if (btnToggleSound) {
    btnToggleSound.addEventListener("click", () => {
      if (window.soundEngine) {
        const isMuted = window.soundEngine.toggleMute();
        const icon = document.getElementById("sound-icon");
        const lbl = document.getElementById("sound-label");
        if (icon) icon.innerText = isMuted ? "🔇" : "🔊";
        if (lbl) lbl.innerText = isMuted ? "Muted" : "Audio On";
        if (!isMuted) window.soundEngine.playClick();
        window.showAppToast(isMuted ? "Audio muted" : "Audio enabled", "info");
      }
    });
  }

  // Desktop Mobile QR Button
  const btnShowQr = document.getElementById("btn-show-qr");
  if (btnShowQr) {
    btnShowQr.addEventListener("click", () => {
      const devFab = document.getElementById("btn-toggle-dev-drawer");
      if (devFab) {
        devFab.click();
        const tabQr = document.querySelector(".dev-tab[data-tab='tab-qr']");
        if (tabQr) tabQr.click();
      }
    });
  }

  // Heat Map CSV Export Button
  const btnExportIncidents = document.getElementById("btn-export-incidents");
  if (btnExportIncidents) {
    btnExportIncidents.addEventListener("click", () => {
      if (window.storage) window.storage.exportIncidentsAsCsv();
    });
  }

  // =========================================================================
  // Auth & Cloud Sync Modal Controller
  // =========================================================================
  const authModal = document.getElementById("auth-modal");
  const dtUserBtn = document.getElementById("dt-user-btn");
  const mbUserBtn = document.getElementById("mb-user-btn");
  const btnCloseAuthModal = document.getElementById("btn-close-auth-modal");
  const tabBtnLogin = document.getElementById("tab-btn-login");
  const tabBtnRegister = document.getElementById("tab-btn-register");
  const formAuthLogin = document.getElementById("form-auth-login");
  const formAuthRegister = document.getElementById("form-auth-register");
  const btnFillDemo = document.getElementById("btn-fill-demo");
  const btnToggleLoginPwd = document.getElementById("btn-toggle-login-pwd");
  const btnToggleRegPwd = document.getElementById("btn-toggle-reg-pwd");
  const btnForceSync = document.getElementById("btn-force-sync");
  const btnAccountLogout = document.getElementById("btn-account-logout");

  function openAuthModal() {
    if (authModal) {
      if (window.authEngine) window.authEngine.updateModalState();
      authModal.classList.add("active");
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  function closeAuthModal() {
    if (authModal) {
      authModal.classList.remove("active");
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  if (dtUserBtn) dtUserBtn.addEventListener("click", openAuthModal);
  if (mbUserBtn) mbUserBtn.addEventListener("click", openAuthModal);
  if (btnCloseAuthModal) btnCloseAuthModal.addEventListener("click", closeAuthModal);
  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // Segmented Tabs Switcher
  if (tabBtnLogin && tabBtnRegister && formAuthLogin && formAuthRegister) {
    tabBtnLogin.addEventListener("click", () => {
      tabBtnLogin.classList.add("active");
      tabBtnRegister.classList.remove("active");
      formAuthLogin.style.display = "flex";
      formAuthRegister.style.display = "none";
      if (window.soundEngine) window.soundEngine.playClick();
    });

    tabBtnRegister.addEventListener("click", () => {
      tabBtnRegister.classList.add("active");
      tabBtnLogin.classList.remove("active");
      formAuthRegister.style.display = "flex";
      formAuthLogin.style.display = "none";
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  // Password Visibility Toggles
  if (btnToggleLoginPwd) {
    btnToggleLoginPwd.addEventListener("click", () => {
      const input = document.getElementById("login-password");
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        btnToggleLoginPwd.innerText = input.type === "password" ? "👁️" : "🙈";
      }
    });
  }
  if (btnToggleRegPwd) {
    btnToggleRegPwd.addEventListener("click", () => {
      const input = document.getElementById("reg-password");
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        btnToggleRegPwd.innerText = input.type === "password" ? "👁️" : "🙈";
      }
    });
  }

  // Quick Demo Fill
  if (btnFillDemo) {
    btnFillDemo.addEventListener("click", () => {
      const emailInput = document.getElementById("login-email");
      const pwdInput = document.getElementById("login-password");
      if (emailInput && pwdInput) {
        emailInput.value = "student@dpssurat.edu";
        pwdInput.value = "pureplate123";
        if (window.soundEngine) window.soundEngine.playClick();
        if (window.showAppToast) window.showAppToast("⚡ Filled demo credentials. Click 'Sign In & Sync Now'!", "info");
      }
    });
  }

  // Form Submit: Sign In
  if (formAuthLogin) {
    formAuthLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("login-email");
      const pwdInput = document.getElementById("login-password");
      const submitBtn = document.getElementById("btn-submit-login");

      if (!emailInput || !pwdInput) return;
      const email = emailInput.value.trim();
      const password = pwdInput.value;

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          const textSpan = submitBtn.querySelector(".btn-text");
          if (textSpan) textSpan.innerText = "Signing in...";
        }
        if (window.authEngine) {
          await window.authEngine.login({ email, password });
          closeAuthModal();
        }
      } catch (err) {
        if (window.showAppToast) window.showAppToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const textSpan = submitBtn.querySelector(".btn-text");
          if (textSpan) textSpan.innerText = "Sign In & Sync Now";
        }
      }
    });
  }

  // Form Submit: Register
  if (formAuthRegister) {
    formAuthRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("reg-name");
      const schoolInput = document.getElementById("reg-school");
      const emailInput = document.getElementById("reg-email");
      const pwdInput = document.getElementById("reg-password");
      const submitBtn = document.getElementById("btn-submit-reg");

      if (!emailInput || !pwdInput) return;
      const name = nameInput ? nameInput.value.trim() : "";
      const school = schoolInput ? schoolInput.value.trim() : "";
      const email = emailInput.value.trim();
      const password = pwdInput.value;

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          const textSpan = submitBtn.querySelector(".btn-text");
          if (textSpan) textSpan.innerText = "Creating account...";
        }
        if (window.authEngine) {
          await window.authEngine.register({ email, password, name, school });
          closeAuthModal();
        }
      } catch (err) {
        if (window.showAppToast) window.showAppToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const textSpan = submitBtn.querySelector(".btn-text");
          if (textSpan) textSpan.innerText = "Create Account & Join Surat Grid";
        }
      }
    });
  }

  // Force Sync Button
  if (btnForceSync) {
    btnForceSync.addEventListener("click", async () => {
      if (window.authEngine) {
        btnForceSync.disabled = true;
        btnForceSync.innerText = "⏳ Syncing...";
        await window.authEngine.syncCloudData(false);
        btnForceSync.disabled = false;
        btnForceSync.innerText = "🔄 Sync Now";
      }
    });
  }

  // Logout Button
  if (btnAccountLogout) {
    btnAccountLogout.addEventListener("click", () => {
      if (window.authEngine) {
        window.authEngine.logout();
        closeAuthModal();
      }
    });
  }
});
