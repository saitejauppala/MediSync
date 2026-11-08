require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { JWT_SECRET, MONGODB_URI } = require('./config/environment');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    if (!JWT_SECRET || !MONGODB_URI) {
      throw new Error('JWT_SECRET and MONGODB_URI must be configured in production.');
    }
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL must be configured in production.');
    }
    const contactEmail = process.env.NOMINATIM_CONTACT_EMAIL || '';
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
      || contactEmail.endsWith('@example.com')
      || contactEmail.includes('replace-with')
    ) {
      throw new Error('Set a valid NOMINATIM_CONTACT_EMAIL before production deployment.');
    }
  }

  await connectDB();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediSync API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  }).on('error', (error) => {
    console.error('Failed to start MediSync API:', error.message);
    process.exitCode = 1;
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
