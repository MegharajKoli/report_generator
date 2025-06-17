const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({ message: "Invalid user ID" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      department: user.department,
    });

    console.log(`✅ Login success: ${userId} | ${user.role} | ${user.department}`);
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = {
  loginUser,
};
