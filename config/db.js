const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MongoDBURL || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MongoDBURL or MONGODB_URI is missing in environment variables.');
  }

  const conn = await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || 'krishi-mitra',
    serverSelectionTimeoutMS: 5000, // Fail fast if the DB is unreachable
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected! Retrying connection...');
});

module.exports = connectDB;
