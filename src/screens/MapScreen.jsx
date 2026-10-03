import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';

export default function MapScreen({ showToast, theme }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const radarCirclesLayerRef = useRef(null);
  const cartoVoyagerRef = useRef(null);
  const cartoDarkRef = useRef(null);

  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState(storage.getAllIncidents());

  const filters = [
    { id: 'all', label: 'All Tests' },
    { id: 'fail', label: '⚠️ Contamination Spikes' },
    { id: 'pass', label: '🛡️ Verified Pure' },
    { id: 'milk', label: '🥛 Milk Reports' },
    { id: 'spices', label: '🌶️ Spice Reports' },
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.1738, 72.8028],
        zoom: 13,
        zoomControl: false,
        preferCanvas: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

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

      cartoVoyagerRef.current = cartoVoyager;
      cartoDarkRef.current = cartoDark;

      if (theme === 'dark') {
        cartoDark.addTo(map);
      } else {
        cartoVoyager.addTo(map);
      }

      markersLayerRef.current = L.layerGroup().addTo(map);
      radarCirclesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize(true);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Update theme layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !cartoVoyagerRef.current || !cartoDarkRef.current) return;

    if (theme === 'dark') {
      if (map.hasLayer(cartoVoyagerRef.current)) map.removeLayer(cartoVoyagerRef.current);
      if (!map.hasLayer(cartoDarkRef.current)) cartoDarkRef.current.addTo(map);
    } else {
      if (map.hasLayer(cartoDarkRef.current)) map.removeLayer(cartoDarkRef.current);
      if (!map.hasLayer(cartoVoyagerRef.current)) cartoVoyagerRef.current.addTo(map);
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
          fillOpacity: 0.18,
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
    showToast('📥 Exported JSON Database successfully!', 'success');
  };

  return (
    <section id="screen-heatmap" className="app-screen active">
      {/* Header */}
      <div className="screen-top-nav">
        <div className="screen-top-title">
          <h2>Regional Food Security Tracker</h2>
          <p>Live crowdsourced adulteration heat map for Surat &amp; surrounding areas</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="btn-locate-user" id="btn-locate-user-map" title="Find My Location" onClick={handleLocateUser}>
            <span>📍 Find Me</span>
          </button>
          <button className="btn-locate-user" title="Export CSV" onClick={handleExportCsv}>
            <span>📥 CSV</span>
          </button>
          <button className="btn-locate-user" title="Export JSON" onClick={handleExportJson}>
            <span>📦 JSON</span>
          </button>
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

      {/* Fullscreen Map Canvas */}
      <div className="map-viewport-wrapper">
        <div ref={mapContainerRef} id="pureplate-leaflet-map" style={{ width: '100%', height: '100%', minHeight: '380px' }}></div>
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
