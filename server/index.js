const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require('./routes/reportRoutes');

dotenv.config(); // Load .env file

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/report_generator", {
  
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.log("❌ MongoDB connection error:", err));

// Test Route (Fixes 'Cannot GET /')
app.get("/", (req, res) => {
  res.send("🚀 Backend is running. Use /api/auth routes.");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/reports', reportRoutes);

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
