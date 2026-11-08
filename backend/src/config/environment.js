require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medisync',
  JWT_SECRET: process.env.JWT_SECRET || 'medisync_super_secret_jwt_key_2026_production_grade',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
};
