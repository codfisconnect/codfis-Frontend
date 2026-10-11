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
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
  : ['https://www.codfis.com', 'https://codfis.com', 'http://localhost:5050', 'http://localhost:3000', 'http://localhost:5055'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins or wildcard in development
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
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

// 25-second request timeout guard to prevent hanging connections
app.use('/api', (req, res, next) => {
  res.setTimeout(25000, () => {
    if (!res.headersSent) {
      console.warn(`[Timeout] Request ${req.method} ${req.originalUrl} timed out after 25s`);
      res.status(504).json({
        success: false,
        error: 'The server took too long to process your request. Please try again in a moment.'
      });
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Codfis Technologies V2 Backend',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', jobRoutes);
app.use('/api', enquiryRoutes);
app.use('/api/admin', adminRoutes);

// Compatibility alias for legacy /api/auth/login
const adminController = require('./controllers/adminController');
app.post('/api/auth/login', adminController.login);

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File size exceeds the 2 MB limit. Please upload a file smaller than 2 MB.'
      });
    }
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }

  if (err.code === 'STORAGE_DISABLED') {
    return res.status(503).json({
      success: false,
      error: err.message
    });
  }

  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const rootDir = path.resolve(__dirname, '..');

// Redirect /index.html to / for clean canonical URL
app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

// Serve frontend static assets from root repository directory
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

// Process Safety Guards to prevent crashes on transient network / SDK errors
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Unhandled Rejection]:', reason);
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
