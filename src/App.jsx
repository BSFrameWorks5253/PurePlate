import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import InstructionSheet from './components/InstructionSheet.jsx';
import AuthModal from './components/AuthModal.jsx';
import QRModal from './components/QRModal.jsx';
import Toast from './components/Toast.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';

import HomeScreen from './screens/HomeScreen.jsx';
import SelectionScreen from './screens/SelectionScreen.jsx';
import CameraScreen from './screens/CameraScreen.jsx';
import MapScreen from './screens/MapScreen.jsx';
import LearningScreen from './screens/LearningScreen.jsx';

import { FOOD_PROTOCOLS } from './data/protocols.js';
import storage from './services/storage.js';
import soundEngine from './services/sound.js';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('screen-home');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 821 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });
  const [theme, setTheme] = useState('light');
  const [region, setRegion] = useState(storage.getUserRegion());
  const [selectedProtocol, setSelectedProtocol] = useState(FOOD_PROTOCOLS[0]);
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

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
  const handleNavigate = (screenId) => {
    soundEngine.playClick();
    setActiveScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenProtocol = (protocol) => {
    setSelectedProtocol(protocol);
    setIsInstructionOpen(true);
  };

  const handleLaunchCamera = (protocol) => {
    setSelectedProtocol(protocol);
    setIsInstructionOpen(false);
    setActiveScreen('screen-camera');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };


  // Keyboard shortcuts for Mac / Desktop power users (1=Home, 2=Test, 3=Map, 4=Academy)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === '1') handleNavigate('screen-home');
      if (e.key === '2') handleNavigate('screen-selection');
      if (e.key === '3') handleNavigate('screen-map');
      if (e.key === '4') handleNavigate('screen-learning');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* ── Premium Welcome Splash Screen ── */}
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
          onOpenAuth={() => setIsAuthOpen(true)}
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

          {activeScreen === 'screen-camera' && (
            <CameraScreen
              protocol={selectedProtocol}
              onBack={() => handleNavigate('screen-selection')}
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
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeScreen={activeScreen}
          setActiveScreen={handleNavigate}
        />

        {/* Image 1 Instruction Sheet Modal */}
        <InstructionSheet
          isOpen={isInstructionOpen}
          protocol={selectedProtocol}
          onClose={() => setIsInstructionOpen(false)}
          onLaunchCamera={handleLaunchCamera}
        />

        {/* Auth & Sync Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          showToast={showToast}
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
