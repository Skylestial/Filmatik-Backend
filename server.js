require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth"); // ✅ Authentication routes
const tmdbRoutes = require("./routes/tmdb"); // ✅ TMDB API routes
const passwordResetRoutes = require("./routes/passwordReset"); // ✅ Password Reset Routes
const ticketRoutes = require("./routes/tickets"); // ✅ Ticket Booking Routes
const paymentRoutes = require("./routes/payment"); // ✅ Payment Routes
const profileRoutes = require("./routes/profile"); // ✅ Profile API Routes

const app = express();

// ✅ Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS

// ✅ Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ Validate Environment Variables
if (!MONGO_URI) {
  console.error("❌ MongoDB URI is missing. Check your .env file.");
  process.exit(1);
}
if (!TMDB_API_KEY) {
  console.error("❌ TMDB API Key is missing. Check your .env file.");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("❌ JWT Secret is missing. Check your .env file.");
  process.exit(1);
}

// 🔍 Connect to MongoDB
console.log("🔍 Connecting to MongoDB...");
mongoose.set("strictQuery", true); // Recommended for latest MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ✅ API Routes
app.use("/api/auth", authRoutes); // ✅ Authentication Routes (Signup, Login, Protected)
app.use("/api/movies", tmdbRoutes); // ✅ TMDB Movie Routes
app.use("/api/password-reset", passwordResetRoutes); // ✅ Password Reset Routes
app.use("/api/tickets", ticketRoutes); // ✅ Ticket Booking API
app.use("/api/payments", paymentRoutes); // ✅ Payment API
app.use("/api/profile", profileRoutes); // ✅ Profile API (Newly Added)
app.use("/api/theaters", theaterRoutes); 

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("🚀 Filmatik Backend Server is Running!");
});

// ✅ Graceful Error Handling
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Promise Rejection:", reason);
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
