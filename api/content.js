/**
 * Vercel Serverless Function — /api/content
 * GET  → Returns current content (public)
 * POST → Saves content (requires Authorization: Bearer <ADMIN_PASSWORD>)
 *
 * Storage: Supabase (free tier)
 * See SETUP.md for how to configure Supabase env vars.
 */

const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_ANON   = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || 'admin123';

// Fallback: if Supabase isn't configured, serve the bundled content.json
const fs   = require('fs');
const path = require('path');

async function getContent() {
  if (SUPABASE_URL && SUPABASE_ANON) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_content?id=eq.1&select=data`, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`
      }
    });
    const rows = await r.json();
    if (rows && rows[0]) return rows[0].data;
  }
  // Fallback to bundled JSON
  const filePath = path.join(process.cwd(), 'data', 'content.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function saveContent(data) {
  if (!SUPABASE_URL || !SUPABASE_SVC) {
    throw new Error('Supabase not configured. See SETUP.md.');
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/site_content?id=eq.1`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SVC,
      'Authorization': `Bearer ${SUPABASE_SVC}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ data, updated_at: new Date().toISOString() })
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Supabase error: ${txt}`);
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — public
  if (req.method === 'GET') {
    try {
      const data = await getContent();
      res.setHeader('Cache-Control', 'public, max-age=30'); // 30-second cache
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — admin only
  if (req.method === 'POST') {
    const auth  = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    if (token !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      await saveContent(req.body);
      return res.status(200).json({ success: true, savedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
