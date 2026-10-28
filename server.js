/**
 * SMART GROCERY TRUCKER - BACKEND SERVER
 * Built with Node.js built-in HTTP and Crypto modules.
 * Handles static file serving, REST APIs for Authentication,
 * Password Hashing with Salt, Username Availability, and Data Storage.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USER_DATA_FILE = path.join(DATA_DIR, 'user_data.json');

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
    return false;
  }
}

// Seed demo users if empty
let users = readJsonFile(USERS_FILE, []);
let userStore = readJsonFile(USER_DATA_FILE, {});

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + ':' + salt).digest('hex');
}

// Ensure default demo account exists for zero-friction evaluation
if (users.length === 0) {
  const salt = crypto.randomBytes(16).toString('hex');
  const demoUser = {
    id: 'user_rian_demo',
    username: 'rian_kos',
    email: 'rian@kos.ac.id',
    name: 'Rian Siswa Kos',
    salt: salt,
    passwordHash: hashPassword('Belanja2026!', salt),
    createdAt: new Date().toISOString()
  };
  users.push(demoUser);
  writeJsonFile(USERS_FILE, users);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ==========================================
  // API ROUTING
  // ==========================================

  // 1. Check Username Availability (Realtime as user types)
  if (pathname === '/api/check-username' && req.method === 'GET') {
    const username = (parsedUrl.searchParams.get('username') || '').trim().toLowerCase();
    if (!username) {
      return sendJson(res, 400, { success: false, message: 'Username tidak boleh kosong' });
    }
    if (username.length < 3) {
      return sendJson(res, 200, {
        success: true,
        available: false,
        message: 'Username minimal 3 karakter'
      });
    }
    const exists = users.some(u => u.username.toLowerCase() === username);
    return sendJson(res, 200, {
      success: true,
      available: !exists,
      username: username,
      message: exists ? 'Username sudah digunakan' : 'Username tersedia'
    });
  }

  // 2. User Registration
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { username, email, password, confirmPassword } = body;

      if (!username || !email || !password) {
        return sendJson(res, 400, { success: false, message: 'Semua field wajib diisi' });
      }

      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      if (cleanUsername.length < 3) {
        return sendJson(res, 400, { success: false, message: 'Username minimal 3 karakter' });
      }
      if (!/^[a-zA-Z0-9_\-]+$/.test(cleanUsername)) {
        return sendJson(res, 400, { success: false, message: 'Username hanya boleh huruf, angka, garis bawah, dan tanda hubung' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return sendJson(res, 400, { success: false, message: 'Format email tidak valid' });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { success: false, message: 'Password minimal 6 karakter' });
      }
      if (confirmPassword && password !== confirmPassword) {
        return sendJson(res, 400, { success: false, message: 'Konfirmasi password tidak cocok' });
      }

      // Check unique username
      if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
        return sendJson(res, 409, { success: false, message: 'Username sudah digunakan oleh akun lain' });
      }

      // Check unique email
      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return sendJson(res, 409, { success: false, message: 'Email sudah terdaftar. Silakan login.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        username: cleanUsername,
        email: cleanEmail,
        name: username.trim(),
        salt: salt,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      writeJsonFile(USERS_FILE, users);

      return sendJson(res, 201, {
        success: true,
        message: 'Registrasi berhasil!',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          token: 'token_' + newUser.id
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      return sendJson(res, 500, { success: false, message: 'Terjadi kesalahan server saat registrasi' });
    }
  }

  // 3. User Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { identifier, password } = body; // identifier can be username or email

      if (!identifier || !password) {
        return sendJson(res, 400, { success: false, message: 'Username/email dan password wajib diisi' });
      }

      const cleanId = identifier.trim().toLowerCase();
      const user = users.find(u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);

      if (!user) {
        return sendJson(res, 401, { success: false, message: 'Username atau password salah' });
      }

      const inputHash = hashPassword(password, user.salt);
      if (inputHash !== user.passwordHash) {
        return sendJson(res, 401, { success: false, message: 'Username atau password salah' });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Login berhasil!',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name || user.username,
          token: 'token_' + user.id
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return sendJson(res, 500, { success: false, message: 'Terjadi kesalahan server saat login' });
    }
  }

  // 4. Google OAuth Sign-in Handler
  if (pathname === '/api/auth/google' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { credential, email, name, googleId } = body;

      const userEmail = email ? email.toLowerCase() : `google_user_${Date.now()}@gmail.com`;
      let user = users.find(u => u.email.toLowerCase() === userEmail);

      if (!user) {
        const usernameBase = (name || 'google_user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
        let finalUsername = usernameBase || 'google_user';
        let counter = 1;
        while (users.some(u => u.username === finalUsername)) {
          finalUsername = `${usernameBase}${counter++}`;
        }

        user = {
          id: 'usr_g_' + (googleId || Date.now()),
          username: finalUsername,
          email: userEmail,
          name: name || finalUsername,
          salt: 'oauth_google',
          passwordHash: 'oauth_managed',
          provider: 'google',
          createdAt: new Date().toISOString()
        };
        users.push(user);
        writeJsonFile(USERS_FILE, users);
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Autentikasi Google berhasil!',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          token: 'token_' + user.id
        }
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, message: 'Gagal autentikasi Google' });
    }
  }

  // 5. User Data Sync (Get user's grocery items & settings)
  if (pathname === '/api/data' && req.method === 'GET') {
    const userId = parsedUrl.searchParams.get('userId');
    if (!userId) {
      return sendJson(res, 400, { success: false, message: 'userId dibutuhkan' });
    }
    const data = userStore[userId] || null;
    return sendJson(res, 200, { success: true, data: data });
  }

  // 6. User Data Save
  if (pathname === '/api/data' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { userId, data } = body;
      if (!userId || !data) {
        return sendJson(res, 400, { success: false, message: 'userId dan data dibutuhkan' });
      }
      userStore[userId] = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      writeJsonFile(USER_DATA_FILE, userStore);
      return sendJson(res, 200, { success: true, message: 'Data berhasil disimpan' });
    } catch (err) {
      return sendJson(res, 500, { success: false, message: 'Gagal menyimpan data' });
    }
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let reqPath = pathname;
  if (reqPath === '/') reqPath = '/index.html';

  const fullPath = path.join(__dirname, reqPath);

  // Security: prevent path traversal outside project root
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('File Not Found');
    return;
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Directory listing forbidden');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, fileData) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileData);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Smart Grocery Trucker Server is running at http://localhost:${PORT}`);
});
