/**
 * PurePlate Kids' Learning Lab & Gamification Engine
 * Handles Quizzes, Adulterant Matching Game, Badge Unlocks, and School Leaderboard
 * Matches DOCS Module 3 Specification Exactly
 */

class PurePlateQuiz {
  constructor() {
    this.currentQuestionIndex = 0;
    this.selectedFoodTile = null;
    this.matchedCount = 0;

    this.init();
  }

  init() {
    this.renderQuizQuestion();
    this.setupMatchingGame();
    this.updateUserStatsDisplay();
  }

  updateUserStatsDisplay() {
    const profile = window.storage ? window.storage.getUserProfile() : null;
    if (!profile) return;

    const ptsVal = document.getElementById("user-points-val");
    if (ptsVal) ptsVal.innerText = profile.points;

    // Badges update
    const badgeChemist = document.getElementById("badge-chemist");
    if (badgeChemist && profile.badges.includes("chemist")) {
      badgeChemist.classList.remove("locked");
      badgeChemist.classList.add("unlocked");
      const statSpan = badgeChemist.querySelector(".badge-status");
      if (statSpan) statSpan.innerText = "Master Detective";
    }
  }

  // Render current science quiz question
  renderQuizQuestion() {
    const qData = SCIENCE_QUIZ_DATA[this.currentQuestionIndex];
    const qText = document.getElementById("quiz-question-text");
    const optionsList = document.getElementById("quiz-options-list");
    const feedbackBox = document.getElementById("quiz-feedback-box");

    if (!qData || !qText || !optionsList) return;

    qText.innerText = qData.question;
    if (feedbackBox) {
      feedbackBox.style.display = "none";
      feedbackBox.innerHTML = "";
    }

    optionsList.innerHTML = qData.options
      .map((opt, idx) => {
        return `
        <button class="quiz-option-btn quiz-opt-btn" data-correct="${opt.isCorrect}" data-idx="${idx}">
          <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
          <span class="option-text">${opt.text}</span>
        </button>
      `;
      })
      .join("");

    const buttons = optionsList.querySelectorAll(".quiz-opt-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const isCorrect = btn.getAttribute("data-correct") === "true";
        this.handleQuizAnswer(btn, isCorrect, qData.explanation);
      });
    });
  }

  handleQuizAnswer(btnEl, isCorrect, explanation) {
    const optionsList = document.getElementById("quiz-options-list");
    const feedbackBox = document.getElementById("quiz-feedback-box");
    const allButtons = optionsList.querySelectorAll(".quiz-opt-btn");

    // Disable all buttons after selection
    allButtons.forEach((b) => (b.style.pointerEvents = "none"));

    if (isCorrect) {
      if (window.soundEngine) window.soundEngine.playSuccess();
      btnEl.classList.add("correct");
      if (feedbackBox) {
        feedbackBox.className = "quiz-feedback-box success";
        feedbackBox.style.display = "block";
        feedbackBox.innerHTML = `
          <strong>🎉 Correct! +50 Points</strong><br/>
          <span>${explanation}</span>
          <button id="btn-next-question" class="btn-quiz-next">
            Next Question ➔
          </button>
        `;
      }

      // Reward points & confetti!
      if (window.storage) window.storage.addPoints(50);
      this.triggerConfetti();

      // Check if unlocked Chemical Sleuth badge
      if (this.currentQuestionIndex >= 1 && window.storage) {
        const unlocked = window.storage.unlockBadge("chemist");
        if (unlocked) {
          if (window.soundEngine) window.soundEngine.playFanfare();
          if (window.showAppToast) {
            window.showAppToast("🏅 Achievement Unlocked: Chemical Sleuth Badge!", "success");
          }
        }
      }

      this.updateUserStatsDisplay();
    } else {
      if (window.soundEngine) window.soundEngine.playWarning();
      btnEl.classList.add("wrong");
      // Highlight correct button
      allButtons.forEach((b) => {
        if (b.getAttribute("data-correct") === "true") b.classList.add("correct");
      });

      if (feedbackBox) {
        feedbackBox.className = "quiz-feedback-box error";
        feedbackBox.style.display = "block";
        feedbackBox.innerHTML = `
          <strong>❌ Not quite.</strong><br/>
          <span>${explanation}</span>
          <button id="btn-next-question" class="btn-quiz-next try-again">
            Try Next Question ➔
          </button>
        `;
      }
    }

    const btnNext = document.getElementById("btn-next-question");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        this.currentQuestionIndex = (this.currentQuestionIndex + 1) % SCIENCE_QUIZ_DATA.length;
        this.renderQuizQuestion();
      });
    }
  }

  // Setup Adulterant Matching Mini-Game (Two clean side-by-side columns)
  setupMatchingGame() {
    const board = document.getElementById("match-game-board");
    const statusMsg = document.getElementById("match-status-msg");
    const btnReset = document.getElementById("btn-reset-match");

    if (!board) return;

    this.matchedCount = 0;
    this.selectedFoodTile = null;

    // Items for the game
    const foods = [
      { key: "milk", label: "🥛 Milk Sample" },
      { key: "turmeric", label: "🌶️ Turmeric Powder" },
      { key: "chili", label: "🌶️ Red Chili Powder" },
      { key: "honey", label: "🍯 Natural Honey" }
    ];

    const adulterants = [
      { key: "turmeric", label: "Metanil Yellow Dye" },
      { key: "milk", label: "Starch & Added Water" },
      { key: "honey", label: "Invert Sugar Syrup" },
      { key: "chili", label: "Brick Dust & Sand" }
    ];

    board.innerHTML = `
      <div class="match-columns-wrap">
        <div class="match-col foods-col" id="match-foods-col">
          <div class="col-head-label">STAPLE FOOD</div>
        </div>
        <div class="match-col adulterants-col" id="match-adulterants-col">
          <div class="col-head-label">COMMON ADULTERANT</div>
        </div>
      </div>
    `;

    const foodsCol = document.getElementById("match-foods-col");
    const adultCol = document.getElementById("match-adulterants-col");

    foods.forEach((f) => {
      const tile = document.createElement("div");
      tile.className = "match-tile food-tile";
      tile.setAttribute("data-key", f.key);
      tile.innerText = f.label;
      tile.addEventListener("click", () => this.handleTileClick(tile, "food"));
      if (foodsCol) foodsCol.appendChild(tile);
    });

    adulterants.forEach((a) => {
      const tile = document.createElement("div");
      tile.className = "match-tile adulterant-tile";
      tile.setAttribute("data-key", a.key);
      tile.innerText = a.label;
      tile.addEventListener("click", () => this.handleTileClick(tile, "adulterant"));
      if (adultCol) adultCol.appendChild(tile);
    });

    if (btnReset) {
      btnReset.addEventListener("click", () => this.setupMatchingGame());
    }

    if (statusMsg) statusMsg.innerText = "Matches: 0 / 4";
  }

  handleTileClick(tile, type) {
    if (tile.classList.contains("matched")) return;

    if (type === "food") {
      // Clear previous selected food
      const board = document.getElementById("match-game-board");
      if (board) {
        board.querySelectorAll(".food-tile").forEach((t) => t.classList.remove("selected"));
      }
      tile.classList.add("selected");
      this.selectedFoodTile = tile;
      if (window.soundEngine) window.soundEngine.playClick();
    } else if (type === "adulterant" && this.selectedFoodTile) {
      // Check match
      const foodKey = this.selectedFoodTile.getAttribute("data-key");
      const adultKey = tile.getAttribute("data-key");

      if (foodKey === adultKey) {
        // Matched!
        if (window.soundEngine) window.soundEngine.playSuccess();
        this.selectedFoodTile.classList.remove("selected");
        this.selectedFoodTile.classList.add("matched");
        tile.classList.add("matched");
        this.selectedFoodTile = null;
        this.matchedCount++;

        const statusMsg = document.getElementById("match-status-msg");
        if (statusMsg) statusMsg.innerText = `Matches: ${this.matchedCount} / 4`;

        if (this.matchedCount === 4) {
          if (statusMsg) statusMsg.innerText = "🎉 All Matched! +80 Points!";
          if (window.storage) window.storage.addPoints(80);
          if (window.soundEngine) window.soundEngine.playFanfare();
          this.triggerConfetti();
          this.updateUserStatsDisplay();
        }
      } else {
        if (window.soundEngine) window.soundEngine.playWarning();
        // Mismatch shake
        tile.classList.add("mismatch");
        setTimeout(() => {
          tile.classList.remove("mismatch");
        }, 500);
      }
    }
  }

  triggerConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }
}

window.PurePlateQuiz = PurePlateQuiz;
