// src/utils/jwt.js
const jwt = require("jsonwebtoken");
const logger = require("./logger");

const SECRET = process.env.JWT_SECRET || "dev-secret";
const DEFAULT_EXPIRES = process.env.JWT_EXPIRES || "12h";

function sign(payload = {}, opts = {}) {
  // Accept either a payload object or an options object.
  // Use 'sub' for subject if you pass opts.sub or payload.sub
  const signOpts = {
    algorithm: opts.algorithm || "HS256",
    expiresIn: opts.expiresIn || DEFAULT_EXPIRES,
  };

  // If caller provided subject as opts.sub or payload.id, set sub claim
  const subject = opts.sub || payload.sub || payload.id || payload.userId || null;
  if (subject) signOpts.subject = String(subject);

  // create a shallow payload copy without 'id' to avoid duplication
  const outPayload = { ...payload };
  delete outPayload.id;
  delete outPayload.userId;

  return jwt.sign(outPayload, SECRET, signOpts);
}

function verify(token) {
  try {
    // verify will return the payload (and set .sub if a subject was used)
    return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  } catch (e) {
    // rethrow so middleware can map errors
    throw e;
  }
}

function decode(token) {
  return jwt.decode(token, { complete: true });
}

module.exports = { sign, verify, decode };
