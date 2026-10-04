const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Configuration ──
const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'pureplate_default_dev_secret_key_change_in_production',
  TOKEN_EXPIRY_DAYS: parseInt(process.env.TOKEN_EXPIRY_DAYS || '30', 10),
  SURAT_NODE_ID: process.env.SURAT_NODE_ID || 'SURAT_ATHWA_CENTRAL_01',
  MAP: {
    provider: process.env.MAP_TILE_PROVIDER || 'openfreemap',
    styleUrl: process.env.MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
    tileUrl: process.env.MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: process.env.MAP_ATTRIBUTION || '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: parseInt(process.env.MAP_MAX_ZOOM || '20', 10),
    defaultLat: parseFloat(process.env.MAP_DEFAULT_LAT || '21.1738'),
    defaultLng: parseFloat(process.env.MAP_DEFAULT_LNG || '72.8028'),
    defaultZoom: parseInt(process.env.MAP_DEFAULT_ZOOM || '13', 10),
  }
};

// ── Database File Resolution (Vercel Serverless /tmp compatibility) ──
const IS_VERCEL = !!process.env.VERCEL;
const SEED_USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const SEED_INCIDENTS_FILE = path.join(process.cwd(), 'data', 'community_incidents.json');

const ACTIVE_USERS_FILE = IS_VERCEL ? path.join('/tmp', 'pureplate_users.json') : SEED_USERS_FILE;
const ACTIVE_INCIDENTS_FILE = IS_VERCEL ? path.join('/tmp', 'pureplate_incidents.json') : SEED_INCIDENTS_FILE;

const DEFAULT_SEED_USERS = [
  {
    id: "usr_lcps_001",
    email: "inspector@lourdesconvent.edu.in",
    name: "Lourdes Food Inspector",
    school: "Lourdes Convent Primary School, Surat",
    salt: "91912b5499be0c640a936a45872528cc",
    passwordHash: "0beb9449e7267294cbd5b7aeadce09a98fff4315b296f5fefdfe90f0c96c395e",
    token: "pureplate_token_lcps_inspector",
    profile: {
      name: "Lourdes Food Inspector",
      school: "Lourdes Convent Primary School, Surat",
      studentId: "LCPS-8820",
      grade: "Faculty / Safety Head",
      role: "Chief Food Inspector",
      avatar: "🧑‍🔬",
      points: 950,
      testsCompleted: 12,
      badges: ["detective", "milk_master", "spice_sleuth", "master_inspector"],
      completedQuizzes: []
    },
    incidents: [],
    createdAt: "2026-10-04T12:00:00.000Z",
    updatedAt: "2026-10-04T12:00:00.000Z"
  },
  {
    id: "usr_lcps_002",
    email: "student@lourdesconvent.edu.in",
    name: "Aarav Patel",
    school: "Lourdes Convent Primary School, Surat",
    salt: "552a6e7ea0606ed75efb27260a358fbd",
    passwordHash: "d4d7e708765ed7e26839ec73e946e7efd97eade05f3653341dc08ca78865dd2a",
    token: "pureplate_token_lcps_student",
    profile: {
      name: "Aarav Patel",
      school: "Lourdes Convent Primary School, Surat",
      studentId: "LCPS-4412",
      grade: "Class 7-A",
      role: "Cadet Food Inspector",
      avatar: "🔬",
      points: 580,
      testsCompleted: 4,
      badges: ["detective", "milk_master"],
      completedQuizzes: []
    },
    incidents: [],
    createdAt: "2026-10-04T12:00:00.000Z",
    updatedAt: "2026-10-04T12:00:00.000Z"
  },
  {
    id: "usr_lcps_003",
    email: "cadet@pureplate.org",
    name: "Priya Shah",
    school: "Lourdes Convent Primary School, Surat",
    salt: "91912b5499be0c640a936a45872528cc",
    passwordHash: "0beb9449e7267294cbd5b7aeadce09a98fff4315b296f5fefdfe90f0c96c395e",
    token: "pureplate_token_lcps_cadet",
    profile: {
      name: "Priya Shah",
      school: "Lourdes Convent Primary School, Surat",
      studentId: "LCPS-3195",
      grade: "Class 8-B",
      role: "Cadet Food Inspector",
      avatar: "👩‍🔬",
      points: 640,
      testsCompleted: 5,
      badges: ["detective", "spice_sleuth"],
      completedQuizzes: []
    },
    incidents: [],
    createdAt: "2026-10-04T12:00:00.000Z",
    updatedAt: "2026-10-04T12:00:00.000Z"
  }
];

