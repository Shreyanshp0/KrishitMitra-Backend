const express = require("express");
const { handleChat } = require("../controllers/chatController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limit for chat endpoint to prevent abuse
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    reply: "Too many requests, please try again in a minute."
  }
});

router.post("/chat", chatLimiter, handleChat);

module.exports = router;
