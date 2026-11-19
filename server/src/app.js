const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Rate limiting & security middlewares
const { globalRateLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Route files
const verificationRoutes = require('./routes/verifications');
const jobShieldRoutes = require('./routes/jobshield');
const credentialCheckRoutes = require('./routes/credentialcheck');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// 1. Configure trust proxy for Netlify serverless and reverse proxy environments (1 hop)
app.set('trust proxy', 1);

// 2. Helmet Security Headers (tailored for API serving web frontend)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin API data consumption
  contentSecurityPolicy: false, // API returns JSON; frontend manages its own HTML CSP
  frameguard: { action: 'deny' }, // Anti-clickjacking
  dnsPrefetchControl: { allow: false }
}));

// 3. Strict CORS configuration
// Support comma-separated ALLOWED_ORIGINS, FRONTEND_URL, NETLIFY_SITE_URL, and local dev ports
const parseAllowedOrigins = () => {
  const origins = new Set(['http://localhost:5173', 'http://localhost:5174']);

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((orig) => {
      const trimmed = orig.trim();
      if (trimmed) origins.add(trimmed);
    });
  }

  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL.trim());
  }

  if (process.env.NETLIFY_SITE_URL) {
    origins.add(process.env.NETLIFY_SITE_URL.trim());
  }

  // Normalize: trim and strip trailing slashes
  return Array.from(origins)
    .map((o) => (o.endsWith('/') ? o.slice(0, -1) : o))
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
  origin: function (origin, callback) {
    // Non-browser requests (e.g. curl, CLI, server-to-server, unit tests) send no Origin header
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: Origin '${origin}' is not authorized.`));
  },
  credentials: false // Bearer token authentication in Authorization header; no cookies needed
}));

// 4. Request body size limit: 10MB for CredentialCheck & JobShield (document/image uploads), 16KB for other endpoints
app.use('/api/credentialcheck', express.json({ limit: '10mb' }));
app.use('/api/jobshield', express.json({ limit: '6mb' }));
app.use(express.json({ limit: '16kb' }));

// 5. Basic health check endpoint (mounted before rate limiter so health probes are not throttled)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'VerifyMe backend is operational.',
    timestamp: new Date().toISOString()
  });
});

// 6. Global rate limiting across API endpoints
app.use('/api', globalRateLimiter);

// 7. API Routes
app.use('/api/verifications', verificationRoutes);
app.use('/api/jobshield', jobShieldRoutes);
app.use('/api/credentialcheck', credentialCheckRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// 8. Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
