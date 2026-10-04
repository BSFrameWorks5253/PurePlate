import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import InstructionSheet from './components/InstructionSheet.jsx';
import QRModal from './components/QRModal.jsx';
import Toast from './components/Toast.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';

import HomeScreen from './screens/HomeScreen.jsx';
import SelectionScreen from './screens/SelectionScreen.jsx';
import ProcedureScreen from './screens/ProcedureScreen.jsx';
import CameraScreen from './screens/CameraScreen.jsx';
import MapScreen from './screens/MapScreen.jsx';
import LearningScreen from './screens/LearningScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';

import { FOOD_PROTOCOLS } from './data/protocols.js';
import storage from './services/storage.js';
import soundEngine from './services/sound.js';

// Route Helper Functions
const getScreenFromPath = (path) => {
  if (!path) return 'screen-home';
  const clean = path.replace(/\/$/, '').toLowerCase();
  if (clean === '/map') return 'screen-map';
  if (clean === '/test') return 'screen-selection';
  if (clean === '/academy' || clean === '/learn') return 'screen-learning';
  if (clean === '/login') return 'screen-login';
  if (clean === '/procedure') return 'screen-procedure';
  if (clean === '/camera') return 'screen-camera';
  return 'screen-home';
};

const getPathFromScreen = (screenId, protocolId) => {
  switch (screenId) {
    case 'screen-map':
      return '/map';
    case 'screen-selection':
      return '/test';
    case 'screen-learning':
      return '/academy';
    case 'screen-login':
      return '/login';
    case 'screen-procedure':
      return protocolId ? `/procedure?test=${protocolId}` : '/procedure';
    case 'screen-camera':
      return '/camera';
    case 'screen-home':
    default:
      return '/';
  }
};

