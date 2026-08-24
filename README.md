# Codfis Frontend (modified)

This workspace contains the existing Codfis frontend (static HTML/CSS/JS) and a minimal local backend for lead management and admin dashboard.

Quick start

1. Start backend:

```bash
cd backend
npm install
cp .env.example .env
# edit .env to set JWT_SECRET and admin credentials
npm start
```

2. Serve the frontend (static files) using an HTTP server (for example `npx serve` or `python -m http.server 8080`):

```bash
# from repo root
npx serve . -p 3000
# or
python -m http.server 3000
```

3. Open `http://localhost:3000/index.html` in your browser.

Admin

- Visit `http://localhost:3000/AdminLogin.html` and login with the seeded admin credentials from `.env` (default `admin` / `adminpass`).
- After login, open `admin.html` and `enquiries.html` to view leads.

Notes

- Media assets are centralized via `src/config/media.js` and applied at runtime by `media-init.js`.
- Backend endpoints used by the frontend are proxied to `/api/*` (the backend must be running on `http://localhost:4000`).
- Replace placeholder media in `/images/` and update `src/config/media.js` to change visuals site-wide.
