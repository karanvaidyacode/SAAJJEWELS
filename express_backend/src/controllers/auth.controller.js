const { User } = require("../models/postgres");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/email");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const jwtSign = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "devsecret", {
    expiresIn: "7d",
  });

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const otp = generateOTP();
    // Extract a name from email for new users
    const defaultName = email.split("@")[0];

    // Using our new User model with in-memory storage
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Generate a temporary password for OTP-only users
      const tempPassword = await User.hashPassword("temp_password_" + Date.now());
      user = await User.create({
        email,
        password: tempPassword, // Add a temporary password
        firstName: defaultName,
        isVerified: false
      });
    } else {
      await User.update(
        { 
          otp: otp,
          otpCreatedAt: new Date(),
          isVerified: false
        },
        { where: { email } }
      );
      user = await User.findOne({ where: { email } });
    }

    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    });
    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: "Email and OTP required" });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });
    const age =
      Date.now() - (user.otpCreatedAt ? user.otpCreatedAt.getTime() : 0);
    if (user.otp !== otp || age > 10 * 60 * 1000)
      return res.status(400).json({ error: "Invalid or expired OTP" });
    await User.update(
      { 
        isVerified: true,
        otp: null,
        otpCreatedAt: null
      },
      { where: { email } }
    );
    const token = jwtSign(user.email); // Using email as identifier
    const name =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName
        ? user.firstName
        : user.email.split("@")[0];

    return res.json({
      message: "Verified",
      token,
      user: {
        id: user.email, // Using email as ID
        email: user.email,
        name: name,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

// Export helper for passport callback to reuse token generation
exports.jwtSign = jwtSign;