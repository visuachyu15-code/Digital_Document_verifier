/**
 * server.js — Entry point for the Digital Document Verification API.
 *
 * This file:
 *  1. Loads environment variables from .env
 *  2. Connects to MongoDB
 *  3. Sets up Express middleware (CORS, JSON parsing)
 *  4. Mounts route files (added in later steps)
 *  5. Adds a health-check route, a 404 handler and centralised error handling
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/error');

// ── 1. Load environment variables ───────────────────────────────────────────
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── 2. Create Express app ───────────────────────────────────────────────────
const app = express();

// ── 3. Middleware ───────────────────────────────────────────────────────────
// Allow requests from the React front-end (Vite runs on port 5173 by default)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow for local dev testing
    },
    credentials: true,
  })
);

// Parse incoming JSON bodies (e.g. from POST/PUT requests)
app.use(express.json());

// ── 4. Health-check route ───────────────────────────────────────────────────
// Quick way to confirm the server is running — visit http://localhost:5000/api/health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Document Verification API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── 5. API routes ──────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/users', require('./routes/users'));
app.use('/api/verify', require('./routes/verify'));

// ── 6. 404 handler — catches any route that doesn't match above ─────────────
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── 7. Centralized error handler ────────────────────────────────────────────
app.use(errorHandler);

// ── 8. Connect to MongoDB and start the server ──────────────────────────────
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      console.error('ERROR: MONGO_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
