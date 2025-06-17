const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/report_generator", {
  
});

const users = [
  {
    userId: "cse001",
    password: "password123",
    role: "department",
    department: "Computer Science and Engineering",
  },
  {
    userId: "it001",
    password: "password123",
    role: "department",
    department: "Information Technology",
  },
  {
    userId: "etc001",
    password: "password123",
    role: "department",
    department: "Electronics and Telecommunication Engineering",
  },
  {
    userId: "ecse001",
    password: "password123",
    role: "department",
    department: "Electronics and Computer Science Engineering",
  },
  {
    userId: "mech001",
    password: "password123",
    role: "department",
    department: "Mechanical and Automation",
  },
  {
    userId: "civil001",
    password: "password123",
    role: "department",
    department: "Civil Engineering",
  },
  {
    userId: "office001",
    password: "admin@123",
    role: "office",
    department: "Office",
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
