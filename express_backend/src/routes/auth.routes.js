const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
// Google OAuth removed — no passport strategy required here

router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

// Google OAuth routes removed

// Test routes for verifying setup
router.get("/test/email", async (req, res) => {
  try {
    const { sendEmail } = require("../utils/email");
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "Test Email from SaajJewels",
      text: "This is a test email to verify the email configuration.",
    });
    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Email test failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/test/oauth-config", (req, res) => {
  res.json({
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    clientConfigured:
      !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
  });
});

module.exports = router;
