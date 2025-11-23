const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

// public
router.post("/register", auth.register);

// Step 1: email+password -> send otp
router.post("/login", auth.login);

// Step 2: verify otp -> returns JWT
router.post("/verify-otp", auth.verifyOtp);

// optional: resend otp
router.post("/resend-otp", auth.resendOtp);

module.exports = router;
