# Deployment & Setup Guide — Codfis Technologies

## Quick Start (Development)

### Prerequisites
- Node.js (v14+) and npm
- SQLite3 (included with Node)
- Git (optional)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your desired admin credentials:
```env
PORT=4000
JWT_SECRET=your-secure-random-secret-here
ADMIN_USER=admin
ADMIN_PASS=password123
```

Start the backend:
```bash
npm start
```

Backend is now running at `http://localhost:4000`

### 2. Frontend Setup

In the root directory:

```bash
npm install
node start-server.js
```

Frontend is now running at `http://localhost:3000`

### 3. Access the Application

- **Homepage**: http://localhost:3000/index.html
- **Admin Login**: http://localhost:3000/admin.html
- **API Docs**: [backend/API.md](backend/API.md)

---

## Project Structure

```
codfis-Frontend/
├── backend/
│   ├── index.js              # Express server & all API routes
│   ├── package.json          # Backend dependencies
│   ├── .env.example          # Environment template
│   ├── data.db               # SQLite database (auto-created)
│   ├── README.md             # Backend documentation
│   └── API.md                # API documentation
├── src/
│   └── config/
│       ├── media.js          # Centralized media config
│       └── contact.js        # Contact links config
├── images/                   # All image assets
├── index.html                # Homepage
├── solutions.html            # Solutions page
├── academy.html              # Academy/Training page
├── about.html                # About page
├── contact.html              # Contact page
├── careers.html              # Careers page
├── admin.html                # Admin dashboard
├── enquiries.html            # Admin enquiries page
├── demo.html                 # Admin demo requests page
├── contacts.html             # Admin contacts page
├── codfis_premium.css        # Main stylesheet with animations
├── codfis.js                 # Global UI logic
├── chatbot.js                # Chatbot modal & forms
├── media-init.js             # Media config initializer
├── start-server.js           # Frontend proxy server
├── package.json              # Root dependencies
├── README.md                 # Project README
├── QA_CHECKLIST.md          # QA testing guide
├── API.md                    # API documentation (root)
└── DEPLOYMENT.md             # This file
```

---

## Database Schema

### Tables Overview

#### admins
- id (PRIMARY KEY)
- username (UNIQUE)
- password (hashed)
- role

#### courses
- id, name, description, duration, fee, mode, skill_level, technologies

#### students
- id, name, email, mobile, gender, course_name, status, createdAt

#### trainers
- id, name, email, mobile, gender, description, status, createdAt

#### enquiries
- id, name, company, email, phone, businessType, requirement, preferredSolution, projectType, additional, type, status, createdAt

#### demo_requests
- id, name, phone, email, course, mode, preferredDate, experienceLevel, message, status, createdAt

#### contacts
- id, name, email, phone, message, createdAt

---

## Configuration & Customization

### Media Configuration (src/config/media.js)

To change image paths, hero images, solution images, courses, clients:

```javascript
window.media = {
  hero: {
    home: "/images/your-image.jpg",
    solutions: "/images/solutions-hero.jpg",
    // ...add more pages
  },
  solutions: {
    webDevelopment: "/images/web.jpg",
    // ...add more solutions
  },
  // ...etc
}
```

All image paths are relative to the root directory.

### Contact Configuration (src/config/contact.js)

To change contact information:

```javascript
window.config = {
  contact: {
    email: "contact@yourcompany.com",
    phone: "+1 (555) 123-4567",
    whatsapp: "1234567890",
    address: "123 Main St, City, Country",
    social: {
      instagram: "https://instagram.com/...",
      facebook: "https://facebook.com/...",
      linkedin: "https://linkedin.com/...",
      twitter: "https://twitter.com/..."
    }
  }
};
```

### CSS Customization (codfis_premium.css)

Color scheme is defined in CSS variables at the top:

```css
:root {
  --primary: #1366ff; /* Change brand blue */
  --accent: #7c3aed; /* Change accent color */
  --text: #072033; /* Change text color */
  /* ...etc */
}
```

---

## Environment Variables (.env)

```env
# Backend server port
PORT=4000

# JWT secret for admin auth (use secure random string)
JWT_SECRET=your-secret-key-here

# Admin credentials
ADMIN_USER=admin
ADMIN_PASS=adminpassword

# Database path (optional)
DB_PATH=./data.db
```

