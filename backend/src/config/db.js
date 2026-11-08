const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI || (
    isProduction ? undefined : 'mongodb://127.0.0.1:27017/medisync'
  );

  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured in production.');
  }

  try {
    console.log('Connecting to MongoDB...');

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('MongoDB connected successfully.');
      return;
    } catch (connErr) {
      if (isProduction) {
        throw connErr;
      }

      console.warn('MongoDB connection failed; starting an in-memory database for development:', connErr.message);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'medisync',
        },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('In-memory MongoDB started and connected successfully.');
    }
  } catch (error) {
    console.error('Fatal MongoDB connection error:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
