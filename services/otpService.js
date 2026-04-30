const crypto = require("crypto");
const generateOtp = require("../utils/generateOtp");

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_REQUESTS_PER_HOUR = 5;

const getOtpSecret = () => {
  const secret = process.env.OTP_SECRET || process.env.AUTH_TOKEN_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET or AUTH_TOKEN_SECRET must be set in environment variables.");
  }

  return secret;
};

const hashOtp = (otp) =>
  crypto.createHmac("sha256", getOtpSecret()).update(String(otp)).digest("hex");

const createOtpPayload = () => {
  const otp = generateOtp();

  return {
    otp,
    otpHash: hashOtp(otp),
    otpExpiry: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  };
};

const isOtpExpired = (otpExpiry) => !otpExpiry || otpExpiry.getTime() < Date.now();

const canSendOtp = (user) => {
  const now = Date.now();

  if (user.otpLastSentAt) {
    const secondsSinceLastRequest = (now - user.otpLastSentAt.getTime()) / 1000;

    if (secondsSinceLastRequest < OTP_RESEND_COOLDOWN_SECONDS) {
      return {
        allowed: false,
        message: `Please wait ${Math.ceil(
          OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastRequest
        )} seconds before requesting another OTP.`,
      };
    }
  }

  if (!user.otpRequestWindowStart || now - user.otpRequestWindowStart.getTime() > 60 * 60 * 1000) {
    return { allowed: true, resetWindow: true };
  }

  if ((user.otpRequestCount || 0) >= OTP_MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      message: "Too many OTP requests. Please try again later.",
    };
  }

  return { allowed: true, resetWindow: false };
};

const applyOtpToUser = (user, otpHash, otpExpiry) => {
  const now = new Date();
  const limitCheck = canSendOtp(user);

  if (!limitCheck.allowed) {
    const error = new Error(limitCheck.message);
    error.statusCode = 429;
    throw error;
  }

  if (limitCheck.resetWindow) {
    user.otpRequestWindowStart = now;
    user.otpRequestCount = 1;
  } else {
    user.otpRequestCount = (user.otpRequestCount || 0) + 1;
  }

  user.otp = otpHash;
  user.otpExpiry = otpExpiry;
  user.otpAttempts = 0;
  user.otpLastSentAt = now;
};

const assertOtpVerificationAllowed = (user) => {
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.otp || !user.otpExpiry) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  if (isOtpExpired(user.otpExpiry)) {
    const error = new Error("OTP expired");
    error.statusCode = 400;
    throw error;
  }

  if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    const error = new Error("Maximum OTP verification attempts exceeded.");
    error.statusCode = 429;
    throw error;
  }
};

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  createOtpPayload,
  hashOtp,
  canSendOtp,
  applyOtpToUser,
  assertOtpVerificationAllowed,
  isOtpExpired,
};
