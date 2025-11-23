module.exports = {
  info: (...msg) => console.log("ℹ️ ", ...msg),
  success: (...msg) => console.log("✅ ", ...msg),
  error: (...msg) => console.log("❌ ", ...msg),
  warn: (...msg) => console.log("⚠️ ", ...msg),
  log: (...msg) => console.log("📌 ", ...msg),
};