To generate a secure JWT_SECRET:
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Min 0 -Max 256) }))
```

---

## Common Tasks

### Reset Database
```bash
cd backend
rm data.db      # macOS/Linux
del data.db     # Windows
npm start       # This recreates the database
```

### Change Admin Credentials
1. Delete database: `rm backend/data.db`
2. Update `.env` with new ADMIN_USER and ADMIN_PASS
3. Restart backend

### Add New Course
1. Login to admin dashboard
2. Navigate to Courses section
3. Click "Add Course"
4. Fill in course details and submit

### Generate Fake Data for Testing

In `backend/index.js`, after database initialization, add:

```javascript
// Add test data
db.run(`INSERT INTO courses (name, description, duration, fee, mode, skill_level, technologies)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ['Test Course', 'A test course', '4 weeks', '5000', 'Online', 'Intermediate', 'JavaScript']
);
```

---

## Production Deployment

### Recommended Stack
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Heroku, AWS EC2, DigitalOcean, or Railway
- **Database**: PostgreSQL (not SQLite)
- **Cache**: Redis
- **CDN**: CloudFlare or AWS CloudFront

### Database Migration (SQLite → PostgreSQL)

1. Install postgres driver:
```bash
npm install pg
```

2. Update `backend/index.js` to use PostgreSQL instead of SQLite

3. Migrate data from SQLite to PostgreSQL using tools like pgloader

### Environment Variables for Production
```env
PORT=8000
JWT_SECRET=long-secure-random-string-generated-on-deployment
ADMIN_USER=prodadmin
ADMIN_PASS=very-secure-password
DB_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production
```

### Security Considerations

1. **HTTPS Only**: Enforce HTTPS redirects
2. **CORS**: Restrict to allowed domains only
3. **Rate Limiting**: Add express-rate-limit middleware
4. **Input Validation**: Validate all user inputs
5. **SQL Injection**: Use parameterized queries (already done)
6. **XSS Prevention**: Sanitize user inputs
7. **Secrets**: Never commit .env files
8. **CSRF**: Add CSRF tokens to forms
9. **Password Hashing**: Use bcrypt for admin passwords
10. **Logging**: Implement comprehensive error logging

### Performance Optimization

1. **Image Optimization**: Use WebP format, lazy loading
2. **Caching**: Configure cache headers
3. **Minification**: Minify CSS/JS before deployment
4. **Gzip Compression**: Enable server-side compression
5. **Database Indexing**: Add indexes to frequently queried fields
6. **API Caching**: Add Redis for caching frequent queries
7. **CDN**: Serve static files from CDN

---

## Monitoring & Logging

### Key Metrics to Monitor
- API response time
- Error rate
- Database query performance
- Server CPU/Memory usage
- Database connection pool

### Recommended Tools
- **Logging**: Winston, Bunyan, or LogRocket
- **Error Tracking**: Sentry or LogRocket
- **Monitoring**: DataDog, New Relic, or AWS CloudWatch
- **Analytics**: Google Analytics

---

## Troubleshooting

### Port Already in Use
```bash
# macOS/Linux
lsof -i :3000      # Find process using port 3000
kill -9 <PID>      # Kill the process

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Corruption
```bash
# Reset database
cd backend
rm data.db
npm start
```

### CORS Errors
- Ensure backend has `cors` middleware enabled
- Check frontend is calling correct API URLs
- Verify proxy server is running (if not using direct calls)

### JWT Errors
- Clear browser localStorage
- Re-login to get new token
- Check JWT_SECRET in .env

### Email/Contact Not Working
- Verify backend `/api/contact` endpoint is running
- Check browser network tab for 200 responses
- Verify data appears in admin contacts page

---

## Support & Documentation

- **API Reference**: [backend/API.md](backend/API.md)
- **QA Checklist**: [QA_CHECKLIST.md](QA_CHECKLIST.md)
- **Backend README**: [backend/README.md](backend/README.md)
- **Project README**: [README.md](README.md)

---

## Version History

**Current Version**: 1.0.0  
**Last Updated**: August 25, 2026  
**Framework**: Vanilla HTML/CSS/JavaScript + Express.js + SQLite

---

## License

© 2026 Codfis Technologies. All rights reserved.
