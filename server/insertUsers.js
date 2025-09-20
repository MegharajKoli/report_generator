const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
require('dotenv').config();
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  
});

const users = [
  {
    userId: "library001",
    password: "password123",
    role: "department",
    department: "Library",
  },
  {
    userId: "wit001",
    password: "password123",
    role: "department",
    department: "Walchand Institute of Technology",
  },
];

async function insertUsers() {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      await User.create(user);
    }
    console.log("✅ Users inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting users:", error);
  } finally {
    mongoose.disconnect();
  }
}

insertUsers();
