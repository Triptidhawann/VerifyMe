const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Middleware
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/auth');
const verificationRoutes = require('./routes/verifications');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// Configure allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow if no origin (e.g. Postman), if explicitly allowed, or if it's from the deployed Netlify app
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('netlify.app')) {
      callback(null, true);
    } else {
      // Clean up trailing slash issues just in case
      const originNoSlash = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      if (allowedOrigins.includes(originNoSlash)) {
         callback(null, true);
      } else {
         callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'VerifyMe backend is running normally with Firebase Auth.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
