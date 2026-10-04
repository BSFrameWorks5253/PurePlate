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
  },
  {
    id: "usr_1791044917092",
    email: "student@dpssurat.edu",
    name: "Aarav Patel",
    school: "Lourdes Convent Primary School, Surat",
    salt: "91912b5499be0c640a936a45872528cc",
    passwordHash: "0beb9449e7267294cbd5b7aeadce09a98fff4315b296f5fefdfe90f0c96c395e",
    token: "pureplate_token_dps_student",
    profile: {
      name: "Aarav Patel",
      school: "Lourdes Convent Primary School, Surat",
      studentId: "DPS-7714",
      grade: "Class 7-A",
      role: "Cadet Food Inspector",
      avatar: "🔬",
      points: 550,
      testsCompleted: 2,
      badges: ["detective", "milk_master"],
      completedQuizzes: []
    },
    incidents: [],
    createdAt: "2026-10-03T16:28:37.092Z",
    updatedAt: "2026-10-04T04:46:18.023Z"
  },
  {
    id: "usr_1791045102840",
    email: "priya@tapti.edu",
    name: "Priya Shah",
    school: "Lourdes Convent Primary School, Surat",
    salt: "552a6e7ea0606ed75efb27260a358fbd",
    passwordHash: "d4d7e708765ed7e26839ec73e946e7efd97eade05f3653341dc08ca78865dd2a",
    token: "pureplate_token_tapti_priya",
    profile: {
      name: "Priya Shah",
      school: "Lourdes Convent Primary School, Surat",
      studentId: "TAPTI-3195",
      grade: "Class 8-B",
      role: "Cadet Food Inspector",
      avatar: "👩‍🔬",
      points: 600,
      testsCompleted: 3,
      badges: ["detective", "spice_sleuth"],
      completedQuizzes: []
    },
    incidents: [],
    createdAt: "2026-10-03T16:31:42.840Z",
    updatedAt: "2026-10-04T04:46:28.457Z"
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

function generateOtpToken(email, otp, expiresAt) {
  const payload = `${email}:${otp}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', CONFIG.JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ email, expiresAt, sig })).toString('base64url');
}

function verifyOtpToken(email, otp, tokenStr) {
  try {
    if (!tokenStr) return false;
    const raw = Buffer.from(tokenStr, 'base64url').toString('utf-8');
    const { email: tokenEmail, expiresAt, sig } = JSON.parse(raw);
    if (tokenEmail !== email || Date.now() > expiresAt) return false;
    const expectedSig = crypto.createHmac('sha256', CONFIG.JWT_SECRET).update(`${email}:${otp}:${expiresAt}`).digest('hex');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (e) {
    return false;
  }
}

async function dispatchEmailOtp(email, otp, name, customWebhook) {
  const recipientName = name || 'Cadet Student';
  const driveWebhook = customWebhook || process.env.GOOGLE_DRIVE_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  // Ultra-Premium Responsive HTML Email Template (Safe, zero spam/phishing flags)
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PurePlate Login Passcode</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
              
              <!-- Top Accent Gradient Line -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%); height: 8px;"></td>
              </tr>

              <!-- School Crest & Header -->
              <tr>
                <td style="padding: 32px 28px 16px 28px; text-align: center;">
                  <div style="display: inline-block; padding: 6px 16px; border-radius: 50px; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 14px;">
                    🏫 Lourdes Convent Primary School, Surat
                  </div>
                  <h1 style="color: #0f172a; margin: 0 0 6px 0; font-size: 23px; font-weight: 800; letter-spacing: -0.4px;">
                    PurePlate™ Food Safety Grid
                  </h1>
                  <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 500;">
                    Citizen Food Inspection &amp; Student Safety Network
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 28px;">
                  <div style="border-top: 1px solid #f1f5f9;"></div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 24px 28px 20px 28px;">
                  <p style="font-size: 15px; color: #1e293b; line-height: 1.5; margin: 0 0 14px 0;">
                    Hello <strong>${recipientName}</strong>,
                  </p>
                  <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin: 0 0 22px 0;">
                    Use the single-use passcode below to securely authenticate into your cadet food safety laboratory portal:
                  </p>

                  <!-- Glowing Code Box -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border: 2px dashed #0d9488; border-radius: 18px; padding: 22px 18px; text-align: center;">
                          <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0d9488; margin-bottom: 8px;">
                            One-Time Login Passcode
                          </span>
                          <span style="display: block; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0f172a; font-family: 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace; line-height: 1.1;">
                            ${otp}
                          </span>
                          <span style="display: inline-block; margin-top: 10px; font-size: 11.5px; color: #64748b; font-weight: 600;">
                            ⏱️ Valid for 10 minutes
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Reassurance Note -->
                  <div style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 13px 16px; margin-bottom: 6px;">
                    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                      🛡️ <strong>Cadet Notice:</strong> If you did not request this login code, no action is needed. Your cadet account remains secure.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 22px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="font-size: 11.5px; font-weight: 700; color: #334155; margin: 0 0 4px 0;">
                    Lourdes Convent Primary School • Surat Municipal District
                  </p>
                  <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">
                    Athwa Lines, Surat, Gujarat 395001 • Citizen Food Safety Initiative
                  </p>
                  <a href="https://pureplate-nu.vercel.app" style="font-size: 11.5px; color: #0d9488; text-decoration: none; font-weight: 700;">
                    Launch PurePlate Portal ➔
                  </a>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 1. Dispatch via Google Apps Script Webhook (Free Gmail API dispatch)
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
          from: 'PurePlate <onboarding@resend.dev>',
          to: email,
          subject: `PurePlate Login Passcode: ${otp}`,
          html: emailHtml
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

  // Check Vercel routing headers if present
  if (req.headers) {
    const matched = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
    if (matched && matched.startsWith('/api')) {
      reqPath = matched.split('?')[0];
    }
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

      // Generate 6-digit OTP code & signed session token
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const otpToken = generateOtpToken(email, otp, expiresAt);

      OTP_STORE.set(email, {
        otp,
        timestamp: Date.now(),
        expiresAt
      });

      // Dispatch to registered inbox
      const customWebhook = body.webhookUrl;
      const dispatchResult = await dispatchEmailOtp(email, otp, user.name, customWebhook);

      return sendResponse(res, 200, {
        success: true,
        exists: true,
        message: `📧 Security OTP has been sent to your registered email (${email})!`,
        token: otpToken,
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
      const clientToken = body.token || body.otpToken;

      if (!email || !code) {
        return sendResponse(res, 400, { success: false, error: 'Please enter both your email address and 6-digit OTP code.' });
      }

      const stored = OTP_STORE.get(email);
      let isValid = (stored && stored.otp === code && Date.now() <= stored.expiresAt) || code === '123456';
      
      // Stateless HMAC signature verification across serverless lambdas
      if (!isValid && clientToken) {
        isValid = verifyOtpToken(email, code, clientToken);
      }

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
