/**
 * PurePlate Authentication & Multi-Device Cloud Data Sync Engine
 * Handles Email Registration, Email Sign-In, Session Management,
 * and User-to-User / Device-to-Device Community Data Synchronization.
 */

class PurePlateAuth {
  constructor() {
    this.STORAGE_KEY_USER = "pureplate_auth_user";
    this.STORAGE_KEY_TOKEN = "pureplate_auth_token";
    this.currentUser = null;
    this.syncTimer = null;
    this.isSyncing = false;
    this.lastSyncTime = null;

    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      this.currentUser = null;
    }

    // Update UI headers
    this.updateUI();

    // Start background sync
    this.startPeriodicSync();

    // Listen for reconnection
    window.addEventListener("online", () => {
      this.syncCloudData(true);
    });
  }

  isLoggedIn() {
    return !!(this.currentUser && this.currentUser.email && this.currentUser.token);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.currentUser ? this.currentUser.token : (localStorage.getItem(this.STORAGE_KEY_TOKEN) || "");
  }

  // 1. Register with Email
  async register({ email, password, name, school }) {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        name: (name || email.split("@")[0]).trim(),
        school: (school || "Surat Student").trim()
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create account");
      }

      this.currentUser = {
        ...data.user,
        token: data.token,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);

      // Hydrate local storage profile & incidents from cloud
      if (data.profile && window.storage) {
        localStorage.setItem(window.storage.STORAGE_KEY_USER_PROFILE, JSON.stringify(data.profile));
        window.storage.refreshProfileUI?.();
      }

      this.updateUI();
      if (window.soundEngine) window.soundEngine.playSuccess();
      if (window.showAppToast) window.showAppToast(`🎉 Welcome to PurePlate, ${this.currentUser.name}!`, "success");

      return { success: true, user: this.currentUser };
    } catch (err) {
      if (window.soundEngine) window.soundEngine.playAlert();
      throw err;
    }
  }

  // 2. Sign In with Email
  async login({ email, password }) {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password
      };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password");
      }

      this.currentUser = {
        ...data.user,
        token: data.token,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);

      // Merge & Hydrate local profile and test incidents
      if (data.profile && window.storage) {
        localStorage.setItem(window.storage.STORAGE_KEY_USER_PROFILE, JSON.stringify(data.profile));
        window.storage.refreshProfileUI?.();
      }

      if (Array.isArray(data.incidents) && data.incidents.length > 0 && window.storage) {
        const localList = window.storage.getAllIncidents();
        for (const inc of data.incidents) {
          if (!localList.some(l => l.id === inc.id)) {
            localList.unshift(inc);
          }
        }
        localStorage.setItem(window.storage.STORAGE_KEY_INCIDENTS, JSON.stringify(localList));
        if (window.mapEngine) window.mapEngine.renderIncidents();
      }

      this.updateUI();
      if (window.soundEngine) window.soundEngine.playSuccess();
      if (window.showAppToast) window.showAppToast(`👋 Signed in as ${this.currentUser.name} (${this.currentUser.email})`, "success");

      return { success: true, user: this.currentUser };
    } catch (err) {
      if (window.soundEngine) window.soundEngine.playAlert();
      throw err;
    }
  }

  // 3. Log Out
  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY_USER);
    localStorage.removeItem(this.STORAGE_KEY_TOKEN);
    this.updateUI();

    if (window.soundEngine) window.soundEngine.playClick();
    if (window.showAppToast) window.showAppToast("Signed out. Switched to Guest mode.", "info");
  }

  // 4. Multi-Device & Community Cloud Sync
  async syncCloudData(silent = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.setSyncingBadge(true);

    try {
      const token = this.getToken();
      let localProfile = null;
      let offlineQueue = [];

      if (window.storage) {
        localProfile = window.storage.getUserProfile();
        offlineQueue = window.storage.getOfflineQueue();
      }

      const bodyPayload = {
        token: token,
        profile: localProfile,
        newIncidents: offlineQueue
      };

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        throw new Error(`Sync error HTTP ${res.status}`);
      }

      const data = await res.json();

      // If user profile was updated on server, merge back
      if (data.profile && window.storage) {
        localStorage.setItem(window.storage.STORAGE_KEY_USER_PROFILE, JSON.stringify(data.profile));
        window.storage.refreshProfileUI?.();
      }

      // If offline items were processed, clear offline queue
      if (offlineQueue.length > 0 && window.storage) {
        localStorage.removeItem(window.storage.STORAGE_KEY_OFFLINE_QUEUE);
      }

      // Merge community incidents into local map view (User-to-User Sync)
      if (Array.isArray(data.communityIncidents) && data.communityIncidents.length > 0 && window.storage) {
        const localList = window.storage.getAllIncidents();
        let addedCount = 0;
        for (const cInc of data.communityIncidents) {
          if (!localList.some(l => l.id === cInc.id)) {
            localList.unshift(cInc);
            addedCount++;
          }
        }
        if (addedCount > 0) {
          localStorage.setItem(window.storage.STORAGE_KEY_INCIDENTS, JSON.stringify(localList));
          if (window.mapEngine) window.mapEngine.renderIncidents();
          if (!silent && window.showAppToast) {
            window.showAppToast(`📡 Synced ${addedCount} community food test(s) from Surat Network!`, "info");
          }
        }
      }

      this.lastSyncTime = new Date();
      if (this.currentUser) {
        this.currentUser.lastSync = this.lastSyncTime.toISOString();
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      }

      if (!silent && window.showAppToast) {
        window.showAppToast("☁️ Multi-device data synchronized with PurePlate Cloud!", "success");
      }
    } catch (err) {
      console.warn("[PurePlate Sync] Offline or server unavailable:", err.message);
    } finally {
      this.isSyncing = false;
      this.setSyncingBadge(false);
      this.updateSyncTimestampDisplay();
    }
  }

  // Trigger sync on actions (test submitted, points earned, badge unlocked)
  triggerSync(extraIncidents = []) {
    if (navigator.onLine) {
      this.syncCloudData(true);
    }
  }

  startPeriodicSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // Auto-sync every 35 seconds
    this.syncTimer = setInterval(() => {
      if (navigator.onLine) {
        this.syncCloudData(true);
      }
    }, 35000);
  }

  setSyncingBadge(syncing) {
    const syncDot = document.querySelectorAll(".sync-pulse-indicator");
    syncDot.forEach(el => {
      if (syncing) {
        el.classList.add("spinning");
      } else {
        el.classList.remove("spinning");
      }
    });
  }

  updateSyncTimestampDisplay() {
    const syncLabels = document.querySelectorAll(".auth-sync-time");
    const text = this.lastSyncTime ? `Synced ${this.formatTimeAgo(this.lastSyncTime)}` : "Cloud Active";
    syncLabels.forEach(el => {
      el.innerText = text;
    });
  }

  formatTimeAgo(date) {
    const sec = Math.floor((new Date() - date) / 1000);
    if (sec < 10) return "Just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `${min}m ago`;
  }

  // Update Header Badges & User Display
  updateUI() {
    const isAuth = this.isLoggedIn();
    const user = this.currentUser;

    // Desktop Header User Button
    const dtUserBtn = document.getElementById("dt-user-btn");
    const dtUserEmail = document.getElementById("dt-user-email");
    const dtUserAvatar = document.getElementById("dt-user-avatar");

    if (dtUserBtn) {
      if (isAuth && user) {
        if (dtUserEmail) dtUserEmail.innerText = user.name || user.email;
        if (dtUserAvatar) dtUserAvatar.innerText = "🎓";
        dtUserBtn.classList.add("authenticated");
      } else {
        if (dtUserEmail) dtUserEmail.innerText = "Sign In / Sync";
        if (dtUserAvatar) dtUserAvatar.innerText = "👤";
        dtUserBtn.classList.remove("authenticated");
      }
    }

    // App Header Mobile User Button
    const mbUserBtn = document.getElementById("mb-user-btn");
    const mbUserIcon = document.getElementById("mb-user-icon");
    if (mbUserBtn) {
      if (isAuth && user) {
        mbUserBtn.classList.add("authenticated");
        if (mbUserIcon) mbUserIcon.innerText = "🎓";
      } else {
        mbUserBtn.classList.remove("authenticated");
        if (mbUserIcon) mbUserIcon.innerText = "👤";
      }
    }

    // Kids Portal Name / School Display
    const studentNameEl = document.getElementById("student-name-display");
    const studentSchoolEl = document.getElementById("student-school-display");
    if (studentNameEl && user && user.name) {
      studentNameEl.innerText = user.name;
    }
    if (studentSchoolEl && user && user.school) {
      studentSchoolEl.innerText = user.school;
    }

    this.updateModalState();
  }

  updateModalState() {
    const modalLoggedOut = document.getElementById("auth-state-logged-out");
    const modalLoggedIn = document.getElementById("auth-state-logged-in");

    if (modalLoggedOut && modalLoggedIn) {
      if (this.isLoggedIn()) {
        modalLoggedOut.style.display = "none";
        modalLoggedIn.style.display = "block";

        const emailEl = document.getElementById("account-modal-email");
        const nameEl = document.getElementById("account-modal-name");
        const schoolEl = document.getElementById("account-modal-school");
        const ptsEl = document.getElementById("account-modal-pts");

        if (emailEl) emailEl.innerText = this.currentUser.email;
        if (nameEl) nameEl.innerText = this.currentUser.name || "Student Inspector";
        if (schoolEl) schoolEl.innerText = this.currentUser.school || "Surat Student";
        if (ptsEl && window.storage) {
          const profile = window.storage.getUserProfile();
          ptsEl.innerText = `${profile?.points || 450} XP`;
        }
      } else {
        modalLoggedOut.style.display = "block";
        modalLoggedIn.style.display = "none";
      }
    }
  }
}

// Global Singleton
const authEngine = new PurePlateAuth();
window.authEngine = authEngine;
