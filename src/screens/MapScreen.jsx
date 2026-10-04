import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';
import { FOOD_PROTOCOLS } from '../data/protocols.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths in case bundlers mangle them
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Curated Crisp Tile Layer Provider (High Resolution Esri World Street Map)
const TILE_PROVIDERS = {
  streets: {
    id: 'streets',
    name: 'Detailed Streets',
    icon: '🗺️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; World Street Map',
      maxZoom: 19
    }
  },
  darkmatter: {
    id: 'darkmatter',
    name: 'Night Matrix',
    icon: '🌙',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; World Street Map',
      maxZoom: 19
    }
  }
};

// Surat Municipal Wards for Instant Quick-Jump
const SURAT_WARDS = [
  { id: 'athwa', name: 'Athwa Lines', coords: [21.1764, 72.8052], zoom: 15 },
  { id: 'adajan', name: 'Adajan', coords: [21.1965, 72.7958], zoom: 15 },
  { id: 'pal', name: 'Pal & Gaurav Path', coords: [21.1848, 72.7725], zoom: 15 },
  { id: 'varachha', name: 'Varachha', coords: [21.2155, 72.8525], zoom: 15 },
  { id: 'majura', name: 'Majura Gate', coords: [21.1822, 72.8188], zoom: 15 },
  { id: 'citylight', name: 'City Light', coords: [21.1685, 72.7885], zoom: 15 },
  { id: 'katargam', name: 'Katargam', coords: [21.2280, 72.8290], zoom: 15 },
  { id: 'rander', name: 'Rander', coords: [21.2170, 72.7910], zoom: 15 },
];

// Google Maps Custom Apple Liquid Glass Styles
const GOOGLE_MAPS_LIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#0f172a' }, { weight: 1.5 }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#ecfdf5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ccfbf1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f2fe' }] }
];

const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0f766e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#03172e' }] }
];

