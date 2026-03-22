const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/auth");

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const createAccessToken = (admin) =>
  jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

const createRefreshToken = () => crypto.randomBytes(40).toString("hex");

const sendResetEmail = async (admin, token) => {
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: admin.email,
    subject: "Reset your admin password",
    html: `
      <div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1f2937;">
        <h2 style="margin-top:0;">Reset your password</h2>
        <p>If you requested a password reset, click the button below. This link expires in 30 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Reset password</a>
        <p style="margin:16px 0 0; font-size:14px; color:#6b7280;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;font-size:14px;color:#2563eb;">${resetUrl}</p>
        <p style="margin-top:20px;font-size:12px;color:#9ca3af;">If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
};

const clearAuthTokens = (admin) => {
  admin.refreshToken = "";
  admin.refreshTokenExpiration = null;
  return admin.save();
};

// Register the first admin account (one-time use)
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(400).json({ error: "Registration is disabled once an admin exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await Admin.create({ email, password: hashed });

    return res.status(201).json({ message: "Admin registered" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (admin.isLocked) {
      return res.status(423).json({
        error:
          "Too many failed login attempts. Please try again in a few minutes.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await admin.save();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Reset failed login tracking
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;

    const refreshToken = createRefreshToken();
    admin.refreshToken = refreshToken;
    admin.refreshTokenExpiration = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

    await admin.save();

    const token = createAccessToken(admin);
    res.json({ token, refreshToken, email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const admin = await Admin.findOne({
      refreshToken,
      refreshTokenExpiration: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const token = createAccessToken(admin);
    const newRefreshToken = createRefreshToken();

    admin.refreshToken = newRefreshToken;
    admin.refreshTokenExpiration = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
    await admin.save();

    res.json({ token, refreshToken: newRefreshToken, email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (admin) {
      await clearAuthTokens(admin);
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Request a password reset link via email
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Do not reveal whether email exists for security
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    admin.resetToken = token;
    admin.resetTokenExpiration = expiration;
    await admin.save();

    await sendResetEmail(admin, token);

    res.json({ message: "If the email exists, a reset link has been sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset password using token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    admin.password = await bcrypt.hash(password, 10);
    admin.resetToken = "";
    admin.resetTokenExpiration = null;
    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("email");
    if (!admin) return res.status(404).json({ error: "Not found" });
    res.json({ email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
