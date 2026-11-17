const admin = require('../config/firebase');

/**
 * Extract verified client IP address.
 * Prioritizes Netlify's tamper-proof edge header (x-nf-client-connection-ip)
 * to prevent proxy header manipulation and rate-limit spoofing.
 */
const getClientIp = (req) => {
  if (req.headers['x-nf-client-connection-ip']) {
    return String(req.headers['x-nf-client-connection-ip']).trim();
  }
  if (req.ip) {
    return String(req.ip).replace(/^::ffff:/, '').trim();
  }
  const socketAddr = req.socket?.remoteAddress;
  if (socketAddr) {
    return String(socketAddr).replace(/^::ffff:/, '').trim();
  }
  return '127.0.0.1';
};

/**
 * In-memory sliding/bucket rate-limit store
 * Reserved for local development and isolated unit tests.
 */
class MemoryRateLimitStore {
  constructor() {
    this.hits = new Map();
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.hits.entries()) {
        if (v.expiresAt <= now) {
          this.hits.delete(k);
        }
      }
    }, 60000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  async checkAndIncrement(key, windowMs, max = Infinity) {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.expiresAt <= now) {
      const newEntry = { count: 1, expiresAt: now + windowMs };
      this.hits.set(key, newEntry);
      return { count: 1, resetTimeMs: newEntry.expiresAt, exceeded: 1 > max };
    }

    if (entry.count >= max) {
      return {
        count: entry.count + 1,
        resetTimeMs: entry.expiresAt,
        exceeded: true
      };
    }

    entry.count += 1;
    return {
      count: entry.count,
      resetTimeMs: entry.expiresAt,
      exceeded: false
    };
  }

  async increment(key, windowMs) {
    return this.checkAndIncrement(key, windowMs, Infinity);
  }

  reset() {
    this.hits.clear();
  }
}

/**
 * Distributed Firestore rate-limit store
 * Uses Firestore transactions to atomically read, evaluate and increment rate-limit
 * counters across multiple serverless/lambda instances, eliminating race conditions.
 */
class FirestoreRateLimitStore {
  constructor(adminInstance) {
    this.admin = adminInstance;
  }

  getDb() {
    if (this.admin && this.admin.apps && this.admin.apps.length > 0) {
      return this.admin.firestore();
    }
    return null;
  }

  async checkAndIncrement(key, windowMs, max = Infinity) {
    const db = this.getDb();
    if (!db) {
      throw new Error('Firestore instance not available for distributed rate limiting');
    }

    const now = Date.now();
    const windowBucket = Math.floor(now / windowMs);
    const resetTimeMs = (windowBucket + 1) * windowMs;
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docId = `${sanitizedKey}_${windowBucket}`;
    const docRef = db.collection('system_rate_limits').doc(docId);
    const expiresDate = new Date(resetTimeMs + 60000);

    return await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      const currentCount = docSnap.exists ? (docSnap.data().count || 0) : 0;

      if (currentCount >= max) {
        return {
          count: currentCount + 1,
          resetTimeMs,
          exceeded: true
        };
      }

      const nextCount = currentCount + 1;
      transaction.set(docRef, {
        count: nextCount,
        expiresAt: expiresDate
      }, { merge: true });

      return {
        count: nextCount,
        resetTimeMs,
        exceeded: false
      };
    });
  }

  async increment(key, windowMs) {
    return this.checkAndIncrement(key, windowMs, Infinity);
  }
}

const memoryStore = new MemoryRateLimitStore();
let firestoreStore = null;

const isProductionDistributed = () => {
  return process.env.NODE_ENV === 'production' && process.env.RATE_LIMIT_STORE !== 'memory';
};

/**
 * Generic Rate Limiting Middleware Factory
 * Supports distributed atomic transactions and enforces HTTP 503 on production outages.
 */