export default function MapScreen({ showToast, theme, onNavigate, onSelectFood, onLaunchCamera }) {
  const mapContainerRef = useRef(null);

  // Map Engine & Layer State
  const [mapEngine, setMapEngine] = useState('leaflet'); // 'leaflet' (default, rock-solid) or 'google'
  const [activeTileKey, setActiveTileKey] = useState(theme === 'dark' ? 'darkmatter' : 'streets');
  const [isExpanded, setIsExpanded] = useState(false);

  // References
  const leafletInstanceRef = useRef(null);
  const leafletTileLayerRef = useRef(null);
  const leafletMarkersGroupRef = useRef(null);
  const leafletCirclesGroupRef = useRef(null);
  const markersMapRef = useRef({});

  // Google Maps refs (for optional API key usage)
  const googleMapInstanceRef = useRef(null);
  const googleMarkersRef = useRef([]);
  const googleCirclesRef = useRef([]);
  const activeInfoWindowRef = useRef(null);

  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('pureplate_google_maps_api_key') || '';
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('pureplate_google_maps_api_key') || '';
  });

  // Data & Filters
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState(() => storage.getAllIncidents());
  const [activeWard, setActiveWard] = useState('athwa');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  // Mobile Map UI State (Apple Maps Style Floating Island & Drawer)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);

  // Report Modal on Map
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCoords, setReportCoords] = useState({ lat: 21.1738, lng: 72.8028, neighborhood: 'Athwa Lines, Surat' });
  const [reportRoad, setReportRoad] = useState('Ghod Dod Road');
  const [reportLandmark, setReportLandmark] = useState('Near Joggers Park');
  const [reportAddress, setReportAddress] = useState('Shop 4, Silver Point Arcade, Ghod Dod Road, Athwa Lines, Surat - 395007');
  const [reportFood, setReportFood] = useState('Milk & Dairy');
  const [reportStatus, setReportStatus] = useState('fail');
  const [reportAdulterant, setReportAdulterant] = useState('Added Starch / Water');
  const [reportVendor, setReportVendor] = useState('Local Loose Milk Vendor');
  const [reportNotes, setReportNotes] = useState('');

  const filters = [
    { id: 'all', label: 'All Samples' },
    { id: 'fail', label: '⚠️ Contamination Spikes' },
    { id: 'pass', label: '🛡️ Pure Zones' },
    { id: 'milk', label: '🥛 Milk & Dairy' },
    { id: 'spices', label: '🌶️ Turmeric & Spices' },
    { id: 'honey', label: '🍯 Honey' },
  ];

  // Calculated Real-Time Safety Metrics
  const stats = useMemo(() => {
    const total = incidents.length;
    const fails = incidents.filter(i => i.status === 'fail').length;
    const purityRate = total > 0 ? Math.round(((total - fails) / total) * 100) : 100;
    return { total, fails, purityRate };
  }, [incidents]);

  // Keep incidents fresh
  const refreshIncidents = () => {
    setIncidents(storage.getAllIncidents());
  };

  // Auto-switch between Light and Dark CartoDB tiles when theme changes
  useEffect(() => {
    if (activeTileKey === 'positron' && theme === 'dark') {
      setActiveTileKey('darkmatter');
    } else if (activeTileKey === 'darkmatter' && theme === 'light') {
      setActiveTileKey('positron');
    }
  }, [theme]);

  // Update Leaflet tile layer when activeTileKey changes
  useEffect(() => {
    if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      const map = leafletInstanceRef.current;
      if (leafletTileLayerRef.current) {
        map.removeLayer(leafletTileLayerRef.current);
      }
      const provider = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.positron;
      const tileLayer = L.tileLayer(provider.url, provider.options);
      tileLayer.addTo(map);
      leafletTileLayerRef.current = tileLayer;
    }
  }, [activeTileKey, mapEngine]);

  // Handle Google Maps API dynamic loading (only if API key is configured or user switches)
  useEffect(() => {
    if (mapEngine !== 'google') return;

    if (window.google && window.google.maps) {
      setGoogleMapsReady(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-api-script');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    const keyQuery = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=places,geometry${keyQuery}&callback=__initPurePlateGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.__initPurePlateGoogleMaps = () => {
      setGoogleMapsReady(true);
      showToast('🗺️ Google Maps JavaScript API initialized', 'success');
    };

    script.onerror = () => {
      console.warn('Google Maps script failed. Falling back to Leaflet vector tiles.');
      setMapEngine('leaflet');
      showToast('Google Maps network notice: using Leaflet vector tiles', 'info');
    };

    document.head.appendChild(script);

    return () => {
      if (window.__initPurePlateGoogleMaps) {
        delete window.__initPurePlateGoogleMaps;
      }
    };
  }, [apiKey, mapEngine]);

  // Initialize Maps (Leaflet or Google)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;

    if (mapEngine === 'leaflet') {
      // Teardown Google Maps if any
      clearGoogleLayers();
      googleMapInstanceRef.current = null;

      // Teardown previous Leaflet if any
      if (leafletInstanceRef.current) {
        try {
          leafletInstanceRef.current.remove();
        } catch (e) {}
        leafletInstanceRef.current = null;
      }

      container.innerHTML = '';

      const lmap = L.map(container, {
        center: [21.1738, 72.8028],
        zoom: 13,
        zoomControl: false,
        preferCanvas: true
      });

      // Add Zoom Control to Bottom Right
      L.control.zoom({ position: 'bottomright' }).addTo(lmap);

      // Add active Tile Provider
      const provider = TILE_PROVIDERS[activeTileKey] || (theme === 'dark' ? TILE_PROVIDERS.darkmatter : TILE_PROVIDERS.streets);
      const tileLayer = L.tileLayer(provider.url, provider.options);
      tileLayer.addTo(lmap);
      leafletTileLayerRef.current = tileLayer;

      // Layer groups for markers & radar circles
      leafletMarkersGroupRef.current = L.layerGroup().addTo(lmap);
      leafletCirclesGroupRef.current = L.layerGroup().addTo(lmap);
      leafletInstanceRef.current = lmap;

      // Click on map to drop a pin or report
      lmap.on('click', (e) => {
        soundEngine.playClick();
        const { lat, lng } = e.latlng;
        setReportCoords({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
          neighborhood: 'Athwa Lines, Surat'
        });
        setReportRoad('Ghod Dod Road');
        setReportLandmark('Near Joggers Park & Subhash Chowk');
        setReportAddress('Shop 4, Silver Point Arcade, Ghod Dod Road, Athwa Lines, Surat - 395007');
        setIsReportModalOpen(true);
      });

      renderLeafletMarkers(lmap);

      setTimeout(() => {
        if (leafletInstanceRef.current) {
          leafletInstanceRef.current.invalidateSize(true);
        }
      }, 200);

    } else if (mapEngine === 'google' && window.google && window.google.maps) {
      if (leafletInstanceRef.current) {
        try {
          leafletInstanceRef.current.remove();
        } catch (e) {}
        leafletInstanceRef.current = null;
      }

      container.innerHTML = '';

      const center = { lat: 21.1738, lng: 72.8028 };
      const map = new window.google.maps.Map(container, {
        center,
        zoom: 13,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : GOOGLE_MAPS_LIGHT_STYLE
      });

      googleMapInstanceRef.current = map;
      renderGoogleMarkers(map);

      setTimeout(() => {
        if (googleMapInstanceRef.current) {
          window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
          googleMapInstanceRef.current.setCenter(center);
        }
      }, 200);
    }
  }, [mapEngine, googleMapsReady]);

  // Handle Resize whenever viewport is expanded/collapsed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
        leafletInstanceRef.current.invalidateSize(true);
      } else if (mapEngine === 'google' && googleMapInstanceRef.current && window.google?.maps) {
        window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Filtered incidents list
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      if (filter === 'fail') return item.status === 'fail';
      if (filter === 'pass') return item.status === 'pass';
      if (filter === 'milk') return item.food.toLowerCase().includes('milk');
      if (filter === 'spices') return item.food.toLowerCase().includes('turmeric') || item.food.toLowerCase().includes('chili');
      if (filter === 'honey') return item.food.toLowerCase().includes('honey');
      return true;
    });
  }, [incidents, filter]);

  // Leaflet Marker Rendering
  const renderLeafletMarkers = (mapInstance) => {
    const lmap = mapInstance || leafletInstanceRef.current;
    if (!lmap || !leafletMarkersGroupRef.current || !leafletCirclesGroupRef.current) return;

    leafletMarkersGroupRef.current.clearLayers();
    leafletCirclesGroupRef.current.clearLayers();
    markersMapRef.current = {};

    filteredIncidents.forEach((item) => {
      const isFail = item.status === 'fail';

      if (isFail) {
        // Hyper-polished precision pinpoint needle marker (Red Spike)
        const customIcon = L.divIcon({
          className: 'precision-map-marker-wrapper',
          html: `
            <div class="precision-map-pin red">
              <div class="pin-head red">
                <div class="pin-glaze"></div>
                <span class="pin-emoji">⚠️</span>
                <div class="pin-pulse-ring red"></div>
              </div>
              <div class="pin-needle red"></div>
              <div class="pin-shadow-ground"></div>
            </div>
          `,
          iconSize: [36, 48],
          iconAnchor: [18, 48],
          popupAnchor: [0, -48]
        });

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });

        // Radar circle layer
        const circle = L.circle([item.lat, item.lng], {
          radius: 380,
          color: '#ef4444',
          weight: 1.5,
          opacity: 0.85,
          fillColor: '#ef4444',
          fillOpacity: 0.18
        });
        leafletCirclesGroupRef.current.addLayer(circle);

        const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || (item.road + ', ' + item.neighborhood + ', Surat'))}`;

        // Rich Glassmorphic Popup with Road Name, Full Address, Landmark & Google Maps Navigation Link
        const popupContent = `
          <div class="pureplate-popup-card">
            <div class="popup-status-badge fail">
              <span>⚠️ Contamination Spike</span>
            </div>

            <div class="popup-road-badge">
              <span>🛣️ ${item.road || 'Ghod Dod Road'}</span>
            </div>

            <div class="popup-food-title">${item.food}</div>

            <div class="popup-address-card">
              <div class="popup-addr-line">
                <span class="addr-label">Address:</span>
                <span class="addr-val">${item.address || `${item.road || 'Ghod Dod Road'}, ${item.neighborhood}, Surat`}</span>
              </div>
              <div class="popup-landmark-line">
                <span class="addr-label">Landmark:</span>
                <span class="addr-val">${item.landmark || 'Near Main Market'}</span>
              </div>
              <div class="popup-ward-line">
                <span class="addr-label">Ward:</span>
                <span class="addr-val">${item.neighborhood}</span>
              </div>
            </div>

            <div class="popup-adulterant-box fail">
              <strong>Adulterant:</strong> ${item.adulterant}
            </div>

            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
              <strong>Test:</strong> ${item.testType || 'Reagent Colorimetric Test'}
            </div>

            <div class="popup-footer-row">
              <span>⏱️ ${item.timestamp || 'Recent'}</span>
              <span>🏪 ${item.vendorType || 'Local Vendor'}</span>
            </div>

            <a href="${googleMapsSearchUrl}" target="_blank" rel="noopener noreferrer" class="popup-gmaps-btn" id="btn-popup-gmaps-${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Open in Google Maps ↗</span>
            </a>

            <div class="popup-actions-row">
              <button class="popup-btn primary" id="btn-popup-test-${item.id}">
                🔬 Test Food
              </button>
              <button class="popup-btn" id="btn-popup-zoom-${item.id}">
                🎯 Focus
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 330 });

        marker.on('click', () => {
          soundEngine.playClick();
          setSelectedIncidentId(item.id);
        });

        marker.on('popupopen', () => {
          const testBtn = document.getElementById(`btn-popup-test-${item.id}`);
          if (testBtn) {
            testBtn.onclick = () => handleTestThisFood(item);
          }
          const zoomBtn = document.getElementById(`btn-popup-zoom-${item.id}`);
          if (zoomBtn) {
            zoomBtn.onclick = () => {
              soundEngine.playClick();
              lmap.flyTo([item.lat, item.lng], 16, { duration: 1 });
            };
          }
        });

        leafletMarkersGroupRef.current.addLayer(marker);
        markersMapRef.current[item.id] = marker;

      } else {
        // Hyper-polished precision pinpoint needle marker (Green Pure Zone)
        const shieldIcon = L.divIcon({
          className: 'precision-map-marker-wrapper',
          html: `
            <div class="precision-map-pin green">
              <div class="pin-head green">
                <div class="pin-glaze"></div>
                <span class="pin-emoji">🛡️</span>
                <div class="pin-pulse-ring green"></div>
              </div>
              <div class="pin-needle green"></div>
              <div class="pin-shadow-ground"></div>
            </div>
          `,
          iconSize: [36, 48],
          iconAnchor: [18, 48],
          popupAnchor: [0, -48]
        });

        const marker = L.marker([item.lat, item.lng], { icon: shieldIcon });

        // Safe green aura
        const circle = L.circle([item.lat, item.lng], {
          radius: 250,
          color: '#10b981',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#10b981',
          fillOpacity: 0.12
        });
        leafletCirclesGroupRef.current.addLayer(circle);

        const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || (item.road + ', ' + item.neighborhood + ', Surat'))}`;

        const popupContent = `
          <div class="pureplate-popup-card">
            <div class="popup-status-badge pass">
              <span>🛡️ Verified Pure Zone</span>
            </div>

            <div class="popup-road-badge pure">
              <span>🛣️ ${item.road || 'City Light Road'}</span>
            </div>

            <div class="popup-food-title">${item.food}</div>

            <div class="popup-address-card">
              <div class="popup-addr-line">
                <span class="addr-label">Address:</span>
                <span class="addr-val">${item.address || `${item.road || 'City Light Road'}, ${item.neighborhood}, Surat`}</span>
              </div>
              <div class="popup-landmark-line">
                <span class="addr-label">Landmark:</span>
                <span class="addr-val">${item.landmark || 'Near Science Centre'}</span>
              </div>
              <div class="popup-ward-line">
                <span class="addr-label">Ward:</span>
                <span class="addr-val">${item.neighborhood}</span>
              </div>
            </div>

            <div class="popup-adulterant-box pass">
              <strong>Verified Safe:</strong> 100% Unadulterated
            </div>

            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
              <strong>Test:</strong> ${item.testType || 'Reagent Verification'}
            </div>

            <div class="popup-footer-row">
              <span>⏱️ ${item.timestamp || 'Recent'}</span>
              <span>🏪 ${item.vendorType || 'Local Vendor'}</span>
            </div>

            <a href="${googleMapsSearchUrl}" target="_blank" rel="noopener noreferrer" class="popup-gmaps-btn" id="btn-popup-gmaps-${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Open in Google Maps ↗</span>
            </a>

            <div class="popup-actions-row">
              <button class="popup-btn primary" id="btn-popup-test-${item.id}">
                🔬 Re-Test Food
              </button>
              <button class="popup-btn" id="btn-popup-zoom-${item.id}">
                🎯 Focus
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 330 });

        marker.on('click', () => {
          soundEngine.playClick();
          setSelectedIncidentId(item.id);
        });

        marker.on('popupopen', () => {
          const testBtn = document.getElementById(`btn-popup-test-${item.id}`);
          if (testBtn) {
            testBtn.onclick = () => handleTestThisFood(item);
          }
          const zoomBtn = document.getElementById(`btn-popup-zoom-${item.id}`);
          if (zoomBtn) {
            zoomBtn.onclick = () => {
              soundEngine.playClick();
              lmap.flyTo([item.lat, item.lng], 16, { duration: 1 });
            };
          }
        });

        leafletMarkersGroupRef.current.addLayer(marker);
        markersMapRef.current[item.id] = marker;
      }
    });
  };

  // Google Maps Markers & Circles
  const clearGoogleLayers = () => {
    googleMarkersRef.current.forEach((m) => m.setMap(null));
    googleMarkersRef.current = [];
    googleCirclesRef.current.forEach((c) => c.setMap(null));
    googleCirclesRef.current = [];
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }
  };

  const renderGoogleMarkers = (mapInstance) => {
    const map = mapInstance || googleMapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    clearGoogleLayers();

    filteredIncidents.forEach((item) => {
      const isFail = item.status === 'fail';
      const pos = { lat: item.lat, lng: item.lng };

      if (isFail) {
        const circle = new window.google.maps.Circle({
          strokeColor: '#ef4444',
          strokeOpacity: 0.85,
          strokeWeight: 1.5,
          fillColor: '#ef4444',
          fillOpacity: 0.22,
          map: map,
          center: pos,
          radius: 380,
          clickable: false
        });
        googleCirclesRef.current.push(circle);

        const marker = new window.google.maps.Marker({
          position: pos,
          map: map,
          title: `⚠️ Contamination Spike: ${item.food}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
                <path d="M18 0 C8.06 0 0 8.06 0 18 C0 28.5 18 48 18 48 C18 48 36 28.5 36 18 C36 8.06 27.94 0 18 0 Z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                <circle cx="18" cy="18" r="12" fill="#b91c1c"/>
                <text x="18" y="23" font-size="14" text-anchor="middle" fill="#ffffff">⚠️</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(36, 48),
            anchor: new window.google.maps.Point(18, 48)
          }
        });

        const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || (item.road + ', ' + item.neighborhood + ', Surat'))}`;

        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 6px; max-width: 290px;">
              <div style="font-weight: 800; color: #ef4444; font-size: 13px; margin-bottom: 3px;">⚠️ Contamination Spike</div>
              <div style="display: inline-block; padding: 2px 7px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; font-size: 11px; font-weight: 700; color: #dc2626; margin-bottom: 4px;">
                🛣️ ${item.road || 'Ghod Dod Road'}
              </div>
              <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 2px;">${item.food}</div>
              <div style="color: #475569; font-size: 11.5px; margin-bottom: 3px;"><strong>🏠 Address:</strong> ${item.address || `${item.road || 'Ghod Dod Road'}, ${item.neighborhood}, Surat`}</div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;"><strong>📍 Landmark:</strong> ${item.landmark || 'Near Main Market'}</div>
              <div style="padding: 5px 8px; background: #fff1f2; border-radius: 6px; color: #9f1239; font-size: 11px; font-weight: 700; margin-bottom: 6px;">
                Adulterant: ${item.adulterant}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
                Reported ${item.timestamp} • ${item.vendorType || "Vendor"}
              </div>
              <a href="${googleMapsSearchUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 10px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 11.5px; font-weight: 700;">
                📍 Open in Google Maps ↗
              </a>
            </div>
          `
        });

        marker.addListener('click', () => {
          soundEngine.playClick();
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
          info.open(map, marker);
          activeInfoWindowRef.current = info;
          setSelectedIncidentId(item.id);
        });

        googleMarkersRef.current.push(marker);
      } else {
        const marker = new window.google.maps.Marker({
          position: pos,
          map: map,
          title: `🛡️ Verified Pure: ${item.food}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
                <path d="M18 0 C8.06 0 0 8.06 0 18 C0 28.5 18 48 18 48 C18 48 36 28.5 36 18 C36 8.06 27.94 0 18 0 Z" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
                <circle cx="18" cy="18" r="12" fill="#047857"/>
                <text x="18" y="23" font-size="14" text-anchor="middle" fill="#ffffff">🛡️</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(36, 48),
            anchor: new window.google.maps.Point(18, 48)
          }
        });

        const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || (item.road + ', ' + item.neighborhood + ', Surat'))}`;

        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 6px; max-width: 290px;">
              <div style="font-weight: 800; color: #047857; font-size: 13px; margin-bottom: 3px;">🛡️ Verified Pure &amp; Safe</div>
              <div style="display: inline-block; padding: 2px 7px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 4px;">
                🛣️ ${item.road || 'City Light Road'}
              </div>
              <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 2px;">${item.food}</div>
              <div style="color: #475569; font-size: 11.5px; margin-bottom: 3px;"><strong>🏠 Address:</strong> ${item.address || `${item.road || 'City Light Road'}, ${item.neighborhood}, Surat`}</div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;"><strong>📍 Landmark:</strong> ${item.landmark || 'Near Science Centre'}</div>
              <div style="padding: 5px 8px; background: #ecfdf5; border-radius: 6px; color: #065f46; font-size: 11px; font-weight: 700; margin-bottom: 6px;">
                Verified 100% Unadulterated
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
                Logged ${item.timestamp} • Verified Pure
              </div>
              <a href="${googleMapsSearchUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 10px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 11.5px; font-weight: 700;">
                📍 Open in Google Maps ↗
              </a>
            </div>
          `
        });

        marker.addListener('click', () => {
          soundEngine.playClick();
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
          info.open(map, marker);
          activeInfoWindowRef.current = info;
          setSelectedIncidentId(item.id);
        });

        googleMarkersRef.current.push(marker);
      }
    });
  };

  // Re-render markers when filter, incidents, or engine changes
  useEffect(() => {
    if (mapEngine === 'leaflet') {
      renderLeafletMarkers();
    } else {
      renderGoogleMarkers();
    }
  }, [filter, incidents, mapEngine]);

  // Jump to Surat Ward
  const handleJumpToWard = (ward) => {
    soundEngine.playClick();
    setActiveWard(ward.id);
    if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      leafletInstanceRef.current.flyTo(ward.coords, ward.zoom, { duration: 1.2 });
    } else if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: ward.coords[0], lng: ward.coords[1] });
      googleMapInstanceRef.current.setZoom(ward.zoom);
    }
    showToast(`📍 Centered map on ${ward.name}, Surat`, 'info');
  };

  // Focus and pop open marker when clicking a feed item
  const handleFocusIncident = (item) => {
    soundEngine.playClick();
    setSelectedIncidentId(item.id);
    setMobileDrawerOpen(false); // Close mobile bottom drawer so map is fully visible

    if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      leafletInstanceRef.current.flyTo([item.lat, item.lng], 15, { duration: 1 });
      const marker = markersMapRef.current[item.id];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }
    } else if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: item.lat, lng: item.lng });
      googleMapInstanceRef.current.setZoom(15);
    }
  };

  // Live GPS Geolocation
  const handleLocateUser = () => {
    soundEngine.playClick();
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this device', 'warning');
      return;
    }
    showToast('🛰️ Acquiring live GPS lock...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
          const lmap = leafletInstanceRef.current;
          lmap.flyTo([latitude, longitude], 15, { duration: 1.2 });

          const gpsIcon = L.divIcon({
            className: 'custom-gps-pin',
            html: '<div class="gps-marker-inner" title="Your GPS Location"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker([latitude, longitude], { icon: gpsIcon })
            .addTo(lmap)
            .bindPopup(`<strong>📍 Your Live Location</strong><br/><span style="font-size:11px;color:#64748b;">Accurate to ~${Math.round(accuracy || 20)} meters</span>`)
            .openPopup();

          L.circle([latitude, longitude], {
            radius: Math.max(accuracy || 50, 100),
            color: '#0284c7',
            weight: 1,
            fillColor: '#38bdf8',
            fillOpacity: 0.15
          }).addTo(lmap);

        } else if (googleMapInstanceRef.current && window.google?.maps) {
          const userPos = { lat: latitude, lng: longitude };
          googleMapInstanceRef.current.panTo(userPos);
          googleMapInstanceRef.current.setZoom(15);

          new window.google.maps.Circle({
            strokeColor: '#0284c7',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: '#38bdf8',
            fillOpacity: 0.35,
            map: googleMapInstanceRef.current,
            center: userPos,
            radius: 120
          });
        }
        soundEngine.playSuccess();
        showToast('📍 Live GPS position locked on map!', 'success');
      },
      () => {
        showToast('GPS permission denied. Centered on Surat, Athwa Lines.', 'warning');
        if (leafletInstanceRef.current) {
          leafletInstanceRef.current.flyTo([21.1738, 72.8028], 14);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Navigate to testing protocol for a food item
  const handleTestThisFood = (item) => {
    soundEngine.playClick();
    const matchedProtocol = FOOD_PROTOCOLS.find(p => 
      p.foodName.toLowerCase().includes(item.food.toLowerCase().split(' ')[0]) ||
      item.food.toLowerCase().includes(p.foodName.toLowerCase().split(' ')[0])
    ) || FOOD_PROTOCOLS[0];

    if (onSelectFood) {
      onSelectFood(matchedProtocol);
    } else if (onNavigate) {
      onNavigate('screen-selection');
    }
  };

  // Submit Community Report on Map
  const handleSubmitReport = (e) => {
    e.preventDefault();
    soundEngine.playSuccess();

    storage.submitTestResult({
      food: reportFood,
      testType: `${reportFood} Purity Check`,
      status: reportStatus,
      adulterant: reportStatus === 'fail' ? reportAdulterant : 'None Detected',
      vendorType: reportVendor,
      locationName: reportCoords.neighborhood,
      road: reportRoad || 'Ghod Dod Road',
      landmark: reportLandmark || 'Near Main Market',
      address: reportAddress || `${reportRoad || 'Ghod Dod Road'}, ${reportCoords.neighborhood}, Surat`,
      lat: reportCoords.lat,
      lng: reportCoords.lng
    });

    refreshIncidents();
    setIsReportModalOpen(false);
    showToast(`✅ ${reportFood} report pinned to Surat safety grid!`, 'success');

    // Pan map to new pin
    if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      leafletInstanceRef.current.flyTo([reportCoords.lat, reportCoords.lng], 15, { duration: 1 });
    }
  };

  // Handle API Key Configuration
  const handleSaveApiKey = (e) => {
    e.preventDefault();
    soundEngine.playClick();
    const cleanKey = apiKeyInput.trim();
    localStorage.setItem('pureplate_google_maps_api_key', cleanKey);
    setApiKey(cleanKey);
    setApiKeyModalOpen(false);
    showToast(cleanKey ? '🔑 Google Maps API Key saved! Reloading map...' : 'Standard vector map engine active.', 'success');
  };

  const handleExportCsv = () => {
    soundEngine.playClick();
    storage.exportIncidentsAsCsv();
    showToast('📥 Exported CSV Report successfully!', 'success');
  };

  const handleExportJson = () => {
    soundEngine.playClick();
    storage.exportIncidentsAsJson();
    showToast('📦 Exported JSON Database successfully!', 'success');
  };

  return (
    <section id="screen-heatmap" className="app-screen active">
      {/* Top Header */}
      <div className="map-screen-top-nav">
        <div className="map-title-row">
          <div className="map-title-group">
            <h2 className="map-heading">Surat Food Security Radar</h2>
            <span className="map-engine-pill">
              {mapEngine === 'google' ? '🗺️ Google Maps' : `🛰️ ${TILE_PROVIDERS[activeTileKey]?.name || 'Leaflet Vector'}`}
            </span>
          </div>
          <div className="map-primary-actions">
            <button 
              className="map-action-btn primary" 
              id="btn-add-map-report"
              title="Log test result on map" 
              onClick={() => {
                soundEngine.playClick();
                setIsReportModalOpen(true);
              }}
            >
              <span>➕ Pin Test</span>
            </button>
            <button className="map-action-btn" id="btn-locate-user-map" title="Center on my location" onClick={handleLocateUser}>
              <span>🎯 My GPS</span>
            </button>
            <button
              className="map-action-btn"
              title="Toggle Fullscreen / Expand"
              onClick={() => {
                soundEngine.playClick();
                setIsExpanded(!isExpanded);
              }}
            >
              <span>{isExpanded ? '⤢ Compact' : '⤢ Expand'}</span>
            </button>
          </div>
        </div>

        <p className="map-subheading">Live crowdsourced adulteration heat map &amp; pure zones across Surat municipal wards</p>
      </div>

      {/* Real-Time Safety Metrics Strip */}
      <div className="map-stats-strip">
        <div className="map-stat-badge">
          <span>🛡️ Surat Purity Index:</span>
          <span className={`map-stat-val ${stats.purityRate >= 80 ? 'safe' : 'danger'}`}>
            {stats.purityRate}% Clean
          </span>
        </div>
        <div className="map-stat-badge">
          <span>📍 Verified Tests:</span>
          <span className="map-stat-val">{stats.total} Logs</span>
        </div>
        <div className="map-stat-badge">
          <span>🚨 Active Danger Zones:</span>
          <span className="map-stat-val danger">{stats.fails} Spikes</span>
        </div>
      </div>

      {/* Surat Municipal Wards Command Bar (Desktop & Mobile) */}
      <div className="map-wards-bar" id="surat-wards-bar">
        <div className="wards-bar-title-wrap">
          <span className="wards-bar-icon">🏛️</span>
          <span className="wards-bar-title">Surat Wards</span>
        </div>
        <div className="wards-chips-track">
          {SURAT_WARDS.map((w) => (
            <button
              key={w.id}
              className={`ward-jump-chip ${activeWard === w.id ? 'active' : ''}`}
              onClick={() => handleJumpToWard(w)}
              title={`Focus on ${w.name}, Surat`}
            >
              <span className="ward-chip-pin">📍</span>
              <span className="ward-chip-text">{w.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="map-filter-bar">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setFilter(f.id);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map Viewport Canvas with Floating Overlays */}
      <div className={`map-viewport-wrapper ${isExpanded ? 'is-fullscreen' : ''}`}>
        <div 
          ref={mapContainerRef} 
          id="pureplate-leaflet-map" 
          style={{ width: '100%', height: '100%' }}
        ></div>


        {/* Floating Glassmorphic Legend Box (Desktop) */}
        <div className="map-legend-box">
          <div 
            className="legend-row" 
            onClick={() => {
              soundEngine.playClick();
              setFilter(filter === 'fail' ? 'all' : 'fail');
            }}
            title="Click to filter spikes"
          >
            <span className="legend-dot red-pulse"></span>
            <span>Spike (&gt;3 fails in 7 days)</span>
          </div>
          <div 
            className="legend-row" 
            onClick={() => {
              soundEngine.playClick();
              setFilter(filter === 'pass' ? 'all' : 'pass');
            }}
            title="Click to filter pure zones"
          >
            <span className="legend-dot green-shield"></span>
            <span>Verified Pure Zone</span>
          </div>
        </div>

        {/* ── Mobile Floating Filter Island (Phone View Only) ── */}
        <div className="map-mobile-top-island">
          {/* Horizontal Swipeable Filter Chips */}
          <div className="map-mobile-filters-scroll">
            {filters.map((f) => (
              <button
                key={f.id}
                className={`mobile-filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => {
                  soundEngine.playClick();
                  setFilter(f.id);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile Floating Action FABs (Right Side) ── */}
        <div className="map-mobile-fabs">
          <button 
            className="mobile-fab primary" 
            title="Pin Food Safety Report"
            onClick={() => {
              soundEngine.playClick();
              setIsReportModalOpen(true);
            }}
          >
            <span>➕</span>
          </button>
          <button 
            className="mobile-fab" 
            title="Center on My GPS"
            onClick={handleLocateUser}
          >
            <span>🎯</span>
          </button>
        </div>

        {/* ── Mobile Floating Apple Maps Bottom Safety Drawer ── */}
        <div className={`map-mobile-drawer ${mobileDrawerOpen ? 'expanded' : 'collapsed'}`}>
          <div 
            className="mobile-drawer-header" 
            onClick={() => {
              soundEngine.playClick();
              setMobileDrawerOpen(!mobileDrawerOpen);
            }}
          >
            <div className="drawer-handle-bar"></div>
            <div className="drawer-summary-row">
              <div className="drawer-stat-pill">
                <span className="pulse-dot"></span>
                <span>{stats.purityRate}% Surat Clean</span>
              </div>
              <div className="drawer-counts">
                <span>🚨 {stats.fails} Spikes</span>
                <span>•</span>
                <span>🛡️ {stats.total - stats.fails} Pure</span>
              </div>
              <button className="drawer-toggle-btn" aria-label="Toggle feed drawer">
                {mobileDrawerOpen ? 'Close ▾' : `Feed (${filteredIncidents.length}) ▴`}
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="mobile-drawer-body">
            <div className="drawer-body-title">
              <span>Surat Live Citizen Reports ({filteredIncidents.length})</span>
              <span className="drawer-tip">Tap card to focus on map</span>
            </div>
            <div className="drawer-cards-list">
              {filteredIncidents.map((item) => {
                const isFail = item.status === 'fail';
                const isSelected = selectedIncidentId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`drawer-incident-card ${isFail ? 'fail' : 'pass'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleFocusIncident(item)}
                  >
                    <div className="dic-top-row">
                      <span className="dic-icon">{isFail ? '⚠️' : '🛡️'}</span>
                      <div className="dic-road-badge">
                        🛣️ {item.road || item.neighborhood}
                      </div>
                      <span className="dic-time">{item.timestamp || 'Recent'}</span>
                    </div>

                    <div className="dic-food-name">{item.food}</div>

                    <div className={`dic-status-line ${isFail ? 'fail' : 'pass'}`}>
                      {isFail ? `Adulterant: ${item.adulterant}` : 'Verified 100% Pure & Safe'}
                    </div>

                    <div className="dic-address">
                      🏠 {item.address || `${item.road || item.neighborhood}, Surat`}
                    </div>

                    <div className="dic-actions">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || (item.road + ', ' + item.neighborhood + ', Surat'))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="dic-gmaps-link"
                      >
                        📍 Google Maps ↗
                      </a>
                      <span className="dic-inspect-btn">Focus on Map ➔</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Community Intelligence Feed (Bottom Sheet) */}
      <div className="map-bottom-feed" id="map-bottom-feed">
        <div className="map-feed-header">
          <div className="mf-title">
            <span className="pulse-dot"></span>
            <h4>Surat Community Intelligence Feed</h4>
            <span className="feed-counter" id="feed-count-badge">
              {filteredIncidents.length} logs in view
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Click any entry to inspect on map ➔
          </span>
        </div>
        <div className="map-feed-items" id="map-feed-items">
          {filteredIncidents.map((item) => {
            const isFail = item.status === 'fail';
            const isSelected = selectedIncidentId === item.id;
            return (
              <div 
                key={item.id} 
                className={`feed-log-entry ${isFail ? 'fail' : 'pass'} ${isSelected ? 'active-selected' : ''}`}
                onClick={() => handleFocusIncident(item)}
              >
                <span className="feed-log-icon">{isFail ? '⚠️' : '🛡️'}</span>
                <div className="feed-log-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isFail ? '#dc2626' : '#059669',
                      background: isFail ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      padding: '1px 7px',
                      borderRadius: '6px'
                    }}>
                      🛣️ {item.road || item.neighborhood}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.food}
                    </span>
                  </div>
                  <span className="feed-log-text" style={{ fontSize: '11.5px' }}>
                    {isFail
                      ? `⚠️ ${item.adulterant}`
                      : `🛡️ Verified Pure & Safe`}
                  </span>
                  <div className="feed-log-meta" style={{ marginTop: '3px' }}>
                    <span>🏠 {item.address || `${item.road || item.neighborhood}, Surat`}</span>
                    <span>•</span>
                    <span>📍 {item.landmark || item.neighborhood}</span>
                    <span>•</span>
                    <span>⏱️ {item.timestamp || 'Recent'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || (item.road + ', ' + item.neighborhood + ', Surat'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#0284c7',
                      background: 'rgba(2, 132, 199, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    title="Open in Google Maps"
                  >
                    Google Maps ↗
                  </a>
                  <span className="feed-jump-hint">Inspect ➔</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Pin/Log Food Test on Map - Portaled to document.body so it is never clipped */}
      {isReportModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="auth-modal-backdrop active" onClick={() => setIsReportModalOpen(false)}>
          <div className="auth-modal-sheet modal-report-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsReportModalOpen(false)} aria-label="Close modal">
              &times;
            </button>
            <div className="modal-header-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(13, 148, 136, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  📍
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Pin Food Safety Report
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Log real-time citizen test results directly to the Surat heat map
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="modal-form-scrollable">
              {/* Row 1: Food Sample + Result Verdict */}
              <div className="modal-form-grid-2">
                <div className="form-group-field">
                  <label className="modal-field-label">
                    Food Sample Tested:
                  </label>
                  <select
                    value={reportFood}
                    onChange={(e) => setReportFood(e.target.value)}
                    className="modal-select-input"
                  >
                    <option value="Milk & Dairy">🥛 Milk &amp; Dairy</option>
                    <option value="Turmeric Powder">🌶️ Turmeric Powder (Haldi)</option>
                    <option value="Red Chili Powder">🌶️ Red Chili Powder</option>
                    <option value="Pure Honey">🍯 Pure Honey</option>
                    <option value="Edible Oil & Ghee">🫒 Edible Cooking Oil &amp; Ghee</option>
                    <option value="Tea Leaves">☕ Tea Leaves</option>
                    <option value="Sweets / Mawa">🍬 Mawa &amp; Traditional Sweets</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label className="modal-field-label">
                    Test Result Verdict:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label style={{
                      padding: '9px 6px',
                      borderRadius: '12px',
                      border: `1.5px solid ${reportStatus === 'fail' ? '#ef4444' : 'var(--border-subtle)'}`,
                      background: reportStatus === 'fail' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card)',
                      color: reportStatus === 'fail' ? '#dc2626' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.18s'
                    }}>
                      <input 
                        type="radio" 
                        name="test_status" 
                        value="fail" 
                        checked={reportStatus === 'fail'} 
                        onChange={() => setReportStatus('fail')} 
                        style={{ display: 'none' }}
                      />
                      ⚠️ Adulterated
                    </label>

                    <label style={{
                      padding: '9px 6px',
                      borderRadius: '12px',
                      border: `1.5px solid ${reportStatus === 'pass' ? '#10b981' : 'var(--border-subtle)'}`,
                      background: reportStatus === 'pass' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                      color: reportStatus === 'pass' ? '#059669' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.18s'
                    }}>
                      <input 
                        type="radio" 
                        name="test_status" 
                        value="pass" 
                        checked={reportStatus === 'pass'} 
                        onChange={() => setReportStatus('pass')} 
                        style={{ display: 'none' }}
                      />
                      🛡️ Pure (Pass)
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 2 (if fail): Adulterant Detected */}
              {reportStatus === 'fail' && (
                <div className="form-group-field" style={{ animation: 'modal-fade-in 0.2s ease' }}>
                  <label className="modal-field-label">
                    Specific Adulterant Detected:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Added Starch, Detergent, Brick Dust, Metanil Yellow"
                    value={reportAdulterant}
                    onChange={(e) => setReportAdulterant(e.target.value)}
                    className="modal-text-input"
                    required
                  />
                </div>
              )}

              {/* Row 3: Road Name + Landmark (2 Columns) */}
              <div className="modal-form-grid-2">
                <div className="form-group-field">
                  <label className="modal-field-label">
                    Road / Street Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ghod Dod Road"
                    value={reportRoad}
                    onChange={(e) => setReportRoad(e.target.value)}
                    className="modal-text-input"
                    required
                  />
                </div>

                <div className="form-group-field">
                  <label className="modal-field-label">
                    Specific Landmark:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Joggers Park"
                    value={reportLandmark}
                    onChange={(e) => setReportLandmark(e.target.value)}
                    className="modal-text-input"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Ward / Area + Vendor Type (2 Columns) */}
              <div className="modal-form-grid-2">
                <div className="form-group-field">
                  <label className="modal-field-label">
                    Surat Ward / Area:
                  </label>
                  <input
                    type="text"
                    value={reportCoords.neighborhood}
                    onChange={(e) => setReportCoords({ ...reportCoords, neighborhood: e.target.value })}
                    className="modal-text-input"
                    required
                  />
                </div>

                <div className="form-group-field">
                  <label className="modal-field-label">
                    Vendor / Store Type:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Local Loose Milk Vendor, Dairy Stall"
                    value={reportVendor}
                    onChange={(e) => setReportVendor(e.target.value)}
                    className="modal-text-input"
                  />
                </div>
              </div>

              {/* Row 5: Full Street Address */}
              <div className="form-group-field">
                <label className="modal-field-label">
                  Full Street Address:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop 4, Silver Point Arcade, Ghod Dod Road, Surat - 395007"
                  value={reportAddress}
                  onChange={(e) => setReportAddress(e.target.value)}
                  className="modal-text-input"
                  required
                />
              </div>

              {/* GPS Geocoding Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--brand-green)', fontWeight: 700, padding: '4px 0' }}>
                <span className="pulse-dot"></span>
                <span>📍 GPS Pin Geocoded &amp; Locked to Surat Coordinates</span>
              </div>

              {/* Modal Actions Footer */}
              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                >
                  Pin on Heat Map ➔
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </section>
  );
}
