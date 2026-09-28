const env = require('./env');

// Whitelist of allowed origins.
const whitelist = [
  env.clientUrl,
  'http://localhost:4200',
  'http://localhost:3000',
  'http://localhost:5173',
  // Add any Vercel preview/production URLs below if known
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, mobile apps, server-side)
    if (!origin) return callback(null, true);

    // Allow all localhost ports for local development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow all Vercel deployments (*.vercel.app) and the configured clientUrl
    const isVercel = origin.endsWith('.vercel.app');
    const isWhitelisted = whitelist.includes(origin);
    const isRailway = origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app');

    if (isWhitelisted || isVercel || isRailway) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Fix for older browsers / preflight
};

module.exports = corsOptions;
