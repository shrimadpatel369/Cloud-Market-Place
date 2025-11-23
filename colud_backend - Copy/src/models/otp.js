// src/models/otp.js
const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
    purpose: { type: String, default: "login" } // future-proof
}, { timestamps: true });

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-remove after expiry (Mongo will remove when expiresAt passed)

module.exports = mongoose.model("Otp", OtpSchema);
