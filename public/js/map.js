/**
 * PurePlate Regional Food Security Heat Map
 * Implements Leaflet.js with pulsing red radar zones, green shields, and community log feed
 */

class PurePlateMap {
  constructor() {
    this.map = null;
    this.markersLayer = null;
    this.radarCirclesLayer = null;
    this.currentFilter = "all";
    
    // Surat default coordinates (Athwa Lines)
    this.centerLat = 21.1738;
    this.centerLng = 72.8028;
    this.currentZoom = 13;

    this.init();
  }

  init() {
    this.initMap();
    this.setupFilterChips();
    this.setupGpsButton();
    this.renderIncidents();
    this.renderRecentFeed();
  }

  async initMap() {
    const mapEl = document.getElementById("pureplate-leaflet-map");
    if (!mapEl || this.map) return;

    // Load dynamic map configuration from secure .env API if available
    let customTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    let customAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    let openFreeMapStyle = "https://tiles.openfreemap.org/styles/liberty";

    try {
      const configRes = await fetch("/api/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.map) {
          if (configData.map.tileUrl) customTileUrl = configData.map.tileUrl;
          if (configData.map.styleUrl) openFreeMapStyle = configData.map.styleUrl;
          if (configData.map.attribution) customAttribution = configData.map.attribution;
          if (configData.map.defaultLat) this.centerLat = configData.map.defaultLat;
          if (configData.map.defaultLng) this.centerLng = configData.map.defaultLng;
          if (configData.map.defaultZoom) this.currentZoom = configData.map.defaultZoom;
        }
      }
    } catch (e) {
      console.log("[PurePlate Map] Running with default OpenFreeMap & Carto tiles");
    }

    // Initialize Leaflet map
    this.map = L.map("pureplate-leaflet-map", {
      center: [this.centerLat, this.centerLng],
      zoom: this.currentZoom,
      zoomControl: false
    });

    // Add zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Multi-Provider Base Layers (Configured via .env & OpenFreeMap API)
    this.darkMatterLayer = L.tileLayer(customTileUrl, {
      attribution: customAttribution,
      subdomains: "abcd",
      maxZoom: 20
    });

