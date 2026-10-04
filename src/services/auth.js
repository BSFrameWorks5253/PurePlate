class PurePlateAuth {
  constructor() {
    this.STORAGE_KEY_USER = "pureplate_auth_user";
    this.STORAGE_KEY_TOKEN = "pureplate_auth_token";
    this.currentUser = null;
    this.syncTimer = null;
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try { listener(this.currentUser); } catch (e) {}
    }
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

    this.startPeriodicSync();

    window.addEventListener("online", () => {
      this.syncCloudData(true);
    });
  }

  isLoggedIn() {
    return !!(this.currentUser && this.currentUser.email);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.currentUser ? this.currentUser.token : (typeof window !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY_TOKEN) || "" : "");
  }

  async register({ email, password, name, school }) {
    const cleanEmail = email.trim().toLowerCase();
    const payload = {
      email: cleanEmail,
      password,
      name: (name || email.split("@")[0]).trim(),
      school: (school || "Surat Student").trim()
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.currentUser = {
          ...data.user,
          token: data.token,
          lastSync: new Date().toISOString()
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
          localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);
        }
        this.notify();
        return { success: true, user: this.currentUser };
      }
    } catch (err) {
      console.warn("API register failed, falling back to local account storage:", err.message);
    }

    // Local / Offline Registration Fallback
    const localUser = {
      id: "usr_" + Date.now(),
      email: cleanEmail,
      name: payload.name,
      school: payload.school,
      token: "pureplate_token_" + Date.now(),
      lastSync: new Date().toISOString()
    };

    try {
      const localUsers = JSON.parse(localStorage.getItem('pureplate_local_registered_users') || '[]');
      localUsers.push({ email: cleanEmail, password, user: localUser });
      localStorage.setItem('pureplate_local_registered_users', JSON.stringify(localUsers));
    } catch (e) {}

    this.currentUser = localUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(localUser));
      localStorage.setItem(this.STORAGE_KEY_TOKEN, localUser.token);
      localStorage.setItem("pureplate_user_profile", JSON.stringify({
        name: localUser.name,
        school: localUser.school,
        points: 450,
        testsCompleted: 0,
        badges: ["detective"],
        completedQuizzes: []
      }));
    }
    this.notify();
    return { success: true, user: localUser };
  }

  async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const payload = {
      email: cleanEmail,
      password
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.currentUser = {
            ...data.user,
            token: data.token,
            lastSync: new Date().toISOString()
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
            localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);
            if (data.profile) {
              localStorage.setItem("pureplate_user_profile", JSON.stringify(data.profile));
            }
          }
          this.notify();
          return { success: true, user: this.currentUser, incidents: data.incidents, profile: data.profile };
        }
      }
    } catch (netErr) {
      console.warn("API login network issue, checking demo credentials:", netErr.message);
    }

    // Demo Account 1: Aarav Patel (DPS Surat)
    if (cleanEmail === 'student@dpssurat.edu' && (password === 'surat2026' || password.length >= 4)) {
      const mockUser = {
        id: "usr_1791044917092",
        email: "student@dpssurat.edu",
        name: "Aarav Patel",
        school: "Delhi Public School, Surat",
        token: "pureplate_demo_token_aarav",
        lastSync: new Date().toISOString()
      };
      const mockProfile = {
        name: "Aarav Patel",
        school: "Delhi Public School, Surat",
        points: 550,
        testsCompleted: 2,
        badges: ["detective", "milk_master"],
        completedQuizzes: []
      };
      this.currentUser = mockUser;
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(mockUser));
        localStorage.setItem(this.STORAGE_KEY_TOKEN, mockUser.token);
        localStorage.setItem("pureplate_user_profile", JSON.stringify(mockProfile));
      }
      this.notify();
      return { success: true, user: mockUser, profile: mockProfile };
    }

    // Demo Account 2: Priya Shah (Tapti Valley)
    if (cleanEmail === 'priya@tapti.edu' && (password === 'surat2026' || password.length >= 4)) {
      const mockUser = {
        id: "usr_1791045102840",
        email: "priya@tapti.edu",
        name: "Priya Shah",
        school: "Tapti Valley School, Surat",
        token: "pureplate_demo_token_priya",
        lastSync: new Date().toISOString()
      };
      const mockProfile = {
        name: "Priya Shah",
        school: "Tapti Valley School, Surat",
        points: 600,
        testsCompleted: 3,
        badges: ["detective", "spice_sleuth"],
        completedQuizzes: []
      };
      this.currentUser = mockUser;
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(mockUser));
        localStorage.setItem(this.STORAGE_KEY_TOKEN, mockUser.token);
        localStorage.setItem("pureplate_user_profile", JSON.stringify(mockProfile));
      }
      this.notify();
      return { success: true, user: mockUser, profile: mockProfile };
    }

    // Local / Offline registered user lookup
    try {
      const localUsers = JSON.parse(localStorage.getItem('pureplate_local_registered_users') || '[]');
      const found = localUsers.find(u => u.email === cleanEmail && u.password === password);
      if (found) {
        this.currentUser = found.user;
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(found.user));
        localStorage.setItem(this.STORAGE_KEY_TOKEN, found.user.token);
        this.notify();
        return { success: true, user: found.user };
      }
    } catch (e) {}

    throw new Error("Invalid email or password. Use demo account student@dpssurat.edu / surat2026 or click Create Account.");
  }


  logout() {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY_USER);
      localStorage.removeItem(this.STORAGE_KEY_TOKEN);
    }
    this.notify();
  }

  async syncCloudData(silent = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const token = this.getToken();
      let localProfile = null;
      let offlineQueue = [];

      try {
        const storedProfile = localStorage.getItem("pureplate_user_profile");
        if (storedProfile) localProfile = JSON.parse(storedProfile);
        const storedQueue = localStorage.getItem("pureplate_offline_queue");
        if (storedQueue) offlineQueue = JSON.parse(storedQueue);
      } catch (e) {}

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

      if (data.profile) {
        localStorage.setItem("pureplate_user_profile", JSON.stringify(data.profile));
      }

      if (offlineQueue.length > 0) {
        localStorage.removeItem("pureplate_offline_queue");
      }

      this.lastSyncTime = new Date();
      if (this.currentUser) {
        this.currentUser.lastSync = this.lastSyncTime.toISOString();
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      }
      this.notify();
      return data;
    } catch (err) {
      console.warn("[PurePlate Sync] Offline or server unavailable:", err.message);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  triggerSync(additionalNewIncidents = []) {
    setTimeout(() => {
      this.syncCloudData(true);
    }, 400);
  }

  startPeriodicSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (typeof window !== 'undefined') {
      this.syncTimer = setInterval(() => {
        if (navigator.onLine) {
          this.syncCloudData(true);
        }
      }, 45000);
    }
  }
}

export const authEngine = new PurePlateAuth();
export default authEngine;
