const nodemailer = require("nodemailer");
const { OTP_EXPIRY_MINUTES } = require("./otpService");

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment variables.");
  }

  if (process.env.SMTP_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return cachedTransporter;
};

const sendVerificationOtp = async ({ email, name, otp }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Verify your account",
    text: `Hello ${name || "there"}, your OTP is: ${otp} (valid for ${OTP_EXPIRY_MINUTES} minutes).`,
    html: `
      <p>Hello ${name || "there"},</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
    `,
  });
};

module.exports = {
  sendVerificationOtp,
};
