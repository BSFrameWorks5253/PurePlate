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
    tileUrl: process.env.MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
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

function loadUsers() {
  try {
    if (fs.existsSync(ACTIVE_USERS_FILE)) {
      return JSON.parse(fs.readFileSync(ACTIVE_USERS_FILE, 'utf-8'));
    }
    if (fs.existsSync(SEED_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEED_USERS_FILE, 'utf-8'));
      if (IS_VERCEL) {
        try { fs.writeFileSync(ACTIVE_USERS_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) {}
      }
      return data;
    }
  } catch (e) {
    console.error('[API] Error loading users:', e);
  }
  return [];
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
