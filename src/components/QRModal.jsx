import React from 'react';
import soundEngine from '../services/sound.js';

export default function QRModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://pureplate-nu.vercel.app';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`;

  const handleClose = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div className="auth-modal-backdrop active" onClick={handleClose}>
      <div className="auth-modal-sheet" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" title="Close" onClick={handleClose}>
          &times;
        </button>
        <div style={{ padding: '16px 8px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📱</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800 }}>Scan with Phone</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Open PurePlate directly on your mobile device to test your camera and GPS sensors.
          </p>
          <div style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            display: 'inline-block',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            marginBottom: '16px'
          }}>
            <img
              src={qrUrl}
              alt="Scan to open on phone"
              style={{ width: '200px', height: '200px', display: 'block' }}
              onError={(e) => {
                e.target.src = '/assets/cloudflare_qr.png';
              }}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
            {currentUrl}
          </div>
        </div>
      </div>
    </div>
  );
}
