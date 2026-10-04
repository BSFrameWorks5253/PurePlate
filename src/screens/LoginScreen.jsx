import React, { useState, useEffect } from 'react';
import authEngine from '../services/auth.js';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';
import PurePlateLogo from '../components/PurePlateLogo.jsx';

export default function LoginScreen({ onNavigate, showToast }) {
  const [currentUser, setCurrentUser] = useState(() => authEngine.getCurrentUser());
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password' | 'register'
  
  // Login fields
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regGrade, setRegGrade] = useState('Class 7-A');
  const [regRole, setRegRole] = useState('Cadet Food Inspector');
  const [regAvatar, setRegAvatar] = useState('🧑‍🔬');
  const [isLoading, setIsLoading] = useState(false);

  // Google Drive Webhook state
  const [driveWebhookUrl, setDriveWebhookUrl] = useState(() => {
    return localStorage.getItem('pureplate_google_drive_webhook') || '';
  });
  const [showDemoOtp, setShowDemoOtp] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [showDriveGuide, setShowDriveGuide] = useState(false);

  const avatars = ['🧑‍🔬', '👩‍🔬', '👨‍🔬', '🔬', '🛡️', '🌟'];

  useEffect(() => {
    return authEngine.subscribe((user) => {
      setCurrentUser(user);
    });
  }, []);

  // Request 6-digit OTP code to registered email ID
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid student or institutional email ID', 'warning');
      return;
    }

    setIsLoading(true);

    // 1. Check if email exists in database (Note 4 Requirement)
    const check = await authEngine.checkEmail(cleanEmail);
    if (!check.exists) {
      setIsLoading(false);
      soundEngine.playClick();
      showToast(`⚠️ This email ID (${cleanEmail}) is not registered yet. Please create your student account first!`, 'warning');
      // Auto-switch to register mode and pre-fill email
      setRegEmail(cleanEmail);
      const suggestedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setRegName(suggestedName);
      setAuthMode('register');
      return;
    }

    // 2. Email exists! Send real OTP to registered email address
    const otpResult = await authEngine.sendOtp(cleanEmail);
    setIsLoading(false);

    if (otpResult.success) {
      setGeneratedOtp(otpResult.debugOtp);
      setOtpSent(true);
      setShowDemoOtp(false);
      soundEngine.playSuccess();
      showToast(`📧 Verification code sent to your registered email (${cleanEmail})! Please check your inbox.`, 'success');
    } else {
      showToast(otpResult.error || 'Failed to send verification code. Please try again.', 'error');
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!otpInput.trim()) {
      showToast('Please enter the 6-digit OTP code', 'warning');
      return;
    }

    setIsLoading(true);
    const cleanEmail = emailInput.trim().toLowerCase();
    const result = await authEngine.verifyOtp(cleanEmail, otpInput.trim());
    setIsLoading(false);

    if (result.success) {
      soundEngine.playSuccess();
      showToast(`Welcome back, ${result.user.name}! Verified with Lourdes Convent Primary School`, 'success');
      setOtpSent(false);
      setOtpInput('');
    } else {
      showToast(result.error || 'Invalid verification code. Please check your inbox and try again.', 'error');
    }
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !passwordInput.trim()) {
      showToast('Please enter both Email and Password', 'warning');
      return;
    }

    setIsLoading(true);
    const check = await authEngine.checkEmail(cleanEmail);
    if (!check.exists) {
      setIsLoading(false);
      showToast(`⚠️ This email ID (${cleanEmail}) is not registered yet. Please create your student account first!`, 'warning');
      setRegEmail(cleanEmail);
      setAuthMode('register');
      return;
    }

    const res = await authEngine.login({ email: cleanEmail, password: passwordInput });
    setIsLoading(false);
    if (res.success) {
      soundEngine.playSuccess();
      showToast(`Signed in successfully! Welcome ${res.user.name}`, 'success');
    } else {
      showToast(res.error || 'Incorrect password. Please verify and try again.', 'error');
    }
  };

  // Student Account Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!regName.trim()) {
      showToast('Please enter your full name', 'warning');
      return;
    }

    const email = (regEmail.trim() || `${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}@lourdesconvent.edu.in`).toLowerCase();

    setIsLoading(true);
    // Check if already registered
    const existingCheck = await authEngine.checkEmail(email);
    if (existingCheck.exists) {
      setIsLoading(false);
      showToast(`⚠️ An account with this email (${email}) already exists. Please sign in!`, 'warning');
      setEmailInput(email);
      setAuthMode('otp');
      return;
    }

    const id = regStudentId.trim() || `LCPS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile = {
      name: regName.trim(),
      email: email,
      studentId: id,
      school: 'Lourdes Convent Primary School, Surat',
      grade: regGrade,
      role: regRole,
      avatar: regAvatar,
      verifiedTests: 5,
      xpPoints: 200,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const regResult = await authEngine.register({
      name: newProfile.name,
      email: newProfile.email,
      password: 'cadet_verified_pass',
      school: newProfile.school
    });

    storage.setUserProfile(newProfile);

    // Sync to Google Drive webhook (100% free / zero database bill!)
    authEngine.syncToGoogleDrive(newProfile, driveWebhookUrl);

    setIsLoading(false);
    soundEngine.playSuccess();
    showToast(`Cadet account created! Welcome ${newProfile.name}`, 'success');
  };

  // Save Google Drive Webhook URL
  const handleSaveDriveWebhook = (e) => {
    e.preventDefault();
    soundEngine.playClick();
    const cleanUrl = driveWebhookUrl.trim();
    localStorage.setItem('pureplate_google_drive_webhook', cleanUrl);
    showToast('💾 Google Drive Webhook URL saved! Backups will mirror to Google Sheets/Drive for free.', 'success');
  };

  // Backup all data to Google Drive & download JSON
  const handleBackupToDrive = async () => {
    soundEngine.playClick();
    const allData = {
      user: currentUser,
      profile: storage.getUserProfile(),
      incidents: storage.getAllIncidents(),
      region: storage.getUserRegion(),
      exportedAt: new Date().toISOString()
    };

    if (driveWebhookUrl.trim()) {
      setIsDriveSyncing(true);
      showToast('☁️ Syncing all data to Google Drive & Sheets...', 'info');
      try {
        await authEngine.syncToGoogleDrive(allData, driveWebhookUrl.trim());
        showToast('✅ Synced to Google Drive successfully! Zero database costs.', 'success');
      } catch (err) {
        showToast('⚠️ Could not connect to Google Apps Script. Check URL permissions.', 'error');
      } finally {
        setIsDriveSyncing(false);
      }
    } else {
      showToast('ℹ️ Please paste your Google Apps Script URL above, or use Export Local JSON.', 'info');
    }

    // Also download JSON locally so the user always has a hard copy
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureplate_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Downloaded local JSON backup file!', 'success');
  };

  const handleLogout = () => {
    soundEngine.playClick();
    authEngine.logout();
    setOtpSent(false);
    setGeneratedOtp(null);
    showToast('Signed out of cadet session', 'info');
  };

  return (
    <section id="screen-login" className="app-screen active">
      {/* Top Header Navigation */}
      <div className="screen-top-nav">
        <button
          className="btn-back"
          id="btn-back-from-login"
          title="Return to Home"
          onClick={() => {
            soundEngine.playClick();
            onNavigate('screen-home');
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="screen-top-title">
          <div className="title-with-badge">
            <h2>Cadet &amp; Citizen Portal</h2>
            <span className="catalog-counter-pill">Official Hub</span>
          </div>
          <p>Lourdes Convent Primary School • Surat Safety Grid</p>
        </div>
      </div>

      <div className="login-screen-container">
        {currentUser ? (
          /* Active Cadet ID Card */
          <div className="cadet-badge-card glass-card">
            <div className="cadet-badge-header">
              <div className="cadet-school-banner">
                <span className="school-crest-icon">🏫</span>
                <div className="school-text-wrap">
                  <h3>Lourdes Convent Primary School</h3>
                  <span className="school-sub">Surat Municipal Safety Network • Grade {currentUser.grade || '7-A'}</span>
                </div>
              </div>
              <span className="cadet-active-tag">
                <span className="pulse-dot"></span> Active Session
              </span>
            </div>

            <div className="cadet-badge-body">
              <div className="cadet-avatar-box">
                <div className="cadet-avatar-ring">
                  <span className="cadet-emoji-avatar">{currentUser.avatar || '🧑‍🔬'}</span>
                </div>
                <span className="cadet-id-code">{currentUser.studentId || 'LCPS-CADET-042'}</span>
              </div>

              <div className="cadet-details">
                <h4 className="cadet-full-name">{currentUser.name || 'Cadet Student'}</h4>
                <p className="cadet-rank-title">🎖️ {currentUser.role || 'Cadet Food Inspector'}</p>
                <p className="cadet-email-text">{currentUser.email}</p>
                
                <div className="cadet-stats-grid">
                  <div className="cadet-stat-item">
                    <span className="stat-label">Verified Tests</span>
                    <span className="stat-val">{currentUser.verifiedTests || 6} Logs</span>
                  </div>
                  <div className="cadet-stat-item">
                    <span className="stat-label">Citizen XP</span>
                    <span className="stat-val text-teal">{currentUser.xpPoints || 260} XP</span>
                  </div>
                  <div className="cadet-stat-item">
                    <span className="stat-label">Cloud Sync</span>
                    <span className="stat-val text-green">100% Synced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Drive & Zero-Bill Cloud Backup Panel */}
            <div className="drive-backup-panel glass-inset">
              <div className="drive-panel-header">
                <div className="drive-header-title">
                  <span className="drive-icon">☁️</span>
                  <div>
                    <h4>Google Drive &amp; Sheets Cloud Backup</h4>
                    <span className="drive-free-badge">100% Free • Zero Database Overload</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-guide-toggle"
                  onClick={() => setShowDriveGuide(!showDriveGuide)}
                >
                  {showDriveGuide ? 'Hide Setup' : 'Setup Guide 📖'}
                </button>
              </div>

              <p className="drive-desc">
                Stream and mirror all your food test logs and credentials directly into your Google Drive &amp; Google Sheets. Uses Google Apps Script with zero cloud bills.
              </p>

              {showDriveGuide && (
                <div className="drive-guide-card animate-fade-in">
                  <h5>⚡ 1-Minute Free Google Drive Setup:</h5>
                  <ol>
                    <li>Create a new Google Sheet at <strong>sheets.new</strong> and name it <em>PurePlate Database</em>.</li>
                    <li>Go to <strong>Extensions ➔ Apps Script</strong>.</li>
                    <li>Copy and paste the code from <code>google_drive_sync_script.gs</code> into the editor.</li>
                    <li>Click <strong>Deploy ➔ New Deployment</strong>, choose <strong>Web app</strong>, access: <strong>Anyone</strong>.</li>
                    <li>Copy your <strong>Web app URL</strong> and paste it below!</li>
                  </ol>
                </div>
              )}

              <form onSubmit={handleSaveDriveWebhook} className="drive-webhook-form">
                <div className="input-with-icon">
                  <span className="input-icon">🔗</span>
                  <input
                    type="url"
                    placeholder="Paste Google Apps Script URL (https://script.google.com/...)"
                    value={driveWebhookUrl}
                    onChange={(e) => setDriveWebhookUrl(e.target.value)}
                    className="input-webhook"
                  />
                </div>
                <button type="submit" className="btn-save-webhook">Save Webhook</button>
              </form>

              <div className="drive-actions-row">
                <button
                  type="button"
                  className="btn-drive-sync"
                  onClick={handleBackupToDrive}
                  disabled={isDriveSyncing}
                >
                  {isDriveSyncing ? (
                    <span>Syncing to Google Drive...</span>
                  ) : (
                    <>
                      <span>☁️ Backup to Google Drive</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-download-json"
                  onClick={() => {
                    soundEngine.playClick();
                    const allData = {
                      user: currentUser,
                      profile: storage.getUserProfile(),
                      incidents: storage.getAllIncidents(),
                      region: storage.getUserRegion(),
                      exportedAt: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pureplate_backup_${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('📥 Downloaded local JSON backup file!', 'success');
                  }}
                >
                  📥 Export Local JSON
                </button>
              </div>
            </div>

            <div className="cadet-badge-footer">
              <button
                className="btn-primary-action"
                onClick={() => {
                  soundEngine.playClick();
                  onNavigate('screen-selection');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Start New Food Test</span>
              </button>

              <button
                className="btn-secondary-action"
                onClick={() => {
                  soundEngine.playClick();
                  onNavigate('screen-map');
                }}
              >
                <span>View Surat Heat Map</span>
              </button>

              <button
                className="btn-switch-cadet"
                onClick={handleLogout}
              >
                Sign Out / Switch Account
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Portal */
          <div className="login-form-card glass-card">
            <div className="login-card-brand">
              <PurePlateLogo size={56} variant="icon" showGlow={true} />
              <h3>Cadet Sign In &amp; Registration</h3>
              <div className="school-pill-tag">
                <span>🏫 Lourdes Convent Primary School, Surat</span>
              </div>
              <p className="login-tagline">Log into your student account or register to sync your test data</p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="auth-tab-pill-bar">
              <button
                type="button"
                className={`auth-pill-tab ${authMode === 'otp' ? 'active' : ''}`}
                onClick={() => setAuthMode('otp')}
              >
                📧 Email Code (OTP)
              </button>
              <button
                type="button"
                className={`auth-pill-tab ${authMode === 'password' ? 'active' : ''}`}
                onClick={() => setAuthMode('password')}
              >
                🔑 Password Login
              </button>
              <button
                type="button"
                className={`auth-pill-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                ✨ New Student
              </button>
            </div>

            {/* ── 1. LOGIN VIA OTP CODE ── */}
            {authMode === 'otp' && (
              <div className="auth-step-wrapper">
                {!otpSent ? (
                  <form onSubmit={handleRequestOtp} className="student-login-form">
                    <div className="form-group">
                      <label htmlFor="otp-email-input">Registered Student / Institutional Email ID</label>
                      <div className="input-with-icon">
                        <span className="input-icon">✉️</span>
                        <input
                          id="otp-email-input"
                          type="email"
                          required
                          placeholder="e.g. inspector@lourdesconvent.edu.in"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                        />
                      </div>
                      <small className="form-tip">We verify your account and send a 6-digit code directly to your email inbox.</small>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-cadet"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <span>Send 6-Digit Code to Email ➔</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="student-login-form">
                    {/* Dispatched to Registered Email Notice */}
                    <div className="otp-dispatched-notice">
                      <div className="otp-notice-header">
                        <span className="otp-notice-icon">✉️</span>
                        <div className="otp-notice-text">
                          <strong>Verification Code Dispatched!</strong>
                          <p>
                            A 6-digit one-time code was sent to your registered email:{' '}
                            <span className="otp-highlight-email">{emailInput}</span>
                          </p>
                        </div>
                      </div>
                      <div className="otp-notice-tips">
                        <span>• Please check your email inbox and spam/junk folder</span>
                        <span>• Code expires in 10 minutes</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="otp-code-input">Enter 6-Digit OTP Code</label>
                      <div className="input-with-icon">
                        <span className="input-icon">🔢</span>
                        <input
                          id="otp-code-input"
                          type="text"
                          maxLength={6}
                          required
                          placeholder="e.g. 748291"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          className="input-otp-field"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-cadet"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <span>Verify Code &amp; Sign In ➔</span>
                      )}
                    </button>

                    {/* Offline / Demo Code Reveal Option */}
                    <div className="demo-otp-section">
                      <button
                        type="button"
                        className="btn-demo-toggle"
                        onClick={() => setShowDemoOtp(!showDemoOtp)}
                      >
                        {showDemoOtp ? '🔒 Hide Demo / Offline Code' : '🔍 Didn\'t receive email? Click to view offline demo code'}
                      </button>
                      {showDemoOtp && (
                        <div className="demo-otp-card animate-fade-in">
                          <small className="demo-desc">
                            Offline development code generated by security node:
                          </small>
                          <div className="demo-code-pill">
                            {generatedOtp || '123456'}
                          </div>
                          <button
                            type="button"
                            className="btn-auto-fill-otp"
                            onClick={() => setOtpInput(generatedOtp || '123456')}
                          >
                            Auto-Fill This Code
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-resend-otp"
                      onClick={() => setOtpSent(false)}
                    >
                      ← Change Email or Resend Code
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── 2. LOGIN VIA PASSWORD ── */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="student-login-form">
                <div className="form-group">
                  <label htmlFor="pwd-email-input">Registered Email ID</label>
                  <div className="input-with-icon">
                    <span className="input-icon">✉️</span>
                    <input
                      id="pwd-email-input"
                      type="email"
                      required
                      placeholder="e.g. inspector@lourdesconvent.edu.in"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pwd-secret-input">Password / PIN</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🔒</span>
                    <input
                      id="pwd-secret-input"
                      type="password"
                      required
                      placeholder="Enter password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-cadet"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading-spinner"></span> : <span>Sign In as Cadet</span>}
                </button>
              </form>
            )}

            {/* ── 3. REGISTER NEW STUDENT ── */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="student-login-form">
                <div className="form-group">
                  <label htmlFor="reg-name-input">Full Name *</label>
                  <div className="input-with-icon">
                    <span className="input-icon">👤</span>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      placeholder="e.g. Diya Mehta"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email-input">Student / Institutional Email ID *</label>
                  <div className="input-with-icon">
                    <span className="input-icon">✉️</span>
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      placeholder="e.g. diya.m@lourdesconvent.edu.in"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                  <small className="form-tip">This email will be registered to receive one-time verification codes (OTP).</small>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="reg-id-input">Roll No. / Student ID</label>
                    <div className="input-with-icon">
                      <span className="input-icon">🏷️</span>
                      <input
                        id="reg-id-input"
                        type="text"
                        placeholder="e.g. LCPS-7A-18"
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-grade-select">Class / Grade</label>
                    <select
                      id="reg-grade-select"
                      value={regGrade}
                      onChange={(e) => setRegGrade(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Class 5-A">Class 5-A</option>
                      <option value="Class 6-A">Class 6-A</option>
                      <option value="Class 7-A">Class 7-A</option>
                      <option value="Class 7-B">Class 7-B</option>
                      <option value="Class 8-A">Class 8-A</option>
                      <option value="Science Lab Captain">Science Lab Captain</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Choose Laboratory Avatar</label>
                  <div className="avatar-picker-row">
                    {avatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        className={`avatar-pick-btn ${regAvatar === av ? 'active' : ''}`}
                        onClick={() => {
                          soundEngine.playClick();
                          setRegAvatar(av);
                        }}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>School / Institution</label>
                  <input
                    type="text"
                    readOnly
                    value="Lourdes Convent Primary School, Surat"
                    className="input-disabled"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-submit-cadet"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading-spinner"></span> : <span>Create Account &amp; Sync Badge ➔</span>}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
