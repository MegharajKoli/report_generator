const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require('./routes/reportRoutes');
const Report = require("./models/Report"); // adjust path as needed

require('dotenv').config();
const uri = process.env.MONGODB_URI;


const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));



app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true                // allow cookies/JWT if needed
}));

app.use(express.urlencoded({ extended: true }));

// 📌 Annual Reports API
app.get("/api/reports/annual", async (req, res) => {
  try {
    const { academicYear, organizedBy } = req.query;
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (organizedBy) query.organizedBy = organizedBy;

    const reports = await Report.find(query).sort({ academicYear: -1, eventName: 1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// MongoDB Connection
mongoose.connect(uri, {
  
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
