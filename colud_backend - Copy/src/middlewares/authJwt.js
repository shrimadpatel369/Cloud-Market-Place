// src/middlewares/authJwt.js
const logger = require("../utils/logger");
const { verify } = require("../utils/jwt");
const User = require("../models/user");

async function authJwt(req, res, next) {
  const auth = req.headers["authorization"] || req.query.token || req.headers["x-auth-token"];
  const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    // verify should throw on invalid signature / expired token
    const payload = verify(token);

    // Accept both "sub" (standard) and "id" (custom payload) for subject
    const userId = payload && (payload.sub || payload.id || payload.userId);
    if (!userId) {
      logger.warn("authJwt: token verified but no subject found", { payload });
      return res.status(401).json({ error: "invalid_token", detail: "no_sub_or_id_in_token" });
    }

    // attach user info (lightweight)
    req.user = { id: userId, role: payload.role || "user", username: payload.username || payload.name || null };

    // optionally attach full user doc
    try {
      req.userDoc = await User.findById(userId).select("-passwordHash");
    } catch (e) {
      logger.warn("authJwt: failed to load userDoc:", e && e.message ? e.message : e);
      // not fatal; continue with req.user
    }

    return next();
  } catch (e) {
    logger.warn("authJwt verify failed:", e && e.message ? e.message : e);
    const detail = e && e.name ? `${e.name}: ${e.message}` : String(e);
    // map common JWT errors to friendly codes
    if (e.name === "TokenExpiredError") return res.status(401).json({ error: "token_expired", detail });
    if (e.name === "JsonWebTokenError") return res.status(401).json({ error: "invalid_token", detail });
    return res.status(401).json({ error: "invalid_token", detail });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthenticated" });
    if (req.user.role !== role) return res.status(403).json({ error: "forbidden" });
    next();
  };
}

module.exports = { authJwt, requireRole };
