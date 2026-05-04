const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY_SECONDS = Number(process.env.AUTH_TOKEN_EXPIRY_SECONDS) || 60 * 60 * 24 * 7;

const getTokenSecret = () => {
  if (!process.env.AUTH_TOKEN_SECRET) {
    throw new Error("AUTH_TOKEN_SECRET is missing in environment variables.");
  }

  return process.env.AUTH_TOKEN_SECRET;
};

const signAuthToken = (payload) => {
  return jwt.sign(payload, getTokenSecret(), {
    expiresIn: TOKEN_EXPIRY_SECONDS,
  });
};

const verifyAuthToken = (token) => {
  try {
    return jwt.verify(token, getTokenSecret());
  } catch (error) {
    throw new Error("Invalid or expired authentication token.");
  }
};

module.exports = {
  signAuthToken,
  verifyAuthToken,
};