export default function App() {
  // Initialize screen from browser URL if available
  const [activeScreen, setActiveScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return getScreenFromPath(window.location.pathname);
    }
    return 'screen-home';
  });

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 821 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  const [theme, setTheme] = useState('light');
  const [region, setRegion] = useState(storage.getUserRegion());
  
  // Selected protocol initialization (supports ?test=query parameter)
  const [selectedProtocol, setSelectedProtocol] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const testParam = params.get('test');
      if (testParam) {
        const found = FOOD_PROTOCOLS.find((p) => p.id === testParam);
        if (found) return found;
      }
    }
    return FOOD_PROTOCOLS[0];
  });

  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

  // Sync browser URL with HTML5 History API
  const syncBrowserUrl = (screenId, protocolId) => {
    if (typeof window === 'undefined') return;
    const targetPath = getPathFromScreen(screenId, protocolId);
    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({ screenId, protocolId }, '', targetPath);
    }
  };

  // Listen to browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const scr = getScreenFromPath(window.location.pathname);
      setActiveScreen(scr);

      const params = new URLSearchParams(window.location.search);
      const testParam = params.get('test');
      if (testParam) {
        const found = FOOD_PROTOCOLS.find((p) => p.id === testParam);
        if (found) setSelectedProtocol(found);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toast notification manager
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme with html root attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    soundEngine.playClick();
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this browser', 'warning');
      return;
    }
    showToast('Detecting live GPS location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newRegion = `GPS: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
        setRegion(newRegion);
        storage.setUserRegion(newRegion);
        soundEngine.playSuccess();
        showToast('📍 Live GPS coordinates synced', 'success');
      },
      () => {
        const def = 'Athwa, Surat';
        setRegion(def);
        storage.setUserRegion(def);
        showToast('GPS permission denied. Using default: Athwa, Surat', 'warning');
      }
    );
  };

  // Screen Navigation handlers
  const handleNavigate = (screenId, extraProtocol = null) => {
    soundEngine.playClick();
    const proto = extraProtocol || selectedProtocol;
    if (extraProtocol) {
      setSelectedProtocol(extraProtocol);
    }
    setActiveScreen(screenId);
    syncBrowserUrl(screenId, screenId === 'screen-procedure' ? proto?.id : null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // When a user selects a protocol (e.g. Milk Starch & Thickener Test)
  // Navigate directly to the interactive Procedure & Tutorial Screen!
  const handleOpenProtocol = (protocol) => {
    setSelectedProtocol(protocol);
    handleNavigate('screen-procedure', protocol);
  };

  const handleLaunchCamera = (protocol) => {
    setSelectedProtocol(protocol);
    setIsInstructionOpen(false);
    handleNavigate('screen-camera', protocol);
  };

  // Keyboard shortcuts (1=Home, 2=Test, 3=Map, 4=Academy)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === '1') handleNavigate('screen-home');
      if (e.key === '2') handleNavigate('screen-selection');
      if (e.key === '3') handleNavigate('screen-map');
      if (e.key === '4') handleNavigate('screen-learning');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProtocol]);

  return (
    <>
      {/* ── Welcome Splash Screen ── */}
      {showSplash && (
        <WelcomeScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Apple Liquid Glass Ambient Light Orbs */}
      <div className="apple-liquid-mesh" aria-hidden="true">
        <div className="liquid-orb orb-teal"></div>
        <div className="liquid-orb orb-cyan"></div>
        <div className="liquid-orb orb-purple"></div>
        <div className="liquid-orb orb-amber"></div>
      </div>

      <div id="app-container" className={`app-frame ${viewMode === 'desktop' ? 'frame-expanded' : 'frame-mobile'}`}>
        {/* Unified Desktop & App Header */}
        <Header
          currentScreen={activeScreen}
          viewMode={viewMode}
          setViewMode={setViewMode}
          theme={theme}
          setTheme={setTheme}
          onOpenAuth={() => handleNavigate('screen-login')}
          onOpenQR={() => setIsQROpen(true)}
          onDetectLocation={handleDetectLocation}
          region={region}
          showToast={showToast}
          onNavigate={handleNavigate}
        />

        {/* Screens Viewport */}
        <main className="screens-viewport">
          {activeScreen === 'screen-home' && (
            <HomeScreen
              onNavigate={handleNavigate}
              onSelectFood={handleOpenProtocol}
            />
          )}

          {activeScreen === 'screen-selection' && (
            <SelectionScreen
              onBack={() => handleNavigate('screen-home')}
              onOpenProtocol={handleOpenProtocol}
            />
          )}

          {activeScreen === 'screen-procedure' && (
            <ProcedureScreen
              protocol={selectedProtocol}
              onBack={() => handleNavigate('screen-selection')}
              onLaunchCamera={handleLaunchCamera}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}

          {activeScreen === 'screen-camera' && (
            <CameraScreen
              protocol={selectedProtocol}
              onBack={() => handleNavigate('screen-procedure', selectedProtocol)}
              onNavigateHome={() => handleNavigate('screen-home')}
              onNavigateMap={() => handleNavigate('screen-map')}
              showToast={showToast}
            />
          )}

          {activeScreen === 'screen-map' && (
            <MapScreen
              showToast={showToast}
              theme={theme}
              onNavigate={handleNavigate}
              onSelectFood={handleOpenProtocol}
              onLaunchCamera={handleLaunchCamera}
            />
          )}

          {activeScreen === 'screen-learning' && (
            <LearningScreen
              showToast={showToast}
              onNavigate={handleNavigate}
            />
          )}

          {activeScreen === 'screen-login' && (
            <LoginScreen
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeScreen={activeScreen}
          setActiveScreen={handleNavigate}
        />

        {/* Optional Instruction Sheet Modal (if invoked as quick preview) */}
        <InstructionSheet
          isOpen={isInstructionOpen}
          protocol={selectedProtocol}
          onClose={() => setIsInstructionOpen(false)}
          onLaunchCamera={handleLaunchCamera}
        />

        {/* QR Code Modal for Phone Testing */}
        <QRModal
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
        />

        {/* Global Toast Alerts */}
        <Toast
          toasts={toasts}
          onDismiss={dismissToast}
        />
      </div>
    </>
  );
}
