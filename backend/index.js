require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DB init
const dbFile = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);

function initDb() {
  db.serialize(() => {
    // Admins
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'admin'
    )`);

    // Courses
    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      description TEXT,
      duration TEXT,
      fee TEXT,
      mode TEXT,
      skill_level TEXT,
      technologies TEXT,
      createdAt TEXT
    )`);

    // Students
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      mobile TEXT,
      gender TEXT,
      course_name TEXT,
      status TEXT DEFAULT 'enrolled',
      createdAt TEXT
    )`);

    // Trainers
    db.run(`CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      mobile TEXT,
      gender TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT
    )`);

    // Business Enquiries
    db.run(`CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      company TEXT,
      email TEXT,
      phone TEXT,
      businessType TEXT,
      requirement TEXT,
      preferredSolution TEXT,
      projectType TEXT,
      additional TEXT,
      type TEXT DEFAULT 'business',
      status TEXT DEFAULT 'New',
      createdAt TEXT
    )`);

    // Demo Requests / Course Enquiries
    db.run(`CREATE TABLE IF NOT EXISTS demo_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      course TEXT,
      mode TEXT,
      preferredDate TEXT,
      experienceLevel TEXT,
      message TEXT,
      status TEXT DEFAULT 'New',
      createdAt TEXT
    )`);

    // Contacts
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      createdAt TEXT
    )`);

    // Seed admin
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'adminpass';
    db.get('SELECT * FROM admins WHERE username = ?', [adminUser], (err, row) => {
      if (err) return console.error(err);
      if (!row) {
        db.run('INSERT INTO admins (username, password) VALUES (?,?)', [adminUser, adminPass]);
        console.log('Seeded admin user:', adminUser);
      }
    });
  });
}

initDb();

// Helpers
function nowISO() { return new Date().toISOString(); }

// Auth
app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).send('Missing credentials');
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [userId, password], (err, row) => {
    if (err) return res.status(500).send('DB error');
    if (!row) return res.status(401).send('Invalid username or password');
    const token = jwt.sign({ userId: row.username, role: row.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, userId: row.username, role: row.role });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).send('Missing credentials');
  db.run('INSERT INTO admins (username, password) VALUES (?,?)', [userId, password], function(err){
    if (err) return res.status(409).send('User already exists');
    res.json({ message: 'Admin registered' });
  });
});

app.post('/api/auth/send-otp', (req, res) => {
  // Mock OTP endpoint (mark stored, not actually sending mail)
  const { email } = req.body;
  if (!email) return res.status(400).send('Email required');
  res.json({ message: 'OTP sent to ' + email });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).send('Missing fields');
  // Mock reset
  res.json({ message: 'Password reset' });
});

// Student auth
app.post('/api/student-auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Missing credentials');
  db.get('SELECT * FROM students WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).send('DB error');
    if (!row) return res.status(401).send('Invalid email or password');
    const token = jwt.sign({ email: row.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, email: row.email });
  });
});

app.post('/api/student-auth/register', (req, res) => {
  const { name, email, mobile, gender, password, course_name } = req.body;
  if (!email || !password) return res.status(400).send('Missing required fields');
  const createdAt = nowISO();
  db.run('INSERT INTO students (name, email, mobile, gender, course_name, createdAt) VALUES (?,?,?,?,?,?)', [name, email, mobile, gender, course_name, createdAt], function(err){
    if (err) return res.status(409).send('Email already registered');
    res.json({ id: this.lastID, message: 'Student registered' });
  });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('Unauthorized');
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).send('Unauthorized');
  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).send('Invalid token');
    req.user = payload;
    next();
  });
}

app.get('/api/student-auth/profile/:email', requireAuth, (req, res) => {
  const email = decodeURIComponent(req.params.email);
  db.get('SELECT * FROM students WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).send('DB error');
    if (!row) return res.status(404).send('Student not found');
    res.json(row);
  });
});

app.post('/api/student-auth/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email required');
  res.json({ message: 'OTP sent to ' + email });
});

// Courses
app.get('/api/courses', (req, res) => {
  db.all('SELECT * FROM courses ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows || []);
  });
});

app.post('/api/courses/add', requireAuth, (req, res) => {
  const { name, description, duration, fee, mode, skill_level, technologies } = req.body;
  const createdAt = nowISO();
  db.run('INSERT INTO courses (name, description, duration, fee, mode, skill_level, technologies, createdAt) VALUES (?,?,?,?,?,?,?,?)', [name, description, duration, fee, mode, skill_level, technologies, createdAt], function(err){
    if (err) return res.status(409).send('Course name already exists');
    res.json({ id: this.lastID, message: 'Course added' });
  });
});

