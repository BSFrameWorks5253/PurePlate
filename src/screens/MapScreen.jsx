import React, { useEffect, useRef, useState } from 'react';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Google Maps Custom Apple Liquid Glass Styles
const GOOGLE_MAPS_LIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }, { weight: 1.5 }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#ecfdf5' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#ccfbf1' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#99f6e4' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284c7' }]
  }
];

const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#064e3b' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#0f766e' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#03172e' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }]
  }
];

export default function MapScreen({ showToast, theme }) {
  const mapContainerRef = useRef(null);
  
  // Google Maps refs
  const googleMapInstanceRef = useRef(null);
  const googleMarkersRef = useRef([]);
  const googleCirclesRef = useRef([]);
  const activeInfoWindowRef = useRef(null);

  // Fallback Leaflet refs
  const leafletInstanceRef = useRef(null);
  const leafletMarkersRef = useRef(null);
  const leafletCirclesRef = useRef(null);

  const [mapEngine, setMapEngine] = useState('google'); // 'google' or 'leaflet'
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('pureplate_google_maps_api_key') || 
           (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || 
           '';
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('pureplate_google_maps_api_key') || 
           (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || 
           '';
  });

  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState(storage.getAllIncidents());

  const filters = [
    { id: 'all', label: 'All Food Types' },
    { id: 'fail', label: '⚠️ Contamination Spikes' },
    { id: 'pass', label: '🛡️ Pure Zones' },
    { id: 'milk', label: '🥛 Milk Only' },
    { id: 'spices', label: '🌶️ Spices' },
  ];

  // Dynamically load Google Maps script
  useEffect(() => {
    let isCancelled = false;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsReady(true);
        return;
      }

      // Check if script already attached
      const existingScript = document.getElementById('google-maps-api-script');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'google-maps-api-script';
      const keyQuery = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=places,geometry${keyQuery}&callback=__initPurePlateGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.__initPurePlateGoogleMaps = () => {
        if (!isCancelled) {
          console.log('✅ Google Maps JavaScript API loaded successfully');
          setGoogleMapsReady(true);
          setMapEngine('google');
        }
      };

      script.onerror = () => {
        if (!isCancelled) {
          console.warn('⚠️ Google Maps script failed to load. Falling back to high-res OpenStreetMap engine.');
          setMapEngine('leaflet');
          showToast('Google Maps network notice: using fallback map engine', 'info');
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      isCancelled = true;
      if (window.__initPurePlateGoogleMaps) {
        delete window.__initPurePlateGoogleMaps;
      }
    };
  }, [apiKey]);

  // Cleanup map instances on unmount
  useEffect(() => {
    return () => {
      clearGoogleLayers();
      googleMapInstanceRef.current = null;
      if (leafletInstanceRef.current) {
        try {
          leafletInstanceRef.current.remove();
        } catch (e) {}
        leafletInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize and maintain Google Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapEngine === 'google' && window.google && window.google.maps) {
      // Teardown Leaflet if switching from Leaflet to Google
      if (leafletInstanceRef.current) {
        try {
          leafletInstanceRef.current.remove();
        } catch (e) {}
        leafletInstanceRef.current = null;
      }

      const container = mapContainerRef.current;
      container.innerHTML = '';

      const center = { lat: 21.1738, lng: 72.8028 };
      const map = new window.google.maps.Map(container, {
        center,
        zoom: 13,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : GOOGLE_MAPS_LIGHT_STYLE
      });

      googleMapInstanceRef.current = map;
      renderGoogleMarkers(map);

      // Staggered resize triggers
      setTimeout(() => {
        if (googleMapInstanceRef.current) {
          window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
          googleMapInstanceRef.current.setCenter(center);
        }
      }, 150);

    } else if (mapEngine === 'leaflet') {
      // Fallback Leaflet Map
      clearGoogleLayers();
      googleMapInstanceRef.current = null;

      const container = mapContainerRef.current;
      container.innerHTML = '';

      if (leafletInstanceRef.current) {
        try {
          leafletInstanceRef.current.remove();
        } catch (e) {}
        leafletInstanceRef.current = null;
      }

      const lmap = L.map(container, {
        center: [21.1738, 72.8028],
        zoom: 13,
        zoomControl: false,
        preferCanvas: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(lmap);

      const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });
      osm.addTo(lmap);

      leafletMarkersRef.current = L.layerGroup().addTo(lmap);
      leafletCirclesRef.current = L.layerGroup().addTo(lmap);
      leafletInstanceRef.current = lmap;

      renderLeafletMarkers(lmap);

      setTimeout(() => {
        if (leafletInstanceRef.current) {
          leafletInstanceRef.current.invalidateSize(true);
        }
      }, 150);
    }
  }, [mapEngine, googleMapsReady]);

  // Update Google Maps theme dynamically
  useEffect(() => {
    if (mapEngine === 'google' && googleMapInstanceRef.current && window.google?.maps) {
      googleMapInstanceRef.current.setOptions({
        styles: theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : GOOGLE_MAPS_LIGHT_STYLE
      });
    }
  }, [theme, mapEngine]);

  // Render Google Maps Markers & Circles
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

    incidents.forEach((item) => {
      if (filter === 'fail' && item.status !== 'fail') return;
      if (filter === 'pass' && item.status !== 'pass') return;
      if (filter === 'milk' && !item.food.toLowerCase().includes('milk')) return;
      if (filter === 'spices' && !item.food.toLowerCase().includes('turmeric') && !item.food.toLowerCase().includes('chili')) return;

      const isFail = item.status === 'fail';
      const pos = { lat: item.lat, lng: item.lng };

      if (isFail) {
        // Red radar circle in Google Maps
        const circle = new window.google.maps.Circle({
          strokeColor: '#e11d48',
          strokeOpacity: 0.85,
          strokeWeight: 1.5,
          fillColor: '#e11d48',
          fillOpacity: 0.22,
          map: map,
          center: pos,
          radius: 380,
          clickable: false
        });
        googleCirclesRef.current.push(circle);

        // Warning Marker
        const marker = new window.google.maps.Marker({
          position: pos,
          map: map,
          title: `⚠️ Contamination Spike: ${item.food}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="#e11d48" stroke="#ffffff" stroke-width="2.5"/>
                <text x="18" y="23" font-size="16" text-anchor="middle" fill="#ffffff">⚠️</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18)
          }
        });

        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px; max-width: 250px;">
              <div style="font-weight: 800; color: #e11d48; font-size: 14px; margin-bottom: 3px;">
                ⚠️ Contamination Spike
              </div>
              <strong>${item.food}</strong> - ${item.testType}<br/>
              <span style="color: #64748b; font-size: 11px;">📍 ${item.neighborhood}</span><br/>
              <div style="margin-top: 5px; padding: 4px 8px; background: #fff1f2; border-radius: 6px; color: #9f1239; font-size: 11px; font-weight: 700;">
                Detected: ${item.adulterant}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">
                Reported ${item.timestamp} • ${item.vendorType || "Vendor"}
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          soundEngine.playClick();
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
          info.open(map, marker);
          activeInfoWindowRef.current = info;
        });

        googleMarkersRef.current.push(marker);
      } else {
        // Pure Shield Marker
        const marker = new window.google.maps.Marker({
          position: pos,
          map: map,
          title: `🛡️ Verified Pure: ${item.food}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
                <circle cx="17" cy="17" r="15" fill="#10b981" stroke="#ffffff" stroke-width="2.5"/>
                <text x="17" y="22" font-size="15" text-anchor="middle" fill="#ffffff">🛡️</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(34, 34),
            anchor: new window.google.maps.Point(17, 17)
          }
        });

        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px; max-width: 250px;">
              <div style="font-weight: 800; color: #047857; font-size: 14px; margin-bottom: 3px;">
                🛡️ Verified Pure &amp; Safe
              </div>
              <strong>${item.food}</strong><br/>
              <span style="color: #64748b; font-size: 11px;">📍 ${item.neighborhood}</span><br/>
              <div style="margin-top: 5px; padding: 4px 8px; background: #ecfdf5; border-radius: 6px; color: #065f46; font-size: 11px; font-weight: 700;">
                Verified 100% Unadulterated
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">
                Logged ${item.timestamp}
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          soundEngine.playClick();
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
          info.open(map, marker);
          activeInfoWindowRef.current = info;
        });

        googleMarkersRef.current.push(marker);
      }
    });
  };

  // Render Leaflet fallback markers
  const renderLeafletMarkers = (mapInstance) => {
    const lmap = mapInstance || leafletInstanceRef.current;
    if (!lmap || !leafletMarkersRef.current || !leafletCirclesRef.current) return;

    leafletMarkersRef.current.clearLayers();
    leafletCirclesRef.current.clearLayers();

    incidents.forEach((item) => {
      if (filter === 'fail' && item.status !== 'fail') return;
      if (filter === 'pass' && item.status !== 'pass') return;
      if (filter === 'milk' && !item.food.toLowerCase().includes('milk')) return;
      if (filter === 'spices' && !item.food.toLowerCase().includes('turmeric') && !item.food.toLowerCase().includes('chili')) return;

      const isFail = item.status === 'fail';

      if (isFail) {
        const circle = L.circle([item.lat, item.lng], {
          radius: 380,
          color: '#e11d48',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#e11d48',
          fillOpacity: 0.22
        });
        leafletCirclesRef.current.addLayer(circle);

        const alertIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="background:#e11d48;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(225,29,72,0.55);border:2px solid white;">⚠️</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([item.lat, item.lng], { icon: alertIcon });
        marker.bindPopup(`<strong>${item.food}</strong>: Adulterant detected (${item.adulterant})`);
        leafletMarkersRef.current.addLayer(marker);
      } else {
        const shieldIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="background:#10b981;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 12px rgba(16,185,129,0.55);border:2px solid white;">🛡️</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([item.lat, item.lng], { icon: shieldIcon });
        marker.bindPopup(`<strong>${item.food}</strong>: Verified 100% pure.`);
        leafletMarkersRef.current.addLayer(marker);
      }
    });
  };

  // Re-filter markers whenever filter or incidents change
  useEffect(() => {
    if (mapEngine === 'google') {
      renderGoogleMarkers();
    } else {
      renderLeafletMarkers();
    }
  }, [filter, incidents, mapEngine]);

  const handleLocateUser = () => {
    soundEngine.playClick();
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this device', 'warning');
      return;
    }
    showToast('Locating GPS position via Google Maps...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapEngine === 'google' && googleMapInstanceRef.current && window.google?.maps) {
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
        } else if (leafletInstanceRef.current) {
          leafletInstanceRef.current.flyTo([latitude, longitude], 15);
          L.circleMarker([latitude, longitude], {
            radius: 9,
            fillColor: '#0284c7',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1
          }).addTo(leafletInstanceRef.current).bindPopup('📍 <strong>Your Live Location</strong>').openPopup();
        }
        showToast('📍 Live GPS position locked on Google Maps!', 'success');
      },
      () => {
        showToast('GPS permission denied. Centered on Surat, Athwa Lines.', 'warning');
        if (mapEngine === 'google' && googleMapInstanceRef.current) {
          googleMapInstanceRef.current.panTo({ lat: 21.1738, lng: 72.8028 });
        }
      }
    );
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    soundEngine.playClick();
    const cleanKey = apiKeyInput.trim();
    localStorage.setItem('pureplate_google_maps_api_key', cleanKey);
    setApiKey(cleanKey);
    setApiKeyModalOpen(false);
    showToast(cleanKey ? '🔑 Google Maps API Key saved! Reloading map...' : 'Switched to standard Google Maps demo mode', 'success');
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
      {/* Header */}
      <div className="screen-top-nav">
        <div className="screen-top-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Regional Food Security Tracker</h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                background: mapEngine === 'google' ? 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)' : 'var(--brand-teal)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{mapEngine === 'google' ? '🗺️ Google Maps' : '🛰️ OpenStreetMap'}</span>
            </span>
          </div>
          <p>Live crowdsourced adulteration heat map for Surat &amp; surrounding areas</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-locate-user" id="btn-locate-user-map" title="Center on my location" onClick={handleLocateUser}>
            <span>🎯 My GPS</span>
          </button>
          <button
            className="btn-locate-user"
            title="Configure Google Maps API Key"
            onClick={() => {
              soundEngine.playClick();
              setApiKeyModalOpen(true);
            }}
          >
            <span>🔑 API Key</span>
          </button>
          <button
            className="btn-locate-user"
            title="Toggle Map Engine"
            onClick={() => {
              soundEngine.playClick();
              setMapEngine(mapEngine === 'google' ? 'leaflet' : 'google');
              showToast(mapEngine === 'google' ? 'Switched to OSM fallback' : 'Switched to Google Maps', 'info');
            }}
          >
            <span>🔄 Switch Engine</span>
          </button>
          <button className="btn-locate-user" title="Export CSV" onClick={handleExportCsv}>
            <span>📥 CSV</span>
          </button>
          <button className="btn-locate-user" title="Export JSON" onClick={handleExportJson}>
            <span>📦 JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs matching user screenshot */}
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

      {/* Fullscreen Map Canvas with Legend */}
      <div className="map-viewport-wrapper">
        <div 
          ref={mapContainerRef} 
          id="pureplate-google-map" 
          style={{ width: '100%', height: '100%', minHeight: '440px', position: 'relative' }}
        ></div>

        {/* Floating Apple Liquid Glass Legend Box from Screenshot */}
        <div className="map-legend-box">
          <div className="legend-row">
            <span className="legend-dot red-pulse"></span>
            <span>Spike (&gt;3 fails in 7 days)</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot green-shield"></span>
            <span>Verified Pure Zone</span>
          </div>
        </div>
      </div>

      {/* Pull-Up Feed Sheet at Bottom of Map */}
      <div className="map-bottom-feed" id="map-bottom-feed">
        <div className="map-feed-header">
          <div className="mf-title">
            <span className="pulse-dot"></span>
            <h4>Community Intelligence Feed</h4>
            <span className="feed-counter" id="feed-count-badge">{incidents.length} community logs</span>
          </div>
        </div>
        <div className="map-feed-items" id="map-feed-items">
          {incidents.map((item) => {
            const isFail = item.status === 'fail';
            return (
              <div key={item.id} className={`feed-log-entry ${isFail ? 'fail' : 'pass'}`}>
                <span className="feed-log-icon">{isFail ? '⚠️' : '✅'}</span>
                <div className="feed-log-body">
                  <span className="feed-log-text">
                    {isFail
                      ? `Adulterated ${item.food} logged near ${item.neighborhood}. (${item.adulterant})`
                      : `Pure ${item.food} verified near ${item.neighborhood}.`}
                  </span>
                  <div className="feed-log-meta">
                    <span>{item.timestamp}</span> • <span>{item.vendorType || 'Local Vendor'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Maps API Key Modal */}
      {apiKeyModalOpen && (
        <div className="auth-modal-backdrop active" onClick={() => setApiKeyModalOpen(false)}>
          <div className="auth-modal-sheet" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setApiKeyModalOpen(false)}>
              &times;
            </button>
            <div style={{ textAlign: 'left', padding: '10px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px' }}>🗺️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Google Maps Platform</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure Google Maps JavaScript API</span>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '10px 0 16px' }}>
                PurePlate uses Google Maps JavaScript API to render live high-definition vector tiles, satellite overlays, and crowdsourced Surat adulteration radar markers.
              </p>

              <form onSubmit={handleSaveApiKey}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Google Maps API Key:
                  </label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Tip: If left blank, Google Maps runs in dev/free mode or uses OpenStreetMap fallback.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-locate-user"
                    onClick={() => {
                      setApiKeyInput('');
                      localStorage.removeItem('pureplate_google_maps_api_key');
                      setApiKey('');
                      setApiKeyModalOpen(false);
                      showToast('API Key cleared. Using default mode.', 'info');
                    }}
                  >
                    Clear Key
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-action"
                    style={{ width: 'auto', padding: '10px 20px', borderRadius: '12px', fontSize: '13px' }}
                  >
                    Save &amp; Apply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
