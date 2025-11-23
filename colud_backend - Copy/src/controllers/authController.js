// src/controllers/authController.js
const User = require("../models/user");
const Otp = require("../models/otp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");
const logger = require("../utils/logger");
const crypto = require("crypto");

const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "12h";

function generateOtpCode() {
    // 6-digit numeric
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createAndSendOtp(user, purpose = "login") {
    // generate code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // Save OTP doc
    const otp = await Otp.create({
        userId: user._id,
        code,
        expiresAt,
        purpose
    });

    // send email (fire-and-forget but await to catch email errors)
    try {
        await sendOtpEmail(user.email, code, { expiresMinutes: OTP_EXPIRES_MINUTES });
        logger.info("OTP sent to user:", user.email);
    } catch (e) {
        logger.error("Failed sending OTP email:", e && e.message ? e.message : e);
        // optionally remove otp on failure
        await Otp.deleteOne({ _id: otp._id }).catch(() => { });
        throw new Error("failed_to_send_otp");
    }

    // return reference id (otp id) but not the code
    return otp._id;
}

// inside src/controllers/authController.js — replace exports.register with:

exports.register = async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        // require email + password (and optionally username)
        if (!email || !password) return res.status(400).json({ error: "email_and_password_required" });

        // check duplicates by email and username (if provided)
        const byEmail = await User.findOne({ email });
        if (byEmail) return res.status(400).json({ error: "user_with_email_exists" });

        if (username) {
            const byUser = await User.findOne({ username });
            if (byUser) return res.status(400).json({ error: "username_taken" });
        }

        const hash = await bcrypt.hash(password, 10);
        const u = await User.create({
            name: name || null,
            username: username || null,
            email,
            passwordHash: hash,
            role: role === "admin" ? "admin" : "user"
        });

        // return safe user object
        res.json({ ok: true, user: { id: u._id, email: u.email, username: u.username, name: u.name, role: u.role } });
    } catch (err) {
        logger.error("auth.register:", err && err.message ? err.message : err);
        res.status(500).json({ error: err.message || String(err) });
    }
};


// STEP 1: verify credentials, then send OTP, return otpId reference
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "email_and_password_required" });

        const u = await User.findOne({ email });
        if (!u) return res.status(401).json({ error: "invalid_credentials" });

        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return res.status(401).json({ error: "invalid_credentials" });

        // create OTP and send email
        const otpId = await createAndSendOtp(u, "login");

        // return minimal success — do NOT send JWT here
        res.json({ ok: true, otpId, message: "otp_sent" });
    } catch (err) {
        logger.error("auth.login:", err && err.message ? err.message : err);
        res.status(500).json({ error: err.message || String(err) });
    }
};

// STEP 2: verify OTP -> issue JWT
exports.verifyOtp = async (req, res) => {
    try {
        const { otpId, code } = req.body;
        if (!otpId || !code) return res.status(400).json({ error: "otpId_and_code_required" });

        const otp = await Otp.findById(otpId);
        if (!otp) return res.status(400).json({ error: "otp_invalid_or_expired" });
        if (otp.used) return res.status(400).json({ error: "otp_already_used" });
        if (otp.attempts >= OTP_MAX_ATTEMPTS) return res.status(400).json({ error: "otp_attempts_exceeded" });
        if (new Date() > new Date(otp.expiresAt)) {
            // cleanup
            await Otp.deleteOne({ _id: otp._id }).catch(() => { });
            return res.status(400).json({ error: "otp_expired" });
        }

        // increment attempts
        otp.attempts = (otp.attempts || 0) + 1;

        if (otp.code !== String(code).trim()) {
            await otp.save().catch(() => { });
            return res.status(400).json({ error: "otp_invalid" });
        }

        // success: mark used and generate token
        otp.used = true;
        await otp.save();

        const user = await User.findById(otp.userId);
        if (!user) return res.status(500).json({ error: "user_not_found" });

        const payload = { id: String(user._id), email: user.email, role: user.role || "user" };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        res.json({ ok: true, token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (err) {
        logger.error("auth.verifyOtp:", err && err.message ? err.message : err);
        res.status(500).json({ error: err.message || String(err) });
    }
};

// resend OTP: optional — creates new OTP record and emails it
exports.resendOtp = async (req, res) => {
    try {
        const { otpId } = req.body;
        if (!otpId) return res.status(400).json({ error: "otpId_required" });

        const old = await Otp.findById(otpId);
        if (!old) return res.status(400).json({ error: "otp_invalid" });

        const user = await User.findById(old.userId);
        if (!user) return res.status(400).json({ error: "user_not_found" });

        // optional: ensure not abused by checking rate / attempts on old record
        if (old.attempts >= OTP_MAX_ATTEMPTS) return res.status(429).json({ error: "too_many_attempts" });

        // create new otp and send
        const newOtpId = await createAndSendOtp(user, old.purpose || "login");

        // mark old as used/invalid
        old.used = true;
        await old.save().catch(() => { });

        res.json({ ok: true, otpId: newOtpId, message: "otp_resent" });
    } catch (err) {
        logger.error("auth.resendOtp:", err && err.message ? err.message : err);
        res.status(500).json({ error: err.message || String(err) });
    }
};