app.post('/api/courses/update/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { name, description, duration, fee, mode, skill_level, technologies } = req.body;
  db.run('UPDATE courses SET name=?, description=?, duration=?, fee=?, mode=?, skill_level=?, technologies=? WHERE id=?', [name, description, duration, fee, mode, skill_level, technologies, id], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

app.post('/api/courses/delete/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM courses WHERE id=?', [id], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

// Students
app.get('/api/courses/student/all', requireAuth, (req, res) => {
  db.all('SELECT * FROM students ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows || []);
  });
});

app.post('/api/courses/student/enroll', (req, res) => {
  const { name, gender, email, mobile, courseName } = req.body;
  if (!email) return res.status(400).send('Email required');
  const createdAt = nowISO();
  db.run('INSERT INTO students (name, gender, email, mobile, course_name, createdAt) VALUES (?,?,?,?,?,?)', [name, gender, email, mobile, courseName, createdAt], function(err){
    if (err) return res.status(409).send('Email already enrolled');
    res.json({ id: this.lastID, message: 'Student enrolled successfully' });
  });
});

app.post('/api/courses/student/:action/:mobile', requireAuth, (req, res) => {
  const { action, mobile } = req.params;
  // action: approve, reject, etc. For now, update status
  db.run('UPDATE students SET status=? WHERE mobile=?', [action, mobile], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

app.post('/api/courses/student/delete/:mobile', requireAuth, (req, res) => {
  const mobile = req.params.mobile;
  db.run('DELETE FROM students WHERE mobile=?', [mobile], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

// Trainers
app.get('/api/courses/trainer/applied', requireAuth, (req, res) => {
  db.all('SELECT * FROM trainers WHERE status = "pending" ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows || []);
  });
});

app.post('/api/courses/trainer/apply', (req, res) => {
  const { name, gender, email, mobile, description } = req.body;
  if (!email) return res.status(400).send('Email required');
  const createdAt = nowISO();
  db.run('INSERT INTO trainers (name, gender, email, mobile, description, createdAt) VALUES (?,?,?,?,?,?)', [name, gender, email, mobile, description, createdAt], function(err){
    if (err) return res.status(409).send('Email already applied');
    res.json({ id: this.lastID, message: 'Trainer application received' });
  });
});

app.post('/api/courses/trainer/approve/:mobile', requireAuth, (req, res) => {
  const mobile = req.params.mobile;
  db.run('UPDATE trainers SET status="approved" WHERE mobile=?', [mobile], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

app.post('/api/courses/trainer/reject/:mobile', requireAuth, (req, res) => {
  const mobile = req.params.mobile;
  db.run('UPDATE trainers SET status="rejected" WHERE mobile=?', [mobile], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

app.post('/api/courses/trainer/delete/:mobile', requireAuth, (req, res) => {
  const mobile = req.params.mobile;
  db.run('DELETE FROM trainers WHERE mobile=?', [mobile], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

// Enquiries (Business, Course, Callbacks)
app.post('/api/enquiries', (req, res) => {
  const { name, company, email, phone, businessType, requirement, preferredSolution, projectType, additional, type } = req.body;
  const createdAt = nowISO();
  db.run(`INSERT INTO enquiries (name, company, email, phone, businessType, requirement, preferredSolution, projectType, additional, type, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [name, company, email, phone, businessType, requirement, preferredSolution, projectType, additional, type || 'business', createdAt], function(err){
    if (err) { console.error(err); return res.status(500).send('Failed to save enquiry'); }
    res.json({ id: this.lastID });
  });
});

app.get('/api/enquiries', requireAuth, (req, res) => {
  db.all('SELECT * FROM enquiries ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows || []);
  });
});

app.post('/api/enquiries/:id/status', requireAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  db.run('UPDATE enquiries SET status = ? WHERE id = ?', [status, id], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

// Demo requests
app.post('/api/demo', (req, res) => {
  const { name, phone, email, course, mode, preferredDate, experienceLevel, message } = req.body;
  const createdAt = nowISO();
  db.run('INSERT INTO demo_requests (name, phone, email, course, mode, preferredDate, experienceLevel, message, createdAt) VALUES (?,?,?,?,?,?,?,?,?)', [name, phone, email, course, mode, preferredDate, experienceLevel, message, createdAt], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ id: this.lastID });
  });
});

app.get('/api/demo', requireAuth, (req, res) => {
  db.all('SELECT * FROM demo_requests ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows || []);
  });
});

app.post('/api/demo/:id/status', requireAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  db.run('UPDATE demo_requests SET status = ? WHERE id = ?', [status, id], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ changed: this.changes });
  });
});

// Contacts
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  const createdAt = nowISO();
  db.run('INSERT INTO contacts (name, email, phone, message, createdAt) VALUES (?,?,?,?,?)', [name, email, phone, message, createdAt], function(err){
    if (err) return res.status(500).send('DB error');
    res.json({ id: this.lastID });
  });
});

app.get('/api/contact', requireAuth, (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows || []);
  });
});

// Stats
app.get('/api/stats', requireAuth, (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as cnt FROM enquiries', [], (err, row) => {
    stats.enquiries = row ? row.cnt : 0;
    db.get('SELECT COUNT(*) as cnt FROM demo_requests', [], (err2, row2) => {
      stats.demo_requests = row2 ? row2.cnt : 0;
      db.get('SELECT COUNT(*) as cnt FROM contacts', [], (err3, row3) => {
        stats.contacts = row3 ? row3.cnt : 0;
        db.get('SELECT COUNT(*) as cnt FROM students', [], (err4, row4) => {
          stats.students = row4 ? row4.cnt : 0;
          db.get('SELECT COUNT(*) as cnt FROM trainers', [], (err5, row5) => {
            stats.trainers = row5 ? row5.cnt : 0;
            db.get('SELECT COUNT(*) as cnt FROM courses', [], (err6, row6) => {
              stats.courses = row6 ? row6.cnt : 0;
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
