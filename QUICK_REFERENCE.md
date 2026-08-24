# Quick Reference Guide — Codfis Technologies

## Daily Workflows

### Start Development Server
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
node start-server.js

# Access at http://localhost:3000
```

### Access Admin Dashboard
```
URL: http://localhost:3000/admin.html
Username: [Set in backend/.env]
Password: [Set in backend/.env]
```

### Stop Development Server
```bash
Ctrl+C in both terminals
```

---

## Common Tasks Cheat Sheet

### Change Brand Colors
**File**: `codfis_premium.css` (top of file)
```css
:root {
  --primary: #1366ff;        /* Change brand blue */
  --accent: #7c3aed;         /* Change accent */
  --text: #072033;           /* Change text color */
}
```

### Update Contact Information
**File**: `src/config/contact.js`
```javascript
window.config = {
  contact: {
    email: "your@email.com",
    phone: "+1 (555) 123-4567",
    whatsapp: "1234567890"
  }
};
```

### Change Image Paths
**File**: `src/config/media.js`
```javascript
window.media = {
  hero: {
    home: "/images/your-image.jpg",
    solutions: "/images/solutions-hero.jpg"
  }
};
```

### Add New Admin User
**Method 1**: Delete database and change .env
```bash
rm backend/data.db
# Edit backend/.env with new credentials
npm start
```

**Method 2**: Insert via database query (advanced)

### View Database
```bash
# SQLite CLI
sqlite3 backend/data.db

# Inside SQLite
.tables                    # List all tables
SELECT * FROM enquiries;   # View enquiries
SELECT * FROM contacts;    # View contacts
.quit                      # Exit
```

### Reset All Data
```bash
cd backend
rm data.db
npm start
```

### Test an API Endpoint
```bash
# Get JWT token first
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin","password":"password123"}'

# Copy the token from response
# Then use it to make authenticated requests
curl -X GET http://localhost:4000/api/enquiries \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

---

## File Locations Reference

| Need to... | File | Line(s) |
|-----------|------|---------|
| Change hero image | `src/config/media.js` | 3-12 |
| Change solutions images | `src/config/media.js` | 15-28 |
| Change course images | `src/config/media.js` | 31-43 |
| Change client logos | `src/config/media.js` | 46-52 |
| Update email | `src/config/contact.js` | 2 |
| Update phone | `src/config/contact.js` | 3 |
| Update WhatsApp | `src/config/contact.js` | 4 |
| Change button colors | `codfis_premium.css` | 11 |
| Change font | `codfis_premium.css` | 27 |
| Add animation | `codfis_premium.css` | 1100+ |
| Update API endpoint | `backend/index.js` | 100+ |
| View admin stats | `admin.js` | 1-50 |
| Modify enquiries form | `chatbot.js` | 400+ |

---

## API Quick Reference

### Create Business Enquiry
```bash
curl -X POST http://localhost:4000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "company": "Tech Co",
    "email": "john@example.com",
    "phone": "+1234567890",
    "businessType": "Startup",
    "requirement": "Web Application"
  }'
```

### Get All Enquiries (Admin Only)
```bash
curl -X GET http://localhost:4000/api/enquiries \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update Enquiry Status
```bash
curl -X POST http://localhost:4000/api/enquiries/1/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"Contacted"}'
```

### Admin Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin","password":"password123"}'
```

### Get Dashboard Stats
```bash
curl -X GET http://localhost:4000/api/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Environment Variables

**File**: `backend/.env`

```env
PORT=4000                          # Backend server port
JWT_SECRET=your-secret-key         # JWT signing secret
ADMIN_USER=admin                   # Admin username
ADMIN_PASS=adminpass               # Admin password
DB_PATH=./data.db                  # Database location
```

**Generate secure JWT_SECRET**:
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Min 0 -Max 256)}))
```

---

## Frontend Page Structure

All pages follow this pattern:

```html
<!-- 1. Header with Navigation -->
<header class="site-header">
  <nav class="nav">
    <!-- Logo and menu -->
  </nav>
</header>

<!-- 2. Hero Section (optional) -->
<section class="hero">
  <!-- Title and background -->
</section>

<!-- 3. Main Content -->
<main class="container">
  <!-- Page-specific content -->
</main>

<!-- 4. Footer -->
<footer class="end-content">
  <!-- Copyright -->
</footer>

<!-- 5. Chatbot -->
<button id="chatbot-button">💬</button>

<!-- 6. Scripts (required order) -->
<script src="src/config/media.js"></script>
<script src="src/config/contact.js"></script>
<script src="media-init.js"></script>
<script src="chatbot.js"></script>
```

---

## CSS Class Reference

### Utility Classes
- `.container` — Max-width container
- `.section-sub` — Section subtitle styling
- `.btn` — Button base class
- `.btn.primary` — Primary button (blue)
- `.btn.ghost` — Ghost button (outline)
- `.solution-card` — Solution card styling
- `.solution-media` — Solution card image container
- `.hero` — Hero section styling
- `.hero-visual` — Hero image area
- `.hero-ctas` — Hero buttons area

### Layout Classes
- `.nav` — Navigation bar
- `.links` — Navigation links list
- `.solutions-grid` — Solutions grid layout
- `.courses` — Courses container
- `.clients-carousel` — Clients logo carousel
- `.contact-card` — Contact info cards
- `.stats-grid` — Dashboard stats grid

