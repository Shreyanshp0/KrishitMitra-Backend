const crypto = require("crypto");

const TOKEN_EXPIRY_SECONDS = Number(process.env.AUTH_TOKEN_EXPIRY_SECONDS) || 60 * 60 * 24 * 7;

const toBase64Url = (value) => Buffer.from(value).toString("base64url");

const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

const getTokenSecret = () => {
  if (!process.env.AUTH_TOKEN_SECRET) {
    throw new Error("AUTH_TOKEN_SECRET is missing in environment variables.");
  }

  return process.env.AUTH_TOKEN_SECRET;
};

const signAuthToken = (payload) => {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

const verifyAuthToken = (token) => {
  const [encodedPayload, providedSignature] = String(token || "").split(".");

  if (!encodedPayload || !providedSignature) {
    throw new Error("Invalid or expired authentication token.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid or expired authentication token.");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Invalid or expired authentication token.");
  }

  return payload;
};

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
