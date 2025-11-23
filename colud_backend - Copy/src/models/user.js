// src/models/user.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // username optional now (remove required to avoid validation errors)
  username: { type: String, unique: true, sparse: true, index: true },

  // add email which we use for login & OTP
  email: { type: String, required: true, unique: true, index: true },

  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
  name: { type: String }, // optional display name
  createdAt: { type: Date, default: Date.now }
});

// ensure sparse unique index on username allows null/undefined values
module.exports = mongoose.model("User", UserSchema);
