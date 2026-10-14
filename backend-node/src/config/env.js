import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/stockmaster_db',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_development_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_me',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'stockmaster_internal_secure_key_m2m_token_2026'
};
