require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (
  isProduction ? undefined : 'medisync_local_development_secret_only'
);

if (isProduction && (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('replace-with'))) {
  throw new Error('Set JWT_SECRET to a random production secret of at least 32 characters.');
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || (
    isProduction ? undefined : 'mongodb://127.0.0.1:27017/medisync'
  ),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
};
