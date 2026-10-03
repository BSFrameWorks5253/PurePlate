import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';

export default function MapScreen({ showToast, theme }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const radarCirclesLayerRef = useRef(null);
  const activeTileLayerRef = useRef(null);

  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState(storage.getAllIncidents());

  // Matches user screenshot exactly
  const filters = [
    { id: 'all', label: 'All Food Types' },
    { id: 'fail', label: '⚠️ Contamination Spikes' },
    { id: 'pass', label: '🛡️ Pure Zones' },
    { id: 'milk', label: '🥛 Milk Only' },
    { id: 'spices', label: '🌶️ Spices' },
  ];

  // Initialize and mount Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Map cleanup error:', e);
      }
      mapInstanceRef.current = null;
    }

    const container = mapContainerRef.current;

    // Create Leaflet map instance
    const map = L.map(container, {
      center: [21.1738, 72.8028],
      zoom: 13,
      zoomControl: false,
      preferCanvas: true,
      fadeAnimation: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Setup base tile layers
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    const cartoVoyager = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }
    );

    const cartoDark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }
    );

    // Resilient fallback mechanism: if CARTO fails or is blocked by client adblocker, fallback to OSM
    let errorCount = 0;
    const handleTileError = () => {
      errorCount++;
      if (errorCount >= 2 && map.hasLayer(cartoVoyager)) {
        console.warn('Carto tile error or blocked by client; seamlessly falling back to OpenStreetMap standard tiles');
        map.removeLayer(cartoVoyager);
        osmLayer.addTo(map);
        activeTileLayerRef.current = osmLayer;
      }
    };
    cartoVoyager.on('tileerror', handleTileError);
    cartoDark.on('tileerror', handleTileError);

    // Add initial layer based on theme
    const initialLayer = theme === 'dark' ? cartoDark : cartoVoyager;
    initialLayer.addTo(map);
    activeTileLayerRef.current = initialLayer;

    // Create marker groups
    const markersLayer = L.layerGroup().addTo(map);
    const radarLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    radarCirclesLayerRef.current = radarLayer;

    mapInstanceRef.current = map;

    // Staggered size invalidation to guarantee full container rendering
    const triggerInvalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ debounceMoveEnd: true });
      }
    };

    requestAnimationFrame(triggerInvalidate);
    const timer1 = setTimeout(triggerInvalidate, 80);
    const timer2 = setTimeout(triggerInvalidate, 250);
    const timer3 = setTimeout(triggerInvalidate, 600);
    const timer4 = setTimeout(triggerInvalidate, 1200);

    // Dynamic ResizeObserver ensures map always adapts to flex layout changes
    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        triggerInvalidate();
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => triggerInvalidate();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup err
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update theme tile layer dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (theme === 'dark') {
      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });
      if (activeTileLayerRef.current && map.hasLayer(activeTileLayerRef.current)) {
        map.removeLayer(activeTileLayerRef.current);
      }
      darkLayer.addTo(map);
      activeTileLayerRef.current = darkLayer;
    } else {
      const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });
      if (activeTileLayerRef.current && map.hasLayer(activeTileLayerRef.current)) {
        map.removeLayer(activeTileLayerRef.current);
      }
      lightLayer.addTo(map);
      activeTileLayerRef.current = lightLayer;
    }
  }, [theme]);

  // Render markers whenever filter or incidents change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const radarLayer = radarCirclesLayerRef.current;
    if (!map || !markersLayer || !radarLayer) return;

    markersLayer.clearLayers();
    radarLayer.clearLayers();

    incidents.forEach((item) => {
      if (filter === 'fail' && item.status !== 'fail') return;
      if (filter === 'pass' && item.status !== 'pass') return;
      if (filter === 'milk' && !item.food.toLowerCase().includes('milk')) return;
      if (filter === 'spices' && !item.food.toLowerCase().includes('turmeric') && !item.food.toLowerCase().includes('chili')) return;

      const isFail = item.status === 'fail';

      if (isFail) {
        // Red radar wave circle
        const radarCircle = L.circle([item.lat, item.lng], {
          radius: 380,
          color: '#e11d48',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#e11d48',
          fillOpacity: 0.22,
          className: 'heat-radar-wave'
        });
        radarLayer.addLayer(radarCircle);

        const alertIcon = L.divIcon({
          className: 'custom-leaflet-marker',
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
              box-shadow: 0 4px 12px rgba(225, 29, 72, 0.55);
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
        markersLayer.addLayer(marker);
      } else {
        const shieldIcon = L.divIcon({
          className: 'custom-leaflet-marker',
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
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.55);
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
              🛡️ Pure &amp; Safe Sample
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
        markersLayer.addLayer(marker);
      }
    });
  }, [filter, incidents]);

  const handleLocateUser = () => {
    soundEngine.playClick();
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this device', 'warning');
      return;
    }
    showToast('Locating GPS position...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
          L.circleMarker([latitude, longitude], {
            radius: 9,
            fillColor: '#0284c7',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1
          }).addTo(mapInstanceRef.current).bindPopup('📍 <strong>Your Live Location</strong>').openPopup();
        }
        showToast('📍 Location locked successfully!', 'success');
      },
      () => {
        showToast('GPS permission denied. Showing Surat Center.', 'warning');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([21.1738, 72.8028], 14);
        }
      }
    );
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
          <h2>Regional Food Security Tracker</h2>
          <p>Live crowdsourced adulteration heat map for Surat &amp; surrounding areas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-locate-user" id="btn-locate-user-map" title="Center on my location" onClick={handleLocateUser}>
            <span>🎯 My GPS</span>
          </button>
          <button className="btn-locate-user" title="Export CSV" onClick={handleExportCsv}>
            <span>📥 CSV</span>
          </button>
          <button className="btn-locate-user" title="Export JSON" onClick={handleExportJson}>
            <span>📦 JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs matching screenshot */}
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
          id="pureplate-leaflet-map" 
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
    </section>
  );
}
