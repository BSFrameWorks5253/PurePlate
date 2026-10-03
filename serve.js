const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');
const QRCode = require('qrcode');
const selfsigned = require('selfsigned');

const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
const ROOT_DIR = path.join(__dirname, 'web_app');
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INCIDENTS_FILE = path.join(DATA_DIR, 'community_incidents.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Retrieve all local IPv4 addresses (Wi-Fi, LAN, Ethernet)
function getAllLocalIps() {
  const ips = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// Initialize database storage
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
}
if (!fs.existsSync(INCIDENTS_FILE)) {
  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

function loadCommunityIncidents() {
  try {
    return JSON.parse(fs.readFileSync(INCIDENTS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveCommunityIncidents(incidents) {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving incidents:', e);
  }
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

async function handleApiRequest(req, res, reqPath) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // 1. User Registration (Email Sign-Up)
  if (req.method === 'POST' && reqPath === '/api/auth/register') {
    try {
      const { email, password, name, school } = await parseJsonBody(req);
      if (!email || !email.includes('@') || !password || password.length < 6) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Please provide a valid email address and password (minimum 6 characters).'
        });
      }

      const users = loadUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = users.find(u => u.email === normalizedEmail);

      if (existingUser) {
        return sendJsonResponse(res, 409, {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.'
        });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const token = crypto.randomBytes(32).toString('hex');

      const newUser = {
        id: 'usr_' + Date.now(),
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

      return sendJsonResponse(res, 201, {
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
      return sendJsonResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // 2. User Login (Email Sign-In)
  if (req.method === 'POST' && reqPath === '/api/auth/login') {
    try {
      const { email, password } = await parseJsonBody(req);
      if (!email || !password) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Please enter both your email address and password.'
        });
      }

      const users = loadUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find(u => u.email === normalizedEmail);

      if (!user) {
        return sendJsonResponse(res, 401, {
          success: false,
          error: 'No account found with this email. Please check your spelling or register a new account.'
        });
      }

      const calculatedHash = hashPassword(password, user.salt);
      if (calculatedHash !== user.passwordHash) {
        return sendJsonResponse(res, 401, {
          success: false,
          error: 'Incorrect password. Please verify and try again.'
        });
      }

      // Generate refreshed session token
      user.token = crypto.randomBytes(32).toString('hex');
      user.updatedAt = new Date().toISOString();
      saveUsers(users);

      return sendJsonResponse(res, 200, {
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
      return sendJsonResponse(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  // 3. User & Multi-Device Data Sync (POST /api/sync)
  if (req.method === 'POST' && reqPath === '/api/sync') {
    try {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const body = await parseJsonBody(req);
      const userToken = token || body.token;

      const users = loadUsers();
      const user = users.find(u => u.token === userToken);

      // Handle community incidents merge
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
        // Merge user points, badges, quizzes
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

        // Merge user-specific tests
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

        return sendJsonResponse(res, 200, {
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
        // Guest sync: return live community grid
        return sendJsonResponse(res, 200, {
          success: true,
          synced: false,
          guest: true,
          communityIncidents: communityIncidents,
          lastSync: new Date().toISOString()
        });
      }
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: err.message || 'Sync error' });
    }
  }

  // 4. GET /api/sync (Pull Latest Cloud State)
  if (req.method === 'GET' && reqPath === '/api/sync') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const users = loadUsers();
    const user = users.find(u => u.token === token);
    const communityIncidents = loadCommunityIncidents();

    if (user) {
      return sendJsonResponse(res, 200, {
        success: true,
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
    }

    return sendJsonResponse(res, 200, {
      success: true,
      guest: true,
      communityIncidents: communityIncidents,
      lastSync: new Date().toISOString()
    });
  }

  // Unknown API route
  return sendJsonResponse(res, 404, { success: false, error: 'API route not found' });
}

function handleHttpRequest(req, res, isHttps = false) {
  let reqPath = req.url.split('?')[0];

  // Route API requests to REST Controller
  if (reqPath.startsWith('/api/')) {
    return handleApiRequest(req, res, reqPath);
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Enterprise Security: Prevent Directory Traversal
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.resolve(ROOT_DIR, '.' + safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(self), geolocation=(self), accelerometer=(self), gyroscope=(self)',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com; connect-src 'self' https://*.tile.openstreetmap.org ws: wss:; frame-ancestors 'self'; form-action 'self';",
    };

    if (isHttps) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

async function startServers() {
  const localIps = getAllLocalIps();
  const primaryIp = localIps.length > 0 ? localIps[0].address : 'localhost';
  const hostname = os.hostname();

  // 1. Generate SSL Certificate for HTTPS (for Camera & PWA on Mobile)
  let pems;
  try {
    pems = await selfsigned.generate(
      [
        { name: 'commonName', value: primaryIp },
        { name: 'organizationName', value: 'PurePlate Citizen Science' }
      ],
      {
        days: 365,
        keySize: 2048,
        algorithm: 'sha256'
      }
    );
  } catch (err) {
    console.warn('Could not generate self-signed cert, proceeding with HTTP only:', err);
  }

  // 2. Start HTTP Server
  const httpServer = http.createServer(handleHttpRequest);
  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    // 3. Start HTTPS Server if pems generated
    if (pems) {
      const httpsServer = https.createServer(
        { key: pems.private, cert: pems.cert },
        (req, res) => handleHttpRequest(req, res, true)
      );
      httpsServer.listen(HTTPS_PORT, '0.0.0.0', async () => {
        printServerBanner(primaryIp, hostname, localIps);
      });
    } else {
      printServerBanner(primaryIp, hostname, localIps);
    }
  });

  // Automatically open desktop browser
  exec(`start http://localhost:${HTTP_PORT}`);
}

async function printServerBanner(primaryIp, hostname, localIps) {
  const httpUrl = `http://${primaryIp}:${HTTP_PORT}`;
  const httpsUrl = `https://${primaryIp}:${HTTPS_PORT}`;
  const mDnsUrl = `http://${hostname}.local:${HTTP_PORT}`;

  console.log('\n================================================================');
  console.log('🛡️  PUREPLATE CITIZEN FOOD SAFETY NETWORK - SAME-WIFI SERVER');
  console.log('================================================================');
  console.log(`💻 This Computer:     http://localhost:${HTTP_PORT}`);
  console.log(`📱 Same Wi-Fi (Phone): http://${primaryIp}:${HTTP_PORT}`);
  console.log(`🔒 Local HTTPS (Cam):  ${httpsUrl}`);
  console.log(`🌐 Cloudflare Public:  https://philips-quit-marion-activation.trycloudflare.com`);
  console.log(`🏷️ Bonjour/mDNS Name: ${mDnsUrl}`);
  console.log('----------------------------------------------------------------');

  if (localIps.length > 1) {
    console.log('🌐 Available Network Interfaces:');
    localIps.forEach(ip => console.log(`   • ${ip.name}: http://${ip.address}:${HTTP_PORT}`));
    console.log('----------------------------------------------------------------');
  }

  try {
    console.log('📲 SCAN WITH PHONE CAMERA TO OPEN INSTANTLY (Same Wi-Fi):\n');
    const qrString = await QRCode.toString(httpUrl, { type: 'terminal', small: true });
    console.log(qrString);
  } catch (e) {}

  console.log('----------------------------------------------------------------');
  console.log('💡 TIPS FOR CONNECTING ANY DEVICE ON THE SAME INTERNET:');
  console.log('1. Ensure your phone/tablet is connected to the SAME Wi-Fi network.');
  console.log(`2. Open Chrome (Android) or Safari (iPhone) and type: ${httpUrl}`);
  console.log('3. Camera & Sensors: For real hardware camera streaming, use the');
  console.log(`   Secure HTTPS link: ${httpsUrl} (accept self-signed warning once).`);
  console.log('4. Or use the built-in "Demo Samples" toggle which works over any URL!');
  console.log('================================================================\n');
}

startServers();
