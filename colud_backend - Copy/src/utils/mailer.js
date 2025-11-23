// src/utils/mailer.js
const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// quick test function (optional)
async function verifyTransport() {
    try {
        await transporter.verify();
        logger.info("Mailer: SMTP verified");
    } catch (e) {
        logger.warn("Mailer verify failed:", e && e.message ? e.message : e);
    }
}

async function sendOtpEmail(to, code, opts = {}) {
    const subject = opts.subject || "Your login OTP";
    const text = opts.text || `Your OTP is: ${code}. It will expire in ${opts.expiresMinutes || 5} minutes.`;
    const html = opts.html || `<p>Your OTP is: <strong>${code}</strong></p><p>It expires in ${opts.expiresMinutes || 5} minutes.</p>`;

    const mail = {
        from: process.env.SMTP_FROM || `"No Reply" <no-reply@example.com>`,
        to,
        subject,
        text,
        html
    };

    const info = await transporter.sendMail(mail);
    logger.info("Mailer: sent OTP email", info.messageId || info);
    return info;
}

module.exports = { transporter, sendOtpEmail, verifyTransport };
