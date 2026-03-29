/**
 * S3 Foundation — Local Development Server
 * Run: node server.js  (or: npm start)
 * Visit: http://localhost:3000
 * Admin:  http://localhost:3000/admin
 */

require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CONTENT_FILE   = path.join(__dirname, 'data', 'content.json');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname)));   // serves all HTML, CSS, JS, images

// ── Helpers ───────────────────────────────────────────────────────────────────
function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function writeContent(data) {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  }
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Public API ────────────────────────────────────────────────────────────────

// GET all content (public — website reads this)
app.get('/api/content', (req, res) => {
  try {
    res.json(readContent());
  } catch (e) {
    res.status(500).json({ error: 'Could not read content.json', details: e.message });
  }
});

// POST / save content (admin only)
app.post('/api/content', requireAuth, (req, res) => {
  try {
    writeContent(req.body);
    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: 'Could not save content.json', details: e.message });
  }
});

// Admin login — returns the token (which IS the password for simplicity)
app.post('/api/auth', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD, ok: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Upload image to local /images directory
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, 'images', 'uploads');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const url = `/images/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.filename });
});

// ── Catch-all: serve index.html for any unknown route (SPA friendly) ──────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✦ S3 Foundation Server running!');
  console.log(`  🌐  Website : http://localhost:${PORT}`);
  console.log(`  🔐  Admin   : http://localhost:${PORT}/admin`);
  console.log(`  🔑  Password: ${ADMIN_PASSWORD}`);
  console.log('');
});
