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
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);
    }

    this.notify();
    return { success: true, user: this.currentUser };
  }

  async login({ email, password }) {
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);
    }

    this.notify();
    return { success: true, user: this.currentUser, incidents: data.incidents, profile: data.profile };
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
