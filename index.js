require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");
const mongoose = require("mongoose");

const PORT = Number(process.env.PORT) || 5000;

let serverInstance = null;

const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing HTTP server...`);

  const finish = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
      }
    } catch (error) {
      console.error("Error while closing MongoDB connection:", error.message);
    } finally {
      process.exit(0);
    }
  };

  if (!serverInstance) {
    finish();
    return;
  }

  serverInstance.close(() => {
    console.log("HTTP server closed.");
    finish();
  });
};

const startServer = async () => {
  try {
    await connectDatabase();

    serverInstance = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle uncaught exceptions and unhandled rejections globally
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer();
