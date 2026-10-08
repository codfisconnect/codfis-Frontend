# Codfis Technologies V2

Professional Software Development & Technology Training platform.

## 🚀 Overview

Codfis Technologies V2 has been re-architected into a clean, unified, full-stack application operating under a single deployment structure:
- **Core Positioning:** Software Development & Software Training
- **Backend:** Node.js + Express REST API with SQLite (easily migratable to PostgreSQL)
- **Frontend:** Semantic HTML5, modern vanilla CSS design system (`css/codfis-v2.css`), zero heavyweight dependencies
- **Security:** Bcrypt password hashing, JWT authentication, Helmet headers, IP-based rate limiting, safe file validation, and path-traversal protected uploads
- **Portals:** Public conversion site + protected dynamic Admin Console

---

## 🛠️ Technology Stack & Architecture

- **Runtime:** Node.js (v18+)
- **Backend Framework:** Express 4.19
- **Database:** SQLite3 (`data.db`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`
- **File Uploads:** Multer with whitelist MIME & extension filters (PDF, DOC, DOCX up to 5MB)
- **Security & Hardening:** `helmet`, `express-rate-limit`, `cors`
- **Design System:** Custom dark theme `#090909` with `#F59E0B` gold/yellow accents, Space Grotesk & Plus Jakarta Sans typography

---

## 📁 Repository Structure

```text
├── css/
│   └── codfis-v2.css          # Codfis V2 design system & tokens
├── js/
│   └── main.js                # Shared client helpers & mobile drawer
├── server/
│   ├── config/                # Environment configuration loader
│   ├── database/              # SQLite schema & migration initializers
│   ├── middleware/            # JWT authentication & Multer upload handling
│   ├── controllers/           # Business logic (Jobs, Enquiries, Admin)
│   ├── routes/                # API routing endpoints
│   └── index.js               # Unified server & static file host
├── uploads/
│   └── resumes/               # Secure uploaded CVs & resumes (git-ignored)
├── index.html                 # Homepage (8 structured sections)
├── software-development.html  # Dedicated Software Development page
├── training.html              # Dedicated Software Training page
├── careers.html               # Careers, Job Listings & Trainer Application
├── about.html                 # Mission, Values & Positioning
├── contact.html               # Project Enquiries & General Contact
├── AdminLogin.html            # Admin login interface
├── admin.html                 # Protected Admin Management Console
├── test-suite.js              # Automated E2E verification test suite
├── robots.txt & sitemap.xml   # SEO configurations
├── .env.example               # Template environment configuration
└── package.json               # Root dependencies and scripts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```ini
PORT=5050
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USER=admin
ADMIN_PASS=Admin@Codfis2026!
UPLOAD_DIR=./uploads
```

---

## 💻 Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm start
   ```
   Or run with file watcher:
   ```bash
   npm run dev
   ```

3. **Access points:**
   - **Public Website:** `http://localhost:5050`
   - **Software Development:** `http://localhost:5050/software-development`
   - **Software Training:** `http://localhost:5050/training`
   - **Careers & Applications:** `http://localhost:5050/careers`
   - **Contact & Quotes:** `http://localhost:5050/contact`
   - **Admin Console:** `http://localhost:5050/admin`
   - **API Health Check:** `http://localhost:5050/api/health`

---

## 🛡️ Admin Dashboard Setup

1. Navigate to `http://localhost:5050/admin/login` (or `/AdminLogin.html`).
2. Default initial credentials:
   - **Username:** `admin`
   - **Password:** `Admin@Codfis2026!` (set in `.env`)
3. Passwords are automatically hashed via bcrypt upon first initialization.
4. **Features inside the Admin Console:**
   - Overview KPI cards (Project enquiries, job candidates, trainers, active jobs)
   - Real-time Project Enquiries with status transitions
   - General Contact Messages management
   - Job Openings CRUD (Create, Edit, Toggle Active/Inactive)
   - Candidate Job Applications list with direct authenticated Resume download
   - Trainer Applications review & status tracking

---

## 🧪 Testing

Run the automated test suite:
```bash
npm test
```
This tests all 13 core workflows including health checks, job applications with multipart uploads, trainer submissions, JWT login, dashboard stats, job management, candidate status patching, and unauthorized security rejections.

---

## 🚢 Deployment Recommendation

Because Codfis V2 is unified into a single application:
1. **PaaS (Render / Railway / DigitalOcean App Platform):**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Persistent volume attached to `./uploads` and `./data.db`.
2. **VPS (Ubuntu + Nginx + PM2):**
   - Run via PM2: `pm2 start server/index.js --name codfis-v2`
   - Reverse proxy port `5050` through Nginx with SSL via Let's Encrypt.
