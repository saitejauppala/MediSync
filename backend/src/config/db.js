const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medisync';
    
    // Attempt standard connection first with 5-second timeout
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
    
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log('MongoDB connected successfully via native connection.');
      return;
    } catch (connErr) {
      console.warn('Native MongoDB connection failed or timed out:', connErr.message);
      
      // Fallback to in-memory MongoDB for resilient local dev/testing
      console.log('Spinning up resilient in-memory MongoDB instance for local runtime...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'medisync',
        },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`In-memory MongoDB started and connected successfully at: ${uri}`);
    }
  } catch (error) {
    console.error('Fatal MongoDB connection error:', error.message);
    process.exit(1);
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

