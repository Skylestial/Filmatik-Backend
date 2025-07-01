const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Secure environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// 📌 SIGNUP ROUTE (Register a new user)
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists (by username or email)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: "Username or email already taken" });
    }

    // Ensure strong password (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the password (using bcrypt)
    const hashedPassword = await bcrypt.hash(password, 12); // Higher salt rounds for security

    // Create new user object
    const newUser = new User({ username, email, password: hashedPassword });

    // Save user in database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user in database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password with hashed password in database
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT Token (expires in 7 days)
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate password reset token (valid for 1 hour)
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Reset link (change to your frontend URL)
    const resetLink = `https://yourfrontend.com/reset-password?token=${resetToken}`;

    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // filmatik.official@gmail.com
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // Email options
    const mailOptions = {
      from: "Filmatik <filmatik.official@gmail.com>",
      to: email,
      subject: "Reset Your Password - Filmatik",
      html: `
        <p>Hi,</p>
        <p>You requested a password reset for your Filmatik account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>— The Filmatik Team</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 RESET PASSWORD ROUTE
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 PROTECTED ROUTE EXAMPLE
router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "You have accessed a protected route", user: req.user });
});

// 📌 Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ message: "Access Denied. No Token Provided" });

  // Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) return res.status(403).json({ message: "Invalid Token Format" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach user info to request
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or Expired Token" });
  }
}

module.exports = router;
