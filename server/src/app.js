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

// Body parser and CORS
app.use(cors());
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