const createRateLimiter = ({
  windowMs = 60000,
  maxLimit,
  keyGenerator,
  errorMessage = 'Too many requests. Please try again later.',
  isProtected = false
}) => {
  return async (req, res, next) => {
    // Skip OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const key = keyGenerator ? keyGenerator(req) : `ip_${getClientIp(req)}`;
    const max = typeof maxLimit === 'function' ? maxLimit(req) : maxLimit;
    const inProduction = isProductionDistributed();

    let store;
    if (inProduction) {
      // In production, distributed Firestore store is strictly mandatory.
      if (!admin || !admin.apps || admin.apps.length === 0) {
        console.error('[RateLimiter] Production error: Firebase Admin not initialized for distributed rate limiting.');
        return res.status(503).json({
          success: false,
          error: isProtected
            ? 'Rate limiting service temporarily unavailable. Please retry later.'
            : 'Service temporarily unavailable. Please retry later.',
          code: 'RATE_LIMITER_UNAVAILABLE'
        });
      }
      if (!firestoreStore) {
        firestoreStore = new FirestoreRateLimitStore(admin);
      }
      store = firestoreStore;
    } else {
      // For local dev / test suites
      store = (process.env.RATE_LIMIT_STORE !== 'memory' && admin && admin.apps && admin.apps.length > 0)
        ? (firestoreStore || (firestoreStore = new FirestoreRateLimitStore(admin)))
        : memoryStore;
    }

    let hitResult;
    try {
      hitResult = await store.checkAndIncrement(key, windowMs, max);
    } catch (storeErr) {
      console.error('[RateLimiter] Error in distributed rate limiter store:', storeErr.message);
      if (inProduction) {
        // Rule 1 & 3: Never silently fall back to per-instance memory counters in production!
        // Return controlled HTTP 503 so protected verification requests are not silently unguarded.
        return res.status(503).json({
          success: false,
          error: isProtected
            ? 'Rate limiting service temporarily unavailable. Please retry later.'
            : 'Service temporarily unavailable. Please retry later.',
          code: 'RATE_LIMITER_UNAVAILABLE'
        });
      }
      // Non-production fallback only
      hitResult = await memoryStore.checkAndIncrement(key, windowMs, max);
    }

    const { count, resetTimeMs, exceeded } = hitResult;
    const now = Date.now();
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
    const resetEpochSeconds = Math.ceil(resetTimeMs / 1000);

    // Set standard RFC rate limit headers
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - count));
    res.setHeader('RateLimit-Reset', resetEpochSeconds);

    if (exceeded || count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: errorMessage,
        retryAfter: retryAfterSeconds
      });
    }

    next();
  };
};

/**
 * Global IP Rate Limiter
 * 100 requests per minute per IP (configurable via GLOBAL_RATE_LIMIT_MAX)
 */
const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxLimit: (req) => Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 100,
  keyGenerator: (req) => `global_ip_${getClientIp(req)}`,
  errorMessage: 'Too many requests from this IP. Please try again later.',
  isProtected: false
});

/**
 * Verification Rate Limiter
 * Stricter limit: 30 requests per 15 minutes for authenticated UIDs, 5 for unauthenticated IPs
 * Configurable via VERIFY_RATE_LIMIT_MAX
 */
const verificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxLimit: (req) => {
    if (req.user && req.user.uid) {
      return Number(process.env.VERIFY_RATE_LIMIT_MAX) || 30;
    }
    return 5;
  },
  keyGenerator: (req) => {
    if (req.user && req.user.uid) {
      return `verify_uid_${req.user.uid}`;
    }
    return `verify_ip_${getClientIp(req)}`;
  },
  errorMessage: 'Verification rate limit exceeded. Please wait before submitting more verifications.',
  isProtected: true
});

const resetRateLimitStores = () => {
  memoryStore.reset();
};

module.exports = {
  getClientIp,
  globalRateLimiter,
  verificationRateLimiter,
  createRateLimiter,
  resetRateLimitStores,
  MemoryRateLimitStore,
  FirestoreRateLimitStore
};
