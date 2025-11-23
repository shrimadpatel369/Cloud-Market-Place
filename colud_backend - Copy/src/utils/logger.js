// src/utils/logger.js
// Simple logger used across the project. Adjust or replace with pino/winston if you want.

const prefix = (p, ...args) => {
    const time = new Date().toISOString();
    return console.log(`${time} ${p}`, ...args);
};

module.exports = {
    info: (...msg) => prefix("ℹ️", ...msg),
    success: (...msg) => prefix("✅", ...msg),
    error: (...msg) => {
        const time = new Date().toISOString();
        // use console.error so it appears in stderr
        console.error(`${time} ❌`, ...msg);
    },
    warn: (...msg) => prefix("⚠️", ...msg),
    log: (...msg) => prefix("📌", ...msg),
    debug: (...msg) => {
        if (process.env.DEBUG) prefix("🐛", ...msg);
    }
};
