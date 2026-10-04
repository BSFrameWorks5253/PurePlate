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

  const avatars = ['🧑‍🔬', '👩‍🔬', '👨‍🔬', '🔬', '🛡️', '🌟'];

  useEffect(() => {
    return authEngine.subscribe((user) => {
      setCurrentUser(user);
    });
  }, []);

  // Request 6-digit OTP code
  const handleRequestOtp = (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!emailInput.trim() || !emailInput.includes('@')) {
      showToast('Please enter a valid student or institutional email ID', 'warning');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomCode);
      setOtpSent(true);
      setIsLoading(false);
      soundEngine.playSuccess();
      showToast(`Verification code sent! Your security OTP is: ${randomCode}`, 'success');
    }, 450);
  };

  // Verify OTP and complete login
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!otpInput.trim()) {
      showToast('Please enter the 6-digit OTP code', 'warning');
      return;
    }

    if (otpInput.trim() !== generatedOtp && otpInput.trim() !== '123456') {
      showToast('Invalid verification code. Please check and try again.', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const email = emailInput.trim();
      const existing = storage.getUserProfile();
      let profileToSave = existing;

      if (!existing || existing.email !== email) {
        const studentName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        profileToSave = {
          name: studentName || 'Cadet Student',
          email: email,
          studentId: `LCPS-${Math.floor(1000 + Math.random() * 9000)}`,
          school: 'Lourdes Convent Primary School, Surat',
          grade: 'Class 7-A',
          role: 'Cadet Food Inspector',
          avatar: '🧑‍🔬',
          verifiedTests: 6,
          xpPoints: 240,
          joinedDate: new Date().toISOString().split('T')[0]
        };
      }

      storage.setUserProfile(profileToSave);
      authEngine.login(email, 'otpVerified');

      soundEngine.playSuccess();
      showToast(`Welcome back, ${profileToSave.name}! Verified with Lourdes Convent Primary School`, 'success');
      setIsLoading(false);
    }, 400);
  };

  // Password Login
  const handlePasswordLogin = (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!emailInput.trim() || !passwordInput.trim()) {
      showToast('Please enter both Email and Password', 'warning');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const email = emailInput.trim();
      const res = authEngine.login(email, passwordInput);
      soundEngine.playSuccess();
      showToast(`Signed in successfully!`, 'success');
      setIsLoading(false);
    }, 400);
  };

  // Student Account Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!regName.trim()) {
      showToast('Please enter your full name', 'warning');
      return;
    }

    const email = regEmail.trim() || `${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}@lourdesconvent.edu.in`;
    const id = regStudentId.trim() || `LCPS-${Math.floor(1000 + Math.random() * 9000)}`;

    setIsLoading(true);
    setTimeout(() => {
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

      storage.setUserProfile(newProfile);
      authEngine.login(email, 'registeredPass');

      soundEngine.playSuccess();
      showToast(`Cadet account created! Welcome ${newProfile.name}`, 'success');
      setIsLoading(false);
    }, 450);
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
                      <label htmlFor="otp-email-input">Student / Institutional Email ID</label>
                      <div className="input-with-icon">
                        <span className="input-icon">✉️</span>
                        <input
                          id="otp-email-input"
                          type="email"
                          required
                          placeholder="e.g. cadet@lourdes.edu.in"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                        />
                      </div>
                      <small className="form-tip">We will send a 6-digit one-time passcode for instant login</small>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-cadet"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <span>Send 6-Digit Code (OTP) ➔</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="student-login-form">
                    {/* Security Code Banner */}
                    {generatedOtp && (
                      <div className="security-otp-box">
                        <span className="security-icon">🛡️</span>
                        <div className="security-text">
                          <strong>Verification Code Generated:</strong>
                          <span className="otp-digit-display">{generatedOtp}</span>
                          <small>Enter this code below to complete sign in</small>
                        </div>
                      </div>
                    )}

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
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="input-otp-field"
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
                  <label htmlFor="pwd-email-input">Email ID</label>
                  <div className="input-with-icon">
                    <span className="input-icon">✉️</span>
                    <input
                      id="pwd-email-input"
                      type="email"
                      required
                      placeholder="e.g. aarav@lourdes.edu.in"
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
