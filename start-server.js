#!/usr/bin/env node

/**
 * Simple proxy server that:
 * 1. Serves static frontend files on port 3000
 * 2. Proxies /api/* requests to backend on port 4000
 * Run after starting backend: node start-server.js
 */

const express = require('express');
const httpProxy = require('http-proxy');
const path = require('path');

const app = express();
const proxy = httpProxy.createProxyServer({});

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Serve static files from repo root
app.use(express.static(path.join(__dirname)));

// Proxy /api/* to backend
app.use('/api', (req, res) => {
  proxy.web(req, res, { target: BACKEND_URL }, (err) => {
    res.status(500).json({ error: 'Failed to connect to backend. Is it running on ' + BACKEND_URL + '?' });
  });
});

// Fallback: serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(FRONTEND_PORT, () => {
  console.log(`\n✓ Frontend server running on http://localhost:${FRONTEND_PORT}`);
  console.log(`✓ Proxying /api/* to backend at ${BACKEND_URL}\n`);
  console.log('Make sure backend is running:');
  console.log('  cd backend && npm install && npm start\n');
});
