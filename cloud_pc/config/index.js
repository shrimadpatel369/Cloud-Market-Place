require("dotenv").config();

module.exports = {
  SERVER_URL: process.env.BACKEND_WS_URL || "ws://localhost:8080/?token=super-secret",
  CLIENT_PORT: process.env.CLIENT_PORT || 5050,
  STATS_INTERVAL: 15000
};