---

## Debugging Tips

### Check Browser Console
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for errors/warnings
4. Errors usually indicate missing scripts or API issues

### Check Network Tab
1. Go to Network tab in DevTools
2. Reload page
3. Look for red X marks (failed requests)
4. Click on request to see response

### Check Backend Logs
1. Look at backend terminal output
2. Should show "Server running on port 4000"
3. Errors appear with stack traces

### Common Issues
| Issue | Solution |
|-------|----------|
| "Cannot find /api/..." | Backend not running |
| "Cannot read property of undefined" | Check media.js is loaded |
| "Unexpected token" | JSON parse error - check request format |
| "401 Unauthorized" | JWT token missing or expired |
| "CORS error" | Check CORS middleware in backend |

---

## Testing Checklist (5-minute Quick Test)

- [ ] Load homepage - page displays without errors
- [ ] Click chatbot button - chatbot modal opens
- [ ] Fill chatbot form - can enter data
- [ ] Submit chatbot form - success message shows
- [ ] Go to admin page - login form shows
- [ ] Login with admin credentials - dashboard shows stats
- [ ] Click "Enquiries" link - displays submitted enquiry
- [ ] Change status in dropdown - status updates
- [ ] Go to Contact page - contact form displays
- [ ] Submit contact form - appears in admin Contacts page

---

## Performance Tips

### Speed Up Development
- [ ] Use `npm start` instead of nodemon to avoid restarts
- [ ] Keep DevTools closed (drains CPU)
- [ ] Clear browser cache if changes don't appear
- [ ] Use one terminal per service (backend, frontend)

### Improve Production Performance
- [ ] Minify CSS/JS files
- [ ] Compress images (WebP format)
- [ ] Enable gzip compression
- [ ] Use CDN for static files
- [ ] Add Redis caching for API responses
- [ ] Index frequently-queried database fields
- [ ] Implement API rate limiting

---

## Git Commands Reference

```bash
# View changes
git status

# Add changes
git add .

# Commit changes
git commit -m "Your message"

# Push to remote
git push

# Pull from remote
git pull

# View history
git log --oneline

# Undo last commit (before push)
git reset --soft HEAD~1
```

---

## Package.json Scripts

### Root Scripts
```bash
npm start           # Start proxy server
npm run dev         # (Optional) Start with nodemon
npm run backend     # (Optional) Start backend only
npm run frontend    # (Optional) Start frontend only
```

### Backend Scripts
```bash
cd backend
npm start           # Start backend server
npm test            # (Optional) Run tests
npm run dev         # (Optional) Start with nodemon
```

---

## Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| README.md | Project overview & quick start | 5 min |
| PROJECT_SUMMARY.md | Complete features & deliverables | 15 min |
| QA_CHECKLIST.md | Comprehensive testing guide | 30 min |
| DEPLOYMENT.md | Production setup & guidelines | 20 min |
| backend/API.md | API endpoint reference | 15 min |
| backend/README.md | Backend architecture | 10 min |
| This file | Quick reference for daily use | 5 min |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Dev Tools | F12 (PC) / Cmd+Option+I (Mac) |
| Console | F12 → Console tab |
| Network | F12 → Network tab |
| Terminal | Ctrl+` (VS Code) |
| Kill terminal | Ctrl+C |
| Search file | Ctrl+F |
| Global search | Ctrl+Shift+F |
| Go to line | Ctrl+G |

---

## Emergency Procedures

### Database Corrupted
```bash
cd backend
rm data.db
npm start  # Recreates database
```

### Port Already in Use
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Stuck Process
```bash
# Kill all Node processes
pkill -f "node"

# Then restart
npm start
```

### Lost Work
```bash
# View uncommitted changes
git diff

# View commit history
git log --oneline

# Revert to last commit
git checkout .
```

---

## Team Collaboration

### Before Pushing
- [ ] Run QA_CHECKLIST items
- [ ] Check browser console for errors
- [ ] Verify responsive design on mobile
- [ ] Test on different browsers
- [ ] Update documentation if changed code

### When Reviewing Others' Code
- [ ] Check for console errors
- [ ] Test the feature end-to-end
- [ ] Verify responsive design
- [ ] Check for security issues
- [ ] Ensure documentation is updated

---

## Resources & Links

- **Node.js Docs**: https://nodejs.org/docs/
- **Express.js Docs**: https://expressjs.com/
- **CSS Tricks**: https://css-tricks.com/
- **MDN Web Docs**: https://developer.mozilla.org/
- **SQL Tutorial**: https://www.w3schools.com/sql/
- **Git Documentation**: https://git-scm.com/doc
- **VS Code Tips**: https://code.visualstudio.com/docs/editor/tips-and-tricks

---

## Support Priority

1. **Check documentation** (README.md, PROJECT_SUMMARY.md)
2. **Check QA_CHECKLIST** (Troubleshooting section)
3. **Review browser console** (F12)
4. **Check backend logs** (Terminal output)
5. **Search issues online** (Google, StackOverflow)
6. **Ask team** (Slack, Email)

---

**Last Updated**: August 25, 2026  
**Version**: 1.0  
**Status**: Production Ready ✓
