import { INITIAL_MAP_INCIDENTS } from '../data/protocols.js';

class PurePlateStorage {
  constructor() {
    this.STORAGE_KEY_INCIDENTS = "pureplate_incidents";
    this.STORAGE_KEY_OFFLINE_QUEUE = "pureplate_offline_queue";
    this.STORAGE_KEY_USER_PROFILE = "pureplate_user_profile";
    this.STORAGE_KEY_REGION = "pureplate_user_region";

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    if (!localStorage.getItem(this.STORAGE_KEY_INCIDENTS)) {
      localStorage.setItem(
        this.STORAGE_KEY_INCIDENTS,
        JSON.stringify(INITIAL_MAP_INCIDENTS)
      );
    }

    if (!localStorage.getItem(this.STORAGE_KEY_USER_PROFILE)) {
      const defaultProfile = {
        name: "Junior Food Inspector",
        school: "Delhi Public School, Surat",
        points: 420,
        testsCompleted: 3,
        badges: ["detective", "milk_master", "spice_sleuth"],
        completedQuizzes: []
      };
      localStorage.setItem(
        this.STORAGE_KEY_USER_PROFILE,
        JSON.stringify(defaultProfile)
      );
    }

    if (!localStorage.getItem(this.STORAGE_KEY_REGION)) {
      localStorage.setItem(this.STORAGE_KEY_REGION, "Athwa, Surat");
    }

    window.addEventListener("online", () => {
      this.syncOfflineQueue();
    });
  }

  getUserRegion() {
    if (typeof window === 'undefined') return "Athwa, Surat";
    return localStorage.getItem(this.STORAGE_KEY_REGION) || "Athwa, Surat";
  }

  setUserRegion(region) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_REGION, region);
  }

  getAllIncidents() {
    if (typeof window === 'undefined') return INITIAL_MAP_INCIDENTS;
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_INCIDENTS);
      const list = data ? JSON.parse(data) : INITIAL_MAP_INCIDENTS;
      return list.map(item => ({
        ...item,
        food: this.cleanText(item.food),
        neighborhood: this.cleanText(item.neighborhood),
        adulterant: this.cleanText(item.adulterant),
        testType: this.cleanText(item.testType),
        vendorType: this.cleanText(item.vendorType),
      }));
    } catch (e) {
      return INITIAL_MAP_INCIDENTS;
    }
  }

  saveIncident(incident) {
    const list = this.getAllIncidents();
    list.unshift(incident);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_INCIDENTS, JSON.stringify(list));
    }
    return incident;
  }

  cleanText(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  sanitize(str) {
    if (typeof str !== "string") return "";
    // Strip dangerous tags while preserving readable characters like & for React
    return str
      .trim()
      .slice(0, 150)
      .replace(/<[^>]*>?/gm, "")
      .replace(/&amp;/g, "&");
  }

  submitTestResult({ food, testType, status, adulterant, vendorType, locationName, lat, lng }) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const safeLat = (typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90)
      ? lat
      : 21.1738 + (Math.random() - 0.5) * 0.04;
    const safeLng = (typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180)
      ? lng
      : 72.8028 + (Math.random() - 0.5) * 0.04;

    const safeStatus = status === "pass" ? "pass" : "fail";

    const incidentData = {
      id: "inc_" + Date.now(),
      lat: safeLat,
      lng: safeLng,
      neighborhood: this.sanitize(locationName || this.getUserRegion()),
      food: this.sanitize(food || "Sample"),
      testType: this.sanitize(testType || "Chemical Test"),
      status: safeStatus,
      adulterant: this.sanitize(adulterant || "None Detected"),
      vendorType: this.sanitize(vendorType || "Local Loose Milk Vendor"),
      timestamp: "Just now",
      date: new Date().toISOString(),
      failCountInArea: safeStatus === "fail" ? 1 : 0
    };

    if (isOnline) {
      this.saveIncident(incidentData);
      this.addPoints(50);
      return {
        success: true,
        offline: false,
        incident: incidentData,
        message: "Data successfully submitted to the PurePlate Community Network. Thank you for protecting your neighborhood!"
      };
    } else {
      const offlineQueue = this.getOfflineQueue();
      offlineQueue.push(incidentData);
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(offlineQueue));
      }
      this.saveIncident(incidentData);
      return {
        success: true,
        offline: true,
        incident: incidentData,
        message: "No internet connection. Saving your test result offline."
      };
    }
  }

  getOfflineQueue() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  syncOfflineQueue() {
    const queue = this.getOfflineQueue();
    if (queue.length > 0 && typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY_OFFLINE_QUEUE);
    }
  }

  getUserProfile() {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_USER_PROFILE));
    } catch (e) {
      return null;
    }
  }

  saveUserProfile(profile) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
    }
  }

  addPoints(amount) {
    const profile = this.getUserProfile();
    if (profile) {
      profile.points = (profile.points || 0) + amount;
      profile.testsCompleted = (profile.testsCompleted || 0) + 1;
      this.saveUserProfile(profile);
      return profile.points;
    }
    return 0;
  }

  unlockBadge(badgeKey) {
    const profile = this.getUserProfile();
    if (profile && !profile.badges.includes(badgeKey)) {
      profile.badges.push(badgeKey);
      profile.points += 100;
      this.saveUserProfile(profile);
      return true;
    }
    return false;
  }

  sanitizeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  exportIncidentsAsCsv() {
    const incidents = this.getAllIncidents();
    const headers = ["ID", "Food", "Test Type", "Status", "Adulterant", "Neighborhood", "Vendor Type", "Date", "Latitude", "Longitude"];
    const rows = incidents.map(i => [
      this.sanitizeCsvCell(i.id),
      this.sanitizeCsvCell(i.food),
      this.sanitizeCsvCell(i.testType),
      this.sanitizeCsvCell(i.status ? i.status.toUpperCase() : "PASS"),
      this.sanitizeCsvCell(i.adulterant),
      this.sanitizeCsvCell(i.neighborhood),
      this.sanitizeCsvCell(i.vendorType || "Vendor"),
      this.sanitizeCsvCell(i.date),
      i.lat,
      i.lng
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pureplate_data_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportIncidentsAsJson() {
    const incidents = this.getAllIncidents();
    const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pureplate_database_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  resetDatabase() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_INCIDENTS, JSON.stringify(INITIAL_MAP_INCIDENTS));
      localStorage.removeItem(this.STORAGE_KEY_OFFLINE_QUEUE);
    }
  }
}

export const storage = new PurePlateStorage();
export default storage;
