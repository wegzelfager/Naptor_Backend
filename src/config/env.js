// src/config/env.js

const env = {
  port: process.env.PORT || 5000,
  mongo_url: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_token_key_here',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_token_key_here',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  clientUrl: process.env.CLIENT_URL,
  redis_url: process.env.REDIS_URL || 'redis://localhost:6379'
};

// Validate that critical environment variables exist
if (!env.mongo_url) {
  throw new Error("CRITICAL: MONGODB_URI is not defined in your .env file!");
}

module.exports = env;