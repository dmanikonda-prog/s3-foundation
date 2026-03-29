# S3 Foundation Website — Setup Guide

## Running Locally

### Option A — Python (No installation needed, recommended)
Python 3.6+ is pre-installed on most computers.

```bash
cd S3Foundation
python server.py
```
Open **http://localhost:3000** for the website
Open **http://localhost:3000/admin** for the admin panel
Default password: `admin123`

To change password:
```bash
python server.py --password YourNewPassword
```

### Option B — Node.js (requires npm install first)
```bash
cd S3Foundation
npm install
npm start
```

---

## Using the Admin Panel

1. Go to `http://localhost:3000/admin`
2. Enter the password (`admin123` by default)
3. Use the sidebar to navigate sections
4. Edit text, upload images, manage events, gallery, etc.
5. Click **Save Changes** — content updates instantly on the website

### Setting Up Image Uploads (Cloudinary — Free)

1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free, no credit card)
2. In your Cloudinary Dashboard → **Settings** → **Upload**
3. Scroll to **Upload presets** → **Add upload preset**
4. Set mode to **Unsigned**, give it a name (e.g. `s3foundation`), save
5. Go to the Admin Panel → **Dashboard** tab
6. Enter your **Cloud Name** and **Upload Preset name**
7. Click **Save Cloudinary Settings**

Now every image field has a ☁ **Upload Image** button!

---

## Deploying to Vercel

### Step 1 — Push to GitHub
1. Create a GitHub account if you don't have one (github.com)
2. Create a new repository called `s3-foundation`
3. Upload all the S3Foundation folder files to that repo

### Step 2 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub (free)
2. Click **New Project** → import your `s3-foundation` repository
3. Click **Deploy** — your site goes live instantly!
4. Vercel gives you a URL like `s3-foundation.vercel.app`

### Step 3 — Set Up Supabase (for admin editing on live site)
Without Supabase, the admin panel works only locally. To edit content on Vercel:

1. Go to [supabase.com](https://supabase.com) → New project (free)
2. In the Supabase SQL Editor, run this once:
```sql
CREATE TABLE site_content (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Insert default empty row
INSERT INTO site_content (id, data) VALUES (1, '{}');
```
3. Go to **Settings** → **API** → copy:
   - Project URL
   - `anon public` key
   - `service_role` key (secret)
4. In Vercel → your project → **Settings** → **Environment Variables**, add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key
   - `ADMIN_PASSWORD` = your secure password
5. Redeploy on Vercel

Now your admin panel at `yoursite.vercel.app/admin` can edit content and it persists!

### Step 4 — First-time Content Sync
After setting up Supabase, open your admin panel → make any small edit → Save. This pushes your local content.json to Supabase.

---

## File Structure

```
S3Foundation/
├── index.html          ← Home page
├── about.html          ← About page
├── programs.html       ← Programs page
├── gaushala.html       ← Gaushala page
├── events.html         ← Events page
├── gallery.html        ← Gallery page
├── donate.html         ← Donate page
├── contact.html        ← Contact page
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── main.js         ← Animations, nav behavior
│   └── content-loader.js ← Loads dynamic content from API
├── admin/
│   └── index.html      ← Admin panel (complete SPA)
├── api/
│   ├── content.js      ← Vercel serverless: GET/POST content
│   └── auth.js         ← Vercel serverless: admin login
├── data/
│   └── content.json    ← All editable content (local storage)
├── images/
│   └── uploads/        ← Local image uploads (server.js only)
├── server.py           ← Python local server (no install needed)
├── server.js           ← Node.js local server
├── package.json        ← Node.js dependencies
├── vercel.json         ← Vercel deployment config
└── .env.example        ← Environment variable template
```

---

## Changing the Admin Password

**Locally:**
```bash
python server.py --password YourNewSecurePassword
```

**On Vercel:**
In Vercel → Settings → Environment Variables → update `ADMIN_PASSWORD` → Redeploy.

---

## Adding a Custom Domain
In Vercel → your project → **Settings** → **Domains** → add your domain (e.g. `s3foundationusa.org`).
Then update your domain registrar's DNS to point to Vercel (they give you the records).
