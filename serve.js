const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const QRCode = require('qrcode');
const selfsigned = require('selfsigned');

const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
const ROOT_DIR = path.join(__dirname, 'web_app');

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

function handleHttpRequest(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

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
        handleHttpRequest
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