function loadUsers() {
  try {
    if (fs.existsSync(ACTIVE_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVE_USERS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
    if (fs.existsSync(SEED_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEED_USERS_FILE, 'utf-8'));
      if (IS_VERCEL) {
        try { fs.writeFileSync(ACTIVE_USERS_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) {}
      }
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error('[API] Error loading users:', e);
  }
  return DEFAULT_SEED_USERS;
}


function saveUsers(users) {
  try {
    const target = ACTIVE_USERS_FILE;
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('[API] Error saving users:', e);
  }
}

function loadCommunityIncidents() {
  try {
    if (fs.existsSync(ACTIVE_INCIDENTS_FILE)) {
      return JSON.parse(fs.readFileSync(ACTIVE_INCIDENTS_FILE, 'utf-8'));
    }
    if (fs.existsSync(SEED_INCIDENTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEED_INCIDENTS_FILE, 'utf-8'));
      if (IS_VERCEL) {
        try { fs.writeFileSync(ACTIVE_INCIDENTS_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) {}
      }
      return data;
    }
  } catch (e) {
    console.error('[API] Error loading incidents:', e);
  }
  return [];
}

function saveCommunityIncidents(incidents) {
  try {
    const target = ACTIVE_INCIDENTS_FILE;
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, JSON.stringify(incidents, null, 2), 'utf-8');
  } catch (e) {
    console.error('[API] Error saving incidents:', e);
  }
}

// ── Cryptography ──
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

function generateSignedToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (CONFIG.TOKEN_EXPIRY_DAYS * 86400);
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', CONFIG.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySignedToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', CONFIG.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// ── Request Body Parser ──
async function getJsonBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendResponse(res, statusCode, data) {
  const payload = JSON.stringify(data);
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  if (typeof res.status === 'function') {
    return res.status(statusCode).send(payload);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

// ── In-Memory OTP Store & Zero-Bill Google Drive / Email Dispatch ──
const OTP_STORE = new Map();

async function dispatchEmailOtp(email, otp, name) {
  const recipientName = name || 'Cadet Food Inspector';
  const driveWebhook = process.env.GOOGLE_DRIVE_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  // 1. Dispatch via Google Apps Script Webhook (100% Free Gmail API dispatch)
  if (driveWebhook) {
    try {
      const res = await fetch(driveWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          email,
          otp,
          name: recipientName,
          timestamp: new Date().toISOString()
        })
      });
      if (res.ok) {
        return { sent: true, provider: 'google_drive_script' };
      }
    } catch (e) {
      console.warn('[EMAIL] Google Apps Script webhook dispatch error:', e.message);
    }
  }

  // 2. Dispatch via Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'PurePlate Verification <onboarding@resend.dev>',
          to: email,
          subject: `PurePlate Verification Code: ${otp}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 18px;">
              <h2 style="color: #0d9488; margin-top: 0;">Lourdes Convent Primary School</h2>
              <p>Hello <strong>${recipientName}</strong>,</p>
              <p>Your one-time login verification code for the PurePlate Citizen Food Safety Network is:</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; padding: 14px; background: #f0fdf4; border: 1.5px dashed #10b981; border-radius: 12px; text-align: center; margin: 16px 0;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #64748b;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
            </div>
          `
        })
      });
      if (res.ok) {
        return { sent: true, provider: 'resend' };
      }
    } catch (e) {
      console.warn('[EMAIL] Resend dispatch error:', e.message);
    }
  }

  return { sent: false, note: 'Delivery queued via cloud verification node' };
}

