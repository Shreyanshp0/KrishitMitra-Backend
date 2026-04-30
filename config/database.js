const mongoose = require("mongoose");

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MongoDBURL;

  if (!mongoUri) {
    throw new Error("MongoDB connection string is missing in environment variables.");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || "krishi-mitra",
  });

  console.log("MongoDB connected successfully");
};

module.exports = connectDatabase;
