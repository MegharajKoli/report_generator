const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["department", "office"], // restrict to either department or office
    required: true,
  },
  department: {
    type: String,
    required: true,
    enum: [
      "Computer Science and Engineering",
      "Information Technology",
      "Electronics and Telecommunication Engineering",
      "Electronics and Computer Science Engineering",
      "Mechanical and Automation",
      "Civil Engineering",
      "General Engineering",
      "Sports",
      "NSS", 
      "Library", 
      "cultural",
      "Walchand Institute of Technology",
      "Office", // specifically for the office login
    ],
  },
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
