const User = require("../models/User");
const bcrypt = require("bcrypt");
const { signAuthToken } = require("../utils/token");
const { sendVerificationOtp } = require("../services/emailService");
const {
  createOtpPayload,
  hashOtp,
  applyOtpToUser,
  assertOtpVerificationAllowed,
} = require("../services/otpService");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  state: user.state,
  district: user.district,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const validateSignupInput = ({ name, email, password }) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Name is required";
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return "A valid email is required";
  }

  if (!password || password.length < 6) {
    return "Password is required and must be at least 6 characters long";
  }

  return null;
};

const signup = async (req, res, next) => {
  try {
    const { name, email, phone, state, district, password } = req.body;
    const validationError = validateSignupInput({ name, email, password });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const { otp, otpHash, otpExpiry } = createOtpPayload();
    const user =
      existingUser ||
      new User({
        email: normalizedEmail,
      });

    user.name = name.trim();
    user.email = normalizedEmail;
    user.phone = phone ? String(phone).trim() : null;
    user.state = state ? String(state).trim() : null;
    user.district = district ? String(district).trim() : null;
    user.password = await bcrypt.hash(password, 10);
    user.isVerified = false;

    applyOtpToUser(user, otpHash, otpExpiry);

    await user.save();

    try {
      await sendVerificationOtp({
        email: user.email,
        name: user.name,
        otp,
      });

      return res.status(existingUser ? 200 : 201).json({
        success: true,
        message: "OTP sent to your email",
        user: sanitizeUser(user),
      });
    } catch (emailError) {
      console.error("Email sending failed during signup:", emailError);
      
      // DO NOT crash signup. Return success but mention email failure.
      // In development/testing, returning OTP in response helps verify flow.
      return res.status(existingUser ? 200 : 201).json({
        success: true,
        message: "Signup successful, but email delivery failed. Please use the OTP provided below (for testing).",
        user: sanitizeUser(user),
        otp: otp // TEMP for testing/fallback
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      const token = signAuthToken({
        userId: user._id.toString(),
        email: user.email,
      });

      return res.status(200).json({
        success: true,
        message: "Account already verified",
        token,
        user: sanitizeUser(user),
      });
    }

    assertOtpVerificationAllowed(user);

    if (hashOtp(otp) !== user.otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Account verified successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified",
      });
    }

    const { otp, otpHash, otpExpiry } = createOtpPayload();
    applyOtpToUser(user, otpHash, otpExpiry);
    await user.save();

    try {
      await sendVerificationOtp({
        email: user.email,
        name: user.name,
        otp,
      });

      return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    } catch (emailError) {
      console.error("Email sending failed during OTP resend:", emailError);

      return res.status(200).json({
        success: true,
        message: "OTP generation successful, but email delivery failed. Please use the OTP provided below (for testing).",
        otp: otp // TEMP for testing/fallback
      });
    }
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

const login = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your account using OTP before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  getCurrentUser,
  login,
};
