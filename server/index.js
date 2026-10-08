const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { initDb } = require('./database');

const jobRoutes = require('./routes/jobRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible static assets & fonts across modern browsers
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for public form submissions and abuse prevention
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' }
});

app.use('/api', apiLimiter);

// Parse JSON and urlencoded payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Codfis Technologies V2 Backend', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', jobRoutes);
app.use('/api', enquiryRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Serve frontend static assets from root repository directory
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir));

// SPA / Clean URL fallbacks
app.get('/software-development', (req, res) => {
  res.sendFile(path.join(rootDir, 'software-development.html'));
});

app.get('/training', (req, res) => {
  res.sendFile(path.join(rootDir, 'training.html'));
});

app.get('/careers', (req, res) => {
  res.sendFile(path.join(rootDir, 'careers.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(rootDir, 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(rootDir, 'contact.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(rootDir, 'AdminLogin.html'));
});

// Default fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Server
async function startServer(portOverride) {
  try {
    await initDb();
    const listenPort = portOverride || config.port;
    const server = app.listen(listenPort, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Codfis Technologies V2 Unified Application`);
      console.log(`📡 Server running at http://localhost:${listenPort}`);
      console.log(`🛡️  Admin Dashboard at http://localhost:${listenPort}/admin`);
      console.log(`📂 Environment: ${config.nodeEnv}`);
      console.log(`==================================================\n`);
    });
    return server;
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
