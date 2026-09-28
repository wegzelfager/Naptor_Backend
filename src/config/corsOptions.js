const env = require('./env');

// Whitelist of allowed origins.
const whitelist = [
  env.clientUrl,
  'http://localhost:4200',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl, postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist or is a local localhost port
    if (whitelist.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

module.exports = corsOptions;