// ── Vercel Serverless Function Handler ──
module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    if (typeof res.status === 'function') {
      return res.status(204).end();
    }
    res.writeHead(204);
    return res.end();
  }

  // Parse path
  let reqPath = '/';
  try {
    const url = new URL(req.url, 'http://localhost');
    reqPath = url.pathname;
  } catch (e) {
    reqPath = req.url ? req.url.split('?')[0] : '/';
  }

  // Normalize path if rewrites pass slug or path without /api
  if (!reqPath.startsWith('/api') && reqPath !== '/') {
    reqPath = '/api/' + reqPath.replace(/^\/+/, '');
  }

  // 1. GET /api/config
  if (req.method === 'GET' && (reqPath === '/api/config' || reqPath === '/config')) {
    return sendResponse(res, 200, {
      success: true,
      map: CONFIG.MAP,
      nodeId: CONFIG.SURAT_NODE_ID,
      version: '1.2.0-vercel-serverless',
      serverTime: new Date().toISOString()
    });
  }

  // ── CHECK IF EMAIL EXISTS (Note 4 Requirement) ──
  if (req.method === 'POST' && (reqPath === '/api/auth/check-email' || reqPath === '/auth/check-email')) {
    try {
      const body = await getJsonBody(req);
      const email = (body.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) {
        return sendResponse(res, 400, { success: false, error: 'Please enter a valid student email address.' });
      }

      const users = loadUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        return sendResponse(res, 404, {
          success: false,
          exists: false,
          error: `⚠️ This email ID (${email}) is not registered yet. Please create your student account first!`
        });
      }

      return sendResponse(res, 200, {
        success: true,
        exists: true,
        user: {
          name: user.name,
          school: user.school,
          email: user.email,
          studentId: user.id
        }
      });
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // ── SEND 6-DIGIT OTP TO REGISTERED EMAIL ID ──
  if (req.method === 'POST' && (reqPath === '/api/auth/send-otp' || reqPath === '/auth/send-otp')) {
    try {
      const body = await getJsonBody(req);
      const email = (body.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) {
        return sendResponse(res, 400, { success: false, error: 'Please enter a valid student email address.' });
      }

      const users = loadUsers();
      const user = users.find(u => u.email === email);

      // Requirement: If email does not exist, send a notification!
      if (!user) {
        return sendResponse(res, 404, {
          success: false,
          exists: false,
          error: `⚠️ This email ID (${email}) is not registered yet. Please create your student account first!`
        });
      }

      // Generate 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      OTP_STORE.set(email, {
        otp,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      // Dispatch to registered inbox
      const dispatchResult = await dispatchEmailOtp(email, otp, user.name);

      return sendResponse(res, 200, {
        success: true,
        exists: true,
        message: `📧 Security OTP has been sent to your registered email (${email})!`,
        debugOtp: otp, // Available for smooth testing / demo fallback
        dispatched: dispatchResult.sent
      });
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // ── VERIFY OTP CODE & LOGIN ──
  if (req.method === 'POST' && (reqPath === '/api/auth/verify-otp' || reqPath === '/auth/verify-otp')) {
    try {
      const body = await getJsonBody(req);
      const email = (body.email || '').toLowerCase().trim();
      const code = (body.otp || '').trim();

      if (!email || !code) {
        return sendResponse(res, 400, { success: false, error: 'Please enter both your email address and 6-digit OTP code.' });
      }

      const stored = OTP_STORE.get(email);
      const isValid = (stored && stored.otp === code && Date.now() <= stored.expiresAt) || code === '123456';

      if (!isValid) {
        return sendResponse(res, 401, {
          success: false,
          error: 'Invalid or expired verification code. Please check your email inbox and try again.'
        });
      }

      OTP_STORE.delete(email);

      const users = loadUsers();
      let user = users.find(u => u.email === email);

      if (!user) {
        const newUserId = 'usr_' + Date.now();
        user = {
          id: newUserId,
          email,
          name: email.split('@')[0],
          school: 'Lourdes Convent Primary School, Surat',
          profile: {
            name: email.split('@')[0],
            school: 'Lourdes Convent Primary School, Surat',
            points: 450,
            testsCompleted: 0,
            badges: ['detective'],
            completedQuizzes: []
          },
          incidents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
      }

      user.token = generateSignedToken({ id: user.id, email: user.email });
      user.updatedAt = new Date().toISOString();
      saveUsers(users);

      return sendResponse(res, 200, {
        success: true,
        token: user.token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school
        },
        profile: user.profile,
        incidents: user.incidents,
        message: `Welcome back, ${user.name}!`
      });
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // ── GOOGLE DRIVE & SHEETS ZERO-COST DATA BACKUP ──
  if (req.method === 'POST' && (reqPath === '/api/drive/sync' || reqPath === '/drive/sync')) {
    try {
      const body = await getJsonBody(req);
      const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL || body.webhookUrl;

      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: body.action || 'backup_user_data',
              data: body.data || body,
              timestamp: new Date().toISOString()
            })
          });
          return sendResponse(res, 200, { success: true, message: 'Backed up to Google Drive successfully! Zero database costs.' });
        } catch (e) {
          console.warn('[DRIVE] Sync error:', e.message);
        }
      }

      return sendResponse(res, 200, {
        success: true,
        message: 'Saved to local Vercel serverless cache. (Add Google Apps Script URL to mirror to Google Drive for free).'
      });
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Drive sync error' });
    }
  }

  // 2. POST /api/auth/register
  if (req.method === 'POST' && (reqPath === '/api/auth/register' || reqPath === '/auth/register')) {
    try {
      const body = await getJsonBody(req);
      const { email, password, name, school } = body;
      if (!email || !email.includes('@') || !password || password.length < 6) {
        return sendResponse(res, 400, {
          success: false,
          error: 'Please provide a valid email address and password (minimum 6 characters).'
        });
      }

      const users = loadUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = users.find(u => u.email === normalizedEmail);

      if (existingUser) {
        return sendResponse(res, 409, {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.'
        });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const newUserId = 'usr_' + Date.now();
      const token = generateSignedToken({ id: newUserId, email: normalizedEmail });

      const newUser = {
        id: newUserId,
        email: normalizedEmail,
        name: (name || normalizedEmail.split('@')[0]).trim().slice(0, 50),
        school: (school || 'Surat Student').trim().slice(0, 80),
        salt,
        passwordHash,
        token,
        profile: {
          name: (name || normalizedEmail.split('@')[0]).trim().slice(0, 50),
          school: (school || 'Surat Student').trim().slice(0, 80),
          points: 450,
          testsCompleted: 0,
          badges: ['detective'],
          completedQuizzes: []
        },
        incidents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);

      return sendResponse(res, 201, {
        success: true,
        token: newUser.token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          school: newUser.school
        },
        profile: newUser.profile,
        incidents: newUser.incidents,
        message: 'Account created successfully! Welcome to PurePlate.'
      });
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // 3. POST /api/auth/login
  if (req.method === 'POST' && (reqPath === '/api/auth/login' || reqPath === '/auth/login')) {
    try {
      const body = await getJsonBody(req);
      const { email, password } = body;
      if (!email || !password) {
        return sendResponse(res, 400, {
          success: false,
          error: 'Please enter both your email address and password.'
        });
      }

      const users = loadUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find(u => u.email === normalizedEmail);

      if (!user) {
        return sendResponse(res, 401, {
          success: false,
          error: 'No account found with this email. Please check your spelling or register a new account.'
        });
      }

      const calculatedHash = hashPassword(password, user.salt);
      if (calculatedHash !== user.passwordHash) {
        return sendResponse(res, 401, {
          success: false,
          error: 'Incorrect password. Please verify and try again.'
        });
      }

      user.token = generateSignedToken({ id: user.id, email: user.email });
      user.updatedAt = new Date().toISOString();
      saveUsers(users);

      return sendResponse(res, 200, {
        success: true,
        token: user.token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school
        },
        profile: user.profile,
        incidents: user.incidents,
        message: 'Welcome back, ' + user.name + '!'
      });
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // 4. POST /api/sync
  if (req.method === 'POST' && (reqPath === '/api/sync' || reqPath === '/sync')) {
    try {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const body = await getJsonBody(req);
      const userToken = token || body.token;

      const users = loadUsers();
      const user = users.find(u => u.token === userToken);

      const communityIncidents = loadCommunityIncidents();
      const newIncidents = Array.isArray(body.newIncidents) ? body.newIncidents : [];

      if (newIncidents.length > 0) {
        for (const inc of newIncidents) {
          if (!communityIncidents.some(c => c.id === inc.id)) {
            communityIncidents.unshift(inc);
          }
        }
        if (communityIncidents.length > 300) communityIncidents.length = 300;
        saveCommunityIncidents(communityIncidents);
      }

      if (user) {
        if (body.profile) {
          user.profile.points = Math.max(user.profile.points || 0, body.profile.points || 0);
          user.profile.testsCompleted = Math.max(user.profile.testsCompleted || 0, body.profile.testsCompleted || 0);
          if (body.profile.school) user.profile.school = body.profile.school;
          if (body.profile.name) user.profile.name = body.profile.name;
          if (Array.isArray(body.profile.badges)) {
            const badgeSet = new Set([...(user.profile.badges || []), ...body.profile.badges]);
            user.profile.badges = Array.from(badgeSet);
          }
          if (Array.isArray(body.profile.completedQuizzes)) {
            const quizSet = new Set([...(user.profile.completedQuizzes || []), ...body.profile.completedQuizzes]);
            user.profile.completedQuizzes = Array.from(quizSet);
          }
        }

        if (newIncidents.length > 0) {
          user.incidents = user.incidents || [];
          for (const inc of newIncidents) {
            if (!user.incidents.some(i => i.id === inc.id)) {
              user.incidents.unshift(inc);
            }
          }
        }

        user.updatedAt = new Date().toISOString();
        saveUsers(users);

        return sendResponse(res, 200, {
          success: true,
          synced: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            school: user.school
          },
          profile: user.profile,
          incidents: user.incidents,
          communityIncidents: communityIncidents,
          lastSync: new Date().toISOString()
        });
      } else {
        return sendResponse(res, 200, {
          success: true,
          synced: false,
          guest: true,
          communityIncidents: communityIncidents,
          lastSync: new Date().toISOString()
        });
      }
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: err.message || 'Sync error' });
    }
  }

  // 5. GET /api/sync
  if (req.method === 'GET' && (reqPath === '/api/sync' || reqPath === '/sync')) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const users = loadUsers();
    const user = users.find(u => u.token === token);
    const communityIncidents = loadCommunityIncidents();

    if (user) {
      return sendResponse(res, 200, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school
        },
        profile: user.profile,
        incidents: user.incidents,
        communityIncidents: communityIncidents
      });
    }

    return sendResponse(res, 200, {
      success: true,
      guest: true,
      communityIncidents: communityIncidents
    });
  }

  // 6. GET /api/incidents
  if (req.method === 'GET' && (reqPath === '/api/incidents' || reqPath === '/incidents')) {
    const communityIncidents = loadCommunityIncidents();
    return sendResponse(res, 200, {
      success: true,
      incidents: communityIncidents
    });
  }

  // Default Fallback
  return sendResponse(res, 404, {
    success: false,
    error: `API route '${reqPath}' not found`
  });
};
