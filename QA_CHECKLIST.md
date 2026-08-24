# QA Checklist — Codfis Technologies Website

## Pre-Testing Setup

### Backend Setup
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Set `JWT_SECRET` to a secure random string (e.g., `openssl rand -base64 32`)
- [ ] Set `ADMIN_USER` and `ADMIN_PASS` for admin login
- [ ] Run `cd backend && npm install`
- [ ] Start backend: `npm start` (should run on http://localhost:4000)
- [ ] Verify backend is running without errors

### Frontend Setup
- [ ] Run `npm install` in root directory (for proxy server)
- [ ] Start proxy server: `node start-server.js` (should run on http://localhost:3000)
- [ ] Or use: `npx serve .` for static serving

### Database Verification
- [ ] Verify `backend/data.db` is created after first backend run
- [ ] Check all 7 tables exist: admins, courses, students, trainers, enquiries, demo_requests, contacts

---

## Frontend Pages — Navigation & Display

### Home Page (index.html)
- [ ] Hero section displays with correct background gradient and text
- [ ] "Build Your Application" button is visible and clickable
- [ ] Solutions grid displays with 11 solution cards
- [ ] Each solution card shows image (no emoji) and text
- [ ] Images have fallback handling (network tab shows no 404s)
- [ ] Training/courses section displays 8 course cards with images
- [ ] Clients carousel displays with logos
- [ ] Stats section shows: "50+ Clients", "10,000+ Engineers Trained", "AI-First"
- [ ] Chatbot button is visible (bottom right, pulsing animation)
- [ ] All links in navigation work and point to correct pages

### Solutions Page (solutions.html)
- [ ] Page loads with hero section (gradient purple background)
- [ ] "Our Solutions" title and subtitle visible
- [ ] 6 solution cards display properly
- [ ] Responsive on mobile (cards stack vertically)
- [ ] All page links in navigation work

### Academy Page (academy.html)
- [ ] Page loads with hero section (gradient blue background)
- [ ] "Cortis Academy" title visible
- [ ] 6 course cards display with images, titles, descriptions
- [ ] "View Course" buttons clickable and styled
- [ ] "More Courses Coming Soon" section displays
- [ ] "Inquire About Courses" button works

### About Page (about.html)
- [ ] Hero section displays (gradient orange background)
- [ ] Company overview text visible
- [ ] "Our Mission" and "Our Expertise" sections display
- [ ] 4 expertise cards show with proper styling
- [ ] Responsive layout on mobile and tablet

### Contact Page (contact.html)
- [ ] Hero section displays (gradient pink background)
- [ ] Contact cards show: Email, Phone, WhatsApp with clickable links
- [ ] Contact form displays with fields: Name, Email, Phone, Message
- [ ] Form validation works (required fields)
- [ ] Form submission sends data to `/api/contact`

### Careers Page (careers.html)
- [ ] Hero section displays (gradient green background)
- [ ] 2 career cards visible: "Apply for a Job" and "Become a Trainer"
- [ ] "Why Work With Us?" section displays with 4 benefit cards
- [ ] "Become a Trainer" button links to newTrainers.html

---

## Forms & API Integration

### Chatbot Business Enquiry Flow
- [ ] Click chatbot button to open chatbot
- [ ] Chatbot displays welcome message
- [ ] Click "I want a business solution"
- [ ] Form displays with fields: Name, Company, Email, Phone
- [ ] Fill form and submit
- [ ] Form submits to `/api/enquiries` endpoint
- [ ] Success message displays
- [ ] Data appears in admin dashboard

### Contact Form
- [ ] Navigate to Contact page
- [ ] Fill contact form: Name, Email, Message
- [ ] Submit form
- [ ] Form submits to `/api/contact` endpoint
- [ ] Success message displays
- [ ] Data appears in admin "Contacts" page

### Admin Login
- [ ] Navigate to `/admin.html`
- [ ] Login with username/password from `.env`
- [ ] JWT token stored in localStorage
- [ ] Dashboard loads showing stats

---

## Admin Dashboard

### Admin Authentication
- [ ] Login page displays login form
- [ ] Login with correct credentials succeeds
- [ ] Login with incorrect credentials fails
- [ ] JWT token is stored in localStorage
- [ ] Logout clears token and redirects to login

### Admin Dashboard (admin.html)
- [ ] Dashboard loads after login
- [ ] Stats display: 
  - [ ] Number of enquiries
  - [ ] Number of demo requests
  - [ ] Number of contacts
  - [ ] Number of students
  - [ ] Number of trainers
  - [ ] Number of courses
- [ ] Sidebar navigation displays links:
  - [ ] Dashboard
  - [ ] Enquiries
  - [ ] Demo Requests
  - [ ] Contacts
  - [ ] Courses
  - [ ] Students
  - [ ] Trainers
  - [ ] Logout

### Enquiries Page (enquiries.html)
- [ ] Page loads with table of all enquiries
- [ ] Each row shows: ID, Name, Company, Email, Phone, Status
- [ ] Status dropdown allows selecting: New, Contacted, In Progress, Converted, Closed
- [ ] Changing status updates via `/api/enquiries/:id/status`
- [ ] New enquiries from chatbot appear in table
- [ ] Status persists after page reload

### Demo Requests Page (demo.html)
- [ ] Page loads with table of all demo requests
- [ ] Each row shows: ID, Name, Phone, Email, Course, Status
- [ ] Status dropdown allows updating status
- [ ] Demo requests from forms appear in table
- [ ] Status changes persist

### Contacts Page (contacts.html)
- [ ] Page loads with table of all contacts
- [ ] Each row shows: ID, Name, Email, Phone, Message, Date
- [ ] Contact form submissions appear in table
- [ ] Contacts are read-only (no edit)

---

## API Endpoints

### Authentication Endpoints
- [ ] POST `/api/auth/login` → Returns JWT token
- [ ] POST `/api/auth/register` → Creates new admin
- [ ] POST `/api/auth/send-otp` → Mock OTP send
- [ ] POST `/api/auth/reset-password` → Mock password reset

### Enquiry Endpoints
- [ ] POST `/api/enquiries` → Creates enquiry (no auth required)
- [ ] GET `/api/enquiries` → Returns list (auth required)
- [ ] POST `/api/enquiries/:id/status` → Updates status (auth required)

### Contact Endpoints
- [ ] POST `/api/contact` → Creates contact (no auth required)
- [ ] GET `/api/contact` → Returns list (auth required)

### Demo Endpoints
- [ ] POST `/api/demo` → Creates demo request (no auth required)
- [ ] GET `/api/demo` → Returns list (auth required)
- [ ] POST `/api/demo/:id/status` → Updates status (auth required)

### Student Endpoints
- [ ] POST `/api/student-auth/login` → Student login
- [ ] POST `/api/student-auth/register` → Student registration
- [ ] GET `/api/student-auth/profile/:email` → Get profile (auth required)
- [ ] GET `/api/courses/student/all` → List all students (auth required)
- [ ] POST `/api/courses/student/enroll` → Enroll student

### Course Endpoints
- [ ] GET `/api/courses` → List all courses
- [ ] POST `/api/courses/add` → Create course (auth required)
- [ ] POST `/api/courses/update/:id` → Update course (auth required)
- [ ] POST `/api/courses/delete/:id` → Delete course (auth required)

### Stats Endpoint
- [ ] GET `/api/stats` → Returns all statistics (auth required)

---

## Responsive Design

### Mobile (375px width)
- [ ] Navigation collapses or becomes readable
- [ ] Hero section displays properly
- [ ] Cards stack vertically
- [ ] Buttons are touch-friendly (min 44px height)
- [ ] Forms are usable
- [ ] No horizontal scroll
- [ ] Images scale properly

### Tablet (768px width)
- [ ] 2-3 column layouts work
- [ ] All elements visible
- [ ] Navigation accessible
- [ ] Forms usable

### Desktop (1440px width)
- [ ] Full multi-column layouts display
- [ ] Spacing is balanced
- [ ] No extraneous horizontal space

---

## Performance & Visual Quality

### Images
- [ ] All images load without 404 errors
- [ ] Fallback images display if original fails
- [ ] Images are appropriately sized
- [ ] No image distortion

### Animations
- [ ] Button hover animations work (lift up, shadow)
- [ ] Card hover animations work (slide up, shadow)
- [ ] Navigation link underlines animate on hover
- [ ] Chatbot button pulses
- [ ] No laggy performance

### Typography
- [ ] Poppins font loads correctly
- [ ] Text is readable (contrast meets accessibility standards)
- [ ] Font sizes are consistent

### Console Warnings
- [ ] No JavaScript errors in browser console
- [ ] No 404 errors for resources
- [ ] No CORS errors (when running with proxy)

---

## Security Checks

### Authentication
- [ ] Admin routes require valid JWT token in Authorization header
- [ ] Expired tokens are rejected
- [ ] Tokens are stored securely in localStorage (for dev)
- [ ] Public forms don't require authentication

### API Protection
- [ ] GET `/api/enquiries` without token returns 401
- [ ] GET `/api/stats` without token returns 401
- [ ] POST to protected endpoints without token returns 401

---

## Data Integrity

### Database
- [ ] Enquiries are persisted across server restarts
- [ ] Contacts are stored with timestamp
- [ ] Demo requests record correct details
- [ ] Student/Trainer data structure is correct
- [ ] No duplicate data on duplicate submissions

### Form Validation
- [ ] Email fields require valid email format
- [ ] Required fields cannot be empty
- [ ] Phone number fields accept valid formats
- [ ] Long messages are stored completely

---

## Browser Compatibility

- [ ] Chrome/Edge (latest) - ✓ Test
- [ ] Firefox (latest) - ✓ Test
- [ ] Safari (latest) - ✓ Test
- [ ] Mobile Safari (iOS) - ✓ Test
- [ ] Chrome Mobile (Android) - ✓ Test

---

## Cross-Origin & CORS

- [ ] Frontend on port 3000 can call backend on port 4000
- [ ] CORS headers are set correctly
- [ ] No CORS errors in network tab
- [ ] Credentials are sent correctly

---

## Final Sign-Off

- [ ] All pages load without errors
- [ ] All forms submit successfully
- [ ] All API endpoints return correct responses
- [ ] Admin dashboard fully functional
- [ ] Responsive design works on all breakpoints
- [ ] No console errors
- [ ] Database persists data correctly
- [ ] Performance is acceptable

**QA Completed By:** _________________  
**Date:** _________________  
**Notes:** 

---

## Troubleshooting

### Backend Won't Start
```bash
# Check if port 4000 is in use
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process using port
kill -9 <PID>  # macOS/Linux

# Verify dependencies
npm install
```

### Frontend Won't Connect to Backend
- [ ] Ensure backend is running on port 4000
- [ ] Check CORS is enabled in backend
- [ ] Verify proxy server is running on port 3000
- [ ] Check browser console for errors

### Database Issues
- [ ] Delete `backend/data.db` to reset
- [ ] Restart backend to reinitialize
- [ ] Check tables in `backend/index.js` initialization code

### JWT Errors
- [ ] Clear localStorage in admin session
- [ ] Re-login to get new token
- [ ] Check JWT_SECRET in .env matches

---

## Deployment Checklist

Before deploying to production:
- [ ] Environment variables set correctly (.env)
- [ ] Database is PostgreSQL or MySQL (not SQLite for production)
- [ ] Error logging is configured
- [ ] CORS origins restricted to allowed domains
- [ ] HTTPS enabled
- [ ] Rate limiting implemented
- [ ] Input validation enhanced
- [ ] Images optimized
- [ ] Cache headers configured
- [ ] Secrets not committed to repo