    this.daylightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
      subdomains: "abcd",
      maxZoom: 20
    });

    this.osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    // OpenFreeMap MapLibre GL Vector Tile Layers
    this.openFreeMapLiberty = null;
    this.openFreeMapPositron = null;
    if (typeof L.maplibreGL === "function") {
      try {
        this.openFreeMapLiberty = L.maplibreGL({
          style: openFreeMapStyle,
          attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });
        this.openFreeMapPositron = L.maplibreGL({
          style: "https://tiles.openfreemap.org/styles/positron",
          attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });
      } catch (err) {
        console.warn("[PurePlate Map] OpenFreeMap vector layer init error:", err);
      }
    }

    // Add default configured layer based on active theme
    const activeTheme = document.documentElement.getAttribute("data-theme") || "light";
    if (activeTheme === "dark") {
      this.darkMatterLayer.addTo(this.map);
    } else {
      if (this.openFreeMapLiberty) {
        this.openFreeMapLiberty.addTo(this.map);
      } else {
        this.daylightLayer.addTo(this.map);
      }
    }

    // Layer Switcher Control (OpenFreeMap Liberty / Positron + Daylight + Dark HUD + OSM)
    const baseMaps = {};
    if (this.openFreeMapLiberty) {
      baseMaps["🗺️ OpenFreeMap Liberty"] = this.openFreeMapLiberty;
      baseMaps["🕊️ OpenFreeMap Positron"] = this.openFreeMapPositron;
    }
    baseMaps["☀️ Daylight Road"] = this.daylightLayer;
    baseMaps["🌙 Dark HUD Retina"] = this.darkMatterLayer;
    baseMaps["🌍 OpenStreetMap"] = this.osmLayer;

    L.control.layers(baseMaps, null, { position: "topleft", collapsed: true }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.radarCirclesLayer = L.layerGroup().addTo(this.map);

    // Invalidate size when screen becomes active
    setTimeout(() => {
      this.map.invalidateSize();
    }, 400);
  }

  setTheme(theme) {
    if (!this.map) return;
    const lightLayers = [this.openFreeMapLiberty, this.openFreeMapPositron, this.daylightLayer, this.osmLayer].filter(Boolean);

    if (theme === "light") {
      if (this.darkMatterLayer && this.map.hasLayer(this.darkMatterLayer)) {
        this.map.removeLayer(this.darkMatterLayer);
      }
      const hasLightOn = lightLayers.some(layer => this.map.hasLayer(layer));
      if (!hasLightOn) {
        if (this.openFreeMapLiberty) {
          this.openFreeMapLiberty.addTo(this.map);
        } else if (this.daylightLayer) {
          this.daylightLayer.addTo(this.map);
        }
      }
    } else {
      lightLayers.forEach(layer => {
        if (this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      });
      if (this.darkMatterLayer && !this.map.hasLayer(this.darkMatterLayer)) {
        this.darkMatterLayer.addTo(this.map);
      }
    }
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  setupFilterChips() {
    const filterBtns = document.querySelectorAll(".filter-chip");
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.getAttribute("data-filter");
        this.renderIncidents();
      });
    });
  }

  setupGpsButton() {
    const btnGps = document.getElementById("btn-locate-user-map");
    if (btnGps) {
      btnGps.addEventListener("click", () => {
        this.locateUserGps();
      });
    }

    const btnDetect = document.getElementById("btn-detect-loc");
    if (btnDetect) {
      btnDetect.addEventListener("click", () => {
        this.locateUserGps();
      });
    }
  }

  locateUserGps() {
    if (navigator.geolocation) {
      if (window.showAppToast) window.showAppToast("Detecting GPS position...", "info");
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.centerLat = lat;
          this.centerLng = lng;

          if (this.map) {
            this.map.setView([lat, lng], 15);
            L.circleMarker([lat, lng], {
              radius: 8,
              fillColor: "#0284c7",
              color: "#ffffff",
              weight: 3,
              opacity: 1,
              fillOpacity: 1
            }).addTo(this.map).bindPopup("📍 <strong>Your Current Location</strong>").openPopup();
          }

          const regEl = document.getElementById("current-region-display");
          if (regEl) regEl.innerText = `GPS: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;

          if (window.showAppToast) window.showAppToast("Location updated successfully!", "success");
        },
        (err) => {
          console.warn("GPS error:", err);
          if (window.showAppToast) window.showAppToast("GPS permission denied. Using default Surat region.", "warning");
        }
      );
    }
  }

  renderIncidents() {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    this.radarCirclesLayer.clearLayers();

    const incidents = window.storage ? window.storage.getAllIncidents() : INITIAL_MAP_INCIDENTS;

    incidents.forEach((item) => {
      // Filtering logic
      if (this.currentFilter === "fail" && item.status !== "fail") return;
      if (this.currentFilter === "pass" && item.status !== "pass") return;
      if (this.currentFilter === "milk" && !item.food.toLowerCase().includes("milk")) return;
      if (this.currentFilter === "spices" && !item.food.toLowerCase().includes("turmeric") && !item.food.toLowerCase().includes("chili")) return;

      const isFail = item.status === "fail";

      if (isFail) {
        // Red Radar Contamination Spike Circle (as requested in WhatsApp blueprint)
        const radarCircle = L.circle([item.lat, item.lng], {
          radius: 380,
          color: "#e11d48",
          weight: 1.5,
          opacity: 0.8,
          fillColor: "#e11d48",
          fillOpacity: 0.18,
          className: "heat-radar-wave"
        });
        this.radarCirclesLayer.addLayer(radarCircle);

        // Warning Icon Marker
        const alertIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="
              background: #e11d48;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 4px 10px rgba(225, 29, 72, 0.45);
              border: 2px solid white;
            ">⚠️</div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([item.lat, item.lng], { icon: alertIcon });
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <div style="font-weight: 800; color: #e11d48; font-size: 14px; margin-bottom: 2px;">
              ⚠️ Contamination Spike
            </div>
            <strong>${item.food}</strong> - ${item.testType}<br/>
            <span style="color: #64748b; font-size: 11px;">📍 ${item.neighborhood}</span><br/>
            <div style="margin-top: 4px; padding: 4px 6px; background: #fff1f2; border-radius: 4px; color: #9f1239; font-size: 11px; font-weight: 700;">
              Detected: ${item.adulterant}
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
              Reported ${item.timestamp} • Source: ${item.vendorType || "Vendor"}
            </div>
          </div>
        `);
        this.markersLayer.addLayer(marker);
      } else {
        // Green Shield Marker for pure verified zone
        const shieldIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="
              background: #10b981;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              box-shadow: 0 4px 10px rgba(16, 185, 129, 0.45);
              border: 2px solid white;
            ">🛡️</div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([item.lat, item.lng], { icon: shieldIcon });
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <div style="font-weight: 800; color: #047857; font-size: 14px; margin-bottom: 2px;">
              🛡️ Pure & Safe Sample
            </div>
            <strong>${item.food}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">📍 ${item.neighborhood}</span><br/>
            <div style="margin-top: 4px; padding: 4px 6px; background: #ecfdf5; border-radius: 4px; color: #065f46; font-size: 11px; font-weight: 700;">
              Verified 100% Unadulterated
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
              Logged ${item.timestamp}
            </div>
          </div>
        `);
        this.markersLayer.addLayer(marker);
      }
    });
  }

  // Populate pull-up bottom feed as specified in WhatsApp Image 4.41.24 (1).jpeg
  renderRecentFeed() {
    const feedContainer = document.getElementById("map-feed-items");
    const homeFeedList = document.getElementById("home-feed-list");
    const countBadge = document.getElementById("feed-count-badge");

    const incidents = window.storage ? window.storage.getAllIncidents() : INITIAL_MAP_INCIDENTS;

    if (countBadge) {
      countBadge.innerText = `${incidents.length} community logs`;
    }

    const html = incidents.map((item) => {
      const isFail = item.status === "fail";
      const icon = isFail ? "⚠️" : "✅";
      const badgeClass = isFail ? "fail" : "pass";
      const msg = isFail
        ? `Adulterated ${item.food} logged near ${item.neighborhood}. (${item.adulterant})`
        : `Pure ${item.food} verified near ${item.neighborhood}.`;

      return `
        <div class="feed-log-entry ${badgeClass}">
          <span class="feed-log-icon">${icon}</span>
          <div class="feed-log-body">
            <span class="feed-log-text">${msg}</span>
            <div class="feed-log-meta">
              <span>${item.timestamp}</span> • <span>${item.vendorType || "Local Vendor"}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (feedContainer) feedContainer.innerHTML = html;
    if (homeFeedList) homeFeedList.innerHTML = html.slice(0, 3 * 300); // top 3 on home screen
  }

  refresh() {
    if (this.map) {
      this.map.invalidateSize();
      this.renderIncidents();
      this.renderRecentFeed();
    }
  }
}

window.PurePlateMap = PurePlateMap;
