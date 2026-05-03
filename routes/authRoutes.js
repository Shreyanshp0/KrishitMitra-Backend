const express = require("express");

const { signup, verifyOtp, resendOtp, getCurrentUser, login } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
