import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // MongoDB
  mongoUri:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/blood-bank-dev',

  // JWT secret (for auth later)
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',

  // Frontend URL (for CORS + Socket.IO)
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Redis (for worker later)
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

export default config;
