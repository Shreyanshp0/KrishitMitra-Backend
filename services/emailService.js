const { Resend } = require("resend");
const { OTP_EXPIRY_MINUTES } = require("./otpService");

let resendInstance = null;

const getResend = () => {
  if (resendInstance) {
    return resendInstance;
  }

  const apiKey = process.env.Resend;

  if (!apiKey) {
    throw new Error("Resend API key must be set in environment variables (Resend=...).");
  }

  console.log("Initializing Resend client...");
  resendInstance = new Resend(apiKey);
  return resendInstance;
};

const sendVerificationOtp = async ({ email, name, otp }) => {
  const resend = getResend();

  console.log(`Attempting to send OTP email via Resend to ${email}...`);

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev", // Note: This only works for the account owner's email unless a domain is verified
    to: email,
    subject: "Verify your account",
    html: `
      <p>Hello ${name || "there"},</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
    `,
  });

  if (error) {
    console.error("Resend API Error:", error);
    throw error;
  }

  console.log(`Email sent successfully via Resend. ID: ${data.id}`);
};

module.exports = {
  sendVerificationOtp,
};
