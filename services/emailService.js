const nodemailer = require("nodemailer");
const { OTP_EXPIRY_MINUTES } = require("./otpService");

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser = process.env.EMAIL || process.env.EMAIL_USER;
  const emailPass = process.env.APP_PASSWORD || process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL/EMAIL_USER and APP_PASSWORD/EMAIL_PASS must be set in environment variables.");
  }

  console.log("Initializing Nodemailer transporter...");
  console.log(`Using email user: ${emailUser}`);

  // Use secure SMTP (port 465) as requested for Render compatibility
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // IMPORTANT: Use SSL/TLS
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: true, // Enable debug output
    logger: true // Log to console
  });

  console.log("Nodemailer transporter initialized with port 465.");

  return cachedTransporter;
};

const sendVerificationOtp = async ({ email, name, otp }) => {
  const transporter = getTransporter();

  console.log(`Attempting to send OTP email to ${email}...`);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL || process.env.EMAIL_USER,
    to: email,
    subject: "Verify your account",
    text: `Hello ${name || "there"}, your OTP is: ${otp} (valid for ${OTP_EXPIRY_MINUTES} minutes).`,
    html: `
      <p>Hello ${name || "there"},</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
    `,
  });

  console.log(`Email sent successfully to ${email}`);
};

module.exports = {
  sendVerificationOtp,
};
