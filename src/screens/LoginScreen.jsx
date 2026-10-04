import React, { useState, useEffect } from 'react';
import authEngine from '../services/auth.js';
import storage from '../services/storage.js';
import soundEngine from '../services/sound.js';
import PurePlateLogo from '../components/PurePlateLogo.jsx';

export default function LoginScreen({ onNavigate, showToast }) {
  const [currentUser, setCurrentUser] = useState(authEngine.getCurrentUser());
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Form fields
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentGrade, setStudentGrade] = useState('Class 7-A');
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍🔬');
  const [userRole, setUserRole] = useState('Cadet Food Inspector');
  const [schoolName, setSchoolName] = useState('Lourdes Convent Primary School, Surat');
  const [isLoading, setIsLoading] = useState(false);

  const avatarList = ['🧑‍🔬', '👩‍🔬', '👨‍🔬', '🔬', '🛡️', '🌟'];

  useEffect(() => {
    return authEngine.subscribe((user) => {
      setCurrentUser(user);
    });
  }, []);

  const handleQuickLogin = (cadetType) => {
    soundEngine.playClick();
    setIsLoading(true);
    setTimeout(() => {
      let email = 'aarav@lourdes.edu.in';
      let name = 'Cadet Aarav Patel';
      let id = 'LCPS-CADET-042';

      if (cadetType === 'officer') {
        email = 'riya@lourdes.edu.in';
        name = 'Officer Riya Shah';
        id = 'LCPS-OFFICER-009';
      }

      const res = authEngine.login(email, 'cadet123');
      if (res.success) {
        soundEngine.playSuccess();
        showToast(`Welcome back, ${res.user.name}! School synced: Lourdes Convent Primary School`, 'success');
      } else {
        // Fallback create user
        const newProf = {
          name,
          email,
          studentId: id,
          school: 'Lourdes Convent Primary School, Surat',
          grade: cadetType === 'officer' ? 'Lab Captain' : 'Class 7-A',
          role: cadetType === 'officer' ? 'Officer' : 'Cadet Inspector',
          avatar: cadetType === 'officer' ? '👩‍🔬' : '🧑‍🔬',
          verifiedTests: 8,
          xpPoints: 340,
          joinedDate: '2026-09-01'
        };
        storage.setUserProfile(newProf);
        authEngine.login(email, 'any');
        soundEngine.playSuccess();
        showToast(`Signed in as ${name}!`, 'success');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!studentName.trim()) {
      showToast('Please enter your full name', 'warning');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const generatedEmail = `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@lourdesconvent.edu.in`;
      const id = studentId.trim() || `LCPS-${Math.floor(1000 + Math.random() * 9000)}`;

      const customProfile = {
        name: studentName.trim(),
        email: generatedEmail,
        studentId: id,
        school: 'Lourdes Convent Primary School, Surat',
        grade: studentGrade,
        role: userRole,
        avatar: selectedAvatar,
        verifiedTests: (currentUser && currentUser.verifiedTests) || 4,
        xpPoints: (currentUser && currentUser.xpPoints) || 180,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      // Save to storage & auth
      storage.setUserProfile(customProfile);
      authEngine.login(generatedEmail, 'studentPass');

      soundEngine.playSuccess();
      showToast(`Welcome, ${customProfile.name}! Profile created and synced with Lourdes Convent Primary School`, 'success');
      setIsLoading(false);
    }, 450);
  };

  const handleLogout = () => {
    soundEngine.playClick();
    authEngine.logout();
    showToast('Signed out of student session', 'info');
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
            <h2>Student &amp; Cadet Portal</h2>
            <span className="catalog-counter-pill">Official Hub</span>
          </div>
          <p>Lourdes Convent Primary School • Citizen Science Lab</p>
        </div>
      </div>

      <div className="login-screen-container">
        {/* If user is already logged in, show their Cadet ID Card */}
        {currentUser ? (
          <div className="cadet-id-card-wrap">
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
                  <h4 className="cadet-full-name">{currentUser.name || 'Cadet Aarav Patel'}</h4>
                  <p className="cadet-rank-title">🎖️ {currentUser.role || 'Junior Food Safety Inspector'}</p>
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
                  title="Sign out or switch cadet"
                >
                  Sign Out / Switch Cadet
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Login / Registration Card */
          <div className="login-form-card glass-card">
            {/* Brand Logo Header */}
            <div className="login-card-brand">
              <PurePlateLogo size={56} variant="icon" showGlow={true} />
              <h3>Cadet Safety Network</h3>
              <div className="school-pill-tag">
                <span>🏫 Lourdes Convent Primary School, Surat</span>
              </div>
              <p className="login-tagline">Log your classroom food tests directly to the municipal heatmap</p>
            </div>

            {/* Quick 1-Click Cadet Demo Logins */}
            <div className="quick-cadet-section">
              <span className="quick-label">⚡ 1-Click Student Quick Login:</span>
              <div className="quick-buttons-row">
                <button
                  type="button"
                  className="quick-cadet-btn"
                  onClick={() => handleQuickLogin('cadet')}
                  disabled={isLoading}
                >
                  <span className="quick-avatar">👦</span>
                  <div className="quick-meta">
                    <strong>Cadet Aarav Patel</strong>
                    <span>Class 7-A • Roll #42</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-cadet-btn"
                  onClick={() => handleQuickLogin('officer')}
                  disabled={isLoading}
                >
                  <span className="quick-avatar">👧</span>
                  <div className="quick-meta">
                    <strong>Officer Riya Shah</strong>
                    <span>Lab Captain • Roll #09</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="login-divider">
              <span>OR ENTER STUDENT DETAILS</span>
            </div>

            {/* Tabs: Sign In / Register */}
            <div className="auth-tab-pill-bar">
              <button
                type="button"
                className={`auth-pill-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Cadet Sign In
              </button>
              <button
                type="button"
                className={`auth-pill-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register New Student
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCustomSubmit} className="student-login-form">
              <div className="form-group">
                <label htmlFor="student-name-input">Student Full Name *</label>
                <div className="input-with-icon">
                  <span className="input-icon">👤</span>
                  <input
                    id="student-name-input"
                    type="text"
                    required
                    placeholder="e.g. Diya Mehta"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="student-id-input">Roll No. / Student ID</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🏷️</span>
                    <input
                      id="student-id-input"
                      type="text"
                      placeholder="e.g. LCPS-7A-18"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="student-grade-select">Class / Grade</label>
                  <select
                    id="student-grade-select"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="select-custom"
                  >
                    <option value="Class 5-A">Class 5-A</option>
                    <option value="Class 5-B">Class 5-B</option>
                    <option value="Class 6-A">Class 6-A</option>
                    <option value="Class 6-B">Class 6-B</option>
                    <option value="Class 7-A">Class 7-A</option>
                    <option value="Class 7-B">Class 7-B</option>
                    <option value="Class 8-A">Class 8-A</option>
                    <option value="Class 8-B">Class 8-B</option>
                    <option value="Science Lab Captain">Science Lab Captain</option>
                  </select>
                </div>
              </div>

              {activeTab === 'register' && (
                <>
                  <div className="form-group">
                    <label>Choose Laboratory Avatar</label>
                    <div className="avatar-picker-row">
                      {avatarList.map((av) => (
                        <button
                          key={av}
                          type="button"
                          className={`avatar-pick-btn ${selectedAvatar === av ? 'active' : ''}`}
                          onClick={() => {
                            soundEngine.playClick();
                            setSelectedAvatar(av);
                          }}
                        >
                          <span>{av}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-role-select">Cadet Inspection Role</label>
                    <select
                      id="student-role-select"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Cadet Food Inspector">Cadet Food Inspector</option>
                      <option value="Lead Student Officer">Lead Student Officer</option>
                      <option value="Laboratory Science Captain">Laboratory Science Captain</option>
                      <option value="Citizen Food Safety Analyst">Citizen Food Safety Analyst</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Institution / School</label>
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
                id="btn-login-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>{activeTab === 'login' ? 'Sign In as Cadet' : 'Complete Registration & Sync'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
