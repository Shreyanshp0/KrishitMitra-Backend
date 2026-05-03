const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const shcRoutes = require("./routes/shcRoutes");
const recommendRoutes = require("./routes/recommendRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Krishi Mitra backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/shc", shcRoutes);
app.use("/api", recommendRoutes);
app.use("/api/locations", locationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== "test") {
    // Keep stack traces out of production responses, but log them for debugging.
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
