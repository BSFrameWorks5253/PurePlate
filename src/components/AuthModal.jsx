import React, { useState } from 'react';
import authEngine from '../services/auth.js';
import soundEngine from '../services/sound.js';
import storage from '../services/storage.js';

export default function AuthModal({ isOpen, onClose, showToast }) {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUser = authEngine.getCurrentUser();

  if (!isOpen) return null;

  const handleClose = () => {
    soundEngine.playClick();
    onClose();
  };

  const handleQuickDemo = (demoEmail = 'student@dpssurat.edu') => {
    setEmail(demoEmail);
    setPassword('surat2026');
    soundEngine.playClick();
    showToast(`✨ Loaded credentials for ${demoEmail}`, 'info');
  };

  const handleDirectDemoLogin = async (demoEmail, demoPass = 'surat2026') => {
    soundEngine.playClick();
    setLoading(true);
    try {
      const res = await authEngine.login({ email: demoEmail, password: demoPass });
      soundEngine.playSuccess();
      showToast(`👋 Welcome back, ${res.user.name}!`, 'success');
      onClose();
    } catch (err) {
      soundEngine.playWarning();
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await authEngine.login({ email, password });
      soundEngine.playSuccess();
      showToast(`👋 Welcome back, ${res.user.name}!`, 'success');
      onClose();
    } catch (err) {
      soundEngine.playWarning();
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    try {
      const res = await authEngine.register({ email, password, name, school });
      soundEngine.playSuccess();
      showToast(`🎉 Account created! Welcome, ${res.user.name}!`, 'success');
      onClose();
    } catch (err) {
      soundEngine.playWarning();
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    soundEngine.playClick();
    showToast('☁️ Syncing with community cloud...', 'info');
    try {
      await authEngine.syncCloudData(false);
      soundEngine.playSuccess();
      showToast('☁️ Multi-device data synchronized with PurePlate Cloud!', 'success');
    } catch (e) {
      showToast('Sync error. Operating in offline mode.', 'warning');
    }
  };

  const handleLogout = () => {
    authEngine.logout();
    soundEngine.playClick();
    showToast('Logged out. Switched to Guest mode.', 'info');
  };

  return (
    <div id="auth-modal" className="auth-modal-backdrop active" onClick={handleClose}>
      <div className="auth-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" id="btn-close-auth-modal" title="Close Modal" onClick={handleClose}>
          &times;
        </button>

        {!currentUser ? (
          /* View 1: Logged Out (Sign In / Register) */
          <div id="auth-state-logged-out" className="auth-view-content">
            <div className="auth-sheet-header">
              <div className="auth-icon-wrap">🛡️</div>
              <h3>PurePlate Cloud Sync</h3>
              <p>Sign in with your email to sync your food safety test logs, detective XP, and badges across all your devices.</p>
            </div>

            {/* Segmented Tabs */}
            <div className="auth-tabs-row">
              <button
                className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                id="tab-btn-login"
                onClick={() => {
                  soundEngine.playClick();
                  setTab('login');
                }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                id="tab-btn-register"
                onClick={() => {
                  soundEngine.playClick();
                  setTab('register');
                }}
              >
                Create Account
              </button>
            </div>

            {tab === 'login' ? (
              <form id="form-auth-login" className="auth-form active" onSubmit={handleLoginSubmit}>
                <div className="input-field-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="input-with-icon">
                    <span className="field-icon">✉️</span>
                    <input
                      type="email"
                      id="login-email"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="input-with-icon">
                    <span className="field-icon">🔒</span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      id="login-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-pwd"
                      onClick={() => setShowPwd(!showPwd)}
                      title="Toggle visibility"
                    >
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="auth-options-row">
                  <label className="remember-label">
                    <input type="checkbox" id="login-remember" defaultChecked />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button type="submit" className="btn-auth-submit" id="btn-submit-login" disabled={loading}>
                  <span className="btn-text">{loading ? 'Signing In...' : 'Sign In & Sync Now'}</span>
                </button>

                {/* Quick Demo Evaluator Buttons */}
                <div className="demo-account-box">
                  <span className="demo-box-label">Exhibition Evaluator / Instant Sign-In:</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-quick-demo-fill" 
                      id="btn-fill-demo-aarav" 
                      style={{ flex: 1, minWidth: '150px' }}
                      onClick={() => handleDirectDemoLogin('student@dpssurat.edu', 'surat2026')}
                    >
                      🎓 Aarav (DPS Surat)
                    </button>
                    <button 
                      type="button" 
                      className="btn-quick-demo-fill" 
                      id="btn-fill-demo-priya" 
                      style={{ flex: 1, minWidth: '150px' }}
                      onClick={() => handleDirectDemoLogin('priya@tapti.edu', 'surat2026')}
                    >
                      🧪 Priya (Tapti Valley)
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form id="form-auth-register" className="auth-form active" onSubmit={handleRegisterSubmit}>
                <div className="input-field-group">
                  <label htmlFor="reg-name">Your Full Name</label>
                  <div className="input-with-icon">
                    <span className="field-icon">👤</span>
                    <input
                      type="text"
                      id="reg-name"
                      placeholder="e.g. Aarav Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label htmlFor="reg-school">School / Institution</label>
                  <div className="input-with-icon">
                    <span className="field-icon">🏫</span>
                    <input
                      type="text"
                      id="reg-school"
                      placeholder="e.g. Delhi Public School, Surat"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="input-with-icon">
                    <span className="field-icon">✉️</span>
                    <input
                      type="email"
                      id="reg-email"
                      placeholder="student@dpssurat.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label htmlFor="reg-password">Create Password (min. 6 chars)</label>
                  <div className="input-with-icon">
                    <span className="field-icon">🔒</span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      id="reg-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-pwd"
                      onClick={() => setShowPwd(!showPwd)}
                      title="Toggle visibility"
                    >
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-auth-submit btn-accent-submit" id="btn-submit-reg" disabled={loading}>
                  <span className="btn-text">{loading ? 'Creating Account...' : 'Create Account & Join Surat Grid'}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* View 2: Logged In Account Dashboard */
          <div id="auth-state-logged-in" className="auth-view-content">
            <div className="logged-in-profile-card">
              <div className="lip-avatar">🎓</div>
              <div className="lip-info">
                <h3 id="account-modal-name">{currentUser.name || 'Student Inspector'}</h3>
                <span className="lip-email" id="account-modal-email">{currentUser.email}</span>
                <span className="lip-school" id="account-modal-school">{currentUser.school || 'Surat Student'}</span>
              </div>
              <div className="lip-badge-pill" id="account-modal-pts">
                {storage.getUserProfile()?.points || 420} XP
              </div>
            </div>

            <div className="sync-status-card">
              <div className="ssc-row">
                <div className="ssc-icon">☁️</div>
                <div className="ssc-text">
                  <strong>Multi-Device Cloud Sync</strong>
                  <span className="auth-sync-time">Active & Connected</span>
                </div>
                <button className="btn-force-sync" id="btn-force-sync" title="Sync now" onClick={handleForceSync}>
                  🔄 Sync Now
                </button>
              </div>
              <div className="ssc-details">
                <span>• Test logs automatically backup to central server</span>
                <span>• Detective rank & points mirror on all your screens</span>
                <span>• Real-time community adulteration alerts enabled</span>
              </div>
            </div>

            <div className="auth-logout-row">
              <button className="btn-logout" id="btn-account-logout" onClick={handleLogout}>
                <span>Log Out of this Device</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